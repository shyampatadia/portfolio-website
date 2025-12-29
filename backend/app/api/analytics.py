"""
Analytics API routes for tracking and statistics
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import re
import httpx
from app.schemas.analytics import (
    PageViewCreate,
    BlogPostViewCreate,
    PageViewStats,
    BlogPostAnalytics,
    OverallStats,
    RecentActivity
)
from app.core.security import get_current_user
from app.core.supabase import supabase_client, supabase_admin


router = APIRouter(prefix="/analytics", tags=["Analytics"])


# Helper functions for parsing device info
def parse_user_agent(user_agent: str) -> Dict[str, Optional[str]]:
    """
    Parse user agent string to extract device type, OS, and browser
    """
    if not user_agent:
        return {"device_type": None, "os": None, "browser": None}

    ua_lower = user_agent.lower()

    # Detect device type
    device_type = "desktop"
    if re.search(r'mobile|android|iphone|ipod|blackberry|opera mini|windows phone', ua_lower):
        device_type = "mobile"
    elif re.search(r'tablet|ipad|kindle|playbook', ua_lower):
        device_type = "tablet"

    # Detect OS
    os = None
    if 'windows' in ua_lower:
        os = "Windows"
    elif 'mac os x' in ua_lower or 'macos' in ua_lower:
        os = "macOS"
    elif 'iphone' in ua_lower or 'ipad' in ua_lower:
        os = "iOS"
    elif 'android' in ua_lower:
        os = "Android"
    elif 'linux' in ua_lower:
        os = "Linux"
    elif 'cros' in ua_lower:
        os = "Chrome OS"

    # Detect browser
    browser = None
    if 'edg/' in ua_lower or 'edge/' in ua_lower:
        browser = "Edge"
    elif 'chrome' in ua_lower and 'edg' not in ua_lower:
        browser = "Chrome"
    elif 'safari' in ua_lower and 'chrome' not in ua_lower:
        browser = "Safari"
    elif 'firefox' in ua_lower:
        browser = "Firefox"
    elif 'opera' in ua_lower or 'opr/' in ua_lower:
        browser = "Opera"

    return {
        "device_type": device_type,
        "os": os,
        "browser": browser
    }


async def get_location_from_ip(ip_address: str) -> Dict[str, Optional[str]]:
    """
    Get location information from IP address using ipapi.co
    Free tier: 1,000 requests per day
    """
    if not ip_address or ip_address == "127.0.0.1" or ip_address.startswith("192.168"):
        print(f"[Analytics] Skipping location lookup for local IP: {ip_address}")
        return {
            "country": None,
            "country_code": None,
            "city": None,
            "region": None
        }

    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(f"https://ipapi.co/{ip_address}/json/")
            if response.status_code == 200:
                data = response.json()
                location = {
                    "country": data.get("country_name"),
                    "country_code": data.get("country_code"),
                    "city": data.get("city"),
                    "region": data.get("region")
                }
                print(f"[Analytics] Location found for {ip_address}: {location.get('city')}, {location.get('country')}")
                return location
    except Exception as e:
        print(f"[Analytics] Failed to get location for IP {ip_address}: {e}")

    return {
        "country": None,
        "country_code": None,
        "city": None,
        "region": None
    }


@router.post("/track/page", status_code=status.HTTP_201_CREATED)
async def track_page_view(view: PageViewCreate, request: Request, test_ip: Optional[str] = None):
    """
    Track a page view (public endpoint)
    Called from frontend when user visits a page

    For local testing, you can pass ?test_ip=8.8.8.8 to simulate a public IP
    """
    # Get IP address from request (or use test IP for local development)
    ip_address = test_ip if test_ip else (request.client.host if request.client else None)

    view_data = view.model_dump()
    view_data["ip_address"] = ip_address

    # Parse user agent for device info
    device_info = parse_user_agent(view.user_agent or "")
    view_data.update(device_info)

    # Get location from IP
    location_info = await get_location_from_ip(ip_address or "")
    view_data.update(location_info)

    try:
        # Use admin client to bypass RLS - backend API is trusted
        response = supabase_admin.table("page_views").insert(view_data).execute()
        return {"success": True, "message": "Page view tracked"}
    except Exception as e:
        # Don't fail the page load if tracking fails
        print(f"[Analytics] Failed to track page view: {e}")
        return {"success": False, "message": "Tracking failed"}


@router.post("/track/blog", status_code=status.HTTP_201_CREATED)
async def track_blog_view(view: BlogPostViewCreate, request: Request):
    """
    Track a blog post view with engagement metrics
    Called from blog post page
    """
    # Get IP address from request
    ip_address = request.client.host if request.client else None

    view_data = view.model_dump()

    # Parse user agent for device info
    device_info = parse_user_agent(view.user_agent or "")
    view_data.update(device_info)

    # Get location from IP
    location_info = await get_location_from_ip(ip_address or "")
    view_data.update(location_info)

    try:
        # Use admin client to bypass RLS - backend API is trusted
        response = supabase_admin.table("blog_post_views").insert(view_data).execute()
        return {"success": True, "message": "Blog view tracked"}
    except Exception as e:
        print(f"[Analytics] Failed to track blog view: {e}")
        return {"success": False, "message": "Tracking failed"}


@router.get("/stats/overall", response_model=OverallStats)
async def get_overall_stats(current_user: dict = Depends(get_current_user)):
    """
    Get overall website statistics (authenticated only)
    """
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)

    # Total page views
    total_views_response = supabase_admin.table("page_views").select("id", count="exact").execute()
    total_page_views = total_views_response.count or 0

    # Unique visitors - total
    unique_total_response = supabase_admin.table("page_views").select("visitor_id").execute()
    unique_visitors_total = len(set(v["visitor_id"] for v in unique_total_response.data))

    # Unique visitors - today
    unique_today_response = supabase_admin.table("page_views")\
        .select("visitor_id")\
        .gte("created_at", today_start.isoformat())\
        .execute()
    unique_visitors_today = len(set(v["visitor_id"] for v in unique_today_response.data))

    # Unique visitors - week
    unique_week_response = supabase_admin.table("page_views")\
        .select("visitor_id")\
        .gte("created_at", week_start.isoformat())\
        .execute()
    unique_visitors_week = len(set(v["visitor_id"] for v in unique_week_response.data))

    # Unique visitors - month
    unique_month_response = supabase_admin.table("page_views")\
        .select("visitor_id")\
        .gte("created_at", month_start.isoformat())\
        .execute()
    unique_visitors_month = len(set(v["visitor_id"] for v in unique_month_response.data))

    # Total blog views
    blog_views_response = supabase_admin.table("blog_post_views").select("id", count="exact").execute()
    total_blog_views = blog_views_response.count or 0

    # Top pages (excluding API endpoints)
    all_page_views = supabase_admin.table("page_views")\
        .select("page_path, visitor_id, created_at")\
        .execute()

    # Aggregate top pages
    page_stats = {}
    for view in all_page_views.data:
        path = view["page_path"]
        if path.startswith("/api"):
            continue
        if path not in page_stats:
            page_stats[path] = {"views": 0, "visitors": set(), "last_viewed": view["created_at"]}
        page_stats[path]["views"] += 1
        page_stats[path]["visitors"].add(view["visitor_id"])
        if view["created_at"] > page_stats[path]["last_viewed"]:
            page_stats[path]["last_viewed"] = view["created_at"]

    top_pages = [
        PageViewStats(
            page_path=path,
            total_views=stats["views"],
            unique_visitors=len(stats["visitors"]),
            last_viewed=stats["last_viewed"]
        )
        for path, stats in sorted(page_stats.items(), key=lambda x: x[1]["views"], reverse=True)[:10]
    ]

    # Top blog posts
    try:
        blog_stats_response = supabase_admin.rpc("get_blog_post_stats").execute()
        top_blog_posts = [BlogPostAnalytics(**stat) for stat in blog_stats_response.data[:10]]
    except Exception as e:
        # If RPC doesn't exist, calculate manually
        print(f"[Analytics] RPC function not found, calculating manually: {e}")
        # Get all blog views
        all_blog_views = supabase_admin.table("blog_post_views")\
            .select("blog_post_id, blog_post_slug, visitor_id, time_spent_seconds, scroll_depth, created_at")\
            .execute()

        # Get blog post titles
        blog_posts = supabase_admin.table("blog_posts")\
            .select("id, title, slug")\
            .execute()

        blog_post_map = {bp["id"]: bp for bp in blog_posts.data}

        # Aggregate blog stats
        blog_stats_dict = {}
        for view in all_blog_views.data:
            post_id = view["blog_post_id"]
            if post_id not in blog_stats_dict:
                blog_stats_dict[post_id] = {
                    "views": 0,
                    "visitors": set(),
                    "time_spent": [],
                    "scroll_depths": [],
                    "last_viewed": view["created_at"]
                }
            blog_stats_dict[post_id]["views"] += 1
            blog_stats_dict[post_id]["visitors"].add(view["visitor_id"])
            if view["time_spent_seconds"]:
                blog_stats_dict[post_id]["time_spent"].append(view["time_spent_seconds"])
            if view["scroll_depth"]:
                blog_stats_dict[post_id]["scroll_depths"].append(view["scroll_depth"])
            if view["created_at"] > blog_stats_dict[post_id]["last_viewed"]:
                blog_stats_dict[post_id]["last_viewed"] = view["created_at"]

        top_blog_posts = []
        for post_id, stats in sorted(blog_stats_dict.items(), key=lambda x: x[1]["views"], reverse=True)[:10]:
            if post_id in blog_post_map:
                avg_time = sum(stats["time_spent"]) / len(stats["time_spent"]) if stats["time_spent"] else None
                avg_scroll = sum(stats["scroll_depths"]) / len(stats["scroll_depths"]) if stats["scroll_depths"] else None

                top_blog_posts.append(BlogPostAnalytics(
                    blog_post_id=post_id,
                    title=blog_post_map[post_id]["title"],
                    slug=blog_post_map[post_id]["slug"],
                    total_views=stats["views"],
                    unique_views=len(stats["visitors"]),
                    avg_time_spent=avg_time,
                    avg_scroll_depth=avg_scroll,
                    last_viewed=stats["last_viewed"]
                ))

    return OverallStats(
        total_page_views=total_page_views,
        unique_visitors_total=unique_visitors_total,
        unique_visitors_today=unique_visitors_today,
        unique_visitors_week=unique_visitors_week,
        unique_visitors_month=unique_visitors_month,
        total_blog_views=total_blog_views,
        top_pages=top_pages,
        top_blog_posts=top_blog_posts
    )


@router.get("/activity/recent", response_model=List[RecentActivity])
async def get_recent_activity(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """
    Get recent page view activity (authenticated only)
    """
    response = supabase_admin.table("page_views")\
        .select("page_path, page_title, visitor_id, device_type, os, browser, country, city, created_at")\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute()

    return [RecentActivity(**view) for view in response.data]


@router.get("/blog/{post_id}/stats", response_model=BlogPostAnalytics)
async def get_blog_post_stats(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed analytics for a specific blog post
    """
    # Get blog post info
    post = supabase_admin.table("blog_posts").select("id, title, slug").eq("id", post_id).execute()
    if not post.data:
        raise HTTPException(status_code=404, detail="Blog post not found")

    # Get all views for this post
    views = supabase_admin.table("blog_post_views")\
        .select("visitor_id, time_spent_seconds, scroll_depth, created_at")\
        .eq("blog_post_id", post_id)\
        .execute()

    total_views = len(views.data)
    unique_views = len(set(v["visitor_id"] for v in views.data))

    time_spent_values = [v["time_spent_seconds"] for v in views.data if v["time_spent_seconds"]]
    avg_time_spent = sum(time_spent_values) / len(time_spent_values) if time_spent_values else None

    scroll_values = [v["scroll_depth"] for v in views.data if v["scroll_depth"]]
    avg_scroll_depth = sum(scroll_values) / len(scroll_values) if scroll_values else None

    last_viewed = max((v["created_at"] for v in views.data), default=None) if views.data else None

    return BlogPostAnalytics(
        blog_post_id=post_id,
        title=post.data[0]["title"],
        slug=post.data[0]["slug"],
        total_views=total_views,
        unique_views=unique_views,
        avg_time_spent=avg_time_spent,
        avg_scroll_depth=avg_scroll_depth,
        last_viewed=last_viewed
    )
