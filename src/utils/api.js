const PRODUCTION_API = "https://portfolio-website-nine-red-56.vercel.app";

function isDevelopmentHost() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === ""
  );
}

export function getApiBaseUrl() {
  return isDevelopmentHost() ? "http://localhost:8000" : PRODUCTION_API;
}

async function fetchJson(endpoint) {
  const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export function getBlogPosts(params = {}) {
  const query = new URLSearchParams(params).toString();
  return fetchJson(`/api/blog/posts${query ? `?${query}` : ""}`);
}

export function getBooks(status = "") {
  const query = status ? `?status_filter=${status}` : "";
  return fetchJson(`/api/books${query}`);
}

export function getBookStats() {
  return fetchJson("/api/books/stats");
}
