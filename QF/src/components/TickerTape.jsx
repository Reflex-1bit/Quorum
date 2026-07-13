import styles from './TickerTape.module.css';
import { TICKERS } from '../data/constants';

export default function TickerTape() {
  const items = [...TICKERS, ...TICKERS];

  return (
    <div className={styles.tape}>
      <div className={styles.inner}>
        {items.map((t, i) => (
          <span key={i} className={styles.item}>
            <span className={styles.sym}>{t.sym}</span>
            <span style={{ color: t.chg >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {t.chg >= 0 ? '+' : ''}{t.chg.toFixed(2)}%
            </span>
            <span className={styles.sep}>·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
