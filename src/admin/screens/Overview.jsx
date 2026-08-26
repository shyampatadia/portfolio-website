import { useCallback } from "react";
import { FileText, Monitor, Smartphone, Tablet } from "lucide-react";

import {
  getDailyStats,
  getOverallStats,
  getRecentActivity,
  getResumeStats,
} from "@/admin/lib/api";
import { BarList, SplitBar, TrendChart } from "@/admin/components/charts";
import { Empty, ErrorNotice, Panel, PanelSkeleton, Skeleton, Stat } from "@/admin/components/ui";
import { useAsync } from "@/admin/lib/useAdmin";
import { clockTime, delta, hostOf, num, shortDate, tally, timeAgo } from "@/admin/lib/format";

const deviceIcon = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };

export function Overview({ onOpenVisitors }) {
  const load = useCallback(async (signal) => {
    const [stats, activity, daily, resume] = await Promise.all([
      getOverallStats(signal),
      getRecentActivity(120, signal),
      getDailyStats(14, signal).catch(() => null),
      getResumeStats(signal).catch(() => null),
    ]);
    return { stats, activity, daily, resume, loadedAt: new Date() };
  }, []);

  const { status, data, error, reload } = useAsync(load);

  if (status === "loading") return <OverviewSkeleton />;
  if (status === "error" && !data) {
    return (
      <div className="admin-screen">
        <ErrorNotice error={error} onRetry={reload} />
      </div>
    );
  }

  const { stats, activity, daily, resume, loadedAt } = data;

  const points = (daily || []).map((row) => ({
    label: shortDate(row.date).replace(/,.*/, ""),
    value: row.unique_visitors,
  }));

  const week = points.slice(-7).reduce((sum, point) => sum + point.value, 0);
  const priorWeek = points.slice(-14, -7).reduce((sum, point) => sum + point.value, 0);

  const devices = tally(activity, "device_type");
  const browsers = tally(activity, "browser");
  const countries = tally(activity, "country");

  const topPages = (stats.top_pages || []).map((page) => ({
    label: page.page_path,
    count: page.unique_visitors,
  }));

  const tabs = (stats.tab_stats || [])
    .map((tab) => ({ label: tab.tab_name, count: tab.unique_visitors }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="admin-screen">
      <div className="stat-strip">
        <Stat label="Unique visitors today" value={num(stats.unique_visitors_today)} />
        <Stat
          label="Last 7 days"
          value={num(stats.unique_visitors_week)}
          delta={points.length >= 14 ? delta(week, priorWeek) : undefined}
          foot={points.length >= 14 ? "vs previous 7" : undefined}
        />
        <Stat label="Last 30 days" value={num(stats.unique_visitors_month)} />
        <Stat
          label="All time"
          value={num(stats.unique_visitors_total)}
          foot={`${num(stats.total_page_views)} page views`}
        />
      </div>

      <p className="panel-note" style={{ marginTop: "-0.5rem" }}>
        Live from your own tracking. Excludes admin pages, API paths, and requests from private or
        loopback addresses. Read {clockTime(loadedAt)}.
      </p>

      <div className="grid-lead">
        <Panel
          title="Unique visitors"
          note="last 14 days"
          aside={points.length ? `${num(week)} this week` : null}
        >
          {points.length ? (
            <TrendChart points={points} label="Unique visitors" />
          ) : (
            <Empty
              title="No daily history yet"
              hint="This chart fills in once the backend has a few days of page views to group."
            />
          )}
        </Panel>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <Panel title="Devices" note={`${num(activity.length)} recent visits`}>
            <SplitBar items={devices} empty="No visits recorded yet" />
          </Panel>

          <Panel title="Browsers">
            <BarList items={browsers.slice(0, 5)} total={activity.length} />
          </Panel>
        </div>
      </div>

      <div className="grid-2">
        <Panel title="Top pages" note="by unique visitors">
          <BarList items={topPages.slice(0, 7)} empty="No page views recorded yet" />
        </Panel>

        <Panel title="Countries" note="from recent visits">
          <BarList items={countries.slice(0, 7)} total={activity.length} />
        </Panel>
      </div>

      <div className="grid-2">
        <Panel title="Section engagement" note="which tabs get opened">
          <BarList items={tabs.slice(0, 8)} empty="No tab activity recorded yet" />
        </Panel>

        <Panel title="Resume" note="views and downloads">
          {resume ? (
            <div className="barlist">
              <BarList
                items={[
                  { label: "Unique viewers", count: resume.unique_viewers },
                  { label: "Total views", count: resume.total_views },
                  { label: "Unique downloaders", count: resume.unique_downloaders },
                  { label: "Total downloads", count: resume.total_downloads },
                ]}
                empty="No resume activity yet"
              />
              {resume.last_viewed && (
                <p className="panel-note" style={{ marginTop: "0.5rem" }}>
                  Last opened {timeAgo(resume.last_viewed)}
                </p>
              )}
            </div>
          ) : (
            <Empty title="Resume stats unavailable" hint="The endpoint did not respond." />
          )}
        </Panel>
      </div>

      <Panel
        title="Recent visits"
        note="newest first"
        aside={
          <button type="button" className="btn btn-ghost" onClick={onOpenVisitors}>
            See all
          </button>
        }
        flush
      >
        {activity.length === 0 ? (
          <Empty
            title="No visits recorded yet"
            hint="Once someone opens the site, their visit appears here within seconds."
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
                  <th className="num">When</th>
                </tr>
              </thead>
              <tbody>
                {activity.slice(0, 8).map((visit, index) => {
                  const Icon = deviceIcon[String(visit.device_type || "").toLowerCase()] || FileText;
                  return (
                    <tr key={`${visit.visitor_id}-${visit.created_at}-${index}`}>
                      <td style={{ color: "var(--ink)" }}>{visit.page_title || visit.page_path}</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <Icon size={13} />
                          {visit.browser || "Unknown"} on {visit.os || "Unknown"}
                        </span>
                      </td>
                      <td>
                        {[visit.city, visit.country].filter(Boolean).join(", ") || "Unknown"}
                      </td>
                      <td>{hostOf(visit.referrer)}</td>
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

function OverviewSkeleton() {
  return (
    <div className="admin-screen">
      <div className="stat-strip">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="stat" key={index}>
            <Skeleton height={11} width="55%" />
            <Skeleton height={25} width="45%" style={{ marginTop: 6 }} />
            <Skeleton height={10} width="35%" style={{ marginTop: 6 }} />
          </div>
        ))}
      </div>
      <div className="grid-lead">
        <div className="panel">
          <div className="panel-head">
            <Skeleton height={12} width={110} />
          </div>
          <div className="panel-body">
            <Skeleton height={190} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <Skeleton height={12} width={80} />
          </div>
          <div className="panel-body">
            <PanelSkeleton rows={4} />
          </div>
        </div>
      </div>
      <div className="grid-2">
        {[0, 1].map((index) => (
          <div className="panel" key={index}>
            <div className="panel-head">
              <Skeleton height={12} width={90} />
            </div>
            <div className="panel-body">
              <PanelSkeleton rows={5} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
