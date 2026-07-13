import { useEffect, useRef } from 'react';
import styles from './TradeFeed.module.css';

const TYPE_COLORS = {
  buy: 'var(--green)',
  sell: 'var(--red)',
  debate: 'var(--amber)',
};

export default function TradeFeed({ trades }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [trades.length]);

  return (
    <div className={styles.feed} ref={ref}>
      {trades.map((t, i) => (
        <div
          key={t.id}
          className={`${styles.item} ${styles[t.type]}`}
          style={{ '--type-color': TYPE_COLORS[t.type] }}
        >
          <div className={styles.top}>
            <span className={styles.agent}>{t.agent}</span>
            <span className={styles.badge} style={{ background: `${TYPE_COLORS[t.type]}1a`, color: TYPE_COLORS[t.type] }}>
              {t.action}
            </span>
            {t.ticker && <span className={styles.ticker}>{t.ticker}</span>}
            {t.price && (
              <span className={styles.price}>
                @ ${t.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            )}
            <span className={styles.time}>{t.time}</span>
          </div>
          <div className={styles.reason}>{t.reason}</div>
        </div>
      ))}
    </div>
  );
}
