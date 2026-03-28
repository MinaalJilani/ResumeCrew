"""
Agents 3-4 (consolidated) -- Application Materials Specialist
Produces a tailored resume and cover letter in one pass using shared context.
"""

from __future__ import annotations

import json
import re
from typing import Any

from crewai import Agent, Task
from llm import get_groq_llm

application_materials_agent = Agent(
    role="Application Materials Specialist",
    llm=get_groq_llm(),
    goal=(
        "Deliver an ATS-friendly tailored resume and a personalised cover letter "
        "for the same job, using only the candidate's real experience and the "
        "company research from the crew."
    ),
    backstory=(
        "You combine executive resume writing and high-converting cover letters. "
        "You never invent roles or metrics; you highlight what fits the job. "
        "You read company research from the previous task and make the letter "
        "specific, never generic."
    ),
    verbose=True,
    max_iter=5,
    allow_delegation=False,
)


def make_application_materials_task(job_description: str, user_context: str) -> Task:
    return Task(
        description=f"""
You will produce BOTH documents for this application, in order, using one shared context.

JOB DESCRIPTION:
{job_description}

CANDIDATE PROFILE (from CV / vector store):
{user_context}

INSTRUCTIONS:
1. Use the **company research output from the previous task in this crew** when writing the cover letter
   (culture, news, values, stack). If that research is thin, still ground the letter in the job posting.

2. **RESUME** (write this first in your reasoning, then emit in JSON):
   - Contact placeholder line
   - Professional summary tailored to the job
   - Core skills aligned to the posting
   - Experience with measurable outcomes (only from candidate profile)
   - Education
   - Do NOT invent employers, dates, or skills absent from the profile.

3. **COVER LETTER** (after the resume in the same JSON):
   - Three paragraphs: opening tied to the company, body with 2-3 real achievements, confident closing
   - Under 400 words; no cliché openers like "I am writing to express my interest"
   - Professional but warm tone

4. **OUTPUT FORMAT (mandatory)** -- return ONE JSON object only, no markdown outside the JSON, with exactly these keys:
   - "resume" (string, plain text resume with newlines)
   - "cover_letter" (string, plain text letter)

Example shape (content is illustrative only):
{{"resume": "JANE DOE\\n...", "cover_letter": "Dear Hiring Manager,\\n..."}}
        """,
        expected_output=(
            'A single JSON object with keys "resume" and "cover_letter" (string values only), '
            "no extra keys, no markdown fences."
        ),
        agent=application_materials_agent,
    )


def generate_materials(task_output: str) -> dict[str, str]:
    resume, letter = parse_application_materials_output(task_output)
    return {"resume": resume, "cover_letter": letter}


def parse_application_materials_output(raw: str) -> tuple[str, str]:
    if not raw or not str(raw).strip():
        return "", ""

    text = str(raw).strip()

    fence = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if fence:
        text = fence.group(1).strip()

    try:
        data: Any = json.loads(text)
        if isinstance(data, dict):
            r = _str_or_empty(data.get("resume"))
            c = _str_or_empty(data.get("cover_letter", data.get("coverLetter")))
            if r or c:
                return r, c
    except json.JSONDecodeError:
        pass

    try:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end > start:
            blob = text[start : end + 1]
            data = json.loads(blob)
            if isinstance(data, dict):
                r = _str_or_empty(data.get("resume"))
                c = _str_or_empty(data.get("cover_letter", data.get("coverLetter")))
                if r or c:
                    return r, c
    except (json.JSONDecodeError, TypeError, ValueError):
        pass

    return text, ""


def _str_or_empty(v: Any) -> str:
    if v is None:
        return ""
    return str(v).strip()


def make_motivation_letter_task(purpose: str, user_context: str) -> Task:
    return Task(
        description=f"""
Write a motivation letter for the following purpose:
{purpose}

USER BACKGROUND:
{user_context}

Write a compelling 4-paragraph motivation letter:
1. What motivates you about this opportunity
2. Your relevant background and achievements
3. What you will contribute / your goals
4. Strong closing statement

Keep it personal, authentic, and under 500 words.
        """,
        expected_output="A complete motivation letter in plain text.",
        agent=application_materials_agent,
    )
