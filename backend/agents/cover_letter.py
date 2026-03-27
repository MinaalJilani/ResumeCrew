"""
Agent 4 — Cover Letter & Motivation Letter Writer
Writes compelling, personalised cover letters.
"""

from crewai import Agent, Task
from llm import get_groq_llm

cover_letter_agent = Agent(
    role="Cover Letter Specialist",
    llm=get_groq_llm(),
    goal="Write compelling, personalised cover and motivation letters that feel human and reference specific company details",
    backstory=(
        "You are an expert career writer who has helped 10,000+ candidates "
        "land interviews at top companies. Your letters are never generic — "
        "they always reference specific company values, recent news, and "
        "the candidate's most relevant achievements. You write in a professional "
        "but warm tone that makes hiring managers want to meet the candidate."
    ),
    verbose=True,
    max_iter=3,
    allow_delegation=False,
)


def make_cover_letter_task(
    job_description: str,
    user_context: str,
    company_research: str = "",
) -> Task:
    """Create a cover letter task."""
    return Task(
        description=f"""
Write a personalised cover letter for this job application.

USER'S EXPERIENCE:
{user_context}

COMPANY RESEARCH:
{company_research if company_research else "No company research available — extract what you can from the job posting."}

JOB DESCRIPTION:
{job_description}

STRUCTURE (3 paragraphs):
1. OPENING: Why this company specifically — reference company values, mission, or recent news. Show you've done your homework.
2. BODY: Your top 2-3 achievements from the user's experience that directly match what they're looking for. Use specific numbers and outcomes.
3. CLOSING: Forward-looking statement about what you'll bring. Confident but not arrogant. Clear call to action.

RULES:
- Do NOT use generic phrases like "I am writing to express my interest"
- DO start with something specific about the company
- Keep it under 400 words
- Match the tone to the company culture (startup = casual, corporate = formal)
- Only reference real achievements from the user context
        """,
        expected_output="A complete 3-paragraph cover letter ready to send, in plain text.",
        agent=cover_letter_agent,
    )


def make_motivation_letter_task(
    purpose: str,
    user_context: str,
) -> Task:
    """Create a motivation letter task (for universities, scholarships, etc.)."""
    return Task(
        description=f"""
Write a motivation letter for the following purpose:
{purpose}

USER'S BACKGROUND:
{user_context}

Write a compelling 4-paragraph motivation letter:
1. What motivates you about this opportunity
2. Your relevant background and achievements
3. What you will contribute / your goals
4. Strong closing statement

Keep it personal, authentic, and under 500 words.
        """,
        expected_output="A complete motivation letter in plain text.",
        agent=cover_letter_agent,
    )