"""
Authentication Routes
Endpoints for user registration and session management.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.auth import register_user, create_access_token, verify_password, users_db, get_current_user, update_user_profile
from app.models.schemas import User, Token, UserUpdate

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str = None
    email: str
    employee_id: str
    role: str
    department: str
    experience_years: float

@router.post("/token", response_model=Token)
async def login(data: LoginRequest):
    """
    Login with username and password.
    Returns a Bearer token.
    """
    user = users_db.get(data.username)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    token = create_access_token(user)
    return Token(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        username=user.username
    )

@router.post("/register", response_model=User)
async def register(data: RegisterRequest):
    """Register a new user account."""
    return register_user(
        username=data.username, 
        password=data.password, 
        email=data.email,
        employee_id=data.employee_id,
        role=data.role,
        department=data.department,
        experience_years=data.experience_years,
        full_name=data.full_name
    )

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user details."""
    return current_user

@router.patch("/me", response_model=User)
async def update_current_user(updates: UserUpdate, current_user: User = Depends(get_current_user)):
    """Update current user details."""
    return update_user_profile(current_user.username, updates)
