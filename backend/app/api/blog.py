"""
Blog API routes
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from app.schemas.blog import BlogPostCreate, BlogPostUpdate, BlogPostResponse, BlogPostListResponse
from app.core.security import get_current_user
from app.core.supabase import supabase_client, supabase_admin
from datetime import datetime


router = APIRouter(prefix="/blog", tags=["Blog"])


@router.get("/posts", response_model=BlogPostListResponse)
async def get_blog_posts(
    published_only: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    category: Optional[str] = None,
):
    """
    Get all blog posts (published only for public, all for authenticated users)
    """
    # Debug logging
    print(f"[DEBUG] published_only parameter: {published_only} (type: {type(published_only).__name__})")

    # IMPORTANT: Use admin client for unrestricted access to bypass RLS
    client = supabase_admin if published_only is False else supabase_client

    query = client.table("blog_posts").select("*", count="exact")

    # Filter by published status
    # published_only=False → show all posts (admin)
    # published_only=True or None → show published only (public)
    if published_only is False:
        # Explicitly show all posts
        print("[DEBUG] Using ADMIN client - Showing ALL posts (published + drafts)")
        pass  # Don't filter
    else:
        # Show only published posts (default behavior)
        print("[DEBUG] Using PUBLIC client - Showing PUBLISHED posts only")
        query = query.eq("published", True)

    if category:
        query = query.eq("category", category)

    # Pagination
    offset = (page - 1) * page_size
    query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)

    # Execute query
    response = query.execute()

    # Debug logging - check total count
    print(f"[DEBUG] Supabase TOTAL count: {response.count}")
    print(f"[DEBUG] Supabase returned {len(response.data)} posts in this page:")
    for post in response.data:
        print(f"  - {post.get('title')} (published: {post.get('published')}, id: {post.get('id')})")

    # Try a raw query to see ALL posts regardless of anything
    try:
        raw_response = client.table("blog_posts").select("id, title, published").execute()
        print(f"[DEBUG] RAW query (no filters) returned {len(raw_response.data)} posts:")
        for post in raw_response.data:
            print(f"  - {post.get('title')} (published: {post.get('published')}, id: {post.get('id')})")
    except Exception as e:
        print(f"[DEBUG] Raw query failed: {e}")

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
    Uses admin client to allow fetching unpublished posts (for admin panel editing)
    Public website uses slug-based lookup which enforces published status
    """
    # Use admin client to bypass RLS - this endpoint is primarily used by admin panel
    response = supabase_admin.table("blog_posts").select("*").eq("id", post_id).execute()

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
    post_data["read_time"] = read_time
    post_data["author_id"] = current_user["user_id"]

    if post.published:
        post_data["published_at"] = datetime.utcnow().isoformat()

    try:
        response = supabase_admin.table("blog_posts").insert(post_data).execute()

        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create blog post")

        return response.data[0]
    except Exception as e:
        error_msg = str(e)

        # Handle specific database errors with helpful messages
        if "23505" in error_msg or "duplicate key" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail="A blog post with this slug already exists. Please use a different slug."
            )
        elif "23503" in error_msg or "foreign key constraint" in error_msg.lower():
            raise HTTPException(
                status_code=500,
                detail="Database configuration error: author_id foreign key constraint exists. "
                       "Run 'python setup_database.py' to fix this issue."
            )
        else:
            # Generic error
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create blog post: {error_msg}"
            )


@router.put("/posts/{post_id}", response_model=BlogPostResponse)
async def update_blog_post(
    post_id: str,
    post: BlogPostUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a blog post (authenticated users only)
    """
    # Get existing post - use admin client to access unpublished posts
    existing = supabase_admin.table("blog_posts").select("*").eq("id", post_id).execute()

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

    response = supabase_admin.table("blog_posts").update(update_data).eq("id", post_id).execute()

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
    response = supabase_admin.table("blog_posts").delete().eq("id", post_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Blog post not found")

    return None
