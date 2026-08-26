import { useCallback, useEffect, useRef, useState } from "react";

const THEME_KEY = "admin_theme";

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = window.localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch {
      /* fall through to the default */
    }
    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* preference simply will not persist */
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggle };
}

/*
  One loader for every screen: tracks status, aborts in-flight work on unmount,
  and exposes reload() so error states can retry without a page refresh.
  `loader` receives an AbortSignal.
*/
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ status: "loading", data: null, error: null });
  const [nonce, setNonce] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    setState((prev) => ({ ...prev, status: prev.data ? "refreshing" : "loading", error: null }));

    loaderRef
      .current(controller.signal)
      .then((data) => {
        if (alive) setState({ status: "ready", data, error: null });
      })
      .catch((error) => {
        if (!alive || error?.name === "AbortError") return;
        setState((prev) => ({ status: "error", data: prev.data, error }));
      });

    return () => {
      alive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  return { ...state, reload, setData: (data) => setState({ status: "ready", data, error: null }) };
}

// Hash routing so a reload lands back on the screen you were looking at.
export function useHashRoute(defaultRoute) {
  const read = useCallback(() => {
    const raw = window.location.hash.replace(/^#\/?/, "").trim();
    if (!raw) return { screen: defaultRoute, param: null };
    const [screen, param] = raw.split("/");
    return { screen: screen || defaultRoute, param: param ? decodeURIComponent(param) : null };
  }, [defaultRoute]);

  const [route, setRoute] = useState(read);

  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, [read]);

  const navigate = useCallback((screen, param) => {
    window.location.hash = param ? `#/${screen}/${encodeURIComponent(param)}` : `#/${screen}`;
  }, []);

  return { route, navigate };
}

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, { tone = "info", action = null, timeout = 4200 } = {}) => {
      const id = ++counter.current;
      setToasts((list) => [...list, { id, message, tone, action }]);
      if (timeout) window.setTimeout(() => dismiss(id), timeout);
      return id;
    },
    [dismiss],
  );

  return { toasts, push, dismiss };
}
