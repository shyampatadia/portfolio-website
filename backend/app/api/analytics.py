"""
Analytics API routes for tracking and statistics
"""
from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import List, Optional, Dict
from datetime import datetime, timedelta, timezone
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
    ResumeViewStats,
    DailyStat,
    ClarityMetric,
    ClarityInsights
)
from app.core.config import settings
from app.core.security import get_current_user
from app.core.supabase import supabase_client, supabase_admin


router = APIRouter(prefix="/analytics", tags=["Analytics"])

EXCLUDED_PATH_SEGMENTS = ("api", "admin")

# Matched on path *segments* rather than a leading prefix. The frontend is
# served from a GitHub Pages project subpath, so admin pages arrive as
# "/portfolio-website/admin/index.html" and would slip past a "/admin" prefix
# check. Keep in sync with isAdminPath() in src/utils/paths.js.
_EXCLUDED_PATH_RE = re.compile(
    r"(^|/)({})(/|$)".format("|".join(EXCLUDED_PATH_SEGMENTS)),
    flags=re.IGNORECASE,
)


def is_excluded_page_path(page_path: Optional[str]) -> bool:
    """
    True for internal pages (API + admin panel) that must never count as
    public traffic. An empty path is not treated as excluded; callers that
    require a path check for it separately.
    """
    if not page_path:
        return False

    path = page_path.split("?", 1)[0].split("#", 1)[0].strip()
    if not path:
        return False

    return bool(_EXCLUDED_PATH_RE.search(path))


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

    if is_excluded_page_path(page_path):
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
            if not visitor_id or is_excluded_page_path(page_path):
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
        .select("page_path, page_title, visitor_id, ip_address, device_type, os, browser, country, city, referrer, created_at")\
        .order("created_at", desc=True)\
        .limit(safe_limit)\
        .execute()

    activity = []
    for view in response.data:
        page_path = (view.get("page_path") or "").strip()
        visitor_id = (view.get("visitor_id") or "").strip()
        if not page_path or not visitor_id:
            continue
        if is_excluded_page_path(page_path):
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
        if not visitor_id or is_excluded_page_path(page_path):
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


@router.get("/stats/daily", response_model=List[DailyStat])
async def get_daily_stats(
    days: int = 14,
    current_user: dict = Depends(get_current_user)
):
    """
    Public traffic grouped by calendar day (UTC), oldest first.

    Days with no traffic are returned as zeroes so the trend line keeps an even
    time axis instead of compressing the gaps.
    """
    span = max(1, min(days, 90))
    start = datetime.utcnow().date() - timedelta(days=span - 1)

    response = supabase_admin.table("page_views")\
        .select("page_path, visitor_id, ip_address, created_at")\
        .gte("created_at", start.isoformat())\
        .execute()

    buckets: Dict[str, dict] = {}
    for offset in range(span):
        key = (start + timedelta(days=offset)).isoformat()
        buckets[key] = {"visitors": set(), "views": 0}

    for view in response.data or []:
        if not is_public_page_view(view):
            continue

        created_at = parse_created_at(view.get("created_at"))
        if not created_at:
            continue

        bucket = buckets.get(created_at.date().isoformat())
        if bucket is None:
            continue

        bucket["visitors"].add(view.get("visitor_id"))
        bucket["views"] += 1

    return [
        DailyStat(
            date=key,
            unique_visitors=len(bucket["visitors"]),
            page_views=bucket["views"],
        )
        for key, bucket in sorted(buckets.items())
    ]


# ===== MICROSOFT CLARITY =====

CLARITY_ENDPOINT = "https://www.clarity.ms/export-data/api/v1/project-live-insights"

# Clarity permits 10 export calls per project per UTC day. One cached snapshot
# per process keeps normal dashboard use well under that; the cache is in-memory,
# so a cold serverless instance costs one call.
_clarity_cache: Dict[int, dict] = {}

CLARITY_SIGNAL_METRICS = {
    "RageClickCount": "rage_clicks",
    "DeadClickCount": "dead_clicks",
    "ExcessiveScroll": "excessive_scroll",
    "QuickbackClick": "quickback_clicks",
    "ScriptErrorCount": "script_errors",
    "ErrorClickCount": "error_clicks",
}


def _as_number(value):
    """Clarity returns counts as strings and percentages as floats."""
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return value
    try:
        text = str(value).strip().replace(",", "")
        return float(text) if "." in text else int(text)
    except (TypeError, ValueError):
        return None


def _sum_metric(rows, *field_names):
    """Total a metric across its dimension rows, ignoring non-numeric fields."""
    total = 0
    seen = False
    for row in rows or []:
        for field in field_names:
            number = _as_number(row.get(field))
            if number is not None:
                total += number
                seen = True
                break
    return total if seen else None


def normalize_clarity(payload, num_of_days: int, fetched_at: datetime, from_cache: bool):
    """
    Flatten Clarity's [{metricName, information: [...]}] into something the
    dashboard can render, while keeping every original row so a metric this code
    does not model yet still reaches the UI.
    """
    blocks = payload if isinstance(payload, list) else []
    by_name: Dict[str, List[dict]] = {}
    for block in blocks:
        if not isinstance(block, dict):
            continue
        name = str(block.get("metricName") or "").strip()
        rows = block.get("information")
        by_name[name] = [row for row in rows if isinstance(row, dict)] if isinstance(rows, list) else []

    traffic_rows = by_name.get("Traffic", [])
    # "distantUserCount" is the spelling in Microsoft's documented response.
    distinct_users = _sum_metric(traffic_rows, "distinctUserCount", "distantUserCount")

    pages_per_session = None
    for row in traffic_rows:
        value = _as_number(row.get("PagesPerSessionPercentage"))
        if value is not None:
            pages_per_session = value
            break

    signals = {}
    for metric_name, key in CLARITY_SIGNAL_METRICS.items():
        rows = by_name.get(metric_name)
        if rows is None:
            continue
        total = _sum_metric(rows, "subTotal", "count", "value", metric_name)
        if total is not None:
            signals[key] = total

    return ClarityInsights(
        fetched_at=fetched_at,
        num_of_days=num_of_days,
        from_cache=from_cache,
        sessions=_sum_metric(traffic_rows, "totalSessionCount"),
        bot_sessions=_sum_metric(traffic_rows, "totalBotSessionCount"),
        distinct_users=distinct_users,
        pages_per_session=pages_per_session,
        signals=signals,
        metrics=[ClarityMetric(name=name, rows=rows) for name, rows in by_name.items()],
    )


@router.get("/clarity/insights", response_model=ClarityInsights)
async def get_clarity_insights(
    num_of_days: int = 3,
    refresh: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    Proxy Microsoft Clarity's Data Export API (authenticated admin only).

    The API token never reaches the browser. Clarity caps the window at three
    days and the quota at ten calls per project per UTC day, so responses are
    cached and a stale snapshot is always preferred over burning quota.
    """
    span = max(1, min(num_of_days, 3))

    if not settings.CLARITY_API_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Clarity is not configured. Add CLARITY_API_TOKEN to the backend environment.",
        )

    cached = _clarity_cache.get(span)
    if cached and not refresh:
        age = datetime.now(timezone.utc) - cached["fetched_at"]
        if age < timedelta(minutes=settings.CLARITY_CACHE_MINUTES):
            return normalize_clarity(cached["payload"], span, cached["fetched_at"], True)

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(
                CLARITY_ENDPOINT,
                params={"numOfDays": span},
                headers={
                    "Authorization": f"Bearer {settings.CLARITY_API_TOKEN}",
                    "Content-Type": "application/json",
                },
            )
    except httpx.HTTPError as exc:
        if cached:
            return normalize_clarity(cached["payload"], span, cached["fetched_at"], True)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not reach Clarity: {exc}",
        )

    if response.status_code == 429:
        if cached:
            return normalize_clarity(cached["payload"], span, cached["fetched_at"], True)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Clarity's daily export limit of 10 calls is used up. It resets at UTC midnight.",
        )

    if response.status_code in (401, 403):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Clarity rejected the API token. Generate a new one under Settings > Data Export.",
        )

    # Clarity answers a valid token with "400 and an empty body" when the project
    # has no sessions in the requested window. That is a normal empty state, not
    # a failure, so it is reported as one instead of an error.
    if response.status_code == 400 and not response.text.strip():
        return ClarityInsights(
            fetched_at=datetime.now(timezone.utc),
            num_of_days=span,
            from_cache=False,
            note=(
                "Clarity accepted the token but has no data for this window yet. "
                "It starts reporting once the tracking script has collected sessions "
                "on the live site."
            ),
        )

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Clarity returned {response.status_code}. {response.text[:200]}".strip(),
        )

    try:
        payload = response.json()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Clarity returned a response that was not JSON.",
        )

    fetched_at = datetime.now(timezone.utc)
    _clarity_cache[span] = {"payload": payload, "fetched_at": fetched_at}
    return normalize_clarity(payload, span, fetched_at, False)
