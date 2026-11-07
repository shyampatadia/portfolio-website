const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const money = (n) => n == null ? "Not available" : currency.format(n);
const signed = (n) => n == null ? "Not available" : `${n > 0 ? "+" : ""}${money(n)}`;
const pnlClass = (n) => n < 0 ? "trading-loss" : n > 0 ? "trading-gain" : "";
const dateLabel = (day) => day ? new Date(`${day}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "No statement imported";

export function TradingMoneyOverview({ data }) {
  const net = data.net_settlements;
  const complete = [data.opening_balance, data.net_funding, net, data.closing_balance].every((n) => n != null);
  const expectedBalance = complete ? data.opening_balance + data.net_funding + net + (data.other_ledger_change || 0) : null;
  const reconciles = complete && Math.abs(expectedBalance-data.closing_balance) <= .03;
  return <section className="money-overview" aria-label="Your deposits, withdrawals, and trading result">
    <div className="money-funding">
      <p className="money-label">Total deposited</p>
      <strong className="money-amount" data-testid="total-deposits">{money(data.deposits)}</strong>
      <p className="trading-caption">All money transferred into Zerodha during this period.</p>
      <dl className="money-rows"><div><dt>Withdrawn to your bank</dt><dd>{money(data.withdrawals)}</dd></div><div><dt>Net money added</dt><dd>{money(data.net_funding)}</dd></div></dl>
      <p className="money-footnote">Withdrawals include automatic quarterly settlements. Redeposited money counts as another deposit.</p>
    </div>
    <div className="money-result">
      <p className="money-label">{net == null ? "Net trading result" : net < 0 ? "Net trading loss" : net > 0 ? "Net trading profit" : "Net trading result"} <span>after charges</span></p>
      <strong className={`money-amount ${pnlClass(net)}`} data-testid="net-trading-result">{signed(net)}</strong>
      <p className="trading-caption">F&O result from your broker's funds statement.</p>
      <dl className="money-rows"><div><dt>Trading result before charges</dt><dd className={pnlClass(data.gross_pnl)}>{signed(data.gross_pnl)}</dd></div><div><dt>Charges & adjustments</dt><dd>{money(data.costs_and_adjustments)}</dd></div></dl>
      <p className="money-footnote">Charges & adjustments are the difference between matching daily trade results and broker settlements.</p>
    </div>
    <div className="money-balance"><div><span>Balance left in the ledger</span><span>As of {dateLabel(data.ledger_as_of)}</span></div><strong data-testid="ledger-balance">{money(data.closing_balance)}</strong><span className="money-footnote">Historical cash balance; live buying power is in Live account.</span></div>
    {complete && <details className="money-reconciliation"><summary>How these amounts add up</summary><dl className="money-rows"><div><dt>Opening balance</dt><dd>{money(data.opening_balance)}</dd></div><div><dt>Deposits minus withdrawals</dt><dd>{signed(data.net_funding)}</dd></div><div><dt>Net trading result</dt><dd className={pnlClass(net)}>{signed(net)}</dd></div>{data.other_ledger_change !== 0 && <div><dt>Other ledger movements</dt><dd>{signed(data.other_ledger_change)}</dd></div>}<div><dt>Closing balance</dt><dd>{money(data.closing_balance)}</dd></div></dl><p className="trading-caption">{reconciles ? "These figures reconcile to your imported funds statement, allowing for displayed rounding." : "These imported movements do not fully explain the balance. Check report coverage and other ledger entries."}</p></details>}
  </section>;
}
