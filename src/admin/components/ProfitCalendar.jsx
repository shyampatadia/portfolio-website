import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Panel, Segmented } from "@/admin/components/ui";
import { dailyPnl, pnlCell, pnlHighlights, PNL_LIMITS } from "@/admin/lib/tradingAnalysis";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const whole = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const money = (n) => n == null ? "Not available" : currency.format(n);
const signed = (n) => `${n > 0 ? "+" : ""}${money(n)}`;
const dateLabel = (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export function ProfitCalendar({ year, days, ledgerAsOf, selected, onSelect, onViewTrades }) {
  const [basis, setBasis] = useState("net");
  const [hovered, setHovered] = useState(null);
  const [focused, setFocused] = useState(null);
  const scroll = useRef(null);
  const lookup = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const highlights = useMemo(() => pnlHighlights(days, basis), [days, basis]);
  const lastKnown = [...days].reverse().find((d) => dailyPnl(d, basis) !== null)?.date;
  const inspected = hovered || selected || lastKnown;
  const inspectedDay = lookup.get(inspected);
  const inspectedCell = pnlCell(inspectedDay, basis);
  const cells = useMemo(() => {
    const first = new Date(Date.UTC(year, 0, 1));
    const last = new Date(Date.UTC(year, 11, 31));
    const list = Array.from({ length: first.getUTCDay() }, () => null);
    for (let d = new Date(first); d <= last; d.setUTCDate(d.getUTCDate()+1)) {
      list.push({ date: d.toISOString().slice(0, 10), month: d.getUTCDate() === 1 ? d.toLocaleDateString("en", { month: "short", timeZone: "UTC" }) : null });
    }
    return list;
  }, [year]);
  useEffect(() => { setHovered(null); setFocused(null); }, [year]);
  useEffect(() => {
    // Bring the recorded period into view on a phone, rather than empty January.
    const first = days.find((d) => dailyPnl(d, basis) !== null);
    const node = first && scroll.current?.querySelector(`[data-date="${first.date}"]`);
    if (node && scroll.current.scrollWidth > scroll.current.clientWidth) scroll.current.scrollLeft = Math.max(0, node.offsetLeft-85);
  }, [year, days, basis]);
  const weeks = Math.ceil(cells.length/7);
  const cellLabel = (date) => {
    const day = lookup.get(date), cell = pnlCell(day, basis);
    const description = cell.kind === "unknown" ? "No recorded P&L" : cell.kind === "pending" ? basis === "net" ? "Awaiting funds statement" : "P&L not calculated for unmatched positions" : `${cell.value < 0 ? "Loss" : cell.value > 0 ? "Profit" : "Break-even"} ${money(Math.abs(cell.value))}`;
    return `${dateLabel(date)}: ${description}${day?.fills ? `, ${day.fills} fills` : ""}, ${basis === "net" ? "after charges" : "before charges"}`;
  };
  const moveFocus = (e, index) => {
    const offset = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }[e.key];
    if (!offset) return;
    e.preventDefault();
    e.currentTarget.parentElement.querySelector(`[data-index="${index+offset}"]`)?.focus();
  };
  return <Panel title="Daily profit & loss" aside={<Segmented value={basis} onChange={setBasis} options={[{ value: "net", label: "After charges" }, { value: "gross", label: "Before charges" }]} />}>
    <div className="pnl-calendar-heading"><p><strong className="trading-gain">{highlights.profitable} profit days</strong><span aria-hidden="true"> / </span><strong className="trading-loss">{highlights.losing} loss days</strong>{highlights.flat > 0 && <span> / {highlights.flat} break-even</span>}</p><span>Darker boxes mean larger amounts</span></div>
    <div className="pnl-calendar-scroll" ref={scroll}>
      <div className="pnl-calendar-grid" style={{ "--weeks": weeks }}>
        <div className="pnl-months" aria-hidden="true">{Array.from({ length: weeks }, (_, w) => <span key={w}>{cells.slice(w*7, w*7+7).find((d) => d?.month)?.month}</span>)}</div>
        <div className="pnl-weekdays" aria-hidden="true">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span key={d}>{d}</span>)}</div>
        <div className="pnl-dates" role="group" aria-label={`${year} daily profit and loss. Use arrow keys to navigate and Enter to select a day.`} onMouseLeave={() => setHovered(null)}>
          {cells.map((d, i) => d ? <button key={d.date} type="button" className="pnl-day" data-date={d.date} data-index={i}
            data-kind={pnlCell(lookup.get(d.date), basis).kind} data-level={pnlCell(lookup.get(d.date), basis).level}
            aria-label={cellLabel(d.date)} title={cellLabel(d.date)} aria-pressed={selected === d.date}
            tabIndex={d.date === (focused || selected || lastKnown || `${year}-01-01`) ? 0 : -1}
            onMouseEnter={() => setHovered(d.date)} onFocus={() => { setFocused(d.date); setHovered(d.date); }}
            onBlur={() => setHovered(null)} onKeyDown={(e) => moveFocus(e, i)} onClick={() => { setHovered(null); onSelect(d.date); }} /> : <span key={`pad-${i}`} />)}
        </div>
      </div>
    </div>
    <div className="pnl-legend"><span>Loss {Array.from({ length: 5 }, (_, i) => <i key={i} className="pnl-day" data-kind="loss" data-level={5-i} title={`Loss ${i === 0 ? `over ${whole.format(PNL_LIMITS[3])}` : `up to ${whole.format(PNL_LIMITS[4-i])}`}`} />)}</span><span><i className="pnl-day" data-kind="flat" /> Zero</span><span>{Array.from({ length: 5 }, (_, i) => <i key={i} className="pnl-day" data-kind="profit" data-level={i+1} />)} Profit</span><span><i className="pnl-day" data-kind="unknown" /> No data</span><span><i className="pnl-day" data-kind="pending" /> Pending</span></div>
    <p className="trading-caption">Same amount bands for both colors: up to ₹500 / ₹2,000 / ₹5,000 / ₹10,000 / above ₹10,000.</p>
    <div className="pnl-day-detail" data-kind={inspectedCell.kind} aria-live="polite">
      <div><span className="trading-caption">{inspected ? dateLabel(inspected) : "Select a day"}</span><strong className={inspectedCell.kind === "loss" ? "trading-loss" : inspectedCell.kind === "profit" ? "trading-gain" : ""}>{inspectedCell.value === null ? inspectedCell.kind === "pending" ? "Awaiting P&L" : "No recorded P&L" : signed(inspectedCell.value)}</strong><span className="trading-caption">{inspectedCell.value === null ? basis === "net" && inspectedDay?.fills ? "Import the funds statement for this date." : "This date is not covered by the selected P&L source." : basis === "net" ? "Net result after daily charges" : "Trading result before charges"}</span></div>
      <dl><div><dt>Before charges</dt><dd>{inspectedDay?.gross_pnl == null ? "Not available" : signed(inspectedDay.gross_pnl)}</dd></div><div><dt>Charges & adjustments</dt><dd>{money(inspectedDay?.costs_and_adjustments)}</dd></div><div><dt>Executed fills</dt><dd>{inspectedDay?.fills ?? "No data"}</dd></div></dl>
      {inspectedDay?.fills > 0 && <button type="button" className="btn" onClick={() => onViewTrades(inspected)}>View this day's trades <ChevronRight /></button>}
    </div>
    <div className="pnl-extremes">{[["Best day", highlights.best, "trading-gain"], ["Worst day", highlights.worst, "trading-loss"]].map(([label, d, cls]) => <button type="button" key={label} className="pnl-extreme" disabled={!d} onClick={() => { setHovered(null); onSelect(d.date); }}><span>{label}</span><strong className={cls}>{d ? signed(dailyPnl(d, basis)) : "No recorded day"}</strong><span>{d ? dateLabel(d.date) : ""}</span></button>)}</div>
    {highlights.best && highlights.worst && Math.abs(dailyPnl(highlights.worst, basis)) > dailyPnl(highlights.best, basis) && <p className="pnl-insight">Your largest loss day was <strong>{(Math.abs(dailyPnl(highlights.worst, basis))/dailyPnl(highlights.best, basis)).toFixed(1)}×</strong> your largest profit day.</p>}
    {basis === "net" && <p className="trading-caption">After-charges data through {ledgerAsOf ? dateLabel(ledgerAsOf) : "no imported statement yet"}. Trading days without a matching statement remain pending.</p>}
  </Panel>;
}
