"""All portfolio reads are admin-only; only the signed Kite callback is public."""
import secrets
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query, UploadFile, File, Form
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from starlette.concurrency import run_in_threadpool
from typing import Literal
from datetime import date

from app.core import trading
from app.core import trading_history, trading_imports
from app.core.config import settings
from app.core.security import get_current_user
from app.schemas.trading import TradingDashboard, HistoryDashboard, TradePage

router = APIRouter(prefix="/trading", tags=["Private trading"])


def admin_owner(user=Depends(get_current_user)):
    if user.get("email") != settings.ADMIN_EMAIL:
        raise HTTPException(403, "This dashboard is restricted to the portfolio owner.")
    return user["email"]


class LoginLink(BaseModel):
    url: str


@router.get("/dashboard", response_model=TradingDashboard)
def get_dashboard(year: Optional[int] = Query(None, ge=2000, le=2100), owner=Depends(admin_owner)):
    # The unconfigured screen must work before the migration/credentials exist.
    if not trading.configured():
        return TradingDashboard(configured=False)
    return trading.dashboard(owner, year or datetime.now(trading.IST).year)


@router.get("/history", response_model=HistoryDashboard)
def get_history(year: int = Query(..., ge=2000, le=2100), owner=Depends(admin_owner)):
    return trading_history.history(owner, year)


@router.get("/trades", response_model=TradePage)
def get_trades(year: int = Query(..., ge=2000, le=2100),
               page: int = Query(1, ge=1), page_size: int = Query(25, ge=1, le=100),
               day: Optional[date] = None, symbol: Optional[str] = Query(None, max_length=150),
               side: Optional[Literal["BUY", "SELL"]] = None, owner=Depends(admin_owner)):
    return trading_history.trade_page(owner, year, page, page_size,
                                     day.isoformat() if day else None, symbol, side)


async def read_report(file):
    raw = await file.read(trading_imports.MAX_UPLOAD_BYTES + 1)
    try:
        return trading_imports.parse_report(raw)
    except (ValueError, OverflowError) as exc:
        raise HTTPException(422, str(exc))
    finally:
        await file.close()


@router.post("/imports/preview")
async def preview_import(file: UploadFile = File(...), owner=Depends(admin_owner)):
    return trading_imports.preview(await read_report(file))


@router.post("/imports")
async def commit_import(file: UploadFile = File(...), expected_hash: str = Form(..., max_length=64),
                        owner=Depends(admin_owner)):
    report = await read_report(file)
    if not secrets.compare_digest(expected_hash, report["file_hash"]):
        raise HTTPException(409, "The file changed since preview. Preview it again before importing.")
    return await run_in_threadpool(trading_imports.import_report, owner, report)


@router.post("/connect", response_model=LoginLink)
def connect(owner=Depends(admin_owner)):
    return LoginLink(url=trading.begin_login(owner))


@router.get("/callback", include_in_schema=False)
async def callback(request_token: str = Query(..., min_length=1, max_length=512),
                   state: str = Query(..., min_length=1, max_length=2048)):
    await trading.finish_login(request_token, state)
    return RedirectResponse(settings.TRADING_ADMIN_URL + "#/trading", status_code=303)


@router.post("/sync", response_model=TradingDashboard)
async def sync(year: Optional[int] = Query(None, ge=2000, le=2100), owner=Depends(admin_owner)):
    await trading.sync(owner)
    return trading.dashboard(owner, year or datetime.now(trading.IST).year)


@router.delete("/connection", status_code=204)
def disconnect(owner=Depends(admin_owner)):
    trading.update_connection(owner, {"access_token_encrypted": None,
                                      "login_nonce_hash": None, "login_expires_at": None,
                                      "needs_reconnect": False})


@router.post("/scheduled-sync", include_in_schema=False)
async def scheduled_sync(authorization: Optional[str] = Header(None)):
    secret = settings.TRADING_CRON_SECRET
    if not secret or not secrets.compare_digest(authorization or "", f"Bearer {secret}"):
        raise HTTPException(401, "Unauthorized")
    await trading.sync(settings.ADMIN_EMAIL)
    return {"synced": True}
