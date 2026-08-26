# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

Two independently deployed apps in one repo:

- **Frontend** (repo root) — Vite + React 18 SPA (JSX, no TypeScript), Tailwind + shadcn/ui. Deploys to GitHub Pages via `.github/workflows/deploy-pages.yml` on push to `main`.
- **Backend** (`backend/`) — FastAPI + Supabase, deployed separately to Vercel (`backend/vercel.json`). The frontend never imports backend code; they talk only over HTTP.

> **`README.md` is stale.** It describes an earlier Alpine.js + SQLAlchemy + `assets/css` architecture that no longer exists. Trust the code, not the README.

## Commands

### Frontend (run from repo root)

```bash
npm install
npm run dev        # Vite dev server, http://127.0.0.1:4173 (strictPort — fails if busy)
npm run build      # -> dist/  (two entry points, see below)
npm run preview    # serves dist/ on http://127.0.0.1:4174
```

There is no lint or test setup for the frontend.

### Backend (run from `backend/`)

```bash
# deps: uv.lock is authoritative; requirements.txt mirrors it for pip users
uv sync                                   # or: .venv\Scripts\activate && pip install -r requirements.txt
uvicorn app.main:app --reload             # http://localhost:8000, docs at /api/docs

pytest                                    # pytest.ini already sets -v --tb=short
pytest tests/test_blog.py
pytest tests/test_blog.py::TestBlogPostCreation
pytest tests/test_blog.py::TestBlogPostCreation::test_create_blog_post_author_id_not_none
pytest -x --cov=app --cov-report=html
```

The backend requires `backend/.env` (see `.env.example`); `app.core.config.Settings` fails at import if `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`, `SECRET_KEY`, `ADMIN_EMAIL`, or `ADMIN_PASSWORD` are missing. Tests do not need it — `tests/conftest.py` injects env vars and monkeypatches `supabase.create_client` **before** importing `app.main`. Any new test module must rely on that ordering (import app objects only after conftest has loaded) and mock Supabase rather than hitting a real database.

## Frontend architecture

### Three build entry points

`vite.config.js` declares a multi-page rollup input:

- `index.html` → `src/main.jsx` → `src/App.jsx` — the portfolio SPA.
- `blog/post.html` → `src/blog-post.jsx` — a standalone page mounting its own React root, reached as `/blog/post.html?slug=<slug>`.
- `admin/index.html` → `src/admin.jsx` → `src/admin/AdminApp.jsx` — the admin panel.

Markdown is parsed by `src/lib/markdown.js` (`parseMarkdown` returns block descriptors) and **rendered separately by each caller**: `src/blog-post.jsx` renders blog-page components, `src/admin/screens/PostEditor.jsx` renders the same blocks with admin styling. That shared parser is what keeps the editor preview honest, so extend the parser there rather than forking it. There is no markdown library.

### Tabs, not routes

`App.jsx` builds every section up front inside a Radix `Tabs` and swaps them with `AnimatePresence`. Navigation state lives in `window.location.hash`, mapped through `HASH_TO_TAB`, which keeps legacy hashes working (`#summary`→about, `#certifications`→credentials, `#blog`→writing, `#bookshelf`→reading). Adding a section means: add to `tabConfig` in `portfolioContent.js`, add an icon in `TabNav.jsx`, add the entry to `sections` in `App.jsx`, and add any legacy alias to `HASH_TO_TAB`.

### Content: static file vs. API

Most portfolio content is **static data, not database-backed**, despite what the README claims:

- `src/content/portfolioContent.js` — hero, about, tabs, experience, education, projects, credentials.
- `src/content/skills.json` — skill categories and lists; `SkillIcon.jsx` maps each skill label to a `cdn.simpleicons.org` slug via `ICON_SLUGS`, falling back to initials when the label is unmapped or the image 404s. New skills need an `ICON_SLUGS` entry or they render as initials.

Only **Blog** (`BlogSection`) and **Books** (`BooksSection`) fetch from the backend, via `src/utils/api.js`.

### Styling system

Tailwind is configured for shadcn (`components.json`, `cssVariables: true`, base color slate, JSX not TSX). But most layout lives in **~500 hand-authored semantic classes** inside `@layer components` in `src/styles/globals.css` (`page-shell`, `workspace-shell`, `hero-*`, `section-tab-*`, `content-card`, `type-card-title`, `type-body-sm`, …). Components reference those class names; utility classes are used mostly for small local tweaks.

`src/styles/responsive-refinements.css` is imported **after** globals and overrides the same selectors with `clamp()` sizing and `max-width` media queries (1180/980/900/760/700/560/420). Sizing changes usually belong there, not in globals — check both files before editing, since the later file wins.

**Tailwind `@apply` gotcha:** never put `group` in an `@apply` (it is a marker class Tailwind does not emit). `group-hover:` / `group-data-[state=active]:` variants inside `@apply` are fine, but the bare `group` must live on the JSX `className` — e.g. `className="section-tab group"` in `TabNav.jsx`, `"project-card-compact group"` in `ProjectsSection.jsx`. This has bitten this project twice.

### The admin panel

`src/admin/` is a React app with its own design system in `src/styles/admin.css` — deliberately **not** the portfolio's. Dark is the default, light is a persisted `data-theme` toggle on `<html>` (a blocking script in `admin/index.html` applies it before first paint). Layout: persistent sidebar, hash routing (`#/writing/<id>`), Ctrl/Cmd+K command palette.

- `lib/api.js` — the only place that talks to the backend. Holds the token, and on any 401 clears it and fires `AUTH_EXPIRED_EVENT` so the shell can fall back to login from anywhere.
- `lib/useAdmin.js` — `useAsync` (status/abort/reload) backs every screen; also theme, hash routing, toasts.
- `components/charts.jsx` — hand-built SVG charts. Colours come from the dataviz reference palette, re-validated against these surfaces; categorical use is capped at **three** slots plus "Other", magnitude charts use a single hue, and category charts always carry direct labels (the light-mode aqua step sits below 3:1).
- `screens/` — Overview, Clarity, Visitors, Writing, PostEditor, Reading.

The editor autosaves to `localStorage` under `blog_draft` (new) or `blog_draft:<id>` (existing), debounced at 3s with a 30s floor, plus a `beforeunload` guard. Deleting a post is deferred behind a 6-second undo window; the pending delete is flushed on unmount so it cannot be silently dropped.

### `public/` is not part of the React build

Vite copies `public/` verbatim into `dist/`. It holds the vanilla pages that never touch React:

- `public/resume.html` — standalone Tailwind-CDN + PDF.js page.
- `public/analytics.js` and `public/clarity.js` — standalone copies of the tracking logic for that page, since it cannot import from `src/`. Keep them in sync with `src/utils/analytics.js` and `src/utils/clarity.js`.

Microsoft Clarity (project `y83iybmxln`) loads on the public pages only, never on the admin.

### API base URL is duplicated in three places

Environment detection (localhost → `http://localhost:8000`, else the Vercel URL) is repeated in `src/utils/api.js`, `public/analytics.js`, and `public/admin/config.js`. Changing the production backend URL requires editing all three, plus `ALLOWED_ORIGINS` in `backend/app/core/config.py`.

### The site is served from a subpath — beware root-absolute paths

Pages deploys `shyampatadia/portfolio-website` with no CNAME, so production is **`https://shyampatadia.github.io/portfolio-website/`**, not a domain root. `vite.config.js` sets `base: "./"` and `portfolioContent.js` routes public assets through `import.meta.env.BASE_URL`, so bundled assets resolve correctly. Anything hardcoding a leading `/` does not:

- `BlogSection.jsx` links to `/blog/post.html?slug=...`, which resolves outside the base path and 404s in production.
- The admin-exclusion checks in `src/utils/analytics.js` and `public/analytics.js` test `pathname.startsWith("/admin")`, which never matches `/portfolio-website/admin/...`, so admin traffic is tracked. The server-side guard misses for the same reason: `EXCLUDED_PAGE_PREFIXES` in `analytics.py` expects `/admin` but receives the prefixed path.

Prefer `BASE_URL`-relative links over root-absolute ones, and compare paths with a suffix/contains check rather than `startsWith("/admin")`.

## Backend architecture

Layered, with no ORM — every handler calls Supabase PostgREST directly:

- `app/main.py` — app setup, CORS, mounts each router under `/api`.
- `app/api/` — routers: `auth`, `blog`, `books`, `storage`, `analytics` (`analytics.py` is by far the largest, ~850 lines: tracking writes plus aggregation endpoints).
- `app/core/` — `config.py` (pydantic-settings), `security.py` (JWT + `get_current_user`), `supabase.py`.
- `app/schemas/` — Pydantic request/response models.

**Two Supabase clients, chosen deliberately:** `supabase_client` (anon key) for public reads, `supabase_admin` (service-role key) for writes and anything bypassing RLS. Both are module-level singletons created at import.

**Auth is a single hard-coded admin**, not a user table: `/api/auth/login` compares against `ADMIN_EMAIL`/`ADMIN_PASSWORD` from env (plain string comparison — `verify_password`/`get_password_hash` exist but are unused for login) and issues a JWT carrying a fixed sentinel `user_id` of `00000000-0000-0000-0000-000000000000`, which is what lands in `blog_posts.author_id`. Protect an endpoint with `current_user: dict = Depends(get_current_user)`.

**CORS is environment-split** in `main.py`: production uses exactly `settings.ALLOWED_ORIGINS`; development unions in common local ports plus a regex for any `localhost`/`127.0.0.1` port and `"null"` for `file://`. New production frontend origins go in `ALLOWED_ORIGINS` in `config.py`.

**Supabase tables in use:** `blog_posts`, `books`, `page_views`, `blog_post_views`, `tab_views`, `resume_views`, `blog_reactions`. The schema is managed in Supabase — there are no migrations in this repo.

**Microsoft Clarity** is proxied through `GET /api/analytics/clarity/insights` so `CLARITY_API_TOKEN` never reaches the browser. Clarity allows **10 export calls per project per UTC day** over a **3-day** window, so responses are cached in-process for `CLARITY_CACHE_MINUTES` (default 360) and a stale snapshot is always preferred over burning quota — a 429 falls back to cache rather than erroring. The cache is per-process, so each cold serverless instance costs one call; if that becomes a problem the durable fix is a `clarity_snapshots` table. `normalize_clarity` flattens Clarity's `[{metricName, information: [...]}]` while keeping every original row, so an unmodelled metric still reaches the UI. A **400 with an empty body** is Clarity's way of saying "no data in this window", and is returned as an empty state with a `note`, not an error.

Timestamps that cross the wire from this module are timezone-aware (`datetime.now(timezone.utc)`). Naive UTC serialises without an offset and the browser then reads it as local time — that bug showed up as "fetched 5h ago" for a snapshot seconds old.

### Analytics conventions

Tracking is fire-and-forget from the client (`fetch` with `keepalive`, failures swallowed except a dev-only `console.warn`). A visitor id is generated once and persisted in `localStorage` under `portfolio_visitor_id`. Self-traffic is filtered on **both** sides: the client skips any `/admin` path, and the server drops views whose `page_path` starts with `/api` or `/admin` or whose resolved IP is private/loopback (`is_public_page_view`, `is_internal_ip`). Client IP resolution walks `x-forwarded-for`, `cf-connecting-ip`, `x-real-ip`, `true-client-ip`, then `Forwarded` — keep that helper in mind when adding tracked events behind Vercel.

Page views and blog views are de-duplicated per session via in-memory `Set`s, tab views via a 1.5s throttle map, so repeated calls during rendering are cheap but re-mounts do not re-count.

## Deployment notes

- `backend/requirements.txt` (local/dev) and `backend/requirements-vercel.txt` (deploy) pin **different versions** of FastAPI, uvicorn, supabase, and pydantic-settings. If a dependency-related bug appears only in production, compare the two.
- Vercel routes every path to `app/main.py`; `ENVIRONMENT=production` is set in `vercel.json`, which is what flips CORS to strict mode.
- Commit messages in this repo follow Conventional Commits (`feat:`, `fix:`).
