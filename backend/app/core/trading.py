"""Private Kite reads and service-role persistence. No order-writing methods."""
import asyncio
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from urllib.parse import urlencode

import httpx
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException
from jose import JWTError, jwt
from postgrest.exceptions import APIError

from app.core.config import settings
from app.core.supabase import supabase_admin
from app.schemas.trading import Holding, Position, Totals, Trade, TradingDashboard, TradingDay

IST = timezone(timedelta(hours=5, minutes=30))
KITE_ROOT = "https://api.kite.trade"


def configured():
    return all((settings.KITE_API_KEY, settings.KITE_API_SECRET,
                settings.KITE_REDIRECT_URL, settings.TRADING_ENCRYPTION_KEY))


def require_config():
    if not configured():
        raise HTTPException(503, "Trading connection setup is incomplete. Follow backend/TRADING.md.")
    try:
        return Fernet(settings.TRADING_ENCRYPTION_KEY.encode())
    except (ValueError, TypeError):
        raise HTTPException(503, "The trading encryption key needs to be configured on the server.")


def execute(query):
    try:
        return query.execute().data or []
    except (APIError, httpx.HTTPError):
        raise HTTPException(503, "Trading storage is unavailable. Check the migration and server configuration.")


def connection(owner):
    rows = execute(supabase_admin.table("trading_connections").select("*")
                   .eq("owner_email", owner).limit(1))
    return rows[0] if rows else None


def update_connection(owner, values):
    execute(supabase_admin.table("trading_connections").update(values).eq("owner_email", owner))


async def kite_request(client, path, token=None, data=None):
    headers = {"X-Kite-Version": "3"}
    if token:
        headers["Authorization"] = f"token {settings.KITE_API_KEY}:{token}"
    try:
        response = await client.request("POST" if data else "GET", f"{KITE_ROOT}{path}",
                                        headers=headers, data=data)
        payload = response.json()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, "Kite is unavailable. Your saved records are still available.")
    if response.status_code in (401, 403) or payload.get("error_type") == "TokenException":
        # Use 409 so the frontend does not confuse a Kite expiry with admin expiry.
        raise HTTPException(409, "Your Kite session expired. Reconnect to continue syncing.")
    if response.status_code == 429:
        raise HTTPException(429, "Kite's request limit was reached. Try again in a minute.")
    if response.is_error or payload.get("status") != "success":
        raise HTTPException(502, "Kite could not complete the read. Try again later.")
    return payload["data"]


def begin_login(owner):
    require_config()
    nonce = secrets.token_urlsafe(32)
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    execute(supabase_admin.table("trading_connections").upsert({
        "owner_email": owner,
        "login_nonce_hash": hashlib.sha256(nonce.encode()).hexdigest(),
        "login_expires_at": expires.isoformat(),
    }, on_conflict="owner_email"))
    state = jwt.encode({"sub": owner, "nonce": nonce, "exp": expires},
                       settings.SECRET_KEY + ":kite-state", algorithm="HS256")
    params = urlencode({"v": "3", "api_key": settings.KITE_API_KEY,
                        "redirect_params": urlencode({"state": state})})
    return "https://kite.zerodha.com/connect/login?" + params


async def finish_login(request_token, state):
    cipher = require_config()
    try:
        payload = jwt.decode(state, settings.SECRET_KEY + ":kite-state", algorithms=["HS256"])
        owner, nonce = payload["sub"], payload["nonce"]
        if owner != settings.ADMIN_EMAIL:
            raise ValueError("wrong owner")
    except (JWTError, KeyError, ValueError):
        raise HTTPException(400, "This connection link expired. Start again from Trading.")

    # Compare-and-clear makes the callback single-use across server instances.
    used = execute(supabase_admin.table("trading_connections")
                   .update({"login_nonce_hash": None, "login_expires_at": None})
                   .eq("owner_email", owner)
                   .eq("login_nonce_hash", hashlib.sha256(nonce.encode()).hexdigest()))
    if not used:
        raise HTTPException(400, "This connection link was already used. Start again from Trading.")
    checksum = hashlib.sha256(
        f"{settings.KITE_API_KEY}{request_token}{settings.KITE_API_SECRET}".encode()
    ).hexdigest()
    async with httpx.AsyncClient(timeout=20) as client:
        session = await kite_request(client, "/session/token", data={
            "api_key": settings.KITE_API_KEY, "request_token": request_token, "checksum": checksum,
        })
    update_connection(owner, {
        "access_token_encrypted": cipher.encrypt(session["access_token"].encode()).decode(),
        "connected_at": datetime.now(timezone.utc).isoformat(), "needs_reconnect": False,
    })


def money(value):
    return float(Decimal(str(value or 0)).quantize(Decimal("0.01")))


def normalize_portfolio(raw_holdings, raw_positions, margins):
    holdings = []
    for row in raw_holdings:
        quantity = int(row.get("quantity", 0)) + int(row.get("t1_quantity", 0))
        if quantity <= 0:
            continue
        average = Decimal(str(row.get("average_price") or 0))
        price = Decimal(str(row.get("last_price") or 0))
        cost, value = average * quantity, price * quantity
        holdings.append(Holding(symbol=row["tradingsymbol"], exchange=row["exchange"],
                                quantity=quantity, average_price=money(average),
                                last_price=money(price), invested=money(cost),
                                value=money(value), pnl=money(value - cost)))
    positions = [Position(symbol=row["tradingsymbol"], exchange=row["exchange"],
                          product=row["product"], quantity=row["quantity"], pnl=money(row.get("pnl")))
                 for row in raw_positions.get("net", [])]
    invested = sum(Decimal(str(h.invested)) for h in holdings)
    value = sum(Decimal(str(h.value)) for h in holdings)
    equity = margins.get("equity", {})
    totals = Totals(invested=money(invested), holdings_value=money(value),
                    unrealized_pnl=money(value - invested),
                    return_percent=money((value - invested) / invested * 100) if invested else None,
                    available_margin=money(equity.get("net")),
                    cash=money(equity.get("available", {}).get("cash")),
                    used_margin=money(equity.get("utilised", {}).get("debits")),
                    positions_pnl=money(sum(p.pnl for p in positions)))
    return sorted(holdings, key=lambda h: h.value, reverse=True), positions, totals


def normalize_trade(row):
    # Kite exchange timestamps are Indian Standard Time, without an offset.
    timestamp = datetime.fromisoformat(row["fill_timestamp"])
    if timestamp.tzinfo is None:
        timestamp = timestamp.replace(tzinfo=IST)
    return Trade(trade_id=str(row["trade_id"]), order_id=str(row["order_id"]),
                 exchange=row["exchange"], symbol=row["tradingsymbol"],
                 side=row["transaction_type"], quantity=row["quantity"],
                 price=money(row["average_price"]), traded_at=timestamp.isoformat(),
                 segment="FO" if row["exchange"] in ("NFO", "BFO") else "EQ")


async def sync(owner):
    cipher = require_config()
    row = connection(owner)
    if not row or not row.get("access_token_encrypted") or row.get("needs_reconnect"):
        raise HTTPException(409, "Connect your Kite account before syncing.")
    now = datetime.now(timezone.utc)
    if row.get("synced_at"):
        last = datetime.fromisoformat(row["synced_at"].replace("Z", "+00:00"))
        if now - last < timedelta(seconds=55):
            return
    try:
        token = cipher.decrypt(row["access_token_encrypted"].encode()).decode()
    except InvalidToken:
        raise HTTPException(503, "The saved session cannot be decrypted. Check the encryption key, then reconnect.")
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            raw_holdings, raw_positions, margins, raw_trades = await asyncio.gather(
                kite_request(client, "/portfolio/holdings", token),
                kite_request(client, "/portfolio/positions", token),
                kite_request(client, "/user/margins", token),
                kite_request(client, "/trades", token),
            )
    except HTTPException as exc:
        if exc.status_code == 409:
            update_connection(owner, {"needs_reconnect": True, "access_token_encrypted": None})
        raise
    holdings, positions, totals = normalize_portfolio(raw_holdings, raw_positions, margins)
    trades = [{"owner_email": owner, **normalize_trade(t).model_dump()} for t in raw_trades]
    # Fills are deduplicated by their exchange ID on every sync, not by order.
    if trades:
        execute(supabase_admin.table("trading_trades").upsert(
            trades, on_conflict="owner_email,exchange,trade_date,trade_id"))
    execute(supabase_admin.table("trading_days").upsert({
        "owner_email": owner, "date": now.astimezone(IST).date().isoformat(),
        "captured_at": now.isoformat(), "totals": totals.model_dump(),
        "holdings": [h.model_dump() for h in holdings],
        "positions": [p.model_dump() for p in positions],
    }, on_conflict="owner_email,date"))
    update_connection(owner, {"synced_at": now.isoformat()})


def dashboard(owner, year):
    row = connection(owner)
    result = TradingDashboard(configured=configured())
    if not row:
        return result
    result.connected = bool(row.get("access_token_encrypted")) and not row.get("needs_reconnect", False)
    result.needs_reconnect = row.get("needs_reconnect", False)
    result.synced_at = row.get("synced_at")
    latest = execute(supabase_admin.table("trading_days")
                     .select("totals,holdings,positions").eq("owner_email", owner)
                     .order("date", desc=True).limit(1))
    if latest:
        result.totals = Totals(**latest[0]["totals"])
        result.holdings = [Holding(**h) for h in latest[0]["holdings"]]
        result.positions = [Position(**p) for p in latest[0]["positions"]]
    days = execute(supabase_admin.table("trading_days")
                   .select("date,captured_at,totals").eq("owner_email", owner)
                   .gte("date", f"{year}-01-01").lt("date", f"{year + 1}-01-01")
                   .order("date").limit(366))
    activity = {d["date"]: TradingDay(date=d["date"], trade_count=0, buy_value=0, sell_value=0,
                                     holdings_value=d["totals"]["holdings_value"],
                                     invested=d["totals"]["invested"], captured_at=d["captured_at"])
                for d in days}
    all_trades = read_trades(owner, year)
    for t in all_trades:
        day = datetime.fromisoformat(t["traded_at"].replace("Z", "+00:00")).astimezone(IST).date().isoformat()
        entry = activity.setdefault(day, TradingDay(date=day, trade_count=0, buy_value=0, sell_value=0))
        entry.trade_count += 1
        field = "buy_value" if t["side"] == "BUY" else "sell_value"
        setattr(entry, field, money(Decimal(str(getattr(entry, field))) +
                                    Decimal(str(t["price"])) * t["quantity"]))
    result.activity = sorted(activity.values(), key=lambda d: d.date)
    result.trades = [Trade(**t) for t in all_trades[:100]]
    return result


def read_trades(owner, year):
    # PostgREST defaults to 1000 rows. Page explicitly so active days aren't lost.
    all_trades = []
    offset = 0
    while True:
        batch = execute(supabase_admin.table("trading_trades")
                        .select("trade_id,order_id,exchange,symbol,side,quantity,price,traded_at,segment,source")
                        .eq("owner_email", owner)
                        .gte("traded_at", f"{year}-01-01T00:00:00+05:30")
                        .lt("traded_at", f"{year + 1}-01-01T00:00:00+05:30")
                        .order("traded_at", desc=True).order("exchange").order("trade_id")
                        .range(offset, offset + 499))
        all_trades.extend(batch)
        if len(batch) < 500:
            break
        offset += 500
    return all_trades
