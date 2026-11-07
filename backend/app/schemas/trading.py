"""Public response contracts for the authenticated trading dashboard."""
from typing import Literal, Optional
from pydantic import BaseModel, Field


class Holding(BaseModel):
    symbol: str
    exchange: str
    quantity: int
    average_price: float
    last_price: float
    invested: float
    value: float
    pnl: float


class Position(BaseModel):
    symbol: str
    exchange: str
    product: str
    quantity: int
    pnl: float


class Trade(BaseModel):
    trade_id: str
    order_id: str
    symbol: str
    exchange: str
    side: Literal["BUY", "SELL"]
    quantity: int
    price: float
    traded_at: str
    segment: str = "UNKNOWN"
    source: str = "kite"


class Totals(BaseModel):
    invested: float
    holdings_value: float
    unrealized_pnl: float
    return_percent: Optional[float] = None
    available_margin: float
    cash: float
    used_margin: float
    positions_pnl: float


class TradingDay(BaseModel):
    date: str
    trade_count: int
    buy_value: float
    sell_value: float
    holdings_value: Optional[float] = None
    invested: Optional[float] = None
    captured_at: Optional[str] = None


class TradingDashboard(BaseModel):
    configured: bool
    connected: bool = False
    needs_reconnect: bool = False
    synced_at: Optional[str] = None
    totals: Optional[Totals] = None
    holdings: list[Holding] = Field(default_factory=list)
    positions: list[Position] = Field(default_factory=list)
    trades: list[Trade] = Field(default_factory=list)
    activity: list[TradingDay] = Field(default_factory=list)
    currency: str = "INR"
    timezone: str = "Asia/Kolkata"


class TradePage(BaseModel):
    rows: list[Trade]
    total: int
    page: int
    page_size: int


class LedgerEntry(BaseModel):
    entry_id: str
    posting_date: str
    particulars: str
    category: str
    debit: float
    credit: float
    balance: float


class PerformanceDay(BaseModel):
    date: str
    fills: int = 0
    buy_value: float = 0
    sell_value: float = 0
    gross_pnl: Optional[float] = None
    net_settlement: Optional[float] = None
    costs_and_adjustments: Optional[float] = None
    cumulative_gross: Optional[float] = None
    cumulative_net: Optional[float] = None
    ledger_balance: Optional[float] = None


class HistoryDashboard(BaseModel):
    year: int
    available_years: list[int]
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    fill_count: int = 0
    active_days: int = 0
    gross_pnl: Optional[float] = None
    incomplete_days: int = 0
    net_settlements: Optional[float] = None
    costs_and_adjustments: Optional[float] = None
    deposits: Optional[float] = None
    withdrawals: Optional[float] = None
    net_funding: Optional[float] = None
    opening_balance: Optional[float] = None
    closing_balance: Optional[float] = None
    ledger_as_of: Optional[str] = None
    other_ledger_change: float = 0
    winning_days: int = 0
    losing_days: int = 0
    flat_days: int = 0
    max_drawdown: Optional[float] = None
    daily: list[PerformanceDay] = Field(default_factory=list)
    monthly: list[dict] = Field(default_factory=list)
    instruments: list[dict] = Field(default_factory=list)
    ledger: list[LedgerEntry] = Field(default_factory=list)
    imports: list[dict] = Field(default_factory=list)
