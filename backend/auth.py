"""
Authentication helpers using Supabase.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_supabase
from typing import Optional

security = HTTPBearer()

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
    """Create a new user via Supabase Auth."""
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
        # Return what we need for the response
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
            
        # Explicit programmatic check to ensure the user is confirmed
        if not getattr(res.user, 'email_confirmed_at', None):
            raise Exception("Email not confirmed. Please check your inbox for the verification email.")

        return {
            "id": res.user.id,
            "email": res.user.email,
            "token": res.session.access_token
        }
    except Exception as e:
        print(f"Supabase login failed: {str(e)}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
