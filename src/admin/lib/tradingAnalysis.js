// One currency scale for both signs. Do not turn missing P&L into a zero.
export const PNL_LIMITS = [500, 2000, 5000, 10000];

export function dailyPnl(day, basis = "net") {
  const value = basis === "net" ? day?.net_settlement : day?.gross_pnl;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function pnlCell(day, basis = "net") {
  const value = dailyPnl(day, basis);
  if (value === null) return { kind: day?.fills > 0 ? "pending" : "unknown", level: 0, value: null };
  if (value === 0) return { kind: "flat", level: 0, value: 0 };
  const index = PNL_LIMITS.findIndex((limit) => Math.abs(value) <= limit);
  return { kind: value > 0 ? "profit" : "loss", level: index < 0 ? 5 : index+1, value };
}

export function pnlHighlights(days, basis = "net") {
  const known = days.filter((d) => dailyPnl(d, basis) !== null);
  const profitable = known.filter((d) => dailyPnl(d, basis) > 0);
  const losing = known.filter((d) => dailyPnl(d, basis) < 0);
  return {
    best: profitable.length ? profitable.reduce((a, b) => dailyPnl(a, basis) > dailyPnl(b, basis) ? a : b) : null,
    worst: losing.length ? losing.reduce((a, b) => dailyPnl(a, basis) < dailyPnl(b, basis) ? a : b) : null,
    profitable: profitable.length, losing: losing.length, flat: known.length-profitable.length-losing.length,
    pending: days.filter((d) => d.fills > 0 && dailyPnl(d, basis) === null).length,
  };
}
