import styles from './EventInjector.module.css';
import { EVENTS } from '../data/constants';

export default function EventInjector({ onInject }) {
  return (
    <div className={styles.injector}>
      <div className={styles.label}>INJECT MARKET EVENT</div>
      <div className={styles.buttons}>
        {EVENTS.map(e => (
          <button key={e.label} className={styles.btn} onClick={() => onInject(e)}>
            {e.label}
          </button>
        ))}
      </div>
    </div>
  );
}
