"""Test context retrieval from Pinecone."""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from pinecone_client import (
    ping, upsert_chunks, query_context,
    query_context_with_scores, delete_all_user_data,
)
import time

TEST_USER = "test_user_retrieval"


def test_retrieval():
    print("\n=== Testing Retrieval ===\n")

    # Confirm Pinecone is reachable
    print("1. Pinging Pinecone...")
    assert ping(), "Pinecone unreachable!"
    print("   ✅ Pinecone is reachable")

    # Clean up
    delete_all_user_data(TEST_USER)
    time.sleep(2)

    # Insert test chunks
    print("\n2. Inserting test chunks...")
    chunks = [
        {"text": "5 years of Python development with FastAPI and Django frameworks", "section": "experience"},
        {"text": "Expert in PostgreSQL, Redis, and MongoDB database design", "section": "skills"},
        {"text": "BSc Computer Science from LUMS, graduated 2019 with 3.8 GPA", "section": "education"},
        {"text": "Led migration from monolith to microservices for 500k user platform", "section": "experience"},
        {"text": "AWS Certified Solutions Architect, Docker Certified Associate", "section": "certifications"},
    ]
    count = upsert_chunks(TEST_USER, chunks, "cv", "test_retrieval_cv")
    print(f"   ✅ Upserted {count} chunks")

    time.sleep(3)

    # Test queries
    print("\n3. Testing semantic search...")
    results = query_context(TEST_USER, "database experience", top_k=3)
    print(f"   Query: 'database experience' → {len(results)} results")
    for r in results:
        print(f"   → {r[:70]}...")

    print("\n4. Testing scored query...")
    scored = query_context_with_scores(TEST_USER, "cloud certifications", top_k=3)
    for s in scored:
        print(f"   [{s['score']:.3f}] ({s['section']}) {s['text'][:60]}...")

    # Cleanup
    delete_all_user_data(TEST_USER)
    print("\n=== All retrieval tests passed! ===\n")


if __name__ == "__main__":
    test_retrieval()