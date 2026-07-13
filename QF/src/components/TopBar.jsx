import { useState, useEffect } from 'react';
import styles from './TopBar.module.css';

const MODES = ['SIM', 'PAPER', 'LIVE'];

export default function TopBar({ mode, onModeChange, portfolio, dayPnl, activeTrades }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
  const isPositive = dayPnl >= 0;

  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <div className={styles.logo}>
          QUO<span className={styles.accent}>R</span>UM
        </div>
        <div className={styles.tagline}>MULTI-AGENT HEDGE FUND</div>
      </div>

      <div className={styles.center}>
        {MODES.map(m => (
          <button
            key={m}
            className={`${styles.modeBtn} ${mode === m ? styles.active : ''} ${m === 'LIVE' ? styles.live : ''}`}
            onClick={() => onModeChange(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <div className={styles.right}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Portfolio NAV</span>
          <span className={styles.statVal} style={{ color: 'var(--text-primary)' }}>{fmt(portfolio)}</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={styles.statLabel}>Day P&amp;L</span>
          <span className={styles.statVal} style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}>
            {isPositive ? '+' : ''}{fmt(dayPnl)}
          </span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={styles.statLabel}>Active Trades</span>
          <span className={styles.statVal} style={{ color: 'var(--amber)' }}>{activeTrades}</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={styles.statLabel}>Market Time</span>
          <span className={styles.statVal} style={{ color: 'var(--text-secondary)' }}>
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </span>
        </div>
      </div>
    </header>
  );
}
