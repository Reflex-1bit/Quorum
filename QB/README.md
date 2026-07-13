# QUORUM Backend

Multi-agent hedge fund API. 5 AI agents (Momentum, Contrarian, Value, Macro, Quant) analyze real market data and trade.

## Setup

```bash
cd quorum-backend
pip install -r requirements.txt
cp .env.example .env
# Fill in your keys in .env
uvicorn main:app --reload --port 8000
```

## API Docs
Visit `http://localhost:8000/docs` for interactive Swagger UI.

## Key Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/run` | Run all agents on given tickers |
| POST | `/api/inject` | Inject a market event, agents react |
| GET | `/api/portfolio` | Current portfolio state |
| GET | `/api/portfolio/alpaca` | Real Alpaca account (paper/live) |
| POST | `/api/order/alpaca` | Place real order via Alpaca |
| GET | `/api/market/{ticker}` | Live market data + technicals |
| POST | `/api/reset` | Reset in-memory portfolio |

## Modes

- **SIM** — agents trade against simulated portfolio in memory
- **PAPER** — agents send real orders to Alpaca paper trading account
- **LIVE** — agents send real orders to Alpaca live account (use with caution)

Set `MODE=sim|paper|live` in `.env`.

## Alpaca Setup (Paper/Live)

1. Sign up at https://alpaca.markets
2. Get API keys from dashboard
3. Add to `.env`:
   ```
   ALPACA_API_KEY=your_key
   ALPACA_SECRET_KEY=your_secret
   ALPACA_BASE_URL=https://paper-api.alpaca.markets  # paper
   # ALPACA_BASE_URL=https://api.alpaca.markets  # live
   ```
