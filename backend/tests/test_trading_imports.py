"""Only synthetic records are used here; the real reports stay outside Git."""
import csv
import io
from unittest.mock import Mock
from types import SimpleNamespace

import pytest

from app.core import trading, trading_imports, trading_history
from app.core.config import settings


def csv_bytes(header, rows):
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow(header)
    writer.writerows(rows)
    return output.getvalue().encode("utf-8-sig")


def trade_csv(rows=None):
    return csv_bytes(["symbol","trade_date","exchange","segment","trade_type","quantity","price","trade_id","order_id","order_execution_time"], rows or [
        ["SYNTHETICCE","2026-01-02","NSE","FO","buy","2.000000","10.500000","1","external-order","2026-01-02T09:30:00"],
        ["SYNTHETICCE","2026-01-02","NSE","FO","sell","2.000000","15.000000","2","external-order-2","2026-01-02T10:30:00"],
    ])


def ledger_csv():
    return csv_bytes(["particulars","posting_date","cost_center","voucher_type","debit","credit","net_balance"], [
        ["Opening Balance","","","","","","0.000001"],
        ["Funds added","2026-01-02","NSE-EQ","Bank Receipts","0","1000","1000.000001"],
        ["Net obligation for Equity F&O","2026-01-02","NSE-FO","Book Voucher","0","7.123456","1007.123457"],
        ["Quarterly settlement","2026-01-02","NSE-EQ","Bank Payments","100","0","907.123457"],
        ["Closing Balance","","","","","","907.123457"],
    ])


def test_parse_console_tradebook_maps_exchange_preserves_time_and_ids():
    report = trading_imports.parse_report(trade_csv())
    assert report["kind"] == "tradebook"
    assert report["row_count"] == 2
    assert report["trades"][0]["exchange"] == "NFO"
    assert report["trades"][0]["quantity"] == 2
    assert report["trades"][0]["traded_at"].endswith("+05:30")
    assert "trades" not in trading_imports.preview(report)


def test_trade_id_can_repeat_on_different_dates():
    row = ["SYNTHETICCE","2026-01-02","BSE","FO","buy","1","10","same-id","order","2026-01-02T09:30:00"]
    next_day = [*row]
    next_day[1], next_day[-1] = "2026-01-03", "2026-01-03T09:30:00"
    report = trading_imports.parse_report(trade_csv([row, next_day]))
    assert report["row_count"] == 2
    assert report["trades"][0]["exchange"] == "BFO"


def test_bad_or_conflicting_rows_reject_whole_file():
    row = ["SYNTHETICCE","2026-01-02","NSE","FO","buy","1","10","1","order","2026-01-02T09:30:00"]
    conflict = [*row]
    conflict[6] = "20"
    with pytest.raises(ValueError, match="Conflicting duplicate"):
        trading_imports.parse_report(trade_csv([row, conflict]))
    fractional = [*row]
    fractional[5] = "1.5"
    with pytest.raises(ValueError, match="whole number"):
        trading_imports.parse_report(trade_csv([fractional]))
    row[6] = "NaN"
    with pytest.raises(ValueError, match="price"):
        trading_imports.parse_report(trade_csv([row]))


def test_ledger_reconciles_to_six_decimals_and_classifies_funding():
    report = trading_imports.parse_report(ledger_csv())
    assert report["row_count"] == 3
    assert report["opening_balance"] == "0.000001"
    assert report["closing_balance"] == "907.123457"
    assert [e["category"] for e in report["ledger"]] == ["deposit","fo_settlement","withdrawal"]
    assert len({e["entry_id"] for e in report["ledger"]}) == 3
    corrupted = ledger_csv().replace(b"907.123457", b"900.123457")
    with pytest.raises(ValueError, match="reconcile"):
        trading_imports.parse_report(corrupted)


def test_repeated_file_has_stable_digest_and_entry_ids():
    first = trading_imports.parse_report(ledger_csv())
    second = trading_imports.parse_report(ledger_csv())
    assert first == second
    for raw in (b"", b"hello,world\n1,2", b"\0binary", b"a"*(trading_imports.MAX_UPLOAD_BYTES+1)):
        with pytest.raises(ValueError):
            trading_imports.parse_report(raw)


def test_performance_excludes_transfers_and_matches_ledger():
    fills = trading_imports.parse_report(trade_csv())["trades"]
    ledger = trading_imports.parse_report(ledger_csv())["ledger"]
    result = trading_history.calculate_history(fills, ledger, 2026)
    assert result.fill_count == 2
    assert result.gross_pnl == 9
    assert result.net_settlements == 7.12
    assert result.deposits == 1000
    assert result.withdrawals == 100
    assert result.net_funding == 900
    assert result.costs_and_adjustments == 1.88
    assert result.closing_balance == 907.12
    assert result.winning_days == 1
    assert result.daily[0].cumulative_net == 7.12
    assert result.monthly[0]["net_settlement"] == 7.12


def test_unmatched_positions_do_not_invent_realized_pnl():
    fills = trading_imports.parse_report(trade_csv())["trades"][:1]
    result = trading_history.calculate_history(fills, [], 2026)
    assert result.gross_pnl is None
    assert result.net_settlements is None
    assert result.incomplete_days == 1
    assert result.costs_and_adjustments is None
    assert result.deposits is None
    assert result.net_funding is None


def test_net_drawdown_ignores_deposits_and_respects_date_order():
    ledger = []
    for i, value in enumerate([100, -250, 50]):
        ledger.append({"entry_id": str(i), "posting_date": f"2026-01-0{i+2}",
                       "particulars": "Synthetic F&O settlement", "category": "fo_settlement",
                       "debit": max(0, -value), "credit": max(0, value), "balance": 1000+value})
    result = trading_history.calculate_history([], ledger, 2026)
    assert result.net_settlements == -100
    assert result.max_drawdown == 250
    assert (result.winning_days, result.losing_days) == (2, 1)


def test_import_and_history_endpoints_require_owner_auth(client):
    for path in ("/api/trading/imports", "/api/trading/imports/preview"):
        assert client.post(path, files={"file": ("synthetic.csv", trade_csv(), "text/csv")}).status_code in (401, 403)
    for path in ("/api/trading/history?year=2026", "/api/trading/trades?year=2026"):
        assert client.get(path).status_code in (401, 403)


def test_preview_does_not_write_and_commit_hash_must_match(client, auth_headers, monkeypatch):
    db = Mock()
    monkeypatch.setattr(trading, "supabase_admin", db)
    response = client.post("/api/trading/imports/preview", headers=auth_headers,
        files={"file": ("synthetic.csv", trade_csv(), "text/csv")})
    assert response.status_code == 200
    assert response.json()["row_count"] == 2
    assert response.headers["cache-control"] == "no-store, private"
    db.rpc.assert_not_called()
    response = client.post("/api/trading/imports", headers=auth_headers,
        files={"file": ("synthetic.csv", trade_csv(), "text/csv")}, data={"expected_hash": "wrong"})
    assert response.status_code == 409
    db.rpc.assert_not_called()


def test_commit_uses_transaction_rpc_with_server_owner(client, auth_headers, monkeypatch):
    db = Mock()
    db.rpc.return_value.execute.return_value = SimpleNamespace(data={"already_imported":False,"new_trades":2,"new_ledger_entries":0})
    monkeypatch.setattr(trading, "supabase_admin", db)
    digest = trading_imports.parse_report(trade_csv())["file_hash"]
    response = client.post("/api/trading/imports", headers=auth_headers,
        files={"file": ("synthetic.csv", trade_csv(), "text/csv")}, data={"expected_hash":digest})
    assert response.status_code == 200
    assert response.json()["new_trades"] == 2
    assert db.rpc.call_args.args[0] == "import_trading_report"
    assert db.rpc.call_args.args[1]["p_owner"] == settings.ADMIN_EMAIL
