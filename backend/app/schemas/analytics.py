"""
Analytics schemas for page views and statistics
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PageViewCreate(BaseModel):
    """Schema for creating a page view"""
    page_path: str = Field(..., description="URL path of the page")
    page_title: Optional[str] = Field(None, description="Title of the page")
    referrer: Optional[str] = Field(None, description="Referrer URL")
    user_agent: Optional[str] = Field(None, description="Browser user agent")
    visitor_id: str = Field(..., description="Unique visitor identifier (fingerprint)")


class BlogPostViewCreate(BaseModel):
    """Schema for creating a blog post view"""
    blog_post_id: str = Field(..., description="Blog post UUID")
    blog_post_slug: str = Field(..., description="Blog post slug")
    visitor_id: str = Field(..., description="Unique visitor identifier")
    time_spent_seconds: Optional[int] = Field(0, description="Time spent reading (seconds)")
    scroll_depth: Optional[int] = Field(0, description="Percentage scrolled (0-100)")
    user_agent: Optional[str] = Field(None, description="Browser user agent")


class PageViewStats(BaseModel):
    """Statistics for a specific page"""
    page_path: str
    total_views: int
    unique_visitors: int
    last_viewed: Optional[datetime] = None


class BlogPostAnalytics(BaseModel):
    """Analytics for a specific blog post"""
    blog_post_id: str
    title: str
    slug: str
    total_views: int
    unique_views: int
    avg_time_spent: Optional[float] = None
    avg_scroll_depth: Optional[float] = None
    last_viewed: Optional[datetime] = None


class OverallStats(BaseModel):
    """Overall website statistics"""
    total_page_views: int
    unique_visitors_total: int
    unique_visitors_today: int
    unique_visitors_week: int
    unique_visitors_month: int
    total_blog_views: int
    top_pages: list[PageViewStats]
    top_blog_posts: list[BlogPostAnalytics]


class RecentActivity(BaseModel):
    """Recent page view activity"""
    page_path: str
    page_title: Optional[str] = None
    visitor_id: str
    device_type: Optional[str] = None
    os: Optional[str] = None
    browser: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    created_at: datetime
