from anthropic import Anthropic
from app.models import AgentDecision, MarketData, AgentId, Trade, TradeAction
import os
import uuid
from datetime import datetime

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))


def should_debate(d1: AgentDecision, d2: AgentDecision) -> bool:
    """Two agents debate if they take opposing positions on the same ticker."""
    opposing = {
        (TradeAction.BUY, TradeAction.SELL),
        (TradeAction.SELL, TradeAction.BUY),
    }
    return (d1.action, d2.action) in opposing and d1.confidence > 0.5 and d2.confidence > 0.5


def generate_debate(
    agent1_name: str,
    agent1_reasoning: str,
    agent2_name: str,
    agent2_reasoning: str,
    ticker: str,
    data: MarketData,
) -> str:
    """Generate a short debate response from agent2 firing back at agent1."""
    prompt = f"""Two trading agents are debating {ticker} at ${data.price:.2f}.

{agent1_name} says: "{agent1_reasoning}"
{agent2_name} wants to respond and disagree.

Write a single sharp sentence (max 110 chars) from {agent2_name}'s perspective, 
pushing back on {agent1_name}'s thesis. Be specific to the data. No quotation marks."""

    resp = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=100,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text.strip()


def build_debate_trade(
    agent2_name: str,
    agent1_name: str,
    ticker: str,
    rebuttal: str,
) -> Trade:
    now = datetime.now().strftime("%H:%M:%S")
    return Trade(
        id=str(uuid.uuid4())[:8],
        agent=agent2_name,
        action="DEBATE",
        ticker=ticker,
        price=None,
        shares=None,
        reason=f"⚡ vs {agent1_name}: {rebuttal}",
        time=now,
        type="debate",
    )
