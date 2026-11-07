import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { getTradingHistory, getTradePage, previewTradingImport, commitTradingImport } from "@/admin/lib/api";
import { Empty, ErrorNotice, Notice, Panel, PanelSkeleton, Segmented } from "@/admin/components/ui";
import { useAsync } from "@/admin/lib/useAdmin";
import { TradingMoneyOverview } from "@/admin/components/TradingMoneyOverview";
import { ProfitCalendar } from "@/admin/components/ProfitCalendar";

const format = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const short = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 });
const money = (n) => n == null ? "Not available" : format.format(n);
const signed = (n) => n == null ? "Not available" : `${n > 0 ? "+" : ""}${money(n)}`;
const periodDate = (value) => new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const pnlClass = (n) => n < 0 ? "trading-loss" : n > 0 ? "trading-gain" : "";
const categories = { deposit: "Deposit", withdrawal: "Withdrawal / settlement", fo_settlement: "F&O settlement", other: "Other" };

export function TradingHistory({ year, onYearChange, version, onImported, toast, children }) {
  const [section, setSection] = useState("overview");
  const [selectedDate, setSelectedDate] = useState(null);
  const [compareGross, setCompareGross] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [nonce, setNonce] = useState(0);
  const load = useCallback((signal) => getTradingHistory(year, signal), [year]);
  const { data, error, status, reload } = useAsync(load, [year, version, nonce]);
  const years = [...new Set([year, ...(data?.available_years || []), new Date().getFullYear()])].sort((a, b) => b-a);
  const imported = () => { setNonce((n) => n+1); onImported(); };

  return <section className="trading-history" aria-label="Imported trading history">
    <div className="trading-toolbar">
      <div><h2 className="trading-section-title">Your money & trading</h2><p className="trading-caption">{data?.date_from ? `${periodDate(data.date_from)} to ${periodDate(data.date_to)} · ${data.active_days} trading days · F&O reports` : "Deposits, trading results, and your account balance."}</p></div>
      <div className="trading-actions">
        <label className="trading-year">Year <select value={year} onChange={(e) => { setSelectedDate(null); onYearChange(Number(e.target.value)); }}>{years.map((y) => <option key={y}>{y}</option>)}</select></label>
        <button type="button" className="btn" onClick={() => setShowImport((v) => !v)} aria-expanded={showImport}><Upload /> Import reports</button>
      </div>
    </div>
    {showImport && <ImportReports onImported={imported} toast={toast} />}
    {error && <ErrorNotice error={error} onRetry={reload} />}
    {!data && status === "loading" && <Panel><PanelSkeleton rows={4} /></Panel>}
    {data && <>
      <div className="trading-history-nav">
        <Segmented value={section} onChange={(value) => { if (value === "trades") setSelectedDate(null); setSection(value); }} options={[{ value: "overview", label: "Overview" }, { value: "trades", label: "Trades" }, { value: "ledger", label: "Funds & ledger" }, { value: "account", label: "Live account" }]} />
      </div>
      {data.incomplete_days > 0 && <Notice>{data.incomplete_days} F&O day(s) have unmatched quantities. Gross P&L excludes those days; the ledger settlements remain visible.</Notice>}
      {section === "overview" && <>
        <TradingMoneyOverview data={data} />
        <ProfitCalendar year={year} days={data.daily} ledgerAsOf={data.ledger_as_of} selected={selectedDate} onSelect={setSelectedDate} onViewTrades={(day) => { setSelectedDate(day); setSection("trades"); }} />
        <Panel title="How your trading result changed" note="Cumulative P&L; money transfers are excluded" aside={<label className="trading-compare"><input type="checkbox" checked={compareGross} onChange={(e) => setCompareGross(e.target.checked)} /> Compare before charges</label>}>
          <HistoryChart points={data.daily} series={[{ key: "cumulative_net", name: "After charges", color: data.net_settlements < 0 ? "var(--pnl-loss-text)" : "var(--pnl-profit-text)" }, ...(compareGross ? [{ key: "cumulative_gross", name: "Before charges", color: "var(--series-1)" }] : [])]} />
          <p className="trading-caption">Largest fall from a previous P&L peak: {money(data.max_drawdown)}.</p>
        </Panel>
          <Panel title="Month by month" note="Profit / loss after charges" flush>
            <div className="trading-table-scroll"><table className="trading-table"><thead><tr><th>Month</th><th>Executed fills</th><th>Net profit / loss</th></tr></thead><tbody>{data.monthly.map((m) => <tr key={m.month}><td>{new Date(`${m.month}-01T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })}</td><td>{m.fills}</td><td className={pnlClass(m.net_settlement)}>{signed(m.net_settlement)}</td></tr>)}</tbody></table></div>
            {!data.monthly.length && <Empty title="No history imported yet" hint="Import a Console tradebook and ledger using Import reports." />}
          </Panel>
        <details className="trading-analysis-details"><summary>Daily results and instrument analysis</summary>
          <Panel title="Daily results" note="Choose a date to inspect it on the calendar" flush>
            <div className="trading-table-scroll"><table className="trading-table"><thead><tr><th>Date (IST)</th><th>Fills</th><th>Before charges</th><th>After charges</th><th>Charges / adjustments</th></tr></thead><tbody>{[...data.daily].reverse().map((d) => <tr key={d.date}><td><button type="button" className="trading-date-link" onClick={() => { setSelectedDate(d.date); document.querySelector(".pnl-calendar-heading")?.scrollIntoView({ block: "center" }); }}>{d.date}</button></td><td>{d.fills}</td><td className={pnlClass(d.gross_pnl)}>{signed(d.gross_pnl)}</td><td className={pnlClass(d.net_settlement)}>{signed(d.net_settlement)}</td><td>{money(d.costs_and_adjustments)}</td></tr>)}</tbody></table></div>
          </Panel>
          <Panel title="Instrument results" note="Largest gross gains/losses on flat days; fees excluded" flush>
            <div className="trading-instruments"><table className="trading-table"><thead><tr><th>Instrument</th><th>Fills</th><th>Gross P&L</th></tr></thead><tbody>{data.instruments.map((s) => <tr key={`${s.exchange}:${s.symbol}`}><td>{s.symbol}<span className="trading-cell-note">{s.exchange}</span></td><td>{s.fills}</td><td className={pnlClass(s.gross_pnl)}>{signed(s.gross_pnl)}</td></tr>)}</tbody></table></div>
            {!data.instruments.length && <Empty title="No closed-day instrument results" />}
          </Panel>
          <p className="trading-caption">Before-charges results cover only days where each F&O instrument's buys and sells balance. Charges & adjustments are a reconciliation difference, not an itemized tax report.</p>
        </details>
      </>}
      {section === "ledger" && <>
        <div className="funding-summary"><span>Total deposited <strong>{money(data.deposits)}</strong></span><span>Total withdrawn <strong>{money(data.withdrawals)}</strong></span><span>Net money added <strong>{money(data.net_funding)}</strong></span></div>
        <Panel title="Ledger balance" note="Includes deposits and withdrawals; not an investment-return curve"><HistoryChart points={data.daily} series={[{ key: "ledger_balance", name: "Closing balance on recorded dates", color: "var(--series-1)" }]} /></Panel>
        <LedgerTable rows={data.ledger} opening={data.opening_balance} other={data.other_ledger_change} />
      <p className="trading-caption">Kite updates fills and current account balances. Import a newer funds statement to update net settlements, funding, and the historical ledger.</p>
      {data.imports.length > 0 && <details className="trading-history-details"><summary>{data.imports.length} imported reports</summary><div className="trading-table-scroll"><table className="trading-table"><thead><tr><th>Report</th><th>Coverage</th><th>Records</th><th>Imported</th></tr></thead><tbody>{data.imports.map((r, i) => <tr key={i}><td>{r.kind === "ledger" ? "Funds statement" : "Tradebook"}</td><td>{r.date_from} to {r.date_to}</td><td>{r.row_count}</td><td>{new Date(r.imported_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td></tr>)}</tbody></table></div></details>}
      </>}
      {section === "trades" && <TradingTradebook year={year} selectedDate={selectedDate} onClearDate={() => setSelectedDate(null)} version={version} />}
      {section === "account" && <div className="trading-account-view">{children}</div>}
    </>}
  </section>;
}

function ImportReports({ onImported, toast }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const input = useRef(null);
  const preview = async () => {
    setBusy(true); setError(null); setReceipts([]); setPreviews([]);
    try { setPreviews(await Promise.all(files.map((file) => previewTradingImport(file)))); }
    catch (e) { setError(e); }
    finally { setBusy(false); }
  };
  const commit = async () => {
    setBusy(true); setError(null);
    let completed = 0;
    try {
      for (let i=0; i<files.length; i++) {
        const receipt = await commitTradingImport(files[i], previews[i].file_hash);
        setReceipts((rows) => [...rows, receipt]); completed++;
      }
      setFiles([]); setPreviews([]); if (input.current) input.current.value = "";
      toast("Reports imported. History updated.");
    } catch (e) { setError(e); }
    finally { setBusy(false); if (completed) onImported(); }
  };
  return <Panel title="Import Console reports" note="CSV files go only to the authenticated backend">
    <label className="field" htmlFor="trading-reports"><span className="field-label">Tradebook or funds-statement CSV</span><input id="trading-reports" ref={input} type="file" accept=".csv,text/csv" multiple disabled={busy} onChange={(e) => { setFiles(Array.from(e.target.files)); setPreviews([]); setReceipts([]); setError(null); }} /></label>
    <p className="trading-caption">Up to 5 MB per file. Files are parsed in memory. Identical reports and overlapping trades are deduplicated; conflicting trades stop that file's import.</p>
    {previews.length > 0 && <ul className="trading-import-list">{previews.map((p, i) => <li key={`${p.file_hash}:${i}`}><strong>{p.kind === "ledger" ? "Funds ledger" : "Tradebook"}</strong><span>{p.row_count.toLocaleString("en-IN")} records · {p.date_from} to {p.date_to}</span></li>)}</ul>}
    {error && <ErrorNotice error={error} />}
    {receipts.map((r, i) => <p key={i} role="status" className="trading-caption">{r.already_imported ? "Report already imported; no duplicates added." : `Saved ${r.new_trades} new fills and ${r.new_ledger_entries} new ledger movements.`}</p>)}
    <div className="trading-actions" style={{ marginTop: "1rem" }}>
      <button type="button" className="btn" disabled={!files.length || busy} onClick={preview}>{busy ? "Processing..." : "Validate files"}</button>
      {previews.length === files.length && previews.length > 0 && <button type="button" className="btn btn-primary" disabled={busy} onClick={commit}>Import {previews.reduce((n, p) => n+p.row_count, 0).toLocaleString("en-IN")} records</button>}
    </div>
  </Panel>;
}

function HistoryChart({ points, series }) {
  const [cursor, setCursor] = useState(null);
  const [width, setWidth] = useState(800);
  const wrap = useRef(null);
  useEffect(() => {
    if (!wrap.current) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(wrap.current);
    return () => observer.disconnect();
  }, [points]);
  const valid = points.filter((d) => series.some((s) => d[s.key] != null));
  if (!valid.length) return <Empty title="No recorded values yet" hint="Import a tradebook and funds ledger to populate this chart." />;
  const values = valid.flatMap((d) => series.map((s) => d[s.key]).filter((n) => n != null));
  const low = Math.min(0, ...values), high = Math.max(1, ...values);
  const start = Date.parse(valid[0].date), range = Date.parse(valid.at(-1).date)-start;
  const right = width-12;
  const x = (d) => range ? 64+(Date.parse(d.date)-start)/range*(right-64) : (64+right)/2;
  const y = (n) => 175-(n-low)/(high-low)*150;
  const focus = valid[Math.min(cursor ?? valid.length-1, valid.length-1)];
  const move = (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    setCursor((n) => e.key === "Home" ? 0 : e.key === "End" ? valid.length-1 : Math.max(0, Math.min(valid.length-1, (n ?? valid.length-1)+(e.key === "ArrowLeft" ? -1 : 1))));
  };
  return <div className="trading-history-chart" ref={wrap}>
    <div className="trading-chart-readout" aria-live="polite"><strong>{focus.date}</strong>{series.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.name}: <b>{money(focus[s.key])}</b></span>)}</div>
    <svg viewBox={`0 0 ${width} 205`} role="img" tabIndex="0" onKeyDown={move} aria-label="Historical values by date. Use left and right arrow keys to inspect dates. Exact values also appear in the daily breakdown table.">
      {[low, (high+low)/2, high].map((n, i) => <g key={i}><line x1="64" x2={right} y1={y(n)} y2={y(n)} stroke="var(--line)" /><text x="55" y={y(n)+4} textAnchor="end">{short.format(n)}</text></g>)}
      <line x1="64" x2={right} y1={y(0)} y2={y(0)} stroke="var(--line-strong)" strokeDasharray="4 4" />
      {series.map((s) => { const data = valid.filter((d) => d[s.key] != null); return <g key={s.key}>
        <polyline points={data.map((d) => `${x(d)},${y(d[s.key])}`).join(" ")} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.key === "cumulative_gross" ? "5 3" : undefined} />
        {data.map((d) => <circle key={d.date} cx={x(d)} cy={y(d[s.key])} r="3" fill={s.color}><title>{d.date}: {s.name} {money(d[s.key])}</title></circle>)}
      </g>; })}
      <line x1={x(focus)} x2={x(focus)} y1="20" y2="178" stroke="var(--ink-muted)" strokeDasharray="2 3" />
      {valid.map((d, i) => <rect key={d.date} x={x(d)-8} y="20" width="16" height="160" fill="transparent" onMouseEnter={() => setCursor(i)} />)}
      <text x="64" y="200">{valid[0].date}</text><text x={right} y="200" textAnchor="end">{valid.at(-1).date}</text>
    </svg>
    <p className="trading-caption">Only recorded dates are plotted. Lines join observations; they do not reconstruct missing activity.</p>
  </div>;
}

function LedgerTable({ rows, opening, other }) {
  const [category, setCategory] = useState("all");
  const filtered = rows.filter((r) => category === "all" || r.category === category);
  return <Panel title="Funds statement" note={`Opening balance ${money(opening)} · Other ledger change ${signed(other)}`} aside={<label className="trading-year">Category <select value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All movements</option>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>} flush>
    <div className="trading-table-scroll trading-ledger-scroll"><table className="trading-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.entry_id}><td>{r.posting_date}</td><td className="trading-description">{r.particulars}</td><td>{categories[r.category] || r.category}</td><td>{money(r.debit)}</td><td>{money(r.credit)}</td><td>{money(r.balance)}</td></tr>)}</tbody></table></div>
    {!filtered.length && <Empty title="No ledger movements in this view" />}
  </Panel>;
}

export function TradingTradebook({ year, selectedDate, onClearDate, version }) {
  const [page, setPage] = useState(1);
  const [symbol, setSymbol] = useState("");
  const [search, setSearch] = useState("");
  const [side, setSide] = useState("");
  useEffect(() => { const timer = setTimeout(() => { setSearch(symbol.trim()); setPage(1); }, 250); return () => clearTimeout(timer); }, [symbol]);
  useEffect(() => setPage(1), [year, selectedDate, side]);
  const params = useMemo(() => ({ year, page, page_size: 25, ...(selectedDate ? { day: selectedDate } : {}), ...(search ? { symbol: search } : {}), ...(side ? { side } : {}) }), [year, page, selectedDate, search, side]);
  const load = useCallback((signal) => getTradePage(params, signal), [params]);
  const { data, status, error, reload } = useAsync(load, [params, version]);
  const pages = Math.max(1, Math.ceil((data?.total || 0)/25));
  return <Panel title={selectedDate ? `Tradebook · ${selectedDate}` : "Tradebook"} note="Search and browse every saved fill" aside={selectedDate && <button type="button" className="btn btn-ghost" onClick={onClearDate}>Clear date</button>} flush>
    <div className="trading-tradebook-controls"><label className="field"><span className="field-label">Instrument</span><input placeholder="Search symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} /></label><label className="field"><span className="field-label">Side</span><select value={side} onChange={(e) => setSide(e.target.value)}><option value="">Buy and sell</option><option>BUY</option><option>SELL</option></select></label></div>
    {error && <ErrorNotice error={error} onRetry={reload} />}
    {!data && status === "loading" && <PanelSkeleton rows={5} />}
    {data && <>
      <div className="trading-table-scroll trading-tradebook-scroll"><table className="trading-table"><thead><tr><th>Filled at (IST)</th><th>Instrument</th><th>Side</th><th>Quantity</th><th>Price</th><th>Traded value</th><th>Source</th></tr></thead><tbody>{data.rows.map((t) => <tr key={`${t.traded_at.slice(0, 10)}:${t.exchange}:${t.trade_id}`}><td>{new Date(t.traded_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td><td>{t.symbol}<span className="trading-cell-note">{t.exchange}</span></td><td>{t.side}</td><td>{t.quantity}</td><td>{money(t.price)}</td><td>{money(t.quantity*t.price)}</td><td>{t.source === "console" ? "Console import" : "Kite sync"}</td></tr>)}</tbody></table></div>
      {!data.rows.length && <Empty title="No fills match these filters" />}
      <div className="trading-pagination"><span>{data.total.toLocaleString("en-IN")} matching fills · Page {page} of {pages}</span><div className="trading-actions"><button type="button" className="btn" disabled={page<=1 || status==="refreshing"} onClick={() => setPage((n) => n-1)}><ChevronLeft /> Previous</button><button type="button" className="btn" disabled={page>=pages || status==="refreshing"} onClick={() => setPage((n) => n+1)}>Next <ChevronRight /></button></div></div>
    </>}
  </Panel>;
}
