"""
Blog post schemas
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class BlogPostBase(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    category: str
    tags: List[str] = []
    published: bool = False
    image_url: Optional[str] = None


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    published: Optional[bool] = None
    image_url: Optional[str] = None


class BlogPostResponse(BlogPostBase):
    id: str
    author_id: str
    read_time: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BlogPostListResponse(BaseModel):
    posts: List[BlogPostResponse]
    total: int
    page: int
    page_size: int
