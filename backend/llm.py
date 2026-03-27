import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

def get_groq_llm():
    """Returns a ChatGroq LLM for CrewAI agents."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in .env")
    return ChatGroq(
        temperature=0.7,
        model_name="llama3-8b-8192",  # Or llama3-70b-8192 if speed isn't a tight constraint
        groq_api_key=api_key
    )
