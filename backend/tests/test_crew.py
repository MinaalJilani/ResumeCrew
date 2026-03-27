"""
End-to-end test — ingest a CV, then run the full crew with a job description.
This is the FINAL test before moving to frontend.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from agents.ingest import ingest_document
from agents.retrieval import retrieve_context_for_job
from agents.researcher import researcher_agent, make_research_task
from agents.resume import resume_agent, make_resume_task
from agents.cover_letter import cover_letter_agent, make_cover_letter_task
from agents.interview import interview_agent, make_interview_task
from pinecone_client import delete_all_user_data
from crewai import Crew, Process
import tempfile
import time

TEST_USER = "test_user_crew"

TEST_CV = """
AHMED KHAN
Full Stack Developer
ahmed.khan@email.com | +92-321-5551234 | Lahore, Pakistan

SUMMARY
Full-stack developer with 4 years of experience building web applications
using Python, React, and cloud services. Passionate about clean code and scalable systems.

EXPERIENCE
Full Stack Developer | DataTech Solutions | 2021 - Present
- Developed customer-facing dashboard serving 200k monthly active users
- Built REST APIs with FastAPI processing 50k requests/day
- Implemented real-time notifications using WebSockets
- Reduced page load time by 60% through code splitting and lazy loading
- Tech: Python, FastAPI, React, PostgreSQL, Redis, Docker, AWS

Junior Developer | WebCraft Agency | 2019 - 2021
- Built 20+ client websites using React and Node.js
- Integrated payment gateways (Stripe, JazzCash) for e-commerce clients
- Set up CI/CD pipelines with GitHub Actions

SKILLS
Backend: Python, FastAPI, Django, Node.js, Express
Frontend: React, Next.js, TypeScript, Tailwind CSS
Database: PostgreSQL, MongoDB, Redis
DevOps: Docker, AWS (EC2, S3, Lambda), GitHub Actions
Other: REST APIs, GraphQL, WebSockets, Agile/Scrum

EDUCATION
BS Computer Science | FAST-NUCES Lahore | 2015-2019 | GPA: 3.5/4.0

CERTIFICATIONS
- AWS Certified Cloud Practitioner
- Meta Front-End Developer Certificate
"""

TEST_JOB = """
Senior Full Stack Engineer - FinTech Startup (Series A)

About Us:
We're building the next generation of digital banking in Pakistan. 
$5M Series A, team of 30, remote-first culture.

Responsibilities:
- Build and maintain web applications using React and Python
- Design scalable APIs for financial transactions
- Work with payment gateway integrations
- Collaborate with mobile team on shared APIs
- Mentor junior developers

Requirements:
- 3+ years full-stack development experience
- Strong Python (FastAPI or Django) and React skills
- Experience with PostgreSQL and Redis
- Payment gateway integration experience
- Docker and AWS experience
- Bonus: FinTech or banking experience
"""


def test_full_crew():
    print("\n" + "=" * 60)
    print("  FULL CREW TEST — End to End")
    print("=" * 60 + "\n")

    # Cleanup
    delete_all_user_data(TEST_USER)
    time.sleep(2)

    # Step 1: Ingest CV
    print("📄 Step 1: Ingesting CV...")
    with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
        f.write(TEST_CV)
        tmp_path = f.name

    try:
        result = ingest_document(tmp_path, TEST_USER, "cv", "test_cv")
        assert result["status"] == "success"
        print(f"   ✅ Ingested {result['chunks']} chunks\n")
    finally:
        os.unlink(tmp_path)

    time.sleep(3)

    # Step 2: Retrieve context
    print("🔍 Step 2: Retrieving context for job description...")
    context = retrieve_context_for_job(TEST_USER, TEST_JOB)
    print(f"   ✅ Retrieved {len(context)} chars of context\n")

    # Step 3: Run crew
    print("🤖 Step 3: Running full agent crew...")
    print("   (This will take 1-3 minutes)\n")

    research_task = make_research_task(TEST_JOB)
    resume_task = make_resume_task(TEST_JOB, context)
    cover_task = make_cover_letter_task(TEST_JOB, context, "")
    interview_task = make_interview_task(TEST_JOB, context, "")

    crew = Crew(
        agents=[researcher_agent, resume_agent, cover_letter_agent, interview_agent],
        tasks=[research_task, resume_task, cover_task, interview_task],
        process=Process.sequential,
        verbose=True,
    )

    result = crew.kickoff()

    print("\n" + "=" * 60)
    print("  RESULTS")
    print("=" * 60)

    # Print task outputs
    if hasattr(result, 'tasks_output'):
        labels = ["Company Research", "Tailored Resume", "Cover Letter", "Interview Prep"]
        for i, (label, output) in enumerate(zip(labels, result.tasks_output)):
            print(f"\n{'─' * 40}")
            print(f"📋 {label}")
            print(f"{'─' * 40}")
            print(str(output)[:500] + "..." if len(str(output)) > 500 else str(output))
    else:
        print(str(result)[:2000])

    # Cleanup
    delete_all_user_data(TEST_USER)
    print(f"\n{'=' * 60}")
    print("  ✅ FULL CREW TEST PASSED!")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    test_full_crew()