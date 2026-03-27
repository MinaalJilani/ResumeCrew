"""
Agent 3 — Resume Builder
Builds a tailored resume based on the user's profile and the job description.
"""

from crewai import Agent, Task
from llm import get_groq_llm

resume_agent = Agent(
    role="Expert Resume Writer",
    llm=get_groq_llm(),
    goal="Create a highly tailored, ATS-friendly resume for the given job description using the candidate's real experience.",
    backstory=(
        "You are an executive resume writer with years of experience. "
        "You know exactly what recruiters are looking for and how to pass ATS systems. "
        "You never invent experience, but you highlight the most relevant skills "
        "from the user's profile."
    ),
    verbose=True,
    allow_delegation=False,
)

def make_resume_task(job_description: str, user_context: str) -> Task:
    return Task(
        description=f"""
Review the candidate's profile and the job description, then write a highly tailored resume.

JOB DESCRIPTION:
{job_description}

CANDIDATE PROFILE (CONTEXT):
{user_context}

Write a professional resume that includes:
1. Contact Information placeholder
2. Professional Summary (tailored to the job)
3. Core Competencies/Skills (matching the job requirements)
4. Professional Experience (highlighting relevant achievements)
5. Education

Only include experience and skills found in the Candidate Profile. Do not invent facts.
        """,
        expected_output="A professionally formatted, tailored resume emphasizing relevant experience.",
        agent=resume_agent,
    )