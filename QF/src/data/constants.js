export const AGENTS = [
  {
    id: 'momentum',
    name: 'MOMENTUM',
    strategy: 'Trend following',
    color: 'var(--green)',
    accent: '#00ff87',
    dimBg: 'var(--green-dim)',
    pnl: 84200,
    pct: 8.42,
    trades: 312,
    winRate: 67,
    model: 'claude',
  },
  {
    id: 'contrarian',
    name: 'CONTRARIAN',
    strategy: 'Fade the herd',
    color: 'var(--red)',
    accent: '#ff3b3b',
    dimBg: 'var(--red-dim)',
    pnl: -12400,
    pct: -1.24,
    trades: 198,
    winRate: 44,
    model: 'claude',
  },
  {
    id: 'value',
    name: 'VALUE',
    strategy: 'Fundamental',
    color: 'var(--amber)',
    accent: '#ffb800',
    dimBg: 'var(--amber-dim)',
    pnl: 31800,
    pct: 3.18,
    trades: 87,
    winRate: 58,
    model: 'claude',
  },
  {
    id: 'macro',
    name: 'MACRO',
    strategy: 'News sentiment',
    color: 'var(--blue)',
    accent: '#60a5fa',
    dimBg: 'var(--blue-dim)',
    pnl: 67100,
    pct: 6.71,
    trades: 143,
    winRate: 61,
    model: 'perplexity',
  },
  {
    id: 'quant',
    name: 'QUANT',
    strategy: 'Stat arb',
    color: 'var(--purple)',
    accent: '#c084fc',
    dimBg: 'var(--purple-dim)',
    pnl: 46900,
    pct: 4.69,
    trades: 107,
    winRate: 59,
    model: 'claude',
  },
];

export const INITIAL_TRADES = [
  { id: 1, agent: 'MOMENTUM', action: 'BUY', ticker: 'NVDA', price: 924.50, shares: 10, reason: 'RSI breakout + volume spike 3.2x — entering long', time: '14:32:01', type: 'buy' },
  { id: 2, agent: 'QUANT', action: 'SELL', ticker: 'AAPL', price: 189.20, shares: 25, reason: 'Mean reversion signal — 2.1σ above 20d mean', time: '14:31:47', type: 'sell' },
  { id: 3, agent: 'CONTRARIAN', action: 'DEBATE', ticker: 'NVDA', price: null, shares: null, reason: '⚡ Disagrees with MOMENTUM — overbought, fading this rally', time: '14:31:45', type: 'debate' },
  { id: 4, agent: 'MACRO', action: 'BUY', ticker: 'GLD', price: 2031.00, shares: 5, reason: 'Fed minutes dovish signal detected via news scan', time: '14:30:22', type: 'buy' },
  { id: 5, agent: 'VALUE', action: 'BUY', ticker: 'META', price: 484.10, shares: 8, reason: 'P/E 18.2 vs sector avg 24.1 — significant discount', time: '14:29:55', type: 'buy' },
  { id: 6, agent: 'QUANT', action: 'BUY', ticker: 'TSLA', price: 242.80, shares: 15, reason: 'Statistical arb: TSLA/LCID correlation divergence', time: '14:28:33', type: 'buy' },
];

export const TICKERS = [
  { sym: 'NVDA', chg: +3.21 }, { sym: 'AAPL', chg: -0.83 }, { sym: 'TSLA', chg: +1.14 },
  { sym: 'META', chg: +2.44 }, { sym: 'AMZN', chg: -0.31 }, { sym: 'MSFT', chg: +0.62 },
  { sym: 'GLD', chg: +0.91 }, { sym: 'SPY', chg: +0.44 }, { sym: 'QQQ', chg: +0.74 },
  { sym: 'BTC', chg: +2.13 }, { sym: 'GOOG', chg: -0.55 }, { sym: 'AMD', chg: +1.87 },
];

export const EVENTS = [
  { label: 'FED HIKE', text: 'Fed hikes rates 50bps — surprise decision' },
  { label: 'CPI MISS', text: 'CPI miss: inflation running hotter than expected' },
  { label: 'FLASH CRASH', text: 'Market flash crash — S&P down 4% in 8 minutes' },
  { label: 'RATE CUT', text: 'Fed pivots: emergency 75bps rate cut announced' },
  { label: 'EARNINGS', text: 'NVDA blowout earnings: revenue up 265% YoY' },
];

// Simulated equity curve data (30 days)
export const generateEquityCurves = () => {
  const days = 30;
  const curves = {};
  AGENTS.forEach(a => {
    let val = 1000000;
    const points = [val];
    for (let i = 1; i < days; i++) {
      const drift = a.pct / 100 / days;
      const noise = (Math.random() - 0.48) * 0.008;
      val = val * (1 + drift + noise);
      points.push(Math.round(val));
    }
    curves[a.id] = points;
  });
  return curves;
};
