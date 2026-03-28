import os
from dotenv import load_dotenv
from crewai import LLM

load_dotenv()

def get_groq_llm():
    """Returns a CrewAI-native LLM configured to use Groq."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in .env")
    return LLM(
        model="groq/llama3-8b-8192",
        api_key=api_key,
        temperature=0.7,
    )
