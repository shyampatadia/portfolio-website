"""
Pytest configuration and fixtures for testing
"""
import os
import sys
from pathlib import Path
from unittest.mock import Mock, MagicMock, patch

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set environment variables BEFORE importing app
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_KEY"] = "test-key"
os.environ["SUPABASE_SERVICE_KEY"] = "test-service-key"
os.environ["SECRET_KEY"] = "test-secret-key-for-jwt-testing"
os.environ["ADMIN_EMAIL"] = "admin@example.com"
os.environ["ADMIN_PASSWORD"] = "admin123"

# Mock Supabase create_client BEFORE importing app
import supabase as supabase_module

_original_create_client = supabase_module.create_client

def _mock_create_client(*args, **kwargs):
    """Return a mock Supabase client"""
    mock_client = MagicMock()
    mock_client.table = MagicMock()
    mock_client.auth = MagicMock()
    return mock_client

# Replace create_client globally
supabase_module.create_client = _mock_create_client

# Now it's safe to import the app
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token


@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


@pytest.fixture
def admin_token():
    """Create a valid admin JWT token"""
    return create_access_token(
        data={"sub": "admin@example.com", "user_id": "00000000-0000-0000-0000-000000000000"}
    )


@pytest.fixture
def auth_headers(admin_token):
    """Create authorization headers with admin token"""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def mock_supabase_response():
    """Mock Supabase response factory"""
    def _create_response(data, count=None):
        mock_response = Mock()
        mock_response.data = data
        mock_response.count = count
        return mock_response
    return _create_response


@pytest.fixture
def sample_blog_post():
    """Sample blog post data for testing"""
    return {
        "title": "Test Blog Post",
        "slug": "test-blog-post",
        "excerpt": "This is a test excerpt",
        "content": "This is test content for the blog post. " * 50,  # ~50 words for read time
        "category": "Technology",
        "tags": ["test", "python", "fastapi"],
        "published": True,
        "image_url": "https://example.com/image.jpg"
    }


@pytest.fixture
def sample_blog_post_response():
    """Sample blog post response from database"""
    return {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Test Blog Post",
        "slug": "test-blog-post",
        "excerpt": "This is a test excerpt",
        "content": "This is test content for the blog post. " * 50,
        "category": "Technology",
        "tags": ["test", "python", "fastapi"],
        "published": True,
        "image_url": "https://example.com/image.jpg",
        "author_id": "00000000-0000-0000-0000-000000000000",
        "read_time": "1 min",
        "created_at": "2024-01-01T00:00:00",
        "updated_at": "2024-01-01T00:00:00",
        "published_at": "2024-01-01T00:00:00"
    }
