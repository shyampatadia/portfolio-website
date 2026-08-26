import { useCallback, useMemo, useState } from "react";
import { Monitor, Search, Smartphone, Tablet } from "lucide-react";

import { getRecentActivity } from "@/admin/lib/api";
import { BarList, SplitBar } from "@/admin/components/charts";
import { Empty, ErrorNotice, Panel, PanelSkeleton } from "@/admin/components/ui";
import { useAsync } from "@/admin/lib/useAdmin";
import { hostOf, num, tally, timeAgo } from "@/admin/lib/format";

const deviceIcon = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };

export function Visitors() {
  const [query, setQuery] = useState("");
  const load = useCallback((signal) => getRecentActivity(250, signal), []);
  const { status, data, error, reload } = useAsync(load);

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return data;
    return data.filter((visit) =>
      [
        visit.page_title,
        visit.page_path,
        visit.country,
        visit.city,
        visit.browser,
        visit.os,
        visit.device_type,
        hostOf(visit.referrer),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [data, query]);

  if (status === "loading") {
    return (
      <div className="admin-screen">
        <Panel title="Visitors">
          <PanelSkeleton rows={8} />
        </Panel>
      </div>
    );
  }

  if (status === "error" && !data) {
    return (
      <div className="admin-screen">
        <ErrorNotice error={error} onRetry={reload} />
      </div>
    );
  }

  const visitorCount = new Set(filtered.map((visit) => visit.visitor_id)).size;

  return (
    <div className="admin-screen">
      <div className="grid-3">
        <Panel title="Devices">
          <SplitBar items={tally(filtered, "device_type")} />
        </Panel>
        <Panel title="Operating systems">
          <BarList items={tally(filtered, "os").slice(0, 5)} total={filtered.length} />
        </Panel>
        <Panel title="Referrers">
          <BarList
            items={tally(
              filtered.map((visit) => ({ source: hostOf(visit.referrer) })),
              "source",
            ).slice(0, 5)}
            total={filtered.length}
          />
        </Panel>
      </div>

      <Panel
        title="Visit log"
        note={`${num(filtered.length)} visits from ${num(visitorCount)} visitors`}
        aside={
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <Search size={13} />
            <input
              className="input"
              style={{ width: 190, height: 26 }}
              placeholder="Filter by page, place, browser"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Filter visits"
            />
          </span>
        }
        flush
      >
        {filtered.length === 0 ? (
          <Empty
            title={query ? "No visits match that filter" : "No visits recorded yet"}
            hint={
              query
                ? "Try a page path, a country, or a browser name."
                : "Your own visits and bot traffic are filtered out, so this stays empty until a real visitor arrives."
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Device</th>
                  <th>Location</th>
                  <th>Source</th>
                  <th>Visitor</th>
                  <th className="num">When</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((visit, index) => {
                  const Icon = deviceIcon[String(visit.device_type || "").toLowerCase()] || Monitor;
                  return (
                    <tr key={`${visit.visitor_id}-${visit.created_at}-${index}`}>
                      <td style={{ color: "var(--ink)" }}>
                        {visit.page_title || visit.page_path}
                        <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                          {visit.page_path}
                        </div>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Icon size={13} />
                          {visit.browser || "Unknown"} on {visit.os || "Unknown"}
                        </span>
                      </td>
                      <td>{[visit.city, visit.country].filter(Boolean).join(", ") || "Unknown"}</td>
                      <td>{hostOf(visit.referrer)}</td>
                      <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 11 }}>
                        {String(visit.visitor_id || "").slice(2, 10)}
                      </td>
                      <td className="num">{timeAgo(visit.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
