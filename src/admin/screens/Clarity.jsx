import { useCallback, useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

import { getClarityInsights } from "@/admin/lib/api";
import { BarList, SignalRow } from "@/admin/components/charts";
import {
  Empty,
  ErrorNotice,
  Notice,
  Panel,
  PanelSkeleton,
  Segmented,
  Stat,
} from "@/admin/components/ui";
import { useAsync } from "@/admin/lib/useAdmin";
import { num, timeAgo } from "@/admin/lib/format";

const SIGNAL_LABELS = {
  rage_clicks: ["Rage clicks", "var(--critical)"],
  dead_clicks: ["Dead clicks", "var(--serious)"],
  error_clicks: ["Error clicks", "var(--serious)"],
  script_errors: ["Script errors", "var(--critical)"],
  quickback_clicks: ["Quick backs", "var(--warning)"],
  excessive_scroll: ["Excessive scroll", "var(--warning)"],
};

// Rows Clarity returns carry one label-ish key plus count keys; pick them out
// generically so a metric shape we have not modelled still renders.
function toBreakdown(rows) {
  const labelKeys = [
    "Browser",
    "Device",
    "OS",
    "Country/Region",
    "Country",
    "Source",
    "Medium",
    "Campaign",
    "Channel",
    "URL",
    "Page Title",
    "PageTitle",
    "Referrer URL",
    "ReferrerUrl",
  ];
  const countKeys = ["sessionsCount", "totalSessionCount", "subTotal", "count", "visitsCount"];

  return rows
    .map((row) => {
      const labelKey = labelKeys.find((key) => row[key] !== undefined);
      const countKey = countKeys.find((key) => row[key] !== undefined);
      if (!labelKey || !countKey) return null;
      const count = Number(String(row[countKey]).replace(/,/g, ""));
      if (Number.isNaN(count)) return null;
      return { label: String(row[labelKey]) || "Unknown", count };
    })
    .filter(Boolean)
    .sort((a, b) => b.count - a.count);
}

export function Clarity() {
  const [days, setDays] = useState(3);
  const load = useCallback((signal) => getClarityInsights(days, signal), [days]);
  const { status, data, error, reload } = useAsync(load, [days]);

  const control = (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <Segmented
        value={days}
        onChange={setDays}
        options={[
          { value: 1, label: "24h" },
          { value: 2, label: "48h" },
          { value: 3, label: "72h" },
        ]}
      />
      <button type="button" className="btn btn-ghost btn-icon" onClick={reload} title="Refresh">
        <RefreshCw />
      </button>
      <a
        className="btn btn-ghost"
        href="https://clarity.microsoft.com/"
        target="_blank"
        rel="noreferrer"
      >
        Open Clarity <ExternalLink />
      </a>
    </div>
  );

  if (status === "loading") {
    return (
      <div className="admin-screen">
        <Panel title="Clarity" aside={control}>
          <PanelSkeleton rows={5} />
        </Panel>
      </div>
    );
  }

  if (status === "error" && !data) {
    const notConfigured = error?.status === 503;
    return (
      <div className="admin-screen">
        <Panel title="Clarity" aside={control}>
          {notConfigured ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <Empty
                title="Clarity is not connected yet"
                hint="The tracking script is already live on the public pages, so Clarity is collecting sessions. This panel needs an export token to read them back."
              />
              <Notice tone="accent">
                In Clarity, go to <b>Settings &rarr; Data Export &rarr; Generate new API token</b>,
                then add it to <code>backend/.env</code> as <code>CLARITY_API_TOKEN</code> and
                restart the backend. The token stays server-side and is never sent to this page.
              </Notice>
              <p className="panel-note">
                Clarity allows 10 export calls per day over a rolling 3-day window, so this screen
                caches every response for 6 hours rather than calling on each load.
              </p>
            </div>
          ) : (
            <ErrorNotice error={error} onRetry={reload} />
          )}
        </Panel>
      </div>
    );
  }

  if (data.note && data.sessions === null) {
    return (
      <div className="admin-screen">
        <Panel title="Clarity" aside={control}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            <Empty title="Nothing to show for this window yet" hint={data.note} />
            <Notice>
              The snippet for project <code>y83iybmxln</code> is on the public pages of this build.
              Clarity begins reporting once those pages are deployed and real sessions land, which
              can take a few hours.
            </Notice>
          </div>
        </Panel>
      </div>
    );
  }

  const signals = Object.entries(data.signals || {})
    .filter(([key]) => SIGNAL_LABELS[key])
    .map(([key, value]) => ({
      label: SIGNAL_LABELS[key][0],
      color: SIGNAL_LABELS[key][1],
      value: num(value),
    }));

  const humanSessions =
    data.sessions !== null && data.bot_sessions !== null
      ? Math.max(0, (data.sessions || 0) - (data.bot_sessions || 0))
      : null;

  const breakdowns = (data.metrics || [])
    .map((metric) => ({ name: metric.name, items: toBreakdown(metric.rows || []) }))
    .filter((metric) => metric.items.length > 0 && metric.name !== "Traffic");

  return (
    <div className="admin-screen">
      <div className="stat-strip">
        <Stat
          label="Sessions"
          value={data.sessions === null ? "—" : num(data.sessions)}
          foot={`last ${data.num_of_days * 24}h`}
        />
        <Stat
          label="Human sessions"
          value={humanSessions === null ? "—" : num(humanSessions)}
          foot={data.bot_sessions ? `${num(data.bot_sessions)} bot sessions removed` : "bots removed"}
        />
        <Stat
          label="Distinct users"
          value={data.distinct_users === null ? "—" : num(data.distinct_users)}
        />
        <Stat
          label="Pages per session"
          value={data.pages_per_session ? data.pages_per_session.toFixed(2) : "—"}
        />
      </div>

      <p className="panel-note" style={{ marginTop: "-0.5rem" }}>
        Snapshot, not live. Fetched {timeAgo(data.fetched_at)}
        {data.from_cache ? " and served from cache" : ""}. Clarity caps exports at 10 calls per day
        over a 3-day window.
      </p>

      <div className="grid-2">
        <Panel title="Friction signals" note="lower is better" aside={control}>
          {signals.length ? (
            <SignalRow items={signals} />
          ) : (
            <Empty
              title="No friction signals reported"
              hint="Clarity returns these once it has enough sessions in the window."
            />
          )}
        </Panel>

        <Panel title="What Clarity cannot tell you">
          <p style={{ fontSize: 12.5, color: "var(--ink-secondary)", maxWidth: "60ch" }}>
            Clarity aggregates sessions; it has no view of your blog reactions, resume opens, or
            per-post reads. Those stay on the Overview and Writing screens, measured by your own
            tracking against Supabase.
          </p>
        </Panel>
      </div>

      {breakdowns.length > 0 && (
        <div className="grid-2">
          {breakdowns.slice(0, 6).map((metric) => (
            <Panel key={metric.name} title={metric.name}>
              <BarList items={metric.items.slice(0, 6)} />
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
