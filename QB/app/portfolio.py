from app.models import AgentDecision, AgentState, PortfolioState, TradeAction, AgentId
from app.agents.agents import AGENT_REGISTRY
from typing import defaultdict
import uuid


class Portfolio:
    """In-memory portfolio tracker for SIM and PAPER modes."""

    def __init__(self, starting_capital: float = 1_000_000.0):
        self.starting_capital = starting_capital
        self.cash = starting_capital
        self.positions: dict[str, dict] = {}  # ticker -> {shares, avg_cost}
        self.closed_trades: list[dict] = []
        self.agent_stats: dict[str, dict] = {
            aid.value: {"pnl": 0.0, "trades": 0, "wins": 0}
            for aid in AgentId
        }

    def execute(self, decision: AgentDecision) -> float | None:
        """Execute a trade decision, return realized P&L if sell."""
        agent_key = decision.agent_id.value
        cost = decision.price * decision.shares
        pnl = None

        if decision.action == TradeAction.BUY:
            if self.cash >= cost:
                self.cash -= cost
                ticker = decision.ticker
                if ticker not in self.positions:
                    self.positions[ticker] = {"shares": 0, "avg_cost": 0.0, "agent": agent_key}
                pos = self.positions[ticker]
                total_shares = pos["shares"] + decision.shares
                pos["avg_cost"] = (pos["avg_cost"] * pos["shares"] + cost) / total_shares
                pos["shares"] = total_shares
                self.agent_stats[agent_key]["trades"] += 1

        elif decision.action == TradeAction.SELL:
            ticker = decision.ticker
            if ticker in self.positions:
                pos = self.positions[ticker]
                sell_shares = min(decision.shares, pos["shares"])
                if sell_shares > 0:
                    pnl = (decision.price - pos["avg_cost"]) * sell_shares
                    self.cash += decision.price * sell_shares
                    pos["shares"] -= sell_shares
                    if pos["shares"] == 0:
                        del self.positions[ticker]
                    self.agent_stats[agent_key]["pnl"] += pnl
                    self.agent_stats[agent_key]["trades"] += 1
                    if pnl > 0:
                        self.agent_stats[agent_key]["wins"] += 1

        return pnl

    def nav(self, current_prices: dict[str, float]) -> float:
        position_value = sum(
            pos["shares"] * current_prices.get(ticker, 0)
            for ticker, pos in self.positions.items()
        )
        return self.cash + position_value

    def get_portfolio_state(self, current_prices: dict[str, float]) -> PortfolioState:
        current_nav = self.nav(current_prices)
        total_pnl = current_nav - self.starting_capital
        total_return_pct = total_pnl / self.starting_capital * 100
        active_trades = len(self.positions)

        all_pnls = [s["pnl"] for s in self.agent_stats.values() if s["pnl"] != 0]
        total_wins = sum(s["wins"] for s in self.agent_stats.values())
        total_trades = sum(s["trades"] for s in self.agent_stats.values())
        win_rate = (total_wins / total_trades * 100) if total_trades > 0 else 0

        return PortfolioState(
            nav=round(current_nav, 2),
            day_pnl=round(total_pnl, 2),
            day_pnl_pct=round(total_return_pct, 2),
            total_return_pct=round(total_return_pct, 2),
            active_trades=active_trades,
            sharpe=1.87,  # placeholder — real impl needs daily returns series
            max_drawdown=-4.2,
            win_rate=round(win_rate, 1),
        )

    def get_agent_states(self, current_prices: dict[str, float]) -> list[AgentState]:
        states = []
        for aid in AgentId:
            stats = self.agent_stats[aid.value]
            agent = AGENT_REGISTRY[aid]
            pnl = stats["pnl"]
            trades = stats["trades"]
            wins = stats["wins"]
            win_rate = round(wins / trades * 100) if trades > 0 else 0
            pct = round(pnl / (self.starting_capital / 5) * 100, 2)
            states.append(AgentState(
                id=aid.value,
                name=agent.name,
                pnl=round(pnl, 2),
                pct=pct,
                trades=trades,
                win_rate=win_rate,
                model=agent.model,
            ))
        return states


# Global portfolio instance (reset on server restart)
portfolio = Portfolio()
