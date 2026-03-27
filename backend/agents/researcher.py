"""
Agent 5 — Company Researcher
Researches the company from the job description using web search.
"""

from crewai import Agent, Task
from llm import get_groq_llm

try:
    from crewai_tools import SerperDevTool
    search_tool = SerperDevTool()
    tools = [search_tool]
except Exception:
    tools = []

researcher_agent = Agent(
    role="Company Research Analyst",
    llm=get_groq_llm(),
    goal="Research the company mentioned in the job posting and find key information about their culture, recent news, values, and interview process",
    backstory=(
        "You are an expert corporate researcher who digs up everything a job "
        "candidate needs to know about a company before applying. You find "
        "company culture, recent news, founding story, tech stack, employee "
        "reviews, and anything that helps a candidate tailor their application. "
        "You always cite your sources."
    ),
    tools=tools,
    verbose=True,
    max_iter=3,
    allow_delegation=False,
)


def make_research_task(job_description: str) -> Task:
    """Create a research task for the given job description."""
    return Task(
        description=f"""
Research the company from this job posting and provide a comprehensive brief.

JOB POSTING:
{job_description}

Find and report:
1. Company name and what they do
2. Company culture and values
3. Recent news (last 6 months)
4. Tech stack they use
5. Employee reviews summary (Glassdoor/LinkedIn)
6. Interview process insights
7. Key people to know (CEO, CTO, hiring manager if findable)
8. Tips for tailoring the application to this company

Format your response as clear bullet points under each section header.
If you cannot find the company name, extract whatever details you can from the job posting itself.
        """,
        expected_output=(
            "A structured company research brief with sections: "
            "Company Overview, Culture & Values, Recent News, Tech Stack, "
            "Interview Insights, and Application Tips."
        ),
        agent=researcher_agent,
    )