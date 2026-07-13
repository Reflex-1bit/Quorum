import yfinance as yf
import pandas as pd
import numpy as np
from typing import Optional
from app.models import MarketData


def compute_rsi(prices: pd.Series, period: int = 14) -> float:
    delta = prices.diff().dropna()
    gains = delta.clip(lower=0)
    losses = -delta.clip(upper=0)
    avg_gain = gains.rolling(period).mean().iloc[-1]
    avg_loss = losses.rolling(period).mean().iloc[-1]
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100 - (100 / (1 + rs)), 2)


def fetch_market_data(ticker: str) -> Optional[MarketData]:
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="1y")
        if hist.empty:
            return None

        closes = hist["Close"]
        current_price = float(closes.iloc[-1])
        prev_price = float(closes.iloc[-2])
        change_pct = round((current_price - prev_price) / prev_price * 100, 2)

        volume = float(hist["Volume"].iloc[-1])
        avg_volume = float(hist["Volume"].rolling(20).mean().iloc[-1])

        rsi = compute_rsi(closes)
        sma_20 = round(float(closes.rolling(20).mean().iloc[-1]), 2) if len(closes) >= 20 else None
        sma_50 = round(float(closes.rolling(50).mean().iloc[-1]), 2) if len(closes) >= 50 else None
        sma_200 = round(float(closes.rolling(200).mean().iloc[-1]), 2) if len(closes) >= 200 else None

        info = t.info
        pe_ratio = info.get("trailingPE")
        market_cap = info.get("marketCap")
        high_52w = info.get("fiftyTwoWeekHigh")
        low_52w = info.get("fiftyTwoWeekLow")

        return MarketData(
            ticker=ticker,
            price=round(current_price, 2),
            change_pct=change_pct,
            volume=volume,
            avg_volume=avg_volume,
            rsi=rsi,
            sma_20=sma_20,
            sma_50=sma_50,
            sma_200=sma_200,
            pe_ratio=round(pe_ratio, 2) if pe_ratio else None,
            market_cap=market_cap,
            high_52w=round(high_52w, 2) if high_52w else None,
            low_52w=round(low_52w, 2) if low_52w else None,
        )
    except Exception as e:
        print(f"[market_data] Error fetching {ticker}: {e}")
        return None


def fetch_multiple(tickers: list[str]) -> dict[str, MarketData]:
    results = {}
    for ticker in tickers:
        data = fetch_market_data(ticker)
        if data:
            results[ticker] = data
    return results
