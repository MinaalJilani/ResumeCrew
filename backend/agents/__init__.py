"""
All CrewAI agents for the Job Application Assistant.

Build order:
1. ingest.py       — Profile ingestion
2. retrieval.py    — Context retrieval
3. researcher.py   — Company research
4. resume.py       — Resume builder
5. cover_letter.py — Cover letter writer
6. interview.py    — Interview prep
7. chat_router.py  — Chat session manager (build last)
"""

from .ingest import ingest_document
from .retrieval import make_retrieval_tool
from .researcher import researcher_agent, make_research_task
from .resume import resume_agent, make_resume_task
from .cover_letter import cover_letter_agent, make_cover_letter_task
from .interview import interview_agent, make_interview_task
from .chat_router import ChatSession