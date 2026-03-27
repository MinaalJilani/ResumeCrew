"""
Agent 2 — Context Retrieval Specialist
Provides a CrewAI Tool that fetches relevant user data from Pinecone.
Every other agent uses this instead of touching Pinecone directly.
"""

from crewai.tools import BaseTool
from pydantic import BaseModel, Field
from pinecone_client import query_context, query_context_with_scores


class RetrievalInput(BaseModel):
    query: str = Field(description="The search query to find relevant user experience")


def make_retrieval_tool(user_id: str) -> BaseTool:
    """
    Factory — creates a retrieval tool scoped to a specific user.
    Each agent gets its own instance with the user_id baked in.
    """

    class UserRetrievalTool(BaseTool):
        name: str = "retrieve_user_context"
        description: str = (
            "Search the user's stored profile, CV, and experience data. "
            "Pass a natural language query and get back the most relevant "
            "parts of their background. Use this to find specific skills, "
            "experiences, education, or achievements."
        )
        args_schema: type[BaseModel] = RetrievalInput

        def _run(self, query: str) -> str:
            chunks = query_context(user_id, query, top_k=8)
            if not chunks:
                return "No relevant information found in the user's profile for this query."
            return "\n\n---\n\n".join(chunks)

    return UserRetrievalTool()


def retrieve_context_for_job(user_id: str, job_description: str) -> str:
    """
    Convenience function — retrieves all relevant context for a job description.
    Called by crew_runner.py before passing context to agents.
    """
    # Query with the full job description
    general_chunks = query_context(user_id, job_description, top_k=6)

    # Also specifically query for skills
    skill_chunks = query_context(
        user_id,
        "technical skills programming languages tools",
        top_k=3,
        section="skills",
    )

    # And experience
    exp_chunks = query_context(
        user_id,
        job_description,
        top_k=3,
        section="experience",
    )

    # Deduplicate
    all_chunks = list(dict.fromkeys(general_chunks + skill_chunks + exp_chunks))

    if not all_chunks:
        return "No user profile data found. The user has not uploaded their CV yet."

    return "\n\n---\n\n".join(all_chunks)