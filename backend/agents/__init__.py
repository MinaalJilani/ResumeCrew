"""
All CrewAI agents for the Job Application Assistant.

Build order:
1. ingest.py                 -- Profile ingestion
2. retrieval.py              -- Context retrieval
3-4. application_materials.py -- Resume + cover letter (single CrewAI agent; formerly agents 3 and 4)
5. researcher.py             -- Company research
6. interview.py              -- Interview prep
7. chat_router.py            -- Chat session manager (build last)

CrewAI crew (run_full_crew) uses 3 agents: researcher, application_materials, interview.
"""

from .ingest import ingest_document
from .retrieval import make_retrieval_tool
from .researcher import researcher_agent, make_research_task
from .application_materials import (
    application_materials_agent,
    make_application_materials_task,
    generate_materials,
    make_motivation_letter_task,
)
from .interview import interview_agent, make_interview_task
from .chat_router import ChatSession
