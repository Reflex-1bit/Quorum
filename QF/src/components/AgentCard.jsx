import styles from './AgentCard.module.css';

const MODEL_BADGE = {
  claude: { label: 'CLAUDE', color: 'var(--purple)' },
  perplexity: { label: 'PPLX', color: 'var(--blue)' },
  gpt: { label: 'GPT-4o', color: 'var(--green)' },
};

export default function AgentCard({ agent, selected, onClick }) {
  const isPos = agent.pnl >= 0;
  const pnlStr = `${isPos ? '+' : ''}$${Math.abs(agent.pnl).toLocaleString()}`;
  const badge = MODEL_BADGE[agent.model] || MODEL_BADGE.claude;
  const barWidth = Math.min(100, Math.abs(agent.pct) * 10);

  return (
    <div
      className={`${styles.card} ${selected ? styles.selected : ''}`}
      style={{ '--agent-color': agent.accent }}
      onClick={onClick}
    >
      <div className={styles.topStripe} style={{ background: agent.accent }} />

      <div className={styles.header}>
        <span className={styles.name} style={{ color: agent.color }}>{agent.name}</span>
        <span className={styles.modelBadge} style={{ color: badge.color, borderColor: badge.color }}>
          {badge.label}
        </span>
      </div>

      <div className={styles.pnl} style={{ color: isPos ? 'var(--green)' : 'var(--red)' }}>
        {pnlStr}
      </div>

      <div className={styles.pct} style={{ color: isPos ? 'var(--green)' : 'var(--red)' }}>
        {isPos ? '+' : ''}{agent.pct.toFixed(2)}%
      </div>

      <div className={styles.meta}>
        <span>{agent.trades} trades</span>
        <span>{agent.winRate}% win</span>
      </div>

      <div className={styles.barBg}>
        <div
          className={styles.barFill}
          style={{ width: `${barWidth}%`, background: agent.accent }}
        />
      </div>
    </div>
  );
}
