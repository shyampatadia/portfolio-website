import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ExternalLink, Link2, LockKeyhole, RefreshCw, Unplug } from "lucide-react";

import { connectTrading, disconnectTrading, getTradingDashboard, syncTrading } from "@/admin/lib/api";
import { Empty, ErrorNotice, Notice, Panel, PanelSkeleton, Stat } from "@/admin/components/ui";
import { useAsync } from "@/admin/lib/useAdmin";
import { TradingHistory } from "@/admin/components/TradingHistory";
import "@/styles/trading.css";

const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 });
const money = (value) => value == null ? "Unavailable" : rupees.format(value);
const dateTime = (value) => value ? new Date(value).toLocaleString("en-IN", {
  timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
}) + " IST" : "Not synced yet";
const currentYear = () => Number(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata", year: "numeric" }));

export function Trading({ toast }) {
  const [year, setYear] = useState(currentYear);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [importVersion, setImportVersion] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);

  const load = useCallback((signal) => getTradingDashboard(year, signal), [year]);
  const { data, status, error, reload, setData } = useAsync(load, [year]);
  const updateData = useRef(setData);
  updateData.current = setData;

  // Saved history is useful even if the broker is slow or unavailable. Never
  // hold the whole workspace behind a fresh Kite request.
  useEffect(() => {
    if (!data?.connected || document.visibilityState === "hidden") { setSyncing(false); return undefined; }
    const controller = new AbortController();
    let alive = true;
    setSyncing(true);
    syncTrading(year, controller.signal)
      .then((next) => { if (alive) { updateData.current(next); setSyncError(null); } })
      .catch(async (err) => {
        if (!alive || err.name === "AbortError" || err.status === 401) return;
        if (err.status === 409) {
          try {
            const saved = await getTradingDashboard(year, controller.signal);
            if (alive) { updateData.current(saved); setSyncError(null); }
          } catch (readError) { if (alive && readError.name !== "AbortError") setSyncError(readError.message); }
        } else setSyncError(err.message);
      })
      .finally(() => { if (alive) setSyncing(false); });
    return () => { alive = false; controller.abort(); };
  }, [year, data?.connected, importVersion]);

  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") { setImportVersion((n) => n+1); reload(); } };
    const timer = window.setInterval(tick, 60000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [reload]);

  const connect = async () => {
    setConnecting(true);
    try {
      const { url } = await connectTrading();
      const parsed = new URL(url);
      if (parsed.origin !== "https://kite.zerodha.com") throw new Error("Unexpected Kite login address.");
      window.location.assign(url);
    } catch (err) {
      toast(err.message, { tone: "error" });
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await disconnectTrading();
      setConfirmDisconnect(false);
      toast("Kite disconnected. Saved history is retained.");
      reload();
    } catch (err) {
      toast(err.message, { tone: "error" });
    } finally {
      setDisconnecting(false);
    }
  };

  const activity = data?.activity || [];
  const busy = status === "loading" || status === "refreshing" || syncing;
  const historyVersion = `${data?.synced_at || ""}:${importVersion}`;

  return (
    <div className="admin-screen trading-screen" aria-busy={busy}>
      <div className="trading-toolbar">
        <div>
          <span className="chip"><LockKeyhole size={12} /> Private</span>
          <p className="trading-caption">Your Zerodha account, visible only after admin sign-in.</p>
        </div>
        <div className="trading-actions">
          {data?.configured && !data.connected && (
            <button type="button" className="btn btn-primary" onClick={connect} disabled={connecting}>
              <Link2 /> {connecting ? "Opening Kite..." : data.needs_reconnect ? "Reconnect Kite" : "Connect Kite"}
            </button>
          )}
          <button type="button" className="btn" onClick={() => { setImportVersion((n) => n+1); reload(); }} disabled={busy || !data?.configured}>
            <RefreshCw /> {busy ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && <ErrorNotice error={error} onRetry={reload} />}
      {syncError && <Notice>Account refresh failed: {syncError} Your saved history is still available.</Notice>}
      {!data && busy && <Panel title="Trading account"><PanelSkeleton rows={6} /></Panel>}

      {data && !data.configured && (
        <Panel title="Connect your trading account">
          <p className="trading-intro">Balances, holdings, positions, and a calendar of your trading activity. Your financial records stay in private Supabase tables.</p>
          <ol className="trading-setup">
            <li><a href="https://developers.kite.trade/" target="_blank" rel="noreferrer">Create a Kite Connect app <ExternalLink size={13} /></a> for your Zerodha account.</li>
            <li>Configure its API credentials and the encryption key on the backend.</li>
            <li>Run the private trading migration in Supabase, then return here to connect.</li>
          </ol>
          <p className="trading-caption">The deployment instructions are in <code>backend/TRADING.md</code>. Never put keys in the frontend or a Git commit.</p>
        </Panel>
      )}

      {data?.configured && (
        <>
          <div className="trading-status" role="status">
            <span>{data.connected ? "Kite connected" : data.needs_reconnect ? "Kite session expired" : "Kite disconnected"}</span>
            <span>Last saved: {dateTime(data.synced_at)}</span>
            <span>Checks every 60 seconds while this page is visible</span>
          </div>
          {data.needs_reconnect && <Notice>Kite requires a new login each day. Reconnect to resume updates. Saved history remains available.</Notice>}
          <TradingHistory year={year} onYearChange={setYear} version={historyVersion} toast={toast}
            onImported={() => { setImportVersion((n) => n+1); reload(); }}>
          {!data.totals && <Empty title="Your first snapshot is waiting" hint="Connect Kite to read your account. Trade history starts with the days captured here." />}
          {data.totals && (
            <>
              <h2 className="trading-section-title">Latest Kite account snapshot</h2>
              <div className="trading-stats">
                <Stat label="Invested in held shares" value={money(data.totals.invested)} foot="Cost of current delivery holdings" />
                <Stat label="Holdings value" value={money(data.totals.holdings_value)} foot="At prices in the last snapshot" />
                <Stat label="Unrealized P&L" value={money(data.totals.unrealized_pnl)} foot={data.totals.return_percent == null ? "No cost basis" : `${data.totals.return_percent >= 0 ? "+" : ""}${data.totals.return_percent.toFixed(2)}% on held shares`} />
                <Stat label="Available equity margin" value={money(data.totals.available_margin)} foot="Buying power, not withdrawable balance" />
              </div>
              <div className="trading-funds">
                <span>Equity cash <strong>{money(data.totals.cash)}</strong></span>
                <span>Margin used <strong>{money(data.totals.used_margin)}</strong></span>
                <span>Net positions P&L <strong>{money(data.totals.positions_pnl)}</strong></span>
              </div>
            </>
          )}

          <ValueHistory activity={activity} />

          <Panel title="Delivery holdings" note={`${data.holdings.length} ${data.holdings.length === 1 ? "instrument" : "instruments"}`} flush>
            {data.holdings.length ? (
              <div className="trading-table-scroll">
                <table className="data-table trading-table">
                  <thead><tr><th>Instrument</th><th>Quantity</th><th>Avg. cost</th><th>Last price</th><th>Invested</th><th>Value</th><th>Unrealized P&L</th></tr></thead>
                  <tbody>{data.holdings.map((h) => (
                    <tr key={`${h.exchange}:${h.symbol}`}>
                      <td><strong>{h.symbol}</strong><span className="trading-cell-note">{h.exchange}</span></td>
                      <td>{h.quantity}</td><td>{money(h.average_price)}</td><td>{money(h.last_price)}</td>
                      <td>{money(h.invested)}</td><td>{money(h.value)}</td>
                      <td className={h.pnl < 0 ? "trading-loss" : "trading-gain"}>{h.pnl >= 0 ? "+" : ""}{money(h.pnl)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <Empty title="No delivery holdings captured" hint="Holdings appear after a successful Kite sync." />}
          </Panel>

          <Panel title="Net positions" note="Includes positions closed during the day" flush>
            {data.positions.length ? (
              <div className="trading-table-scroll"><table className="data-table trading-table">
                <thead><tr><th>Instrument</th><th>Exchange</th><th>Product</th><th>Net quantity</th><th>P&L</th></tr></thead>
                <tbody>{data.positions.map((p) => <tr key={`${p.exchange}:${p.symbol}:${p.product}`}>
                  <td>{p.symbol}</td><td>{p.exchange}</td><td>{p.product}</td><td>{p.quantity}</td>
                  <td className={p.pnl < 0 ? "trading-loss" : "trading-gain"}>{p.pnl >= 0 ? "+" : ""}{money(p.pnl)}</td>
                </tr>)}</tbody>
              </table></div>
            ) : <Empty title="No positions captured" />}
          </Panel>


          <footer className="trading-footer">
            <p>The live snapshot covers current delivery holdings and positions. Historical F&O results and funding come from saved fills and imported ledger records. Neither the holdings-value chart nor the ledger-balance chart is a cash-flow-adjusted investment return.</p>
            {data.connected && (confirmDisconnect ? (
              <div className="trading-actions">
                <span>Stop syncing? Saved history stays.</span>
                <button type="button" className="btn" disabled={disconnecting} onClick={disconnect}>{disconnecting ? "Disconnecting..." : "Disconnect"}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmDisconnect(false)}>Cancel</button>
              </div>
            ) : <button type="button" className="btn btn-ghost" onClick={() => setConfirmDisconnect(true)}><Unplug /> Disconnect Kite</button>)}
          </footer>
          </TradingHistory>
        </>
      )}
    </div>
  );
}

function ValueHistory({ activity }) {
  const points = activity.filter((d) => d.holdings_value != null);
  const values = points.map((d) => d.holdings_value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const y = (value) => 125 - (value - min) / (max - min) * 110;
  const x = (date) => {
    const range = Date.parse(points.at(-1)?.date) - Date.parse(points[0]?.date);
    return range ? 15 + (Date.parse(date) - Date.parse(points[0].date)) / range * 770 : 400;
  };
  return <Panel title="Holdings value history" note="Latest saved snapshot for each observed day">
    {points.length < 2 ? <Empty title="A history takes a little time" hint="At least two captured days are needed. Past dates will not be invented." /> : (
      <>
        <div className="trading-value-range"><span>{compact.format(min)}</span><span>{compact.format(max)}</span></div>
        <svg className="trading-value-chart" viewBox="0 0 800 145" role="img" aria-label={`Holdings value from ${money(points[0].holdings_value)} on ${points[0].date} to ${money(points.at(-1).holdings_value)} on ${points.at(-1).date}. Includes effects of buying and selling.`}>
          <line x1="15" x2="785" y1="125" y2="125" stroke="var(--line-strong)" />
          {points.slice(1).map((d, i) => Date.parse(d.date) - Date.parse(points[i].date) === 86400000 && (
            <line key={d.date} x1={x(points[i].date)} y1={y(points[i].holdings_value)} x2={x(d.date)} y2={y(d.holdings_value)} stroke="var(--series-1)" strokeWidth="2" />
          ))}
          {points.map((d) => <circle key={d.date} cx={x(d.date)} cy={y(d.holdings_value)} r="3" fill="var(--series-1)"><title>{d.date}: {money(d.holdings_value)}</title></circle>)}
        </svg>
        <div className="trading-value-range"><span>{points[0].date}</span><span>{points.at(-1).date}</span></div>
        <details className="trading-history-details"><summary>View daily values <ArrowUpRight size={13} /></summary>
          <div className="trading-table-scroll"><table className="data-table trading-table"><thead><tr><th>Date (IST)</th><th>Invested</th><th>Holdings value</th></tr></thead><tbody>{points.map((d) => <tr key={d.date}><td>{d.date}</td><td>{money(d.invested)}</td><td>{money(d.holdings_value)}</td></tr>)}</tbody></table></div>
        </details>
      </>
    )}
    <p className="trading-caption">Observed portfolio values, not investment returns. Gaps between captures are left unconnected.</p>
  </Panel>;
}
