"""
Profile schemas
"""
from pydantic import BaseModel, HttpUrl
from typing import Optional


class ProfileBase(BaseModel):
    name: str
    title: str
    bio: str
    email: str
    phone: Optional[str] = None
    location: Optional[str] = None
    profile_image_url: Optional[str] = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    profile_image_url: Optional[str] = None


class ProfileResponse(ProfileBase):
    id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True
