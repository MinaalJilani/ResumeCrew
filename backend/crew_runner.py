"""
Wires all agents into a single CrewAI crew.
Called when the chat router detects a job description.
"""

import logging
from typing import Optional

from crewai import Crew, Process

from agents.retrieval import retrieve_context_for_job
from agents.researcher import researcher_agent, make_research_task
from agents.resume import resume_agent, make_resume_task
from agents.cover_letter import cover_letter_agent, make_cover_letter_task
from agents.interview import interview_agent, make_interview_task

logger = logging.getLogger(__name__)


def run_full_crew(
    user_id: str,
    job_description: str,
    job_results: dict,
    job_id: str,
):
    """
    Run the full agent crew for a job description.
    Updates job_results[job_id] in-place so the API can poll for progress.

    Steps:
    1. Retrieve user context from Pinecone
    2. Run company research (Agent 5)
    3. Build resume (Agent 3) using context
    4. Write cover letter (Agent 4) using context + research
    5. Generate interview prep (Agent 6)
    """
    try:
        job_results[job_id]["logs"].append("Starting agent crew...")

        # Step 1: Retrieve user context
        job_results[job_id]["logs"].append("Retrieving your profile data...")
        user_context = retrieve_context_for_job(user_id, job_description)

        if "not uploaded" in user_context.lower():
            job_results[job_id]["done"] = True
            job_results[job_id]["outputs"] = {
                "error": "No CV found. Please upload your CV first from the dashboard."
            }
            return

        job_results[job_id]["logs"].append(f"Retrieved {len(user_context)} chars of context")

        # Step 2: Create tasks
        job_results[job_id]["logs"].append("Agent 5: Researching company...")
        research_task = make_research_task(job_description)

        job_results[job_id]["logs"].append("Agent 3: Building tailored resume...")
        resume_task = make_resume_task(job_description, user_context)

        job_results[job_id]["logs"].append("Agent 4: Writing cover letter...")
        cover_letter_task = make_cover_letter_task(job_description, user_context, "")

        job_results[job_id]["logs"].append("Agent 6: Preparing interview questions...")
        interview_task = make_interview_task(job_description, user_context, "")

        # Step 3: Run the crew
        crew = Crew(
            agents=[researcher_agent, resume_agent, cover_letter_agent, interview_agent],
            tasks=[research_task, resume_task, cover_letter_task, interview_task],
            process=Process.sequential,
            verbose=True,
        )

        job_results[job_id]["logs"].append("All agents working... this takes 1-2 minutes")

        result = crew.kickoff()

        # Step 4: Parse results
        task_outputs = result.tasks_output if hasattr(result, 'tasks_output') else []

        outputs = {}
        labels = ["company_research", "resume", "cover_letter", "interview_prep"]

        for i, label in enumerate(labels):
            if i < len(task_outputs):
                outputs[label] = str(task_outputs[i])
            else:
                outputs[label] = "Not generated"

        # Also store the full raw output
        outputs["full_output"] = str(result)

        job_results[job_id]["outputs"] = outputs
        job_results[job_id]["done"] = True
        job_results[job_id]["logs"].append("All agents finished!")

        logger.info(f"Crew completed for job {job_id}")

    except Exception as e:
        logger.error(f"Crew failed for job {job_id}: {e}")
        job_results[job_id]["done"] = True
        job_results[job_id]["outputs"] = {"error": str(e)}
        job_results[job_id]["logs"].append(f"Error: {str(e)}")