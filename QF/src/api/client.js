const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  /** Run all agents on given tickers */
  run(tickers = ['NVDA', 'AAPL', 'TSLA', 'META', 'MSFT'], mode = 'sim') {
    return request('/run', {
      method: 'POST',
      body: JSON.stringify({ tickers, mode }),
    });
  },

  /** Inject a market event */
  inject(label, text) {
    return request('/inject', {
      method: 'POST',
      body: JSON.stringify({ label, text }),
    });
  },

  /** Current portfolio state */
  portfolio() {
    return request('/portfolio');
  },

  /** Alpaca portfolio (paper/live) */
  alpacaPortfolio() {
    return request('/portfolio/alpaca');
  },

  /** Place Alpaca order */
  placeOrder(symbol, qty, side) {
    return request(`/order/alpaca?symbol=${symbol}&qty=${qty}&side=${side}`, {
      method: 'POST',
    });
  },

  /** Single ticker market data */
  marketData(ticker) {
    return request(`/market/${ticker}`);
  },

  /** Reset in-memory portfolio */
  reset() {
    return request('/reset', { method: 'POST' });
  },
};
