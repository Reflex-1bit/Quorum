import styles from './StatusBar.module.css';

export default function StatusBar({ status, error, isLive, onRun, onReset, tickers, onTickersChange }) {
  const statusConfig = {
    idle: { label: 'SIM MODE — BACKEND OFFLINE', color: 'var(--text-muted)', dot: 'dim' },
    loading: { label: 'FETCHING LIVE DATA...', color: 'var(--amber)', dot: 'amber' },
    live: { label: 'LIVE — REAL MARKET DATA', color: 'var(--green)', dot: 'green' },
    error: { label: `ERROR: ${error || 'backend unreachable'}`, color: 'var(--red)', dot: 'red' },
  };

  const cfg = statusConfig[status] || statusConfig.idle;

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <div className={`${styles.dot} ${styles[cfg.dot]}`} />
        <span className={styles.label} style={{ color: cfg.color }}>{cfg.label}</span>
      </div>

      <div className={styles.center}>
        <span className={styles.tickerLabel}>TICKERS:</span>
        <input
          className={styles.tickerInput}
          value={tickers.join(', ')}
          onChange={e => onTickersChange(e.target.value.split(',').map(t => t.trim().toUpperCase()).filter(Boolean))}
          placeholder="NVDA, AAPL, TSLA..."
        />
      </div>

      <div className={styles.right}>
        <button
          className={`${styles.btn} ${styles.runBtn}`}
          onClick={onRun}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'RUNNING...' : '▶ RUN AGENTS'}
        </button>
        <button className={`${styles.btn} ${styles.resetBtn}`} onClick={onReset}>
          RESET
        </button>
      </div>
    </div>
  );
}
