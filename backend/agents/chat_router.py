"""
Agent 7 — Chat Router / Session Manager
Decides what to do with each message:
- Job description → triggers full agent crew
- General question → answers directly using retrieved context
Maintains conversation history so it never re-asks for info.
"""

import os
import logging
from typing import Optional, Generator

from groq import Groq
from dotenv import load_dotenv

from pinecone_client import query_context

load_dotenv()

logger = logging.getLogger(__name__)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are an AI career assistant. You help users with job applications, resumes, cover letters, and career advice.

You have access to the user's career profile stored in a vector database. When answering questions:
1. Use the retrieved context to give personalised answers based on the user's REAL experience
2. Remember the conversation history — don't re-ask for information already discussed
3. Never fabricate experience or skills the user doesn't have
4. If the context doesn't have enough info, say so honestly

When a user pastes a job description, tell them you'll run the full agent crew to generate:
- A tailored resume
- A cover letter
- Company research
- Interview prep questions

For general career questions (rewrite a paragraph, explain a concept, list skills), answer directly without triggering the full crew.

Be concise, helpful, and professional."""

# Signals that indicate a message is a job description
JD_SIGNALS = [
    "responsibilities", "requirements", "qualifications",
    "we are looking for", "job description", "apply now",
    "years of experience", "must have", "nice to have",
    "what you'll do", "about the role", "about us",
    "tech stack", "compensation", "benefits",
    "full-time", "part-time", "remote", "hybrid",
    "senior", "junior", "lead", "manager",
]


class ChatSession:
    """
    Manages a single user's chat session.
    Keeps conversation history in memory for context continuity.
    """

    def __init__(self, user_id: str):
        self.user_id = user_id
        self.history: list[dict] = []
        self.max_history = 20  # keep last 20 messages to avoid token overflow

    def is_job_description(self, message: str) -> bool:
        """
        Heuristic check — does this message look like a job description?
        If 3+ signal words are found, it's probably a JD.
        """
        lower = message.lower()
        matches = sum(1 for signal in JD_SIGNALS if signal in lower)
        # Also check length — JDs are usually 200+ words
        word_count = len(message.split())
        return matches >= 3 or (matches >= 2 and word_count > 150)

    def chat(self, message: str) -> dict:
        """
        Process a chat message.

        Returns:
            {"type": "full_crew", "message": str} — if it's a job description
            {"type": "stream", "stream": generator} — if it's a general question
        """
        # Add user message to history
        self.history.append({"role": "user", "content": message})

        # Trim history if too long
        if len(self.history) > self.max_history:
            self.history = self.history[-self.max_history:]

        # Check if it's a job description
        if self.is_job_description(message):
            logger.info(f"Detected job description for user {self.user_id}")
            self.history.append({
                "role": "assistant",
                "content": "I've detected a job description! I'm now running my AI agents to generate your tailored resume, cover letter, company research, and interview prep. This will take 1-2 minutes..."
            })
            return {"type": "full_crew", "message": message}

        # General question — retrieve context and answer directly
        logger.info(f"General chat for user {self.user_id}: {message[:50]}...")
        return self._answer_directly(message)

    def _answer_directly(self, message: str) -> dict:
        """Answer a general question using retrieved context + conversation history."""

        # Retrieve relevant context from Pinecone
        context_chunks = query_context(self.user_id, message, top_k=5)
        context_str = "\n\n".join(context_chunks) if context_chunks else ""

        # Build messages for Groq
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        if context_str:
            messages.append({
                "role": "system",
                "content": f"Retrieved context from user's profile:\n{context_str}",
            })
        else:
            messages.append({
                "role": "system",
                "content": (
                    "WARNING: No profile context was found in the database for this user. "
                    "Do NOT invent or hallucinate any experience, skills, or achievements. "
                    "Tell the user honestly that their profile data could not be retrieved, "
                    "and ask them to upload their CV on the Dashboard first."
                ),
            })

        # Add conversation history
        messages.extend(self.history)

        # Stream response
        try:
            stream = groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=messages,
                stream=True,
                temperature=0.7,
                max_tokens=1000,
            )

            return {"type": "stream", "stream": self._stream_generator(stream)}

        except Exception as e:
            logger.error(f"Chat error: {e}")
            return {
                "type": "stream",
                "stream": iter([f"Sorry, I encountered an error: {str(e)}"]),
            }

    def _stream_generator(self, stream) -> Generator[str, None, None]:
        """Convert OpenAI stream to a text generator, also saves to history."""
        full_response = ""
        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                full_response += delta
                yield delta

        # Save assistant response to history
        if full_response:
            self.history.append({"role": "assistant", "content": full_response})

    def add_crew_result(self, result: str):
        """Add the crew's output to conversation history so the chat remembers it."""
        self.history.append({
            "role": "assistant",
            "content": f"Here are the results from my AI agents:\n\n{result}",
        })