import styles from './Panel.module.css';

export default function Panel({ title, live, children, style, className }) {
  return (
    <div className={`${styles.panel} ${className || ''}`} style={style}>
      {title && (
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          {live && <div className={styles.dot} />}
        </div>
      )}
      <div className={styles.body}>
        {children}
      </div>
    </div>
  );
}
