import test from "node:test";
import assert from "node:assert/strict";
import { dailyPnl, pnlCell, pnlHighlights } from "../src/admin/lib/tradingAnalysis.js";

test("after-charges is the default and can reverse a before-charges profit", () => {
  const day = { gross_pnl: 250, net_settlement: -100, fills: 4 };
  assert.equal(dailyPnl(day), -100);
  assert.equal(pnlCell(day).kind, "loss");
  assert.equal(pnlCell(day, "gross").kind, "profit");
});

test("zero, missing data, and pending statements are different states", () => {
  assert.equal(pnlCell({ net_settlement: 0, fills: 2 }).kind, "flat");
  assert.equal(pnlCell({ net_settlement: null, fills: 2 }).kind, "pending");
  assert.equal(pnlCell({ net_settlement: null, fills: 0 }).kind, "unknown");
  assert.equal(pnlCell(undefined).value, null);
  assert.equal(dailyPnl({ net_settlement: NaN }), null);
});

test("profit and loss use the same magnitude bands", () => {
  for (const [amount, level] of [[.01,1],[500,1],[500.01,2],[2000,2],[2000.01,3],[5000,3],[5000.01,4],[10000,4],[10000.01,5],[200000,5]]) {
    assert.equal(pnlCell({ net_settlement: amount }).level, level);
    assert.equal(pnlCell({ net_settlement: -amount }).level, level);
  }
});

test("funding-only dates do not become profitable trading days", () => {
  assert.equal(pnlCell({ ledger_balance: 20000, fills: 0 }).kind, "unknown");
});

test("best and worst dates exclude missing data and don't invent a win or loss", () => {
  const days = [
    { date: "2026-01-02", net_settlement: 150, fills: 2 },
    { date: "2026-01-03", net_settlement: -300, fills: 2 },
    { date: "2026-01-04", net_settlement: 0, fills: 2 },
    { date: "2026-01-05", net_settlement: null, fills: 2 },
  ];
  const h = pnlHighlights(days);
  assert.equal(h.best.date, "2026-01-02");
  assert.equal(h.worst.date, "2026-01-03");
  assert.deepEqual([h.profitable,h.losing,h.flat,h.pending], [1,1,1,1]);
  assert.equal(pnlHighlights([days[1]]).best, null);
  assert.equal(pnlHighlights([days[0]]).worst, null);
});
