# QUORUM

A multi-agent trading system. Five LLM-backed agents, each running a distinct
strategy, independently analyze live market data and decide whether to buy,
sell, or hold. They can also be convened as a council to vote on a single
ticker, or left to disagree with each other in a live trade feed.

## How it's built

The frontend is a React + Vite dashboard (the "war room") that polls a
FastAPI backend. The backend does three things: pulls live market data for
whatever tickers you give it via `yfinance`, sends that data to five
different language models with five different trading personalities, and
tracks the resulting trades against an in-memory paper portfolio.

The five agents don't share a model. Each one is mapped to a different free
model on OpenRouter, so one API key covers all of them and there's no per-call
cost:

```
MOMENTUM     trend following          meta-llama/llama-3.3-70b-instruct:free
CONTRARIAN   mean reversion / fade    deepseek/deepseek-chat:free
VALUE        fundamentals, P/E        qwen/qwen-2.5-72b-instruct:free
MACRO        rates, macro events      mistralai/mistral-7b-instruct:free
QUANT        stat arb, factor model   google/gemma-2-9b-it:free
```

Using different models per agent isn't just cosmetic — it means the "voices"
in the war room actually reason differently, not just role-play differently
on top of identical outputs.

When two agents land on opposite sides of the same ticker (one wants to buy,
one wants to sell), the backend generates a short rebuttal from the losing
side and drops it into the trade feed as a debate entry. The Council Vote
feature works the same way but for a single ticker on demand: all five agents
vote independently, majority wins, and you see the full reasoning trail.

## Project layout

```
quorum/                    frontend, React + Vite
  src/App.jsx                dashboard + landing screen
  src/CouncilRoom.jsx         council voting modal
  src/components/              TopBar, AgentCard, TradeFeed, EquityChart,
                                Leaderboard, TickerTape, EventInjector, Panel
  src/hooks/useQuorum.js        state management, polling, offline fallback
  src/api/client.js              backend client

quorum-backend/             backend, FastAPI
  main.py
  app/models.py                pydantic schemas
  app/market_data.py             yfinance fetch, RSI/SMA/PE calculation
  app/portfolio.py                 in-memory portfolio, P&L, win rate
  app/broker.py                     Alpaca REST wrapper (paper/live trading)
  app/agents/base.py                 BaseAgent, OpenRouter API call
  app/agents/agents.py                 5 agent classes, model + prompt per agent
  app/agents/debate.py                   disagreement detection + rebuttal
  app/routes/trading.py                    all API endpoints
```

## Running it

**Backend**

```
cd quorum-backend
python -m pip install -r requirements.txt
copy .env.example .env
```

Open `.env` and set your OpenRouter key on one line. Get a free one at
[openrouter.ai/keys](https://openrouter.ai/keys) — no card required for the
`:free` models:

```
OPENROUTER_API_KEY=sk-or-v1-...
```

Then start it:

```
python -m uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` to confirm it's running.

**Frontend**

```
cd quorum
npm install
npm run dev
```

Visit `http://localhost:5173`.

## Endpoints

| Method | Route | What it does |
|---|---|---|
| POST | `/api/run` | Run all agents on a list of tickers |
| GET | `/api/council/{ticker}` | Council vote on one ticker |
| POST | `/api/inject` | Inject a market event, all agents react |
| GET | `/api/portfolio` | Current in-memory portfolio state |
| GET | `/api/portfolio/alpaca` | Real Alpaca account state |
| POST | `/api/order/alpaca` | Place a real Alpaca order |
| GET | `/api/market/{ticker}` | Market data + technicals for one ticker |
| POST | `/api/reset` | Reset the in-memory portfolio |

## Modes

SIM is the default — trades execute against an in-memory paper portfolio
that resets whenever the backend restarts. PAPER and LIVE route through
Alpaca instead, which means real order execution against a real (paper or
live) brokerage account. Those two modes need `ALPACA_API_KEY` and
`ALPACA_SECRET_KEY` set in `.env`; SIM works without them.

## What's not done yet

Sharpe ratio and max drawdown in the UI are currently placeholder values —
a real calculation needs a tracked daily NAV series, which isn't implemented.
Options trading isn't wired up either, though Alpaca supports multi-leg
options in both paper and live accounts, so it's a natural next step.
Portfolio state also doesn't persist across backend restarts right now —
that would mean moving from the in-memory dict to something like SQLite.

Free OpenRouter models are rate-limited, so heavy use can return a 429 —
wait about 30 seconds and retry.

## Roadmap

- Options trading via Alpaca
- Persistent portfolio state (SQLite)
- Real Sharpe / drawdown calculation from tracked daily NAV
- Per-agent model swapping from the UI
