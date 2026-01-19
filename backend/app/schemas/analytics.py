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


class TabViewCreate(BaseModel):
    """Schema for tracking tab view"""
    tab_name: str = Field(..., description="Tab name")
    visitor_id: str = Field(..., description="Unique visitor identifier")
    page_path: Optional[str] = Field(None, description="Page path where tab was clicked")


class TabViewStats(BaseModel):
    """Statistics for a specific tab"""
    tab_name: str
    total_visits: int
    unique_visitors: int


class OverallStats(BaseModel):
    """Overall website statistics"""
    total_page_views: int
    unique_visitors_total: int
    unique_visitors_today: int
    unique_visitors_week: int
    unique_visitors_month: int
    total_blog_views: int
    total_blog_visitors: int = 0
    top_pages: list[PageViewStats]
    top_blog_posts: list[BlogPostAnalytics]
    tab_stats: Optional[list[TabViewStats]] = None


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


class BlogReactionCreate(BaseModel):
    """Schema for creating/updating a blog reaction"""
    blog_post_id: str = Field(..., description="Blog post UUID")
    blog_post_slug: str = Field(..., description="Blog post slug")
    visitor_id: str = Field(..., description="Unique visitor identifier")
    reaction_type: str = Field(..., description="Reaction type: deploy, gem, learned, fire, clarity, issues, debatable, tldr")


class BlogReactionStats(BaseModel):
    """Reaction statistics for a blog post"""
    reaction_type: str
    count: int


class IndividualBlogAnalytics(BaseModel):
    """Detailed analytics for a single blog post"""
    blog_post_id: str
    title: str
    slug: str
    published_at: Optional[datetime] = None
    total_views: int
    unique_visitors: int
    avg_time_spent: Optional[float] = None
    avg_scroll_depth: Optional[float] = None
    reactions: list[BlogReactionStats] = []
    total_reactions: int
    last_viewed: Optional[datetime] = None


class ResumeViewCreate(BaseModel):
    """Schema for tracking resume view or download"""
    visitor_id: str = Field(..., description="Unique visitor identifier")
    action_type: str = Field(..., description="Action type: 'view' or 'download'")
    user_agent: Optional[str] = Field(None, description="Browser user agent")


class ResumeViewStats(BaseModel):
    """Statistics for resume views and downloads"""
    total_views: int
    unique_viewers: int
    total_downloads: int
    unique_downloaders: int
    last_viewed: Optional[datetime] = None
    last_downloaded: Optional[datetime] = None
