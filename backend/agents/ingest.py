"""
Agent 1 — Profile Ingestion Specialist
Parses uploaded documents, chunks them, embeds them, stores in Pinecone.
"""

import os
import uuid
import logging
from typing import Optional
from pathlib import Path

from groq import Groq
from dotenv import load_dotenv

from utils.parser import parse_document
from utils.chunker import chunk_by_section, chunk_free_text
from pinecone_client import upsert_chunks, delete_document

load_dotenv()

logger = logging.getLogger(__name__)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def generate_profile_summary(text: str, user_id: str) -> str:
    """
    Use GPT to extract a structured profile summary from CV text.
    Stores it as a high-priority chunk in Pinecone.
    """
    prompt = f"""
Extract a structured profile summary from this CV. Return ONLY valid JSON.

CV TEXT:
{text[:4000]}

Return this exact JSON structure:
{{
  "name": "string",
  "email": "string or null",
  "phone": "string or null",
  "location": "string or null",
  "title": "current or most recent job title",
  "years_of_experience": "number or estimated range",
  "top_skills": ["list", "of", "top", "10", "skills"],
  "education": ["degree and institution"],
  "key_achievements": ["top 5 bullet points"],
  "summary_paragraph": "2-sentence career summary"
}}
"""
    response = groq_client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    summary_json = response.choices[0].message.content.strip()

    # Store as a high-priority chunk
    summary_chunk = [{
        "text": f"USER PROFILE SUMMARY:\n{summary_json}",
        "section": "profile_summary",
    }]
    upsert_chunks(user_id, summary_chunk, "profile_summary", f"{user_id}:summary")

    logger.info(f"Profile summary generated and stored for user {user_id}")
    return summary_json


def ingest_document(
    file_path: str,
    user_id: str,
    doc_type: str = "cv",
    doc_id: Optional[str] = None,
) -> dict:
    """
    Main entry point — called by FastAPI's /upload endpoint.

    Steps:
    1. Parse the document (PDF/DOCX/TXT)
    2. Chunk it intelligently (by section for CVs, sliding window for others)
    3. Delete old version if re-uploading
    4. Embed and upsert all chunks to Pinecone
    5. Generate profile summary if it's a CV

    Returns: {"status": str, "chunks": int, "doc_id": str, "summary": str|None}
    """
    if doc_id is None:
        doc_id = Path(file_path).stem + "_" + str(uuid.uuid4())[:8]

    logger.info(f"Ingesting {doc_type} '{doc_id}' for user {user_id}")

    # Step 1: Parse
    try:
        raw_text = parse_document(file_path)
        logger.info(f"Parsed document: {len(raw_text)} characters")
    except Exception as e:
        return {"status": "error", "detail": f"Failed to parse document: {str(e)}"}

    # Step 2: Chunk
    if doc_type == "cv":
        chunks = chunk_by_section(raw_text)
    else:
        chunks = chunk_free_text(raw_text)

    if not chunks:
        return {"status": "error", "detail": "No usable text chunks found"}

    logger.info(f"Created {len(chunks)} chunks")

    # Step 3: Delete old version
    delete_document(user_id, doc_id)

    # Step 4: Embed and upsert
    count = upsert_chunks(user_id, chunks, doc_type, doc_id)

    # Step 5: Profile summary for CVs
    summary = None
    if doc_type == "cv":
        try:
            summary = generate_profile_summary(raw_text, user_id)
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            summary = None

    result = {
        "status": "success",
        "chunks": count,
        "doc_id": doc_id,
        "sections": list({c["section"] for c in chunks}),
        "summary": summary,
    }

    logger.info(f"Ingestion complete: {result}")
    return result