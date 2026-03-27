"""
Agent 6 — Interview Coach
Generates tailored interview questions with answer frameworks.
"""

from crewai import Agent, Task
from llm import get_groq_llm

interview_agent = Agent(
    role="Interview Coach",
    llm=get_groq_llm(),
    goal="Generate likely interview questions with strong STAR-format answer frameworks tailored to the user's actual experience",
    backstory=(
        "You are a career coach with 10 years of mock interview experience "
        "at top companies. You know exactly what interviewers ask for each "
        "role type, and you help candidates prepare answers using the STAR "
        "method (Situation, Task, Action, Result). You always use the "
        "candidate's REAL experience to craft answers — never generic ones."
    ),
    verbose=True,
    max_iter=3,
    allow_delegation=False,
)


def make_interview_task(
    job_description: str,
    user_context: str,
    company_research: str = "",
) -> Task:
    """Create an interview prep task."""
    return Task(
        description=f"""
Generate interview preparation materials for this job.

USER'S EXPERIENCE:
{user_context}

JOB DESCRIPTION:
{job_description}

COMPANY RESEARCH:
{company_research if company_research else "Not available."}

Generate the following:

## SECTION 1: Technical Questions (5 questions)
For each question:
- The question
- Why they ask it (what they're testing)
- A strong answer using the user's real experience (STAR format)

## SECTION 2: Behavioural Questions (5 questions)
For each question:
- The question
- A STAR-format answer draft using the user's real experience
  - Situation: [specific context from their experience]
  - Task: [what they needed to do]
  - Action: [what they did]
  - Result: [measurable outcome]

## SECTION 3: Questions to Ask the Interviewer (5 questions)
Smart questions that show the candidate has researched the company.

## SECTION 4: Red Flags to Prepare For
Any gaps or weaknesses in the user's profile relative to the job requirements,
with suggested ways to address them.
        """,
        expected_output=(
            "A complete interview prep document with 5 technical questions, "
            "5 behavioural questions (with STAR answers), 5 questions to ask, "
            "and a red flags section."
        ),
        agent=interview_agent,
    )