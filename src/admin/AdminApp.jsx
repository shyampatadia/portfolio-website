import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BookOpen,
  ExternalLink,
  Gauge,
  LogOut,
  Moon,
  MousePointerClick,
  NotebookPen,
  Plus,
  Sun,
  Users,
} from "lucide-react";

import { AUTH_EXPIRED_EVENT, clearToken, getToken } from "@/admin/lib/api";
import { CommandPalette } from "@/admin/components/CommandPalette";
import { ToastStack } from "@/admin/components/ui";
import { Clarity } from "@/admin/screens/Clarity";
import { Login } from "@/admin/screens/Login";
import { Overview } from "@/admin/screens/Overview";
import { PostEditor } from "@/admin/screens/PostEditor";
import { Reading } from "@/admin/screens/Reading";
import { Visitors } from "@/admin/screens/Visitors";
import { Writing } from "@/admin/screens/Writing";
import { useHashRoute, useTheme, useToasts } from "@/admin/lib/useAdmin";
import { clockTime } from "@/admin/lib/format";
import { withBase } from "@/utils/paths";

const SCREENS = [
  { id: "overview", label: "Overview", icon: Gauge, title: "Overview", source: "live" },
  { id: "clarity", label: "Clarity", icon: MousePointerClick, title: "Clarity", source: "snapshot" },
  { id: "visitors", label: "Visitors", icon: Users, title: "Visitors", source: "live" },
  { id: "writing", label: "Writing", icon: NotebookPen, title: "Writing", source: null },
  { id: "reading", label: "Reading", icon: BookOpen, title: "Bookshelf", source: null },
];

export function AdminApp() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));
  const [expiredNotice, setExpiredNotice] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { toasts, push, dismiss } = useToasts();
  const { route, navigate } = useHashRoute("overview");

  useEffect(() => {
    const onExpired = () => {
      setAuthed(false);
      setExpiredNotice("Your session expired. Sign in again.");
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setAuthed(false);
    setExpiredNotice(null);
  }, []);

  const commands = useMemo(() => {
    const list = SCREENS.map((screen) => ({
      id: `go-${screen.id}`,
      label: `Go to ${screen.label}`,
      icon: screen.icon,
      run: () => navigate(screen.id),
    }));

    list.push(
      {
        id: "new-post",
        label: "New post",
        icon: Plus,
        run: () => navigate("writing", "new"),
      },
      {
        id: "theme",
        label: theme === "dark" ? "Switch to light" : "Switch to dark",
        icon: theme === "dark" ? Sun : Moon,
        run: toggle,
      },
      {
        id: "view-site",
        label: "Open the public site",
        icon: ExternalLink,
        run: () => window.open(withBase(""), "_blank", "noopener"),
      },
      { id: "sign-out", label: "Sign out", icon: LogOut, run: signOut },
    );

    return list;
  }, [navigate, signOut, theme, toggle]);

  if (!authed) {
    return (
      <Login
        notice={expiredNotice}
        onSignedIn={() => {
          setExpiredNotice(null);
          setAuthed(true);
        }}
      />
    );
  }

  const active = SCREENS.find((screen) => screen.id === route.screen) || SCREENS[0];
  const editingPost = route.screen === "writing" && route.param;

  return (
    <div className="admin-shell">
      <nav className="admin-sidebar" aria-label="Sections">
        <div className="admin-brand">
          <span className="admin-brand-mark" aria-hidden="true">
            SP
          </span>
          <span className="admin-brand-text">
            <strong>Portfolio</strong>
            <span>Admin</span>
          </span>
        </div>

        <div className="admin-nav">
          <span className="admin-nav-label">Analytics</span>
          {SCREENS.slice(0, 3).map((screen) => (
            <NavItem
              key={screen.id}
              screen={screen}
              active={active.id === screen.id}
              onClick={() => navigate(screen.id)}
            />
          ))}

          <span className="admin-nav-label" style={{ marginTop: "0.9rem" }}>
            Content
          </span>
          {SCREENS.slice(3).map((screen) => (
            <NavItem
              key={screen.id}
              screen={screen}
              active={active.id === screen.id}
              onClick={() => navigate(screen.id)}
            />
          ))}
        </div>

        <div className="admin-sidebar-foot">
          <button type="button" className="admin-nav-item" onClick={() => setPaletteOpen(true)}>
            <Activity />
            Command
            <kbd style={{ marginLeft: "auto" }}>Ctrl K</kbd>
          </button>
          <button type="button" className="admin-nav-item" onClick={toggle}>
            {theme === "dark" ? <Sun /> : <Moon />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <a
            className="admin-nav-item"
            href={withBase("")}
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink />
            View site
          </a>
          <button type="button" className="admin-nav-item" onClick={signOut}>
            <LogOut />
            Sign out
          </button>
        </div>
      </nav>

      <main className="admin-main">
        {!editingPost && (
          <header className="admin-topbar">
            <h1>{active.title}</h1>
            {active.source === "live" && (
              <span className="chip chip-live">Live · read {clockTime()}</span>
            )}
            {active.source === "snapshot" && <span className="chip">Snapshot</span>}
            <div className="admin-topbar-actions">
              {active.id === "writing" && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate("writing", "new")}
                >
                  <Plus /> New post
                </button>
              )}
            </div>
          </header>
        )}

        {active.id === "overview" && <Overview onOpenVisitors={() => navigate("visitors")} />}
        {active.id === "clarity" && <Clarity />}
        {active.id === "visitors" && <Visitors />}
        {active.id === "writing" &&
          (editingPost ? (
            <PostEditor
              key={route.param}
              postId={route.param === "new" ? null : route.param}
              toast={push}
              onDone={() => navigate("writing")}
            />
          ) : (
            <Writing
              toast={push}
              onEdit={(postId) => navigate("writing", postId || "new")}
            />
          ))}
        {active.id === "reading" && <Reading toast={push} />}
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        commands={commands}
      />
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function NavItem({ screen, active, onClick }) {
  const Icon = screen.icon;
  return (
    <button
      type="button"
      className="admin-nav-item"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
    >
      <Icon />
      {screen.label}
    </button>
  );
}
