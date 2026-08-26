// The site is served from a GitHub Pages project subpath
// (https://shyampatadia.github.io/portfolio-website/), so root-absolute links
// like "/blog/post.html" escape the deployment. Build links off Vite's
// BASE_URL instead. Note BASE_URL is "./" here (see `base` in vite.config.js),
// which resolves against the current document — this is correct for pages at
// the base root such as index.html. Pages nested deeper, like blog/post.html,
// must use their own relative links ("../").

export function withBase(path = "") {
  const base = import.meta.env.BASE_URL || "./";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${String(path).replace(/^\/+/, "")}`;
}

// Admin pages must never be counted as public traffic. Matched on path
// segments rather than a leading prefix, since the deployed path is
// "/portfolio-website/admin/index.html", not "/admin/index.html".
export function isAdminPath(pathname = window.location.pathname) {
  return /(^|\/)admin(\/|$)/.test(pathname);
}
