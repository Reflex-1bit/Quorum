from pydantic import BaseModel
from typing import Optional, Literal
from enum import Enum


class AppMode(str, Enum):
    SIM = "sim"
    PAPER = "paper"
    LIVE = "live"


class TradeAction(str, Enum):
    BUY = "BUY"
    SELL = "SELL"
    HOLD = "HOLD"
    DEBATE = "DEBATE"


class AgentId(str, Enum):
    MOMENTUM = "momentum"
    CONTRARIAN = "contrarian"
    VALUE = "value"
    MACRO = "macro"
    QUANT = "quant"


class MarketData(BaseModel):
    ticker: str
    price: float
    change_pct: float
    volume: float
    avg_volume: float
    rsi: Optional[float] = None
    sma_20: Optional[float] = None
    sma_50: Optional[float] = None
    sma_200: Optional[float] = None
    pe_ratio: Optional[float] = None
    market_cap: Optional[float] = None
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None


class AgentDecision(BaseModel):
    agent_id: AgentId
    action: TradeAction
    ticker: str
    price: float
    shares: int
    confidence: float  # 0-1
    reasoning: str
    debate_target: Optional[str] = None  # agent it disagrees with


class Trade(BaseModel):
    id: str
    agent: str
    action: str
    ticker: str
    price: Optional[float]
    shares: Optional[int]
    reason: str
    time: str
    type: Literal["buy", "sell", "debate", "hold"]
    pnl: Optional[float] = None


class PortfolioState(BaseModel):
    nav: float
    day_pnl: float
    day_pnl_pct: float
    total_return_pct: float
    active_trades: int
    sharpe: float
    max_drawdown: float
    win_rate: float


class AgentState(BaseModel):
    id: str
    name: str
    pnl: float
    pct: float
    trades: int
    win_rate: float
    model: str


class InjectEvent(BaseModel):
    label: str
    text: str


class SimRunRequest(BaseModel):
    tickers: list[str] = ["NVDA", "AAPL", "TSLA", "META", "MSFT"]
    mode: AppMode = AppMode.SIM
