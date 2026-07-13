from fastapi import APIRouter, HTTPException
from app.models import SimRunRequest, InjectEvent, Trade, AppMode
from app.agents.agents import AGENT_REGISTRY, AgentId
from app.agents.debate import should_debate, generate_debate, build_debate_trade
from app.market_data import fetch_multiple
from app.portfolio import portfolio
from app.broker import broker
import uuid
from datetime import datetime

router = APIRouter()


def decision_to_trade(decision, pnl=None) -> Trade:
    now = datetime.now().strftime("%H:%M:%S")
    type_map = {"BUY": "buy", "SELL": "sell", "HOLD": "hold", "DEBATE": "debate"}
    return Trade(
        id=str(uuid.uuid4())[:8],
        agent=decision.agent_id.value.upper(),
        action=decision.action.value,
        ticker=decision.ticker,
        price=decision.price,
        shares=decision.shares,
        reason=decision.reasoning,
        time=now,
        type=type_map.get(decision.action.value, "hold"),
        pnl=round(pnl, 2) if pnl is not None else None,
    )


@router.post("/run")
async def run_agents(req: SimRunRequest):
    """
    Fetch market data for requested tickers, run all agents,
    detect debates, execute trades, return results.
    """
    # 1. Fetch live market data
    market_data = fetch_multiple(req.tickers)
    if not market_data:
        raise HTTPException(status_code=503, detail="Failed to fetch market data")

    trades_out: list[Trade] = []
    decisions_by_ticker: dict[str, list] = {}

    # 2. Run each agent on each ticker
    for ticker, data in market_data.items():
        decisions_by_ticker[ticker] = []
        for agent_id, agent in AGENT_REGISTRY.items():
            try:
                decision = agent.analyze(data)
                if decision.action.value != "HOLD":
                    # Execute in portfolio
                    pnl = portfolio.execute(decision)
                    trade = decision_to_trade(decision, pnl)
                    trades_out.append(trade)
                    decisions_by_ticker[ticker].append(decision)
            except Exception as e:
                print(f"[run] Agent {agent_id} error on {ticker}: {e}")

    # 3. Detect and generate debates
    for ticker, decisions in decisions_by_ticker.items():
        data = market_data[ticker]
        for i, d1 in enumerate(decisions):
            for d2 in decisions[i+1:]:
                if should_debate(d1, d2):
                    try:
                        rebuttal = generate_debate(
                            d1.agent_id.value.upper(), d1.reasoning,
                            d2.agent_id.value.upper(), d2.reasoning,
                            ticker, data,
                        )
                        debate_trade = build_debate_trade(
                            d2.agent_id.value.upper(),
                            d1.agent_id.value.upper(),
                            ticker, rebuttal,
                        )
                        trades_out.append(debate_trade)
                    except Exception as e:
                        print(f"[debate] Error: {e}")

    # 4. Portfolio state
    current_prices = {t: d.price for t, d in market_data.items()}
    portfolio_state = portfolio.get_portfolio_state(current_prices)
    agent_states = portfolio.get_agent_states(current_prices)

    return {
        "trades": [t.model_dump() for t in trades_out],
        "portfolio": portfolio_state.model_dump(),
        "agents": [a.model_dump() for a in agent_states],
        "market_data": {k: v.model_dump() for k, v in market_data.items()},
    }


@router.post("/inject")
async def inject_event(event: InjectEvent):
    """Inject a market event — all agents react immediately."""
    tickers = ["SPY", "GLD", "QQQ"]
    market_data = fetch_multiple(tickers)
    trades_out: list[Trade] = []

    for ticker, data in market_data.items():
        for agent_id, agent in AGENT_REGISTRY.items():
            try:
                decision = agent.analyze(data, event_context=event.text)
                if decision.action.value != "HOLD":
                    pnl = portfolio.execute(decision)
                    trade = decision_to_trade(decision, pnl)
                    trade.reason = f"⚡ EVENT: {event.text} — {decision.reasoning}"
                    trades_out.append(trade)
            except Exception as e:
                print(f"[inject] Error: {e}")

    current_prices = {t: d.price for t, d in market_data.items()}
    portfolio_state = portfolio.get_portfolio_state(current_prices)
    agent_states = portfolio.get_agent_states(current_prices)

    return {
        "trades": [t.model_dump() for t in trades_out],
        "portfolio": portfolio_state.model_dump(),
        "agents": [a.model_dump() for a in agent_states],
    }


@router.get("/portfolio")
async def get_portfolio():
    """Get current portfolio state (uses last known prices)."""
    agent_states = portfolio.get_agent_states({})
    portfolio_state = portfolio.get_portfolio_state({})
    return {
        "portfolio": portfolio_state.model_dump(),
        "agents": [a.model_dump() for a in agent_states],
        "positions": portfolio.positions,
    }


@router.get("/portfolio/alpaca")
async def get_alpaca_portfolio():
    """Fetch real portfolio from Alpaca (paper or live)."""
    try:
        account = await broker.get_account()
        positions = await broker.get_positions()
        history = await broker.get_portfolio_history()
        return {"account": account, "positions": positions, "history": history}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Alpaca error: {str(e)}")


@router.post("/order/alpaca")
async def place_alpaca_order(symbol: str, qty: int, side: str):
    """Place a real order via Alpaca (paper or live mode)."""
    if side not in ("buy", "sell"):
        raise HTTPException(status_code=400, detail="side must be 'buy' or 'sell'")
    try:
        result = await broker.submit_order(symbol, qty, side)
        return result
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Order failed: {str(e)}")


@router.get("/market/{ticker}")
async def get_market_data(ticker: str):
    """Fetch live market data + technicals for a single ticker."""
    from app.market_data import fetch_market_data
    data = fetch_market_data(ticker.upper())
    if not data:
        raise HTTPException(status_code=404, detail=f"No data for {ticker}")
    return data.model_dump()


@router.post("/reset")
async def reset_portfolio():
    """Reset the in-memory portfolio to starting state."""
    portfolio.cash = portfolio.starting_capital
    portfolio.positions.clear()
    portfolio.closed_trades.clear()
    for k in portfolio.agent_stats:
        portfolio.agent_stats[k] = {"pnl": 0.0, "trades": 0, "wins": 0}
    return {"status": "reset", "starting_capital": portfolio.starting_capital}
