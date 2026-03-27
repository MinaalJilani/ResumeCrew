"""Test the ingestion pipeline — parse → chunk → embed → upsert → retrieve."""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from agents.ingest import ingest_document
from pinecone_client import query_context, delete_all_user_data
import tempfile
import time

TEST_USER = "test_user_ingest"
TEST_CV = """
JANE DOE
Senior Python Developer
Email: jane@example.com | Phone: +92-300-1234567

PROFESSIONAL SUMMARY
Senior Python developer with 6 years of experience in FastAPI, Django, and cloud services.

EXPERIENCE
Senior Developer | TechCorp | 2020 - Present
- Built 12 microservices using FastAPI and Docker
- Reduced API response time by 45% through Redis caching
- Led a team of 4 engineers on payment integration project

Junior Developer | StartupXYZ | 2018 - 2020
- Developed REST APIs using Django serving 30k daily requests
- Implemented automated testing increasing code coverage to 90%

SKILLS
Python, FastAPI, Django, Docker, PostgreSQL, Redis, AWS, Git

EDUCATION
BSc Computer Science | FAST University | 2014-2018 | GPA: 3.6/4.0
"""


def test_ingestion():
    print("\n=== Testing Ingestion Pipeline ===\n")

    # Clean up any previous test data
    delete_all_user_data(TEST_USER)
    time.sleep(2)

    # Write test CV to temp file
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        f.write(TEST_CV)
        tmp_path = f.name

    try:
        # Run ingestion
        print("1. Ingesting test CV...")
        result = ingest_document(tmp_path, TEST_USER, doc_type="cv", doc_id="test_cv")
        print(f"   Result: {result}")
        assert result["status"] == "success", f"Ingestion failed: {result}"
        print(f"   ✅ Ingested {result['chunks']} chunks")

        # Wait for Pinecone to index
        time.sleep(3)

        # Test retrieval
        print("\n2. Testing retrieval...")
        chunks = query_context(TEST_USER, "Python experience and skills")
        assert len(chunks) > 0, "No chunks retrieved!"
        print(f"   ✅ Retrieved {len(chunks)} chunks")
        for i, chunk in enumerate(chunks[:3]):
            print(f"   Chunk {i+1}: {chunk[:80]}...")

        # Test section-specific retrieval
        print("\n3. Testing section-specific retrieval...")
        edu_chunks = query_context(TEST_USER, "education degree", section="education")
        print(f"   ✅ Education chunks: {len(edu_chunks)}")

        print("\n=== All ingestion tests passed! ===\n")

    finally:
        os.unlink(tmp_path)
        delete_all_user_data(TEST_USER)


if __name__ == "__main__":
    test_ingestion()