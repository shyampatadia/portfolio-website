"""
Authentication API routes
"""
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import timedelta
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.core.config import settings
from app.core.security import create_access_token, verify_password, get_password_hash, get_current_user
from app.core.supabase import supabase_admin


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """
    Admin login endpoint
    """
    # Check if credentials match admin credentials
    if credentials.email != settings.ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if credentials.password != settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": credentials.email, "user_id": "admin"},
        expires_delta=access_token_expires
    )

    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    return UserResponse(
        id=current_user["user_id"],
        email=current_user["email"]
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout endpoint (client should remove token)
    """
    return {"message": "Successfully logged out"}
