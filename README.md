# QUORUM

**Multi-agent hedge fund simulator.** Five AI agents, each with a distinct trading
strategy and personality, independently analyze real market data and trade 
or debate, or vote as a council on a single stock.

---

## What it does

- **5 agents, 5 strategies, 5 free LLMs** (via OpenRouter — no paid API needed):

  | Agent | Strategy | Model |
  |---|---|---|
  | MOMENTUM | Trend following | Llama 3.3 70B |
  | CONTRARIAN | Fade the herd | DeepSeek Chat |
  | VALUE | Fundamentals / P/E | Qwen 2.5 72B |
  | MACRO | Macro/news driven | Gemini flash 3.1 |
  | QUANT | Stat arb / mean reversion | Gemma 2 9B/Sonnet 4.7 |

- **War Room dashboard** — live agent P&L, leaderboard, equity curves, and a
  scrolling trade feed with each agent's reasoning.
- **Council Vote** — pick one ticker, all 5 agents independently vote
  BUY / SELL / HOLD, majority wins.
- **Debates** — when two agents take opposite positions on the same stock,
  one fires back with a rebuttal in the trade feed.
- **Real market data** — live price, RSI, SMA 20/50/200, P/E, 52-week range
  via yfinance.
- **Three modes**: SIM (in-memory paper portfolio, default), PAPER / LIVE
  (routes through Alpaca — wiring included, not required to run SIM).

---

## Project structure

```
quorum/                   ← frontend (React + Vite)
  src/
    App.jsx                ← main dashboard + landing screen
    CouncilRoom.jsx         ← council voting modal
    components/             ← TopBar, AgentCard, TradeFeed, EquityChart, etc.
    hooks/useQuorum.js       ← state management, polling, fallback sim
    api/client.js            ← backend API wrapper

quorum-backend/            ← backend (FastAPI)
  main.py                   ← app entry point
  app/
    models.py                 ← data types
    market_data.py             ← yfinance fetcher + technicals
    portfolio.py                ← in-memory P&L tracker
    broker.py                    ← Alpaca wrapper (paper/live, for later)
    agents/
      base.py                    ← BaseAgent, calls OpenRouter
      agents.py                   ← 5 agent personalities + model assignment
      debate.py                    ← debate generation between disagreeing agents
    routes/trading.py               ← all API endpoints
```

---
## Using it

- Type tickers in the status bar (comma-separated) → **▶ RUN AGENTS** — hits
  the backend, agents pull live data and decide BUY/SELL/HOLD via their
  assigned model.
- **⚖ COUNCIL VOTE** button (bottom-right) → enter one ticker → **CONVENE** —
  watch all 5 agents vote and see the majority verdict.
- **INJECT MARKET EVENT** buttons (Fed hike, CPI miss, etc.) → all agents
  react to the scenario in real time.
- If the backend isn't running, the UI falls back to a mock simulation so it
  never looks broken — the status bar will say `SIM MODE — BACKEND OFFLINE`.

---

## API endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/run` | Run all agents on given tickers |
| GET | `/api/council/{ticker}` | Council vote on one ticker |
| POST | `/api/inject` | Inject a market event |
| GET | `/api/portfolio` | Current in-memory portfolio state |
| GET | `/api/portfolio/alpaca` | Real Alpaca account (paper/live) |
| POST | `/api/order/alpaca` | Place a real order via Alpaca |
| GET | `/api/market/{ticker}` | Live market data + technicals |
| POST | `/api/reset` | Reset the in-memory portfolio |

---

## Notes / known limitations

- Free OpenRouter models are rate-limited — heavy use may hit 429s, just
  wait ~30s and retry.
- The in-memory portfolio (SIM mode) resets on backend restart. PAPER/LIVE
  mode via Alpaca persists across restarts once wired up with your Alpaca keys.
- Options trading is not yet implemented — Alpaca supports it (multi-leg,
  paper by default) and is a planned addition.
- Sharpe ratio and max drawdown in the UI are currently placeholder values;
  real calculation needs a daily-returns time series, not yet tracked.

---

## Roadmap

- [ ] Options trading via Alpaca
- [ ] Persist portfolio state across backend restarts (SQLite)
- [ ] Real Sharpe / drawdown calculation from tracked daily NAV
- [ ] Swap individual agents to different providers on demand from the UI
