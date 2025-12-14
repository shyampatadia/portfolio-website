"""
Configuration settings for the application
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""

    # Supabase
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_SERVICE_KEY: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Admin
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    # Environment
    ENVIRONMENT: str = "development"

    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
        "null",  # Allow file:// protocol for local development
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
