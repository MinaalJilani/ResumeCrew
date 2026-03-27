"""
Supabase client setup.
Replaces the old local SQLite database.
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# We instantiate the client so it can be imported anywhere
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

def get_supabase() -> Client:
    """Returns the initialized Supabase client."""
    if not supabase:
        raise ValueError("Supabase URL or Key is missing from .env")
    return supabase

def init_db():
    """Dummy function to keep main.py compatibility if needed, but not required anymore."""
    pass