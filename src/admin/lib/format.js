const numberFormat = new Intl.NumberFormat("en-US");

export function num(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "0";
  return numberFormat.format(Math.round(Number(value)));
}

export function pct(part, whole) {
  if (!whole) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

export function seconds(value) {
  const total = Math.round(Number(value) || 0);
  if (total < 60) return `${total}s`;
  const mins = Math.floor(total / 60);
  const rest = total % 60;
  return rest ? `${mins}m ${rest}s` : `${mins}m`;
}

export function shortDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function clockTime(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function timeAgo(value) {
  if (!value) return "";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";

  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  return shortDate(value);
}

// Trend against the previous period, as a signed percentage plus a direction the
// stat component turns into colour AND a caret, so it is never colour-alone.
export function delta(current, previous) {
  const now = Number(current) || 0;
  const before = Number(previous) || 0;

  if (!before) {
    return now ? { dir: "up", label: "new" } : { dir: "flat", label: "no change" };
  }

  const change = Math.round(((now - before) / before) * 100);
  if (change === 0) return { dir: "flat", label: "no change" };
  return {
    dir: change > 0 ? "up" : "down",
    label: `${change > 0 ? "+" : ""}${change}%`,
  };
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readingTime(markdown) {
  const words = String(markdown || "").trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

export function parseTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function hostOf(referrer) {
  if (!referrer) return "direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return "direct";
  }
}

export function tally(rows, key) {
  const counts = new Map();
  for (const row of rows) {
    const raw = row?.[key];
    const label = raw && String(raw).trim() ? String(raw).trim() : "Unknown";
    counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
