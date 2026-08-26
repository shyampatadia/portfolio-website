(function () {
  const VISITOR_KEY = "portfolio_visitor_id";
  const PRODUCTION_API = "https://portfolio-website-nine-red-56.vercel.app/api";

  function getApiBase() {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.protocol === "file:";

    return isLocal ? "http://localhost:8000/api" : PRODUCTION_API;
  }

  function getVisitorId() {
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

  // Matched on path segments, not a leading prefix: the deployed path is
  // "/portfolio-website/admin/index.html", not "/admin/index.html".
  // Keep in sync with isAdminPath() in src/utils/paths.js.
  function isAdminPath() {
    return /(^|\/)admin(\/|$)/.test(window.location.pathname);
  }

  function post(endpoint, payload) {
    if (isAdminPath()) return;

    const body = JSON.stringify({
      ...payload,
      visitor_id: getVisitorId(),
      user_agent: window.navigator.userAgent,
    });

    fetch(`${getApiBase()}/analytics/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
      keepalive: body.length < 60000,
    }).catch(() => {});
  }

  window.analytics = {
    getVisitorId,
    trackPageView() {
      post("track/page", {
        page_path: `${window.location.pathname}${window.location.search}`,
        page_title: document.title,
        referrer: document.referrer || null,
      });
    },
    trackResumeView() {
      post("track/resume", {
        action_type: "view",
      });
    },
    trackResumeDownload() {
      post("track/resume", {
        action_type: "download",
      });
    },
  };
})();
