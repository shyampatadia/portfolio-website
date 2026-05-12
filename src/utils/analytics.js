import { getApiBaseUrl } from "@/utils/api";

const VISITOR_KEY = "portfolio_visitor_id";
const trackedPageKeys = new Set();
const trackedBlogKeys = new Set();
const recentTabEvents = new Map();

function isAdminPath() {
  return window.location.pathname.startsWith("/admin");
}

export function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;

    const nextId =
      typeof window.crypto?.randomUUID === "function"
        ? `v_${window.crypto.randomUUID()}`
        : `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

    window.localStorage.setItem(VISITOR_KEY, nextId);
    return nextId;
  } catch {
    return `v_session_${Date.now().toString(36)}`;
  }
}

function postAnalytics(endpoint, payload) {
  if (isAdminPath()) return;

  const body = JSON.stringify({
    ...payload,
    visitor_id: getVisitorId(),
    user_agent: window.navigator.userAgent,
  });

  fetch(`${getApiBaseUrl()}/api/analytics/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: body.length < 60000,
  }).catch((error) => {
    if (import.meta.env.DEV) {
      console.warn("[analytics] tracking failed", error);
    }
  });
}

export function trackPageView({
  pagePath = `${window.location.pathname}${window.location.search}`,
  pageTitle = document.title,
} = {}) {
  const key = `${pagePath}|${pageTitle}`;
  if (trackedPageKeys.has(key)) return;
  trackedPageKeys.add(key);

  postAnalytics("track/page", {
    page_path: pagePath,
    page_title: pageTitle,
    referrer: document.referrer || null,
  });
}

export function trackTabView(tabName) {
  if (!tabName) return;

  const now = Date.now();
  const key = `${tabName}|${window.location.pathname}`;
  const lastTrackedAt = recentTabEvents.get(key) || 0;
  if (now - lastTrackedAt < 1500) return;
  recentTabEvents.set(key, now);

  postAnalytics("track/tab", {
    tab_name: tabName,
    page_path: `${window.location.pathname}${window.location.hash}`,
  });
}

export function trackBlogView(post, engagement = {}) {
  if (!post?.id || !post?.slug) return;
  if (trackedBlogKeys.has(post.id)) return;
  trackedBlogKeys.add(post.id);

  postAnalytics("track/blog", {
    blog_post_id: post.id,
    blog_post_slug: post.slug,
    time_spent_seconds: Math.max(0, Math.round(engagement.timeSpentSeconds || 0)),
    scroll_depth: Math.max(0, Math.min(100, Math.round(engagement.scrollDepth || 0))),
  });
}
