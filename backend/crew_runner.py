"""
Wires all agents into a single CrewAI crew.
Called when the chat router detects a job description.
"""

import logging

from crewai import Crew, Process

from agents.retrieval import retrieve_context_for_job
from agents.researcher import researcher_agent, make_research_task
from agents.application_materials import (
    application_materials_agent,
    make_application_materials_task,
    generate_materials,
)
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
    3. Build resume + cover letter in one task (Agents 3-4 consolidated)
    4. Generate interview prep (Agent 6)
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

        job_results[job_id]["logs"].append("Application materials: tailored resume + cover letter...")
        application_materials_task = make_application_materials_task(
            job_description, user_context
        )

        job_results[job_id]["logs"].append("Agent 6: Preparing interview questions...")
        interview_task = make_interview_task(job_description, user_context, "")

        crew = Crew(
            agents=[
                researcher_agent,
                application_materials_agent,
                interview_agent,
            ],
            tasks=[
                research_task,
                application_materials_task,
                interview_task,
            ],
            process=Process.sequential,
            verbose=True,
        )

        job_results[job_id]["logs"].append("All agents working... this takes 1-2 minutes")

        result = crew.kickoff()

        task_outputs = result.tasks_output if hasattr(result, "tasks_output") else []

        outputs = {}
        if len(task_outputs) > 0:
            outputs["company_research"] = str(task_outputs[0])
        else:
            outputs["company_research"] = "Not generated"

        if len(task_outputs) > 1:
            mats = generate_materials(str(task_outputs[1]))
            outputs["resume"] = mats.get("resume") or "Not generated"
            outputs["cover_letter"] = mats.get("cover_letter") or "Not generated"
        else:
            outputs["resume"] = "Not generated"
            outputs["cover_letter"] = "Not generated"

        if len(task_outputs) > 2:
            outputs["interview_prep"] = str(task_outputs[2])
        else:
            outputs["interview_prep"] = "Not generated"

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
