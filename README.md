QUORUM

Multi-agent trading system. Five LLM-backed agents, each running a distinct
strategy, analyze live market data independently and produce trade decisions.
Agents can also vote as a council on a single ticker, or debate when they
disagree.

ARCHITECTURE

quorum/                    frontend, React + Vite
  src/App.jsx               dashboard + landing screen
  src/CouncilRoom.jsx        council voting modal
  src/components/            TopBar, AgentCard, TradeFeed, EquityChart, Leaderboard, TickerTape, EventInjector, Panel
  src/hooks/useQuorum.js      state, polling, offline fallback
  src/api/client.js           backend client

quorum-backend/            backend, FastAPI
  main.py
  app/models.py              pydantic schemas
  app/market_data.py          yfinance fetch + RSI/SMA/PE
  app/portfolio.py             in-memory portfolio, P&L, win rate
  app/broker.py                 Alpaca REST wrapper
  app/agents/base.py             BaseAgent, OpenRouter call
  app/agents/agents.py            5 agent classes, model assignment
  app/agents/debate.py             disagreement -> rebuttal generation
  app/routes/trading.py             endpoints

AGENTS

MOMENTUM     trend following            meta-llama/llama-3.3-70b-instruct:free
CONTRARIAN   mean reversion / fade      deepseek/deepseek-chat:free
VALUE        fundamentals, P/E          qwen/qwen-2.5-72b-instruct:free
MACRO        rates, macro events        mistralai/mistral-7b-instruct:free
QUANT        stat arb, factor model     google/gemma-2-9b-it:free

All models are free tier on OpenRouter. One API key covers all five.

SETUP

Backend:

  cd quorum-backend
  python -m pip install -r requirements.txt
  copy .env.example .env

Open .env, set OPENROUTER_API_KEY on one line (get a free key at
openrouter.ai/keys, no card required):

  OPENROUTER_API_KEY=sk-or-v1-...

Run:

  python -m uvicorn main:app --reload --port 8000

Check http://localhost:8000/docs to confirm it's up.

Frontend:

  cd quorum
  npm install
  npm run dev

Open http://localhost:5173.

ENDPOINTS

POST /api/run                  run all agents on a list of tickers
GET  /api/council/{ticker}     council vote on one ticker
POST /api/inject                inject a market event, agents react
GET  /api/portfolio              current in-memory portfolio state
GET  /api/portfolio/alpaca        real Alpaca account state
POST /api/order/alpaca             place a real Alpaca order
GET  /api/market/{ticker}           market data + technicals for one ticker
POST /api/reset                      reset in-memory portfolio

MODES

SIM: default. In-memory portfolio, resets on backend restart.
PAPER/LIVE: routes through Alpaca. Requires ALPACA_API_KEY and
ALPACA_SECRET_KEY in .env. Not required for SIM mode.

KNOWN LIMITATIONS

Free OpenRouter models are rate limited; heavy use returns 429, retry after
~30s.
Sharpe ratio and max drawdown in the UI are placeholder values; real
calculation requires a tracked daily NAV series, not yet implemented.
Options trading is not implemented. Alpaca supports multi-leg options in
paper and live accounts; this is a planned addition.
Portfolio state is not persisted; restarting the backend resets it to
starting capital.

## Roadmap

- [ ] Options trading via Alpaca
- [ ] Persist portfolio state across backend restarts (SQLite)
- [ ] Real Sharpe / drawdown calculation from tracked daily NAV
- [ ] Swap individual agents to different providers on demand from the UI
