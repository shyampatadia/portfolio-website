"""
Profile API routes
"""
from fastapi import APIRouter, HTTPException, status, Depends
from app.schemas.profile import ProfileCreate, ProfileUpdate, ProfileResponse
from app.core.security import get_current_user
from app.core.supabase import supabase_client


router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.get("", response_model=ProfileResponse)
async def get_profile():
    """
    Get profile information (public)
    """
    response = supabase_client.table("profiles").select("*").limit(1).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    return response.data[0]


@router.put("", response_model=ProfileResponse)
async def update_profile(
    profile: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update profile information (authenticated users only)
    """
    # Get existing profile
    existing = supabase_client.table("profiles").select("*").limit(1).execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile_id = existing.data[0]["id"]
    update_data = profile.model_dump(exclude_unset=True)

    response = supabase_client.table("profiles").update(update_data).eq("id", profile_id).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to update profile")

    return response.data[0]
