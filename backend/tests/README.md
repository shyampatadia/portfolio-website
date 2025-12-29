# Testing Guide

This directory contains tests for the backend API.

## Setup

1. Activate your virtual environment and install test dependencies:
```bash
cd backend
.venv\Scripts\activate  # On Windows
source .venv/bin/activate  # On Linux/Mac
pip install -r requirements.txt
```

**Important Notes:**
- Make sure you have `httpx==0.25.2` installed to avoid version compatibility issues
- Tests use mocked Supabase clients - no real database connection needed
- Test environment variables are automatically configured in `conftest.py`

## Running Tests

### Run all tests
```bash
pytest
```

### Run specific test file
```bash
pytest tests/test_blog.py
pytest tests/test_auth.py
```

### Run specific test class
```bash
pytest tests/test_blog.py::TestBlogPostCreation
```

### Run specific test
```bash
pytest tests/test_blog.py::TestBlogPostCreation::test_create_blog_post_author_id_not_none
```

### Run with verbose output
```bash
pytest -v
```

### Run with coverage
```bash
pytest --cov=app --cov-report=html
```

### Run and stop at first failure
```bash
pytest -x
```

## Test Structure

- `conftest.py` - Shared fixtures and test configuration
- `test_auth.py` - Authentication endpoint tests
- `test_blog.py` - Blog API endpoint tests

## Key Test Cases

### Blog Post Creation (`test_blog.py`)

1. **test_create_blog_post_author_id_not_none** - Critical test that ensures `author_id` is never None when creating a blog post
2. **test_create_blog_post_success** - Tests successful blog post creation
3. **test_create_blog_post_calculates_read_time** - Tests read time calculation
4. **test_create_blog_post_sets_published_at** - Tests published_at timestamp

### Authentication (`test_auth.py`)

1. **test_login_success** - Tests successful admin login
2. **test_login_invalid_email** - Tests login with wrong email
3. **test_login_invalid_password** - Tests login with wrong password
4. **test_get_current_user_success** - Tests getting current user info

## Mocking

Tests use `unittest.mock` to mock Supabase database calls, ensuring tests:
- Run quickly without database connections
- Don't require a test database
- Are isolated and repeatable
- Can test edge cases easily

## Adding New Tests

1. Create a new test file: `test_<feature>.py`
2. Import necessary fixtures from `conftest.py`
3. Write test classes and methods following the existing patterns
4. Use mocking for external dependencies (Supabase, etc.)
