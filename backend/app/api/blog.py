"""
Blog API routes
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from app.schemas.blog import BlogPostCreate, BlogPostUpdate, BlogPostResponse, BlogPostListResponse
from app.core.security import get_current_user
from app.core.supabase import supabase_client
from datetime import datetime


router = APIRouter(prefix="/api/blog", tags=["Blog"])


@router.get("/posts", response_model=BlogPostListResponse)
async def get_blog_posts(
    published_only: bool = True,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    category: Optional[str] = None,
):
    """
    Get all blog posts (published only for public, all for authenticated users)
    """
    query = supabase_client.table("blog_posts").select("*", count="exact")

    if published_only:
        query = query.eq("published", True)

    if category:
        query = query.eq("category", category)

    # Pagination
    offset = (page - 1) * page_size
    query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)

    response = query.execute()

    return BlogPostListResponse(
        posts=response.data,
        total=response.count or 0,
        page=page,
        page_size=page_size
    )


@router.get("/posts/{post_id}", response_model=BlogPostResponse)
async def get_blog_post(post_id: str):
    """
    Get a single blog post by ID
    """
    response = supabase_client.table("blog_posts").select("*").eq("id", post_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Blog post not found")

    return response.data[0]


@router.get("/posts/slug/{slug}", response_model=BlogPostResponse)
async def get_blog_post_by_slug(slug: str):
    """
    Get a blog post by slug
    """
    response = supabase_client.table("blog_posts").select("*").eq("slug", slug).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Blog post not found")

    return response.data[0]


@router.post("/posts", response_model=BlogPostResponse, status_code=status.HTTP_201_CREATED)
async def create_blog_post(
    post: BlogPostCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new blog post (authenticated users only)
    """
    # Calculate read time (simple formula: ~200 words per minute)
    word_count = len(post.content.split())
    read_time = f"{max(1, round(word_count / 200))} min"

    post_data = post.model_dump()
    post_data["author_id"] = current_user["user_id"]
    post_data["read_time"] = read_time

    if post.published:
        post_data["published_at"] = datetime.utcnow().isoformat()

    response = supabase_client.table("blog_posts").insert(post_data).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create blog post")

    return response.data[0]


@router.put("/posts/{post_id}", response_model=BlogPostResponse)
async def update_blog_post(
    post_id: str,
    post: BlogPostUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a blog post (authenticated users only)
    """
    # Get existing post
    existing = supabase_client.table("blog_posts").select("*").eq("id", post_id).execute()

    if not existing.data:
        raise HTTPException(status_code=404, detail="Blog post not found")

    update_data = post.model_dump(exclude_unset=True)

    # Update published_at if publishing for the first time
    if post.published and not existing.data[0].get("published"):
        update_data["published_at"] = datetime.utcnow().isoformat()

    # Recalculate read time if content changed
    if post.content:
        word_count = len(post.content.split())
        update_data["read_time"] = f"{max(1, round(word_count / 200))} min"

    response = supabase_client.table("blog_posts").update(update_data).eq("id", post_id).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to update blog post")

    return response.data[0]


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_blog_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a blog post (authenticated users only)
    """
    response = supabase_client.table("blog_posts").delete().eq("id", post_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Blog post not found")

    return None
