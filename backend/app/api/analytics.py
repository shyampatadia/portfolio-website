"""
Analytics API routes for tracking and statistics
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from ipaddress import ip_address as parse_ip_address
import re
import httpx
from app.schemas.analytics import (
    PageViewCreate,
    BlogPostViewCreate,
    PageViewStats,
    BlogPostAnalytics,
    OverallStats,
    RecentActivity,
    TabViewCreate,
    TabViewStats,
    BlogReactionCreate,
    BlogReactionStats,
    IndividualBlogAnalytics,
    ResumeViewCreate,
    ResumeViewStats
)
from app.core.security import get_current_user
from app.core.supabase import supabase_client, supabase_admin


router = APIRouter(prefix="/analytics", tags=["Analytics"])

EXCLUDED_PAGE_PREFIXES = (
    "/api",
    "/admin",
)

EXCLUDED_PAGE_PATHS = {
    "/admin",
    "/admin/",
    "/admin/index.html",
}


def get_client_ip(request: Request, fallback_ip: Optional[str] = None) -> Optional[str]:
    """
    Resolve the real client IP behind Vercel/proxy layers.
    """
    if fallback_ip:
        return fallback_ip.strip()

    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    for header_name in ("cf-connecting-ip", "x-real-ip", "true-client-ip"):
        header_value = request.headers.get(header_name)
        if header_value:
            return header_value.strip()

    forwarded = request.headers.get("forwarded")
    if forwarded:
        match = re.search(r"for=\"?([^;,\"\s]+)", forwarded, flags=re.IGNORECASE)
        if match:
            return match.group(1).strip("[]")

    return request.client.host if request.client else None


def is_internal_ip(ip_address: Optional[str]) -> bool:
    if not ip_address:
        return False

    try:
        parsed = parse_ip_address(ip_address)
    except ValueError:
        return False

    return (
        parsed.is_private
        or parsed.is_loopback
        or parsed.is_link_local
        or parsed.is_reserved
        or parsed.is_multicast
    )


def is_public_page_view(view: dict) -> bool:
    page_path = (view.get("page_path") or "").strip()
    visitor_id = (view.get("visitor_id") or "").strip()

    if not page_path or not visitor_id:
        return False

    if page_path in EXCLUDED_PAGE_PATHS:
        return False

    if any(page_path.startswith(prefix) for prefix in EXCLUDED_PAGE_PREFIXES):
        return False

    if is_internal_ip(view.get("ip_address")):
        return False

    return True


def parse_created_at(value) -> Optional[datetime]:
    if isinstance(value, datetime):
        return value.replace(tzinfo=None)

    if not value:
        return None

    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def is_since(view: dict, start: datetime) -> bool:
    created_at = parse_created_at(view.get("created_at"))
    return bool(created_at and created_at >= start)


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
    if not ip_address or is_internal_ip(ip_address):
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
    # Get IP address from proxy headers (or use test IP for local development)
    ip_address = get_client_ip(request, test_ip)

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
    # Get IP address from proxy headers
    ip_address = get_client_ip(request)

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


@router.post("/track/tab", status_code=status.HTTP_201_CREATED)
async def track_tab_view(view: TabViewCreate, request: Request):
    """
    Track a portfolio tab view (public endpoint)
    Called from frontend when user switches tabs
    """
    view_data = view.model_dump()

    try:
        # Use admin client to bypass RLS - backend API is trusted
        response = supabase_admin.table("tab_views").insert(view_data).execute()
        return {"success": True, "message": "Tab view tracked"}
    except Exception as e:
        print(f"[Analytics] Failed to track tab view: {e}")
        return {"success": False, "message": "Tracking failed"}


@router.post("/track/resume", status_code=status.HTTP_201_CREATED)
async def track_resume_action(view: ResumeViewCreate, request: Request):
    """
    Track a resume view or download (public endpoint)
    Called from resume page when user views or downloads the resume

    action_type can be 'view' or 'download'
    """
    # Get IP address from proxy headers
    ip_address = get_client_ip(request)

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
        response = supabase_admin.table("resume_views").insert(view_data).execute()
        return {"success": True, "message": f"Resume {view.action_type} tracked"}
    except Exception as e:
        print(f"[Analytics] Failed to track resume {view.action_type}: {e}")
        return {"success": False, "message": "Tracking failed"}


@router.get("/stats/resume", response_model=ResumeViewStats)
async def get_resume_stats(current_user: dict = Depends(get_current_user)):
    """
    Get resume view and download statistics (authenticated only)
    """
    try:
        # Get all resume views
        all_resume_views = supabase_admin.table("resume_views")\
            .select("visitor_id, action_type, created_at")\
            .execute()

        views = [v for v in all_resume_views.data if v["action_type"] == "view"]
        downloads = [v for v in all_resume_views.data if v["action_type"] == "download"]

        total_views = len(views)
        unique_viewers = len(set(v["visitor_id"] for v in views))
        total_downloads = len(downloads)
        unique_downloaders = len(set(v["visitor_id"] for v in downloads))

        last_viewed = max((v["created_at"] for v in views), default=None) if views else None
        last_downloaded = max((v["created_at"] for v in downloads), default=None) if downloads else None

        return ResumeViewStats(
            total_views=total_views,
            unique_viewers=unique_viewers,
            total_downloads=total_downloads,
            unique_downloaders=unique_downloaders,
            last_viewed=last_viewed,
            last_downloaded=last_downloaded
        )
    except Exception as e:
        print(f"[Analytics] Failed to get resume stats: {e}")
        return ResumeViewStats(
            total_views=0,
            unique_viewers=0,
            total_downloads=0,
            unique_downloaders=0,
            last_viewed=None,
            last_downloaded=None
        )


@router.get("/stats/overall", response_model=OverallStats)
async def get_overall_stats(current_user: dict = Depends(get_current_user)):
    """
    Get overall website statistics (authenticated only)
    """
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)

    # Fetch page views once and calculate public-facing KPIs consistently.
    all_page_views = supabase_admin.table("page_views")\
        .select("page_path, visitor_id, ip_address, created_at")\
        .execute()

    public_page_views = [view for view in all_page_views.data if is_public_page_view(view)]
    total_page_views = len(public_page_views)
    unique_visitors_total = len({view["visitor_id"] for view in public_page_views})
    unique_visitors_today = len({
        view["visitor_id"] for view in public_page_views if is_since(view, today_start)
    })
    unique_visitors_week = len({
        view["visitor_id"] for view in public_page_views if is_since(view, week_start)
    })
    unique_visitors_month = len({
        view["visitor_id"] for view in public_page_views if is_since(view, month_start)
    })

    # Total blog views
    blog_views_response = supabase_admin.table("blog_post_views").select("id", count="exact").execute()
    total_blog_views = blog_views_response.count or 0

    # Total unique blog visitors (across all blog posts)
    blog_visitors_response = supabase_admin.table("blog_post_views")\
        .select("visitor_id")\
        .execute()
    total_blog_visitors = len(set(v["visitor_id"] for v in blog_visitors_response.data))

    # Aggregate top pages
    page_stats = {}
    for view in public_page_views:
        path = view["page_path"]
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

        # Get blog post titles (both published and unpublished for admin view)
        blog_posts = supabase_admin.table("blog_posts")\
            .select("id, title, slug, published")\
            .execute()

        blog_post_map = {bp["id"]: bp for bp in blog_posts.data}
        print(f"[Analytics] Found {len(blog_post_map)} blog posts in database")
        print(f"[Analytics] Found {len(all_blog_views.data)} blog views")

        # Aggregate blog stats
        blog_stats_dict = {}
        for view in all_blog_views.data:
            post_id = view["blog_post_id"]
            # Only aggregate stats for posts that exist in blog_posts table
            if post_id not in blog_post_map:
                print(f"[Analytics] Warning: View for non-existent blog post {post_id}")
                continue

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

        print(f"[Analytics] Aggregated stats for {len(blog_stats_dict)} blog posts with views")

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

        print(f"[Analytics] Returning {len(top_blog_posts)} blog posts in top_blog_posts")

    # Tab tracking statistics
    try:
        all_tab_views = supabase_admin.table("tab_views")\
            .select("tab_name, visitor_id, page_path")\
            .execute()

        tab_stats_dict = {}
        for view in all_tab_views.data:
            page_path = view.get("page_path") or ""
            visitor_id = view.get("visitor_id")
            if not visitor_id or any(page_path.startswith(prefix) for prefix in EXCLUDED_PAGE_PREFIXES):
                continue
            tab_name = view["tab_name"]
            if tab_name not in tab_stats_dict:
                tab_stats_dict[tab_name] = {"visits": 0, "visitors": set()}
            tab_stats_dict[tab_name]["visits"] += 1
            tab_stats_dict[tab_name]["visitors"].add(visitor_id)

        tab_stats = [
            TabViewStats(
                tab_name=tab_name,
                total_visits=stats["visits"],
                unique_visitors=len(stats["visitors"])
            )
            for tab_name, stats in sorted(tab_stats_dict.items(), key=lambda x: x[1]["visits"], reverse=True)
        ]
    except Exception as e:
        print(f"[Analytics] Failed to get tab stats: {e}")
        tab_stats = None

    return OverallStats(
        total_page_views=total_page_views,
        unique_visitors_total=unique_visitors_total,
        unique_visitors_today=unique_visitors_today,
        unique_visitors_week=unique_visitors_week,
        unique_visitors_month=unique_visitors_month,
        total_blog_views=total_blog_views,
        total_blog_visitors=total_blog_visitors,
        top_pages=top_pages,
        top_blog_posts=top_blog_posts,
        tab_stats=tab_stats
    )


@router.get("/activity/recent", response_model=List[RecentActivity])
async def get_recent_activity(
    limit: int = 20,
    current_user: dict = Depends(get_current_user)
):
    """
    Get recent page view activity (authenticated only)
    """
    safe_limit = max(1, min(limit, 250))
    response = supabase_admin.table("page_views")\
        .select("page_path, page_title, visitor_id, ip_address, device_type, os, browser, country, city, created_at")\
        .order("created_at", desc=True)\
        .limit(safe_limit)\
        .execute()

    activity = []
    for view in response.data:
        page_path = (view.get("page_path") or "").strip()
        visitor_id = (view.get("visitor_id") or "").strip()
        if not page_path or not visitor_id:
            continue
        if page_path in EXCLUDED_PAGE_PATHS:
            continue
        if any(page_path.startswith(prefix) for prefix in EXCLUDED_PAGE_PREFIXES):
            continue
        activity.append(RecentActivity(**view))

    return activity


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


@router.get("/stats/tabs", response_model=List[TabViewStats])
async def get_tab_stats(current_user: dict = Depends(get_current_user)):
    """
    Get tab tracking statistics (authenticated only)
    Returns total visits and unique visitors per tab
    """
    # Get all tab views
    all_tab_views = supabase_admin.table("tab_views")\
        .select("tab_name, visitor_id, page_path")\
        .execute()

    # Aggregate by tab_name
    tab_stats_dict = {}
    for view in all_tab_views.data:
        page_path = view.get("page_path") or ""
        visitor_id = view.get("visitor_id")
        if not visitor_id or any(page_path.startswith(prefix) for prefix in EXCLUDED_PAGE_PREFIXES):
            continue
        tab_name = view["tab_name"]
        if tab_name not in tab_stats_dict:
            tab_stats_dict[tab_name] = {"visits": 0, "visitors": set()}
        tab_stats_dict[tab_name]["visits"] += 1
        tab_stats_dict[tab_name]["visitors"].add(visitor_id)

    # Convert to list of TabViewStats
    tab_stats = [
        TabViewStats(
            tab_name=tab_name,
            total_visits=stats["visits"],
            unique_visitors=len(stats["visitors"])
        )
        for tab_name, stats in sorted(tab_stats_dict.items(), key=lambda x: x[1]["visits"], reverse=True)
    ]

    return tab_stats


@router.get("/blog/{slug}/reactions")
async def get_blog_reactions_public(slug: str):
    """
    Get reaction counts for a blog post by slug (public endpoint)
    Returns counts for each reaction type
    """
    # Get blog post by slug
    post = supabase_admin.table("blog_posts")\
        .select("id")\
        .eq("slug", slug)\
        .eq("published", True)\
        .execute()

    if not post.data:
        return {"gem": 0, "learned": 0, "clarity": 0, "issues": 0}

    post_id = post.data[0]["id"]

    # Get reactions for this post
    reactions = supabase_admin.table("blog_reactions")\
        .select("reaction_type")\
        .eq("blog_post_id", post_id)\
        .execute()

    # Count reactions
    counts = {"gem": 0, "learned": 0, "clarity": 0, "issues": 0}
    for reaction in reactions.data:
        r_type = reaction["reaction_type"]
        if r_type in counts:
            counts[r_type] += 1

    return counts


@router.post("/react", status_code=status.HTTP_201_CREATED)
async def submit_reaction(reaction: BlogReactionCreate):
    """
    Submit or update a blog post reaction (public endpoint)
    Uses UPSERT to replace existing reaction if visitor already reacted
    """
    # Validate reaction_type - only 4 allowed
    valid_reactions = ['gem', 'learned', 'clarity', 'issues']
    if reaction.reaction_type not in valid_reactions:
        raise HTTPException(status_code=400, detail=f"Invalid reaction type. Must be one of: {', '.join(valid_reactions)}")

    reaction_data = reaction.model_dump()

    try:
        # Use upsert to insert or update reaction (one reaction per visitor per post)
        response = supabase_admin.table("blog_reactions")\
            .upsert(reaction_data, on_conflict="blog_post_id,visitor_id")\
            .execute()

        return {"success": True, "message": "Reaction recorded"}
    except Exception as e:
        print(f"[Analytics] Failed to record reaction: {e}")
        return {"success": False, "message": "Failed to record reaction"}


@router.get("/blog/{post_id}/detailed", response_model=IndividualBlogAnalytics)
async def get_blog_detailed_analytics(post_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get comprehensive analytics for a specific blog post (authenticated)
    Includes views, engagement metrics, and reaction breakdown
    """
    # Get blog post metadata
    post = supabase_admin.table("blog_posts")\
        .select("id, title, slug, published_at")\
        .eq("id", post_id)\
        .execute()

    if not post.data:
        raise HTTPException(status_code=404, detail="Blog post not found")

    # Get view statistics
    views = supabase_admin.table("blog_post_views")\
        .select("visitor_id, time_spent_seconds, scroll_depth, created_at")\
        .eq("blog_post_id", post_id)\
        .execute()

    total_views = len(views.data)
    unique_visitors = len(set(v["visitor_id"] for v in views.data))

    time_spent_values = [v["time_spent_seconds"] for v in views.data if v.get("time_spent_seconds")]
    avg_time_spent = sum(time_spent_values) / len(time_spent_values) if time_spent_values else None

    scroll_values = [v["scroll_depth"] for v in views.data if v.get("scroll_depth")]
    avg_scroll_depth = sum(scroll_values) / len(scroll_values) if scroll_values else None

    last_viewed = max((v["created_at"] for v in views.data), default=None) if views.data else None

    # Get reaction statistics
    reactions_response = supabase_admin.table("blog_reactions")\
        .select("reaction_type")\
        .eq("blog_post_id", post_id)\
        .execute()

    # Count reactions by type
    reaction_counts = {}
    for reaction in reactions_response.data:
        r_type = reaction["reaction_type"]
        reaction_counts[r_type] = reaction_counts.get(r_type, 0) + 1

    reactions = [
        BlogReactionStats(reaction_type=r_type, count=count)
        for r_type, count in reaction_counts.items()
    ]

    total_reactions = sum(r.count for r in reactions)

    return IndividualBlogAnalytics(
        blog_post_id=post_id,
        title=post.data[0]["title"],
        slug=post.data[0]["slug"],
        published_at=post.data[0].get("published_at"),
        total_views=total_views,
        unique_visitors=unique_visitors,
        avg_time_spent=avg_time_spent,
        avg_scroll_depth=avg_scroll_depth,
        reactions=reactions,
        total_reactions=total_reactions,
        last_viewed=last_viewed
    )


@router.get("/blogs/all", response_model=List[IndividualBlogAnalytics])
async def get_all_blogs_analytics(current_user: dict = Depends(get_current_user)):
    """
    Get analytics for all blog posts (authenticated)
    For admin dashboard blog analytics table
    """
    # Get all blog posts
    all_posts = supabase_admin.table("blog_posts")\
        .select("id, title, slug, published_at")\
        .order("published_at", desc=True)\
        .execute()

    if not all_posts.data:
        return []

    # Get all views
    all_views = supabase_admin.table("blog_post_views")\
        .select("blog_post_id, visitor_id, time_spent_seconds, scroll_depth, created_at")\
        .execute()

    # Get all reactions
    all_reactions = supabase_admin.table("blog_reactions")\
        .select("blog_post_id, reaction_type")\
        .execute()

    # Organize views by blog_post_id
    views_by_post = {}
    for view in all_views.data:
        post_id = view["blog_post_id"]
        if post_id not in views_by_post:
            views_by_post[post_id] = []
        views_by_post[post_id].append(view)

    # Organize reactions by blog_post_id
    reactions_by_post = {}
    for reaction in all_reactions.data:
        post_id = reaction["blog_post_id"]
        if post_id not in reactions_by_post:
            reactions_by_post[post_id] = []
        reactions_by_post[post_id].append(reaction["reaction_type"])

    # Build analytics for each post
    blog_analytics = []
    for post in all_posts.data:
        post_id = post["id"]
        post_views = views_by_post.get(post_id, [])
        post_reactions = reactions_by_post.get(post_id, [])

        total_views = len(post_views)
        unique_visitors = len(set(v["visitor_id"] for v in post_views))

        time_spent_values = [v["time_spent_seconds"] for v in post_views if v.get("time_spent_seconds")]
        avg_time_spent = sum(time_spent_values) / len(time_spent_values) if time_spent_values else None

        scroll_values = [v["scroll_depth"] for v in post_views if v.get("scroll_depth")]
        avg_scroll_depth = sum(scroll_values) / len(scroll_values) if scroll_values else None

        last_viewed = max((v["created_at"] for v in post_views), default=None) if post_views else None

        # Count reactions by type
        reaction_counts = {}
        for r_type in post_reactions:
            reaction_counts[r_type] = reaction_counts.get(r_type, 0) + 1

        reactions = [
            BlogReactionStats(reaction_type=r_type, count=count)
            for r_type, count in reaction_counts.items()
        ]

        total_reactions = len(post_reactions)

        blog_analytics.append(IndividualBlogAnalytics(
            blog_post_id=post_id,
            title=post["title"],
            slug=post["slug"],
            published_at=post.get("published_at"),
            total_views=total_views,
            unique_visitors=unique_visitors,
            avg_time_spent=avg_time_spent,
            avg_scroll_depth=avg_scroll_depth,
            reactions=reactions,
            total_reactions=total_reactions,
            last_viewed=last_viewed
        ))

    return blog_analytics
