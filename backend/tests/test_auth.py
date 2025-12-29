"""
Tests for authentication API endpoints
"""
import pytest
from unittest.mock import patch
from fastapi import status


class TestLogin:
    """Tests for login endpoint"""

    def test_login_success(self, client):
        """Test successful admin login"""
        with patch('app.api.auth.settings') as mock_settings:
            mock_settings.ADMIN_EMAIL = "admin@example.com"
            mock_settings.ADMIN_PASSWORD = "admin123"
            mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 30

            response = client.post(
                "/api/auth/login",
                json={
                    "email": "admin@example.com",
                    "password": "admin123"
                }
            )

            assert response.status_code == status.HTTP_200_OK
            data = response.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"

    def test_login_invalid_email(self, client):
        """Test login with invalid email"""
        with patch('app.api.auth.settings') as mock_settings:
            mock_settings.ADMIN_EMAIL = "admin@example.com"
            mock_settings.ADMIN_PASSWORD = "admin123"

            response = client.post(
                "/api/auth/login",
                json={
                    "email": "wrong@example.com",
                    "password": "admin123"
                }
            )

            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Incorrect email or password" in response.json()["detail"]

    def test_login_invalid_password(self, client):
        """Test login with invalid password"""
        with patch('app.api.auth.settings') as mock_settings:
            mock_settings.ADMIN_EMAIL = "admin@example.com"
            mock_settings.ADMIN_PASSWORD = "admin123"

            response = client.post(
                "/api/auth/login",
                json={
                    "email": "admin@example.com",
                    "password": "wrongpassword"
                }
            )

            assert response.status_code == status.HTTP_401_UNAUTHORIZED
            assert "Incorrect email or password" in response.json()["detail"]

    def test_login_missing_fields(self, client):
        """Test login with missing fields"""
        response = client.post(
            "/api/auth/login",
            json={}
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestCurrentUser:
    """Tests for getting current user information"""

    def test_get_current_user_success(self, client, auth_headers):
        """Test getting current user information with valid token"""
        response = client.get(
            "/api/auth/me",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert data["id"] == "00000000-0000-0000-0000-000000000000"

    def test_get_current_user_no_token(self, client):
        """Test getting current user without token"""
        response = client.get("/api/auth/me")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_get_current_user_invalid_token(self, client):
        """Test getting current user with invalid token"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestLogout:
    """Tests for logout endpoint"""

    def test_logout_success(self, client, auth_headers):
        """Test successful logout"""
        response = client.post(
            "/api/auth/logout",
            headers=auth_headers
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "message" in data

    def test_logout_no_token(self, client):
        """Test logout without token"""
        response = client.post("/api/auth/logout")

        assert response.status_code == status.HTTP_403_FORBIDDEN
