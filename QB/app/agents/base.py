from abc import ABC, abstractmethod
from anthropic import Anthropic
from app.models import MarketData, AgentDecision, AgentId, TradeAction
import os
import json
import re

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))


class BaseAgent(ABC):
    id: AgentId
    name: str
    model: str = "claude"

    # Each agent has a unique system prompt that defines its personality + strategy
    @property
    @abstractmethod
    def system_prompt(self) -> str: ...

    def build_market_context(self, data: MarketData) -> str:
        lines = [
            f"Ticker: {data.ticker}",
            f"Current Price: ${data.price:.2f}",
            f"Day Change: {data.change_pct:+.2f}%",
            f"Volume: {data.volume:,.0f} (avg: {data.avg_volume:,.0f}, ratio: {data.volume/data.avg_volume:.1f}x)",
        ]
        if data.rsi is not None:
            lines.append(f"RSI(14): {data.rsi}")
        if data.sma_20:
            lines.append(f"SMA 20: ${data.sma_20:.2f} | SMA 50: ${data.sma_50:.2f} | SMA 200: ${data.sma_200:.2f}")
        if data.pe_ratio:
            lines.append(f"P/E Ratio: {data.pe_ratio}")
        if data.high_52w and data.low_52w:
            pct_from_high = (data.price - data.high_52w) / data.high_52w * 100
            lines.append(f"52W High: ${data.high_52w} | 52W Low: ${data.low_52w} ({pct_from_high:+.1f}% from high)")
        return "\n".join(lines)

    def analyze(self, data: MarketData, event_context: str = "") -> AgentDecision:
        market_ctx = self.build_market_context(data)
        user_msg = f"""Analyze this stock and decide whether to BUY, SELL, or HOLD.

MARKET DATA:
{market_ctx}
{"BREAKING EVENT: " + event_context if event_context else ""}

Respond ONLY with valid JSON, no markdown, no extra text:
{{
  "action": "BUY" | "SELL" | "HOLD",
  "shares": <integer 1-50>,
  "confidence": <float 0.0-1.0>,
  "reasoning": "<one sentence, your voice, max 120 chars>"
}}"""

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=256,
            system=self.system_prompt,
            messages=[{"role": "user", "content": user_msg}],
        )

        raw = response.content[0].text.strip()
        # strip markdown fences if present
        raw = re.sub(r"```(?:json)?", "", raw).strip().rstrip("```").strip()

        try:
            parsed = json.loads(raw)
            action = TradeAction(parsed.get("action", "HOLD"))
            shares = max(1, min(50, int(parsed.get("shares", 5))))
            confidence = float(parsed.get("confidence", 0.5))
            reasoning = parsed.get("reasoning", "No reasoning provided.")
        except Exception:
            action = TradeAction.HOLD
            shares = 1
            confidence = 0.3
            reasoning = "Parse error — holding position."

        return AgentDecision(
            agent_id=self.id,
            action=action,
            ticker=data.ticker,
            price=data.price,
            shares=shares,
            confidence=confidence,
            reasoning=reasoning,
        )
