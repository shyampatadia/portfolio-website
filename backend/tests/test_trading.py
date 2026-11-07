"""Synthetic fixtures only: privacy boundaries, calculations, and sync integrity."""
from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
from cryptography.fernet import Fernet
from jose import jwt

from app.core import trading
from app.core.config import settings
from app.core.security import create_access_token


class Query:
    def __init__(self, store, table):
        self.store, self.table = store, table
        self.filters, self.ordering = [], []
        self.offset, self.count, self.action = 0, 1000, "select"

    def select(self, *args):
        return self

    def eq(self, key, value):
        self.filters.append(lambda r: r.get(key) == value)
        return self

    def gte(self, key, value):
        self.filters.append(lambda r: str(r.get(key, "")) >= value)
        return self

    def lt(self, key, value):
        self.filters.append(lambda r: str(r.get(key, "")) < value)
        return self

    def order(self, key, desc=False):
        self.ordering.append((key, desc))
        return self

    def limit(self, count):
        self.count = count
        return self

    def range(self, start, end):
        self.offset, self.count = start, end - start + 1
        return self

    def upsert(self, payload, on_conflict):
        self.action, self.payload, self.keys = "upsert", payload, on_conflict.split(",")
        return self

    def update(self, payload):
        self.action, self.payload = "update", payload
        return self

    def execute(self):
        rows = self.store.rows.setdefault(self.table, [])
        if self.action == "upsert":
            payloads = self.payload if isinstance(self.payload, list) else [self.payload]
            for new in payloads:
                if self.table == "trading_trades":
                    new = {**new, "trade_date": datetime.fromisoformat(new["traded_at"]).astimezone(trading.IST).date().isoformat()}
                existing = next((r for r in rows if all(r.get(k) == new[k] for k in self.keys)), None)
                if existing is None:
                    rows.append(new.copy())
                else:
                    existing.update(new)
            return SimpleNamespace(data=payloads)
        found = [r for r in rows if all(f(r) for f in self.filters)]
        if self.action == "update":
            for row in found:
                row.update(self.payload)
        for key, desc in reversed(self.ordering):
            found.sort(key=lambda r: r.get(key, ""), reverse=desc)
        return SimpleNamespace(data=found[self.offset:self.offset + self.count])


class Store:
    def __init__(self):
        self.rows = {}

    def table(self, name):
        return Query(self, name)


@pytest.fixture
def store(monkeypatch):
    store = Store()
    monkeypatch.setattr(trading, "supabase_admin", store)
    monkeypatch.setattr(settings, "KITE_API_KEY", "synthetic-key")
    monkeypatch.setattr(settings, "KITE_API_SECRET", "synthetic-secret")
    monkeypatch.setattr(settings, "KITE_REDIRECT_URL", "https://example.test/api/trading/callback")
    monkeypatch.setattr(settings, "TRADING_ENCRYPTION_KEY", Fernet.generate_key().decode())
    monkeypatch.setattr(settings, "TRADING_CRON_SECRET", "synthetic-scheduler-secret")
    return store


def test_auth_required_for_every_private_operation(client, store):
    for method, path in [("get", "/dashboard"), ("post", "/connect"),
                         ("post", "/sync"), ("delete", "/connection")]:
        response = getattr(client, method)("/api/trading" + path)
        assert response.status_code in (401, 403)
        assert response.headers["cache-control"] == "no-store, private"
    token = create_access_token({"sub": "someone-else@example.test"})
    assert client.get("/api/trading/dashboard", headers={"Authorization": f"Bearer {token}"}).status_code == 403


def test_setup_and_empty_states(client, auth_headers, store, monkeypatch):
    monkeypatch.setattr(settings, "KITE_API_KEY", None)
    assert client.get("/api/trading/dashboard", headers=auth_headers).json()["configured"] is False
    monkeypatch.setattr(settings, "KITE_API_KEY", "synthetic-key")
    response = client.get("/api/trading/dashboard", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["holdings"] == []
    assert response.json()["totals"] is None


def test_no_repository_static_access(client):
    for path in ("/static/backend/.env", "/static/.git/config", "/static/backend/app/core/config.py"):
        assert client.get(path).status_code == 404


def test_totals_include_t1_and_separate_margin():
    holdings, positions, totals = trading.normalize_portfolio([
        {"tradingsymbol": "SYNTHETIC", "exchange": "NSE", "quantity": 2,
         "t1_quantity": 1, "average_price": 10.1, "last_price": 12.2},
    ], {"net": [{"tradingsymbol": "TESTFUT", "exchange": "NFO", "product": "NRML",
                  "quantity": 0, "pnl": -25}]},
        {"equity": {"net": 500, "available": {"cash": 400}, "utilised": {"debits": 100}}})
    assert holdings[0].quantity == 3
    assert totals.invested == 30.3
    assert totals.holdings_value == 36.6
    assert totals.unrealized_pnl == 6.3
    assert totals.available_margin == 500
    assert totals.cash == 400
    assert totals.positions_pnl == -25
    assert trading.normalize_portfolio([], {}, {})[2].return_percent is None


def test_trade_timestamp_uses_ist():
    t = trading.normalize_trade({"trade_id": "1", "order_id": "2", "exchange": "NSE",
                                 "tradingsymbol": "SYNTHETIC", "transaction_type": "BUY",
                                 "quantity": 1, "average_price": 10, "fill_timestamp": "2026-01-02 09:30:00"})
    assert t.traded_at == "2026-01-02T09:30:00+05:30"


def state_from_login(url):
    redirect = parse_qs(urlparse(url).query)["redirect_params"][0]
    return parse_qs(redirect)["state"][0]


def test_callback_single_use_encryption_and_no_secret_response(client, auth_headers, store, monkeypatch):
    mock = AsyncMock(return_value={"access_token": "synthetic-access-token"})
    monkeypatch.setattr(trading, "kite_request", mock)
    login = client.post("/api/trading/connect", headers=auth_headers).json()
    state = state_from_login(login["url"])
    response = client.get("/api/trading/callback", params={"state": state, "request_token": "test-request"}, follow_redirects=False)
    assert response.status_code == 303
    assert response.headers["location"].endswith("#/trading")
    saved = store.rows["trading_connections"][0]["access_token_encrypted"]
    assert saved != "synthetic-access-token"
    assert Fernet(settings.TRADING_ENCRYPTION_KEY.encode()).decrypt(saved.encode()) == b"synthetic-access-token"
    assert client.get("/api/trading/callback", params={"state": state, "request_token": "test-request"}).status_code == 400
    dashboard = client.get("/api/trading/dashboard", headers=auth_headers)
    assert "access_token" not in dashboard.text
    assert "synthetic" not in dashboard.text
    assert mock.await_count == 1


def test_invalid_callback_and_state_cannot_authenticate_as_admin(client, auth_headers, store):
    state = state_from_login(client.post("/api/trading/connect", headers=auth_headers).json()["url"])
    assert client.get("/api/trading/callback", params={"state": "invalid", "request_token": "x"}).status_code == 400
    assert client.get("/api/trading/dashboard", headers={"Authorization": f"Bearer {state}"}).status_code == 401


def test_expired_callback_does_not_exchange_tokens(client, auth_headers, store, monkeypatch):
    state = state_from_login(client.post("/api/trading/connect", headers=auth_headers).json()["url"])
    payload = jwt.decode(state, settings.SECRET_KEY + ":kite-state", algorithms=["HS256"])
    payload["exp"] = 1
    expired = jwt.encode(payload, settings.SECRET_KEY + ":kite-state", algorithm="HS256")
    exchange = AsyncMock()
    monkeypatch.setattr(trading, "kite_request", exchange)
    assert client.get("/api/trading/callback", params={"state": expired, "request_token": "x"}).status_code == 400
    exchange.assert_not_awaited()
    assert store.rows["trading_connections"][0]["login_nonce_hash"]


def test_calendar_paginates_beyond_database_page_size_and_uses_ist(store):
    owner = settings.ADMIN_EMAIL
    store.rows["trading_connections"] = [{"owner_email": owner}]
    store.rows["trading_trades"] = [{
        "owner_email": owner, "trade_id": str(i), "order_id": "order",
        "exchange": "NSE", "symbol": "SYNTHETIC", "side": "BUY",
        "quantity": 1, "price": 10, "traded_at": "2026-01-02T00:00:00+00:00",
    } for i in range(1001)]
    result = trading.dashboard(owner, 2026)
    assert result.activity[0].date == "2026-01-02"
    assert result.activity[0].trade_count == 1001
    assert result.activity[0].buy_value == 10010
    assert len(result.trades) == 100


def test_scheduler_has_separate_auth(client, auth_headers, store, monkeypatch):
    mock = AsyncMock()
    monkeypatch.setattr(trading, "sync", mock)
    assert client.post("/api/trading/scheduled-sync").status_code == 401
    assert client.post("/api/trading/scheduled-sync", headers=auth_headers).status_code == 401
    monkeypatch.setattr(settings, "TRADING_CRON_SECRET", None)
    assert client.post("/api/trading/scheduled-sync", headers={"Authorization": "Bearer None"}).status_code == 401
    monkeypatch.setattr(settings, "TRADING_CRON_SECRET", "synthetic-scheduler-secret")
    assert client.post("/api/trading/scheduled-sync", headers={"Authorization": "Bearer synthetic-scheduler-secret"}).status_code == 200
    mock.assert_awaited_once_with(settings.ADMIN_EMAIL)


@pytest.mark.asyncio
async def test_repeat_sync_deduplicates_and_dashboard_is_owner_scoped(store, monkeypatch):
    owner = settings.ADMIN_EMAIL
    encrypted = Fernet(settings.TRADING_ENCRYPTION_KEY.encode()).encrypt(b"synthetic-token").decode()
    store.rows["trading_connections"] = [{"owner_email": owner, "access_token_encrypted": encrypted}]
    now = datetime.now(trading.IST)
    fill = {"trade_id": "1", "order_id": "2", "exchange": "NSE", "tradingsymbol": "SYNTHETIC",
            "transaction_type": "BUY", "quantity": 2, "average_price": 10,
            "fill_timestamp": now.strftime("%Y-%m-%d %H:%M:%S")}

    async def fake_kite(client, path, token):
        return {"/portfolio/holdings": [], "/portfolio/positions": {"net": []},
                "/user/margins": {}, "/trades": [fill]}[path]

    monkeypatch.setattr(trading, "kite_request", fake_kite)
    await trading.sync(owner)
    trading.update_connection(owner, {"synced_at": None})
    await trading.sync(owner)
    assert len(store.rows["trading_trades"]) == 1
    assert len(store.rows["trading_days"]) == 1
    store.rows["trading_trades"].append({"owner_email": "other@example.test", "trade_id": "other"})
    result = trading.dashboard(owner, now.year)
    assert result.activity[0].trade_count == 1
    assert result.activity[0].buy_value == 20
    assert len(result.trades) == 1


@pytest.mark.asyncio
async def test_expired_broker_session_preserves_history(store, monkeypatch):
    from fastapi import HTTPException
    owner = settings.ADMIN_EMAIL
    store.rows["trading_connections"] = [{"owner_email": owner, "access_token_encrypted":
        Fernet(settings.TRADING_ENCRYPTION_KEY.encode()).encrypt(b"synthetic").decode()}]
    monkeypatch.setattr(trading, "kite_request", AsyncMock(side_effect=HTTPException(409, "expired")))
    with pytest.raises(HTTPException) as error:
        await trading.sync(owner)
    assert error.value.status_code == 409
    assert trading.connection(owner)["needs_reconnect"] is True
    assert trading.connection(owner)["access_token_encrypted"] is None


@pytest.mark.asyncio
async def test_kite_error_redacted_and_transport_uses_only_read_endpoints():
    def handler(request):
        assert request.method == "GET"
        assert request.url.path == "/trades"
        return httpx.Response(500, json={"status": "error", "message": "private account detail"})
    from fastapi import HTTPException
    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        with pytest.raises(HTTPException) as error:
            await trading.kite_request(client, "/trades", "synthetic")
    assert "private account detail" not in error.value.detail
