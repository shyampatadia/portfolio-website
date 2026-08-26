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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days (increased for better UX)

    # Admin
    ADMIN_EMAIL: str
    ADMIN_PASSWORD: str

    # Environment
    ENVIRONMENT: str = "development"

    # Microsoft Clarity data export.
    # The token is project-scoped, so no project id is needed for API calls;
    # CLARITY_PROJECT_ID is only the tag id used by the frontend snippet.
    # Generated at: Clarity -> Settings -> Data Export -> Generate new API token.
    CLARITY_API_TOKEN: Optional[str] = None
    CLARITY_PROJECT_ID: Optional[str] = None
    # Clarity allows only 10 export calls per project per UTC day, so responses
    # are cached for this long and served from cache in between.
    CLARITY_CACHE_MINUTES: int = 360

    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:8000",
        "http://localhost:3000",
        "http://127.0.0.1:8000",
        "null",  # Allow file:// protocol for local development
        "https://shyampatadia.github.io",  # GitHub Pages (frontend + admin)
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
