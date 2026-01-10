"""
Authentication Core
Manages user sessions, hashing, and dependency injection.
Uses in-memory storage for the demo environment to ensure reliability without external DBs.
"""

import hashlib
import secrets
from typing import Dict, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.models.schemas import User

# IN-MEMORY STORAGE
users_db: Dict[str, User] = {}  # username -> User
tokens_db: Dict[str, UUID] = {} # token -> user_id

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

def hash_password(password: str) -> str:
    """Simple SHA256 hashing for demo purposes (avoids external deps)."""
    salt = "knowflow_demo_salt_2024"
    return hashlib.sha256((password + salt).encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(user: User) -> str:
    """Generate a secure random token and store it."""
    token = secrets.token_urlsafe(32)
    tokens_db[token] = user.id
    return token

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """FastAPI Dependency to get current authenticated user."""
    user_id = tokens_db.get(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Find user by ID (scan dict)
    user = next((u for u in users_db.values() if u.id == user_id), None)
    if not user:
         raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user

def register_user(username: str, password: str, full_name: str = None) -> User:
    if username in users_db:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed = hash_password(password)
    new_user = User(
        username=username,
        hashed_password=hashed,
        full_name=full_name
    )
    users_db[username] = new_user
    return new_user
