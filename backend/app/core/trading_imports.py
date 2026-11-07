"""Parse Console CSVs in memory. Never write reports or account rows to disk."""
import csv
import hashlib
import io
import json
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

from fastapi import HTTPException
from postgrest.exceptions import APIError
import httpx

from app.core import trading

MAX_UPLOAD_BYTES = 5 * 1024 * 1024


def decimal_value(value, field):
    try:
        number = Decimal(str(value).strip())
        if not number.is_finite() or abs(number) >= Decimal("1e16"):
            raise InvalidOperation
        return number
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError(f"Invalid {field}.")


def report_date(value):
    parsed = date.fromisoformat(value.strip())
    if not 2000 <= parsed.year <= 2100:
        raise ValueError("Date is outside the supported range.")
    return parsed.isoformat()


def parse_report(raw):
    if not raw or len(raw) > MAX_UPLOAD_BYTES:
        raise ValueError("Choose a nonempty Console CSV smaller than 5 MB.")
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise ValueError("Save the report as a UTF-8 CSV and try again.")
    if "\x00" in text:
        raise ValueError("This is not a text CSV file.")
    reader = csv.DictReader(io.StringIO(text, newline=""))
    fields = set(reader.fieldnames or [])
    rows = []
    for line, row in enumerate(reader, 2):
        if not any(row.values()):
            continue
        if None in row or any(v is None for v in row.values()):
            raise ValueError(f"Malformed CSV at line {line}.")
        rows.append(row)
    if not rows or len(rows) > 30000:
        raise ValueError("Choose a report containing between 1 and 30,000 rows.")
    result = {"file_hash": hashlib.sha256(raw).hexdigest(), "trades": [], "ledger": []}
    try:
        if {"symbol", "trade_date", "exchange", "segment", "trade_type", "quantity", "price", "trade_id", "order_id", "order_execution_time"} <= fields:
            result.update(parse_tradebook(rows))
        elif {"particulars", "posting_date", "cost_center", "voucher_type", "debit", "credit", "net_balance"} <= fields:
            result.update(parse_ledger(rows))
        else:
            raise ValueError("Expected an original Zerodha Console tradebook or funds-statement CSV.")
    except (KeyError, TypeError, InvalidOperation) as exc:
        raise ValueError("A required report value is missing or invalid.") from exc
    return result


def parse_tradebook(rows):
    trades, seen = [], {}
    for line, row in enumerate(rows, 2):
        try:
            day = report_date(row["trade_date"])
            timestamp = datetime.fromisoformat(row["order_execution_time"].strip())
            if timestamp.tzinfo is None:
                timestamp = timestamp.replace(tzinfo=trading.IST)
            if timestamp.astimezone(trading.IST).date().isoformat() != day:
                raise ValueError("Trade date and execution time disagree.")
            units = decimal_value(row["quantity"], "quantity")
            if units <= 0 or units != units.to_integral_value() or units > 2147483647:
                raise ValueError("Quantity must be a positive whole number.")
            price = decimal_value(row["price"], "price")
            if price < 0:
                raise ValueError("Price cannot be negative.")
            exchange, segment = row["exchange"].strip().upper(), row["segment"].strip().upper()
            if segment in ("FO", "F&O", "NFO", "BFO"):
                segment = "FO"
                exchange = {"NSE": "NFO", "BSE": "BFO"}.get(exchange, exchange)
            if exchange not in ("NSE", "BSE", "NFO", "BFO", "MCX", "CDS", "BCD"):
                raise ValueError("Unsupported exchange.")
            side = row["trade_type"].strip().upper()
            if side not in ("BUY", "SELL"):
                raise ValueError("Trade type must be buy or sell.")
            t = {"trade_id": row["trade_id"].strip(), "order_id": row["order_id"].strip(),
                 "symbol": row["symbol"].strip(), "exchange": exchange, "segment": segment,
                 "side": side, "quantity": int(units), "price": str(price),
                 "traded_at": timestamp.isoformat()}
            if not all(t[k] and len(t[k]) <= 150 for k in ("trade_id", "order_id", "symbol")):
                raise ValueError("Trade identifiers are missing or too long.")
            key = (day, exchange, t["trade_id"])
            if key in seen:
                if seen[key] != t:
                    raise ValueError("Conflicting duplicate trade ID within this report.")
                continue
            seen[key] = t
            trades.append(t)
        except ValueError as exc:
            raise ValueError(f"Tradebook line {line}: {exc}") from exc
    dates = [t["traded_at"][:10] for t in trades]
    return {"kind": "tradebook", "row_count": len(trades), "date_from": min(dates),
            "date_to": max(dates), "trades": trades}


def ledger_category(row):
    voucher = row["voucher_type"].strip().lower()
    text = row["particulars"].lower()
    if voucher == "bank receipts":
        return "deposit"
    if voucher == "bank payments":
        return "withdrawal"
    if "obligation" in text and any(s in text for s in ("f&o", "futures", "derivative")):
        return "fo_settlement"
    return "other"


def parse_ledger(rows):
    opening = [r for r in rows if r["particulars"].strip().lower() == "opening balance"]
    closing = [r for r in rows if r["particulars"].strip().lower() == "closing balance"]
    if len(opening) != 1 or len(closing) != 1:
        raise ValueError("Ledger must contain one opening balance and one closing balance.")
    opening_balance = decimal_value(opening[0]["net_balance"], "opening balance")
    closing_balance = decimal_value(closing[0]["net_balance"], "closing balance")
    previous, entries, occurrences, day_sequences = opening_balance, [], {}, {}
    for line, row in enumerate(rows, 2):
        if row["particulars"].strip().lower() in ("opening balance", "closing balance"):
            continue
        try:
            day = report_date(row["posting_date"])
            debit, credit = (decimal_value(row[k], k) for k in ("debit", "credit"))
            balance = decimal_value(row["net_balance"], "balance")
            if debit < 0 or credit < 0 or (debit > 0 and credit > 0):
                raise ValueError("Expected one nonnegative debit or credit per movement.")
            if abs(previous + credit - debit - balance) > Decimal("0.000002"):
                raise ValueError("Running balance does not reconcile; export the complete chronological ledger.")
            if entries and day < entries[-1]["posting_date"]:
                raise ValueError("Export the ledger in chronological order.")
            previous = balance
            day_sequences[day] = day_sequences.get(day, 0) + 1
            entry = {"posting_date": day, "particulars": row["particulars"].strip(),
                     "cost_center": row["cost_center"].strip(), "voucher_type": row["voucher_type"].strip(),
                     "category": ledger_category(row), "debit": str(debit), "credit": str(credit),
                     "balance": str(balance), "source_sequence": day_sequences[day]}
            identity = {k: str(Decimal(entry[k]).normalize()) if k in ("debit", "credit", "balance") else entry[k]
                        for k in entry if k != "source_sequence"}
            canonical = json.dumps(identity, sort_keys=True, separators=(",", ":"))
            occurrences[canonical] = occurrences.get(canonical, 0) + 1
            entry["entry_id"] = hashlib.sha256(f"{canonical}:{occurrences[canonical]}".encode()).hexdigest()
            entries.append(entry)
        except ValueError as exc:
            raise ValueError(f"Ledger line {line}: {exc}") from exc
    if not entries or abs(previous - closing_balance) > Decimal("0.000002"):
        raise ValueError("Ledger closing balance does not reconcile.")
    return {"kind": "ledger", "row_count": len(entries), "date_from": entries[0]["posting_date"],
            "date_to": entries[-1]["posting_date"], "opening_balance": str(opening_balance),
            "closing_balance": str(closing_balance), "ledger": entries}


def preview(report):
    return {k: v for k, v in report.items() if k not in ("trades", "ledger")}


def import_report(owner, report):
    try:
        response = trading.supabase_admin.rpc("import_trading_report", {
            "p_owner": owner, "p_report": report,
        }).execute()
    except APIError as exc:
        if "conflicts with an existing trade" in str(exc):
            raise HTTPException(409, "This report conflicts with an existing trade. No records were changed.")
        raise HTTPException(503, "History import is unavailable. Apply the 20261107 trading history migration, then retry.")
    except httpx.HTTPError:
        raise HTTPException(503, "Could not reach private trading storage. Retry the same report safely.")
    return {**preview(report), **response.data}
