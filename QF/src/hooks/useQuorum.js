import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { AGENTS as STATIC_AGENTS, INITIAL_TRADES, generateEquityCurves } from '../data/constants';

const DEFAULT_TICKERS = ['NVDA', 'AAPL', 'TSLA', 'META', 'MSFT'];
const POLL_INTERVAL_MS = 15000; // 15s — respects API rate limits

function mergeAgentStates(staticAgents, liveAgents) {
  if (!liveAgents || liveAgents.length === 0) return staticAgents;
  return staticAgents.map(sa => {
    const live = liveAgents.find(la => la.id === sa.id);
    if (!live) return sa;
    return {
      ...sa,
      pnl: live.pnl,
      pct: live.pct,
      trades: live.trades,
      win_rate: live.win_rate,
    };
  });
}

export function useQuorum() {
  const [mode, setMode] = useState('SIM');
  const [trades, setTrades] = useState(INITIAL_TRADES);
  const [agents, setAgents] = useState(STATIC_AGENTS);
  const [portfolio, setPortfolio] = useState({
    nav: 1247830,
    day_pnl: 24182,
    day_pnl_pct: 1.97,
    total_return_pct: 24.8,
    active_trades: 23,
    sharpe: 1.87,
    max_drawdown: -4.2,
    win_rate: 63,
  });
  const [curves] = useState(() => generateEquityCurves());
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | error | live
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [tickers, setTickers] = useState(DEFAULT_TICKERS);
  const pollRef = useRef(null);
  const tradeIdRef = useRef(200);

  const runAgents = useCallback(async (eventOverride = null) => {
    setStatus('loading');
    setError(null);
    try {
      let result;
      if (eventOverride) {
        result = await api.inject(eventOverride.label, eventOverride.text);
      } else {
        result = await api.run(tickers, mode.toLowerCase());
      }

      // Prepend new trades
      if (result.trades?.length) {
        const newTrades = result.trades.map(t => ({ ...t, id: t.id || String(tradeIdRef.current++) }));
        setTrades(prev => [...newTrades, ...prev].slice(0, 80));
      }

      // Update agent states
      if (result.agents) {
        setAgents(prev => mergeAgentStates(prev, result.agents));
      }

      // Update portfolio
      if (result.portfolio) {
        setPortfolio(result.portfolio);
      }

      setStatus('live');
      setIsLive(true);
    } catch (err) {
      console.error('[useQuorum] runAgents error:', err);
      setError(err.message);
      setStatus('error');
      // Fall back to mock sim so UI keeps ticking
      addMockTrade();
    }
  }, [mode, tickers]);

  // Mock trade for fallback when backend is offline
  const addMockTrade = useCallback(() => {
    const MOCK_REASONS = {
      momentum: 'RSI breakout + volume spike 2.8x — entering long',
      contrarian: 'Overbought conditions — fading this rally',
      value: 'Forward P/E 13.1 vs sector avg 22 — discount entry',
      macro: 'Yield curve inversion deepening — defensive pivot',
      quant: 'Pairs divergence 2.2σ from 60d mean — stat arb',
    };
    const agent = STATIC_AGENTS[Math.floor(Math.random() * STATIC_AGENTS.length)];
    const tickers_sample = ['NVDA', 'AAPL', 'TSLA', 'META', 'MSFT', 'AMD', 'GOOG'];
    const ticker = tickers_sample[Math.floor(Math.random() * tickers_sample.length)];
    const isBuy = Math.random() > 0.4;
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    setTrades(prev => [{
      id: String(tradeIdRef.current++),
      agent: agent.name,
      action: isBuy ? 'BUY' : 'SELL',
      ticker,
      price: Math.round(Math.random() * 800 + 50) + 0.50,
      shares: Math.round(Math.random() * 20 + 1),
      reason: MOCK_REASONS[agent.id],
      time: now,
      type: isBuy ? 'buy' : 'sell',
    }, ...prev].slice(0, 80));
  }, []);

  // Auto-poll when live
  useEffect(() => {
    if (isLive) {
      pollRef.current = setInterval(() => runAgents(), POLL_INTERVAL_MS);
    } else {
      // Mock sim fallback — tick every 3.5s
      pollRef.current = setInterval(addMockTrade, 3500);
    }
    return () => clearInterval(pollRef.current);
  }, [isLive, runAgents, addMockTrade]);

  const handleInject = useCallback((event) => {
    if (isLive) {
      runAgents(event);
    } else {
      // Mock inject
      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      const reactions = [
        { agent: 'MOMENTUM', action: 'SELL', type: 'sell', reason: `⚡ ${event.text} — cutting risk` },
        { agent: 'MACRO', action: 'BUY', type: 'buy', reason: `⚡ ${event.text} — macro repositioning` },
        { agent: 'CONTRARIAN', action: 'BUY', type: 'debate', reason: `⚡ CONTRARIAN: ${event.text} — this is the dip` },
      ];
      setTrades(prev => [
        ...reactions.map(r => ({ ...r, id: String(tradeIdRef.current++), ticker: 'SPY', price: 478.50, shares: 10, time: now })),
        ...prev,
      ].slice(0, 80));
    }
  }, [isLive, runAgents]);

  const handleAgentClick = useCallback((id) => {
    setSelectedAgent(prev => prev === id ? null : id);
  }, []);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    setIsLive(false);
    setStatus('idle');
  }, []);

  const handleReset = useCallback(async () => {
    if (isLive) {
      try { await api.reset(); } catch (e) { console.error(e); }
    }
    setTrades(INITIAL_TRADES);
    setAgents(STATIC_AGENTS);
    setIsLive(false);
    setStatus('idle');
  }, [isLive]);

  const filteredTrades = selectedAgent
    ? trades.filter(t => t.agent === agents.find(a => a.id === selectedAgent)?.name)
    : trades;

  return {
    // State
    mode, trades: filteredTrades, agents, portfolio, curves,
    selectedAgent, status, error, isLive, tickers,
    // Actions
    setTickers,
    runAgents: () => runAgents(),
    handleInject,
    handleAgentClick,
    handleModeChange,
    handleReset,
  };
}
