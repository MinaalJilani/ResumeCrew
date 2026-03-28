"""
Authentication helpers using Supabase.
"""

import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_supabase
from supabase import create_client
from typing import Optional

security = HTTPBearer()

def get_admin_supabase():
    """Returns a Supabase client with the service role key for admin operations."""
    url = os.getenv("SUPABASE_URL", "")
    service_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not url or not service_key:
        return None
    return create_client(url, service_key)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Extract user from Bearer token using Supabase Auth.
    Use as: user_id: str = Depends(get_current_user)
    """
    supabase = get_supabase()
    token = credentials.credentials
    try:
        res = supabase.auth.get_user(token)
        if not res or not res.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return res.user.id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
        )

def create_user(email: str, password: str, full_name: str = "") -> dict:
    """Create a new user via Supabase Auth.
    
    Uses admin API (service role key) if available to create users with
    email already confirmed — no SMTP needed, users login immediately.
    Falls back to standard sign_up with email confirmation if admin key missing.
    """
    admin_supabase = get_admin_supabase()

    if admin_supabase:
        # Admin path: create user with email pre-confirmed, no email needed
        try:
            res = admin_supabase.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {"full_name": full_name}
            })
            if not res.user:
                raise Exception("Admin sign up returned no user")

            # Sign in immediately to get a session token
            sign_in_res = admin_supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            return {
                "id": res.user.id,
                "email": res.user.email,
                "token": sign_in_res.session.access_token if sign_in_res.session else ""
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration failed: {str(e)}"
            )
    else:
        # Fallback: standard sign_up, requires email confirmation via SMTP
        supabase = get_supabase()
        try:
            res = supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {"full_name": full_name}
                }
            })
            if not res.user:
                raise Exception("Sign up returned no user")
            return {
                "id": res.user.id,
                "email": res.user.email,
                "token": res.session.access_token if res.session else ""
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration failed: {str(e)}"
            )

def authenticate_user(email: str, password: str) -> Optional[dict]:
    """Verify credentials via Supabase Auth."""
    supabase = get_supabase()
    try:
        res = supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        if not res.user or not res.session:
            return None
        return {
            "id": res.user.id,
            "email": res.user.email,
            "token": res.session.access_token
        }
    except Exception as e:
        print(f"Supabase login failed: {str(e)}")
        return None