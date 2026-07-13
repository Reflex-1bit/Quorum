import httpx
import os
from typing import Optional


class AlpacaBroker:
    """Thin wrapper around Alpaca REST API for paper/live order execution."""

    def __init__(self):
        self.api_key = os.getenv("ALPACA_API_KEY", "")
        self.secret_key = os.getenv("ALPACA_SECRET_KEY", "")
        self.base_url = os.getenv("ALPACA_BASE_URL", "https://paper-api.alpaca.markets")
        self.headers = {
            "APCA-API-KEY-ID": self.api_key,
            "APCA-API-SECRET-KEY": self.secret_key,
            "Content-Type": "application/json",
        }

    async def get_account(self) -> dict:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{self.base_url}/v2/account", headers=self.headers)
            r.raise_for_status()
            return r.json()

    async def submit_order(
        self,
        symbol: str,
        qty: int,
        side: str,  # "buy" or "sell"
        order_type: str = "market",
        time_in_force: str = "day",
    ) -> dict:
        payload = {
            "symbol": symbol,
            "qty": str(qty),
            "side": side,
            "type": order_type,
            "time_in_force": time_in_force,
        }
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.base_url}/v2/orders",
                headers=self.headers,
                json=payload,
            )
            r.raise_for_status()
            return r.json()

    async def get_positions(self) -> list[dict]:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{self.base_url}/v2/positions", headers=self.headers)
            r.raise_for_status()
            return r.json()

    async def get_portfolio_history(self, period: str = "1M") -> dict:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{self.base_url}/v2/account/portfolio/history",
                headers=self.headers,
                params={"period": period, "timeframe": "1D"},
            )
            r.raise_for_status()
            return r.json()

    async def close_position(self, symbol: str) -> dict:
        async with httpx.AsyncClient() as client:
            r = await client.delete(
                f"{self.base_url}/v2/positions/{symbol}",
                headers=self.headers,
            )
            r.raise_for_status()
            return r.json()


broker = AlpacaBroker()
