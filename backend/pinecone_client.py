"""
Shared Pinecone client — used by ALL agents.
Each user gets their own namespace (complete data isolation).
"""

import os
import logging
import time
from typing import Optional

from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── Clients ───────────────────────────────────────────────────────────────────

# Load local embedding model
embedder = SentenceTransformer('all-MiniLM-L6-v2')

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

INDEX_NAME = os.getenv("PINECONE_INDEX", "job-agent")
EMBED_DIM = 384


# ── Index bootstrap ──────────────────────────────────────────────────────────

def get_or_create_index():
    """Create Pinecone index if it doesn't exist."""
    existing = [i.name for i in pc.list_indexes()]

    if INDEX_NAME not in existing:
        logger.info(f"Creating Pinecone index '{INDEX_NAME}'...")
        pc.create_index(
            name=INDEX_NAME,
            dimension=EMBED_DIM,
            metric="cosine",
            spec=ServerlessSpec(
                cloud=os.getenv("PINECONE_CLOUD", "aws"),
                region=os.getenv("PINECONE_REGION", "us-east-1"),
            ),
        )
        while not pc.describe_index(INDEX_NAME).status["ready"]:
            logger.info("Waiting for index...")
            time.sleep(2)
        logger.info(f"Index '{INDEX_NAME}' ready.")
    else:
        logger.info(f"Index '{INDEX_NAME}' already exists.")

    return pc.Index(INDEX_NAME)


index = get_or_create_index()


# ── Embedding ─────────────────────────────────────────────────────────────────

def embed(text: str) -> list[float]:
    """Embed a single string."""
    text = text.strip().replace("\n", " ")[:30000]
    if not text:
        raise ValueError("Cannot embed empty string")
    return embedder.encode(text).tolist()


def embed_batch(texts: list[str]) -> list[list[float]]:
    """Batch embed multiple strings."""
    if not texts:
        return []

    cleaned = [t.strip().replace("\n", " ")[:30000] for t in texts]
    results = []
    batch_size = 100

    for i in range(0, len(cleaned), batch_size):
        batch = cleaned[i : i + batch_size]
        embeddings = embedder.encode(batch).tolist()
        results.extend(embeddings)
        logger.info(f"Embedded batch {i // batch_size + 1} ({len(batch)} texts)")

    return results


# ── Upsert ────────────────────────────────────────────────────────────────────

def upsert_chunks(
    user_id: str,
    chunks: list[dict],
    doc_type: str,
    doc_id: str,
) -> int:
    """
    Embed and upsert chunks into user's namespace.
    Each chunk: {"text": str, "section": str}
    """
    if not chunks:
        return 0

    texts = [c["text"] for c in chunks]
    embeddings = embed_batch(texts)

    vectors = []
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        vectors.append({
            "id": f"{user_id}:{doc_id}:{i}",
            "values": embedding,
            "metadata": {
                "user_id": user_id,
                "doc_id": doc_id,
                "doc_type": doc_type,
                "section": chunk.get("section", "general"),
                "text": chunk["text"],
                "chunk_index": i,
            },
        })

    # Upsert in batches of 100
    for start in range(0, len(vectors), 100):
        batch = vectors[start : start + 100]
        index.upsert(vectors=batch, namespace=user_id)
        logger.info(f"Upserted {start + len(batch)}/{len(vectors)} for {user_id}")

    return len(vectors)


# ── Query ─────────────────────────────────────────────────────────────────────

def query_context(
    user_id: str,
    query: str,
    top_k: int = 8,
    doc_type: Optional[str] = None,
    section: Optional[str] = None,
    min_score: float = 0.30,
) -> list[str]:
    """Retrieve most relevant chunks for a query, scoped to user."""
    query_vector = embed(query)

    filter_dict = {}
    if doc_type:
        filter_dict["doc_type"] = {"$eq": doc_type}
    if section:
        filter_dict["section"] = {"$eq": section}

    response = index.query(
        vector=query_vector,
        top_k=top_k,
        namespace=user_id,
        include_metadata=True,
        filter=filter_dict if filter_dict else None,
    )

    results = []
    for match in response["matches"]:
        score = match.get("score", 0)
        text = match.get("metadata", {}).get("text", "")
        if score >= min_score and text.strip():
            results.append(text)

    logger.info(f"query_context → {len(results)} chunks for '{query[:50]}...'")
    return results


def query_context_with_scores(
    user_id: str,
    query: str,
    top_k: int = 8,
    min_score: float = 0.30,
) -> list[dict]:
    """Same as query_context but returns scores + metadata."""
    query_vector = embed(query)

    response = index.query(
        vector=query_vector,
        top_k=top_k,
        namespace=user_id,
        include_metadata=True,
    )

    results = []
    for match in response["matches"]:
        score = match.get("score", 0)
        meta = match.get("metadata", {})
        if score >= min_score:
            results.append({
                "text": meta.get("text", ""),
                "score": round(score, 4),
                "section": meta.get("section", "unknown"),
                "doc_type": meta.get("doc_type", "unknown"),
                "doc_id": meta.get("doc_id", "unknown"),
            })

    return results


# ── Deletion ──────────────────────────────────────────────────────────────────

def delete_document(user_id: str, doc_id: str) -> bool:
    """Delete all vectors for a specific document."""
    try:
        index.delete(filter={"doc_id": {"$eq": doc_id}}, namespace=user_id)
        logger.info(f"Deleted doc '{doc_id}' for user '{user_id}'")
        return True
    except Exception as e:
        logger.error(f"Delete failed: {e}")
        return False


def delete_all_user_data(user_id: str) -> bool:
    """Delete entire namespace for a user."""
    try:
        index.delete(delete_all=True, namespace=user_id)
        logger.info(f"Deleted all data for user '{user_id}'")
        return True
    except Exception as e:
        logger.error(f"Delete all failed: {e}")
        return False


def list_user_documents(user_id: str) -> list[dict]:
    """List all documents stored for a user."""
    try:
        dummy_vector = [0.0] * EMBED_DIM
        response = index.query(
            vector=dummy_vector,
            top_k=1000,
            namespace=user_id,
            include_metadata=True,
        )

        doc_map = {}
        for match in response["matches"]:
            meta = match.get("metadata", {})
            doc_id = meta.get("doc_id", "unknown")
            if doc_id not in doc_map:
                doc_map[doc_id] = {
                    "doc_id": doc_id,
                    "doc_type": meta.get("doc_type", "unknown"),
                    "chunk_count": 0,
                }
            doc_map[doc_id]["chunk_count"] += 1

        return list(doc_map.values())
    except Exception as e:
        logger.error(f"list_user_documents failed: {e}")
        return []


def ping() -> bool:
    """Health check."""
    try:
        index.describe_index_stats()
        return True
    except Exception:
        return False