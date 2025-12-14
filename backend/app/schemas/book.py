"""
Book/Bookshelf schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import date


class BookBase(BaseModel):
    title: str
    author: str
    status: str  # read, reading, to-read
    rating: Optional[float] = None
    category: str
    review: Optional[str] = None
    tags: List[str] = []
    cover_image_url: Optional[str] = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    status: Optional[str] = None
    rating: Optional[float] = None
    category: Optional[str] = None
    review: Optional[str] = None
    tags: Optional[List[str]] = None
    cover_image_url: Optional[str] = None


class BookResponse(BookBase):
    id: str
    date_finished: Optional[date] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class BookStatsResponse(BaseModel):
    total_read: int
    currently_reading: int
    to_read: int
