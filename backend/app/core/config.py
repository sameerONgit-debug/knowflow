"""
KnowFlow Backend Configuration

Environment-based configuration with validation.
"""

from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment."""
    
    # API Configuration
    app_name: str = "KnowFlow API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    # CORS
    cors_origins: str = "*"  # Comma-separated in production
    
    # AI Configuration
    gemini_api_key: Optional[str] = None
    ai_model: str = "gemini-1.5-flash"
    
    # Future: Database
    # database_url: str = "sqlite+aiosqlite:///./knowflow.db"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Singleton
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get or create settings singleton."""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
