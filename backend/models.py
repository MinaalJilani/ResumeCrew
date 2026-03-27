"""
Pydantic models for all API requests and responses.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user_id: str
    email: str


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    type: str  # "stream" | "crew_started"
    job_id: Optional[str] = None
    message: Optional[str] = None


# ── Upload ────────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    status: str
    detail: str
    doc_id: str


# ── Crew Results ──────────────────────────────────────────────────────────────

class CrewResult(BaseModel):
    done: bool
    logs: list[str] = []
    outputs: dict = {}


# ── User Profile ──────────────────────────────────────────────────────────────

class UserProfile(BaseModel):
    user_id: str
    email: str
    full_name: str
    documents: list[dict] = []
    created_at: Optional[str] = None