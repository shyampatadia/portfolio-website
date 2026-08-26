import { getApiBaseUrl } from "@/utils/api";

const TOKEN_KEY = "admin_token";

// Raised when the backend rejects our token, so the shell can fall back to the
// login screen from anywhere without every caller handling it.
export const AUTH_EXPIRED_EVENT = "admin:auth-expired";

export function apiRoot() {
  return `${getApiBaseUrl()}/api`;
}

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode: session lives in memory only */
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
}

export class ApiError extends Error {
  constructor(message, { status = 0, offline = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.offline = offline;
  }
}

async function readError(response) {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      // FastAPI validation errors arrive as a list of {loc, msg}.
      return data.detail.map((item) => item.msg).filter(Boolean).join("; ") || "Invalid request";
    }
  } catch {
    /* body was not JSON */
  }
  return `Request failed (${response.status})`;
}

async function send(path, { method = "GET", body, formData, auth = true, signal } = {}) {
  const headers = {};
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response;
  try {
    response = await fetch(`${apiRoot()}${path}`, {
      method,
      headers,
      body: formData ?? (body === undefined ? undefined : JSON.stringify(body)),
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError("Cannot reach the API. Is the backend running?", { offline: true });
  }

  if (response.status === 401 && auth) {
    clearToken();
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
    throw new ApiError("Session expired. Sign in again.", { status: 401 });
  }

  if (!response.ok) {
    throw new ApiError(await readError(response), { status: response.status });
  }

  if (response.status === 204) return null;
  return response.json();
}

/* ---------- auth ---------- */

export async function login(email, password) {
  const data = await send("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  setToken(data.access_token);
  return data;
}

export const whoAmI = () => send("/auth/me");

/* ---------- analytics (live from Supabase) ---------- */

export const getOverallStats = (signal) => send("/analytics/stats/overall", { signal });
export const getRecentActivity = (limit = 60, signal) =>
  send(`/analytics/activity/recent?limit=${limit}`, { signal });
export const getTabStats = (signal) => send("/analytics/stats/tabs", { signal });
export const getResumeStats = (signal) => send("/analytics/stats/resume", { signal });
export const getAllBlogAnalytics = (signal) => send("/analytics/blogs/all", { signal });
export const getDailyStats = (days = 14, signal) =>
  send(`/analytics/stats/daily?days=${days}`, { signal });

/* ---------- clarity (snapshotted, backend-proxied) ---------- */

export const getClarityInsights = (days = 3, signal) =>
  send(`/analytics/clarity/insights?num_of_days=${days}`, { signal });

/* ---------- blog ---------- */

export const getPosts = (signal) =>
  send("/blog/posts?published_only=false&page=1&page_size=100", { signal });
export const createPost = (payload) => send("/blog/posts", { method: "POST", body: payload });
export const updatePost = (id, payload) =>
  send(`/blog/posts/${id}`, { method: "PUT", body: payload });
export const deletePost = (id) => send(`/blog/posts/${id}`, { method: "DELETE" });

/* ---------- books ---------- */

export const getBooks = (signal) => send("/books?include_hidden=true", { signal });
export const getBookStats = (signal) => send("/books/stats", { signal });
export const createBook = (payload) => send("/books", { method: "POST", body: payload });
export const updateBook = (id, payload) => send(`/books/${id}`, { method: "PUT", body: payload });
export const deleteBook = (id) => send(`/books/${id}`, { method: "DELETE" });

/* ---------- storage ---------- */

export function uploadImage(file, kind = "blog") {
  const formData = new FormData();
  formData.append("file", file);
  const path = kind === "book-cover" ? "/storage/upload/book-cover" : "/storage/upload/blog";
  return send(path, { method: "POST", formData });
}

export function uploadImages(files) {
  const formData = new FormData();
  for (const file of files) formData.append("files", file);
  return send("/storage/upload/blog/multiple", { method: "POST", formData });
}
