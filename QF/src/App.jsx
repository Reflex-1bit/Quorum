import { useState } from 'react';
import { useQuorum } from './hooks/useQuorum';
import TopBar from './components/TopBar';
import StatusBar from './components/StatusBar';
import AgentCard from './components/AgentCard';
import TradeFeed from './components/TradeFeed';
import EquityChart from './components/EquityChart';
import Leaderboard from './components/Leaderboard';
import TickerTape from './components/TickerTape';
import EventInjector from './components/EventInjector';
import Panel from './components/Panel';
import styles from './App.module.css';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);

  const {
    mode, trades, agents, portfolio, curves,
    selectedAgent, status, error, isLive, tickers,
    setTickers, runAgents, handleInject,
    handleAgentClick, handleModeChange, handleReset,
  } = useQuorum();

  if (showLanding) {
    return (
      <div style={{height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,background:'#060606',color:'#fff',fontFamily:'monospace'}}>
        <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:64,letterSpacing:10}}>QUORUM</div>
        <div style={{fontSize:11,letterSpacing:4,color:'#888'}}>MULTI-AGENT HEDGE FUND</div>
        <button onClick={() => setShowLanding(false)} style={{marginTop:20,padding:'12px 24px',background:'transparent',border:'1px solid #00ff87',color:'#00ff87',cursor:'pointer',letterSpacing:2,fontFamily:'monospace'}}>
          ENTER THE WAR ROOM →
        </button>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <TopBar
        mode={mode}
        onModeChange={handleModeChange}
        portfolio={portfolio.nav}
        dayPnl={portfolio.day_pnl}
        activeTrades={portfolio.active_trades}
      />

      <StatusBar
        status={status}
        error={error}
        isLive={isLive}
        onRun={runAgents}
        onReset={handleReset}
        tickers={tickers}
        onTickersChange={setTickers}
      />

      <main className={styles.main}>
        <Panel title="Agents" live className={styles.agentsPanel}>
          <div className={styles.agentsGrid}>
            {agents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                selected={selectedAgent === agent.id}
                onClick={() => handleAgentClick(agent.id)}
              />
            ))}
          </div>
        </Panel>

        <Panel title="Leaderboard" className={styles.lbPanel}>
          <Leaderboard agents={agents} onAgentClick={handleAgentClick} selectedAgent={selectedAgent} />
        </Panel>

        <Panel title="Equity Curves — 30D" className={styles.equityPanel}>
          <div className={styles.chartWrap}>
            <EquityChart curves={curves} selectedAgent={selectedAgent} />
          </div>
        </Panel>

        <Panel title="Trade Feed" live className={styles.feedPanel}>
          <TradeFeed trades={trades} />
        </Panel>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Return</div>
            <div className={styles.statBig} style={{ color: portfolio.total_return_pct >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {portfolio.total_return_pct >= 0 ? '+' : ''}{portfolio.total_return_pct?.toFixed(1)}%
            </div>
            <div className={styles.statSub}>vs S&P +11.2% — alpha generating</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Sharpe Ratio</div>
            <div className={styles.statBig} style={{ color: 'var(--amber)' }}>{portfolio.sharpe?.toFixed(2)}</div>
            <div className={styles.statSub}>Win rate {portfolio.win_rate?.toFixed(0)}% — {portfolio.active_trades} positions open</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Max Drawdown</div>
            <div className={styles.statBig} style={{ color: 'var(--red)' }}>{portfolio.max_drawdown?.toFixed(1)}%</div>
            <div className={styles.statSub}>Risk-adjusted returns tracking</div>
          </div>
          <div className={`${styles.statCard} ${styles.eventCard}`}>
            <EventInjector onInject={handleInject} />
          </div>
        </div>
      </main>

      <TickerTape />
    </div>
  );
}