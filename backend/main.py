"""
FastAPI main application — all endpoints.
Run with: uvicorn main:app --reload
"""

import os
import uuid
import json
import asyncio
import tempfile
import logging
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

load_dotenv()

from agents.chat_router import ChatSession
from agents.ingest import ingest_document
from database import init_db
from auth import (
    create_user, authenticate_user,
    get_current_user,
)
from models import (
    RegisterRequest, LoginRequest, AuthResponse,
    ChatRequest, ChatResponse, UploadResponse,
)
# Lazy imports — only import what main.py actually uses
from pinecone_client import list_user_documents, ping


def get_ingest():
    from agents.ingest import ingest_document
    return ingest_document


def get_chat_session():
    from agents.chat_router import ChatSession
    return ChatSession


def get_crew_runner():
    from crew_runner import run_full_crew
    return run_full_crew

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="ResumeCrew",
    description="Multi-agent AI system for job applications",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
init_db()

# In-memory stores (use Redis in production)
chat_sessions: dict[str, ChatSession] = {}
job_results: dict[str, dict] = {}


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "pinecone": ping(),
        "openai": bool(os.getenv("OPENAI_API_KEY")),
    }

@app.get("/")
def root():
    return {"status": "ok", "message": "Job Agent API is running"}

# ── Auth endpoints ────────────────────────────────────────────────────────────

@app.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    data = create_user(body.email, body.password, body.full_name)
    return AuthResponse(token=data["token"], user_id=data["id"], email=data["email"])


@app.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    data = authenticate_user(body.email, body.password)
    if not data:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthResponse(token=data["token"], user_id=data["id"], email=data["email"])


# ── Document upload ───────────────────────────────────────────────────────────

@app.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    doc_type: str = Form(default="cv"),
    user_id: str = Depends(get_current_user),
):
    # Validate file type
    allowed_extensions = {".pdf", ".docx", ".doc", ".txt", ".md"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {allowed_extensions}",
        )

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        doc_id = os.path.splitext(file.filename)[0]
        
        try:
            result = ingest_document(
                file_path=tmp_path,
                user_id=user_id,
                doc_type=doc_type,
                doc_id=doc_id,
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Internal Server Error during ingestion: {str(e)}")

        if result["status"] == "error":
            raise HTTPException(status_code=400, detail=result.get("detail", "Ingestion failed"))

        return UploadResponse(
            status="success",
            detail=f"Ingested {result['chunks']} chunks from {file.filename}",
            doc_id=result["doc_id"],
        )
    finally:
        os.unlink(tmp_path)


# ── User documents list ──────────────────────────────────────────────────────

@app.get("/documents")
async def get_documents(user_id: str = Depends(get_current_user)):
    docs = list_user_documents(user_id)
    return {"documents": docs}


# ── Chat endpoint ─────────────────────────────────────────────────────────────

@app.post("/chat")
async def chat(body: ChatRequest, user_id: str = Depends(get_current_user)):
    # Get or create session
    ChatSession = get_chat_session()
    if user_id not in chat_sessions:
        chat_sessions[user_id] = ChatSession(user_id)

    session = chat_sessions[user_id]
    result = session.chat(body.message)

    if result["type"] == "full_crew":
        # Start the agent crew in the background
        job_id = str(uuid.uuid4())
        job_results[job_id] = {"done": False, "logs": [], "outputs": {}}

        # Run crew in background thread (CrewAI is synchronous)
        loop = asyncio.get_event_loop()
        loop.run_in_executor(
            None,
            get_crew_runner(),
            user_id,
            body.message,
            job_results,
            job_id,
        )

        return ChatResponse(
            type="crew_started",
            job_id=job_id,
            message="Job description detected! Running AI agents...",
        )

    # Stream the response
    async def stream_response():
        try:
            for chunk in result["stream"]:
                yield f"data: {json.dumps({'text': chunk})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")


# ── Crew results polling ─────────────────────────────────────────────────────

@app.get("/results/{job_id}")
async def get_results(job_id: str):
    if job_id not in job_results:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_results[job_id]


# ── Crew logs SSE stream ─────────────────────────────────────────────────────

@app.get("/stream/{job_id}")
async def stream_logs(job_id: str):
    if job_id not in job_results:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        sent = 0
        while True:
            logs = job_results[job_id]["logs"]
            while sent < len(logs):
                yield f"data: {json.dumps({'log': logs[sent]})}\n\n"
                sent += 1
            if job_results[job_id]["done"]:
                yield f"data: {json.dumps({'done': True, 'outputs': job_results[job_id]['outputs']})}\n\n"
                break
            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)