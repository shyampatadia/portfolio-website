"""Historical facts from saved fills and broker ledger, with Decimal arithmetic."""
from collections import defaultdict
from datetime import datetime
from decimal import Decimal

from app.core import trading
from app.schemas.trading import HistoryDashboard, PerformanceDay, LedgerEntry, Trade, TradePage


def amount(value):
    return Decimal(str(value or 0))


def trade_day(t):
    return datetime.fromisoformat(t["traded_at"].replace("Z", "+00:00")).astimezone(trading.IST).date().isoformat()


def read_ledger(owner, year):
    rows, offset = [], 0
    while True:
        batch = trading.execute(trading.supabase_admin.table("trading_ledger").select("*")
            .eq("owner_email", owner).gte("posting_date", f"{year}-01-01")
            .lt("posting_date", f"{year+1}-01-01").order("posting_date")
            .order("source_sequence").order("entry_id").range(offset, offset+499))
        rows.extend(batch)
        if len(batch) < 500:
            return rows
        offset += 500


def history(owner, year):
    trades = trading.read_trades(owner, year)
    ledger = read_ledger(owner, year)
    imports = trading.execute(trading.supabase_admin.table("trading_imports")
        .select("kind,row_count,date_from,date_to,imported_at").eq("owner_email", owner)
        .order("imported_at", desc=True).limit(500))
    years = {datetime.now(trading.IST).year, year}
    for r in imports:
        years.update(range(int(r["date_from"][:4]), int(r["date_to"][:4])+1))
    return calculate_history(trades, ledger, year, sorted(years, reverse=True), imports)


def calculate_history(trades, ledger, year, years=None, imports=None):
    result = HistoryDashboard(year=year, available_years=years or [year], imports=imports or [])
    daily, contracts = {}, defaultdict(lambda: {"units": 0, "cashflow": Decimal(0), "fills": 0})
    for t in trades:
        day = trade_day(t)
        d = daily.setdefault(day, PerformanceDay(date=day))
        d.fills += 1
        cash = amount(t["price"]) * t["quantity"]
        field = "buy_value" if t["side"] == "BUY" else "sell_value"
        setattr(d, field, trading.money(amount(getattr(d, field)) + cash))
        if t.get("segment") == "FO" or t["exchange"] in ("NFO", "BFO"):
            contract = contracts[(day, t["exchange"], t["symbol"])]
            contract["units"] += t["quantity"] * (1 if t["side"] == "BUY" else -1)
            contract["cashflow"] += cash * (-1 if t["side"] == "BUY" else 1)
            contract["fills"] += 1
    day_contracts, symbols = defaultdict(list), {}
    for (day, exchange, symbol), c in contracts.items():
        day_contracts[day].append(c)
        if c["units"] == 0:
            key = (exchange, symbol)
            s = symbols.setdefault(key, {"exchange": exchange, "symbol": symbol, "fills": 0, "gross_pnl": Decimal(0)})
            s["fills"] += c["fills"]
            s["gross_pnl"] += c["cashflow"]
    for day, groups in day_contracts.items():
        if all(c["units"] == 0 for c in groups):
            daily[day].gross_pnl = trading.money(sum(c["cashflow"] for c in groups))
        else:
            result.incomplete_days += 1

    deposits = withdrawals = other = Decimal(0)
    settlements = defaultdict(Decimal)
    for e in ledger:
        d = daily.setdefault(e["posting_date"], PerformanceDay(date=e["posting_date"]))
        change = amount(e["credit"]) - amount(e["debit"])
        if e["category"] == "deposit":
            deposits += change
        elif e["category"] == "withdrawal":
            withdrawals -= change
        elif e["category"] == "fo_settlement":
            settlements[e["posting_date"]] += change
        else:
            other += change
        d.ledger_balance = trading.money(e["balance"])
    for day, value in settlements.items():
        daily[day].net_settlement = trading.money(value)
    result.daily = sorted(daily.values(), key=lambda d: d.date)
    result.fill_count = len(trades)
    result.active_days = sum(d.fills > 0 for d in result.daily)
    if ledger:
        result.deposits, result.withdrawals = trading.money(deposits), trading.money(withdrawals)
        result.net_funding, result.other_ledger_change = trading.money(deposits-withdrawals), trading.money(other)
        first, last = ledger[0], ledger[-1]
        result.opening_balance = trading.money(amount(first["balance"]) - amount(first["credit"]) + amount(first["debit"]))
        result.closing_balance = trading.money(last["balance"])
        result.ledger_as_of = last["posting_date"]
        result.ledger = [LedgerEntry(**e) for e in reversed(ledger)]
    if daily:
        result.date_from, result.date_to = result.daily[0].date, result.daily[-1].date
    net = gross = peak = drawdown = Decimal(0)
    gross_days = net_days = matched = 0
    matched_difference = Decimal(0)
    monthly = {}
    for d in result.daily:
        if d.gross_pnl is not None:
            gross += amount(d.gross_pnl)
            d.cumulative_gross = trading.money(gross)
            gross_days += 1
        if d.net_settlement is not None:
            net += settlements[d.date]
            d.cumulative_net = trading.money(net)
            net_days += 1
            peak = max(peak, net)
            drawdown = max(drawdown, peak-net)
            result.winning_days += d.net_settlement > 0
            result.losing_days += d.net_settlement < 0
            result.flat_days += d.net_settlement == 0
        if d.gross_pnl is not None and d.net_settlement is not None:
            difference = amount(d.gross_pnl) - settlements[d.date]
            d.costs_and_adjustments = trading.money(difference)
            matched_difference += difference
            matched += 1
        month = monthly.setdefault(d.date[:7], {"month": d.date[:7], "fills": 0, "gross_pnl": None, "net_settlement": None})
        month["fills"] += d.fills
        for field in ("gross_pnl", "net_settlement"):
            value = getattr(d, field)
            if value is not None:
                month[field] = amount(month[field]) + (settlements[d.date] if field == "net_settlement" else amount(value))
    result.gross_pnl = trading.money(gross) if gross_days else None
    result.net_settlements = trading.money(net) if net_days else None
    result.max_drawdown = trading.money(drawdown) if net_days else None
    result.costs_and_adjustments = trading.money(matched_difference) if matched else None
    result.monthly = [{**m, **{f: trading.money(m[f]) if m[f] is not None else None
                             for f in ("gross_pnl", "net_settlement")}}
                      for m in sorted(monthly.values(), key=lambda m: m["month"])]
    result.instruments = [{**s, "gross_pnl": trading.money(s["gross_pnl"])}
                          for s in sorted(symbols.values(), key=lambda s: abs(s["gross_pnl"]), reverse=True)]
    return result


def trade_page(owner, year, page, page_size, day=None, symbol=None, side=None):
    rows = trading.read_trades(owner, year)
    if day:
        rows = [t for t in rows if trade_day(t) == day]
    if symbol:
        rows = [t for t in rows if symbol.upper() in t["symbol"].upper()]
    if side:
        rows = [t for t in rows if t["side"] == side]
    start = (page-1)*page_size
    return TradePage(rows=[Trade(**t) for t in rows[start:start+page_size]], total=len(rows), page=page, page_size=page_size)
