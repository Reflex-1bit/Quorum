import styles from './Leaderboard.module.css';

export default function Leaderboard({ agents, onAgentClick, selectedAgent }) {
  const sorted = [...agents].sort((a, b) => b.pct - a.pct);

  return (
    <div className={styles.lb}>
      {sorted.map((agent, i) => {
        const isPos = agent.pct >= 0;
        return (
          <div
            key={agent.id}
            className={`${styles.row} ${selectedAgent === agent.id ? styles.selected : ''}`}
            style={{ '--agent-color': agent.accent }}
            onClick={() => onAgentClick(agent.id)}
          >
            <div className={`${styles.rank} ${i === 0 ? styles.first : ''}`}>
              {i === 0 ? '①' : `${i + 1}`}
            </div>
            <div className={styles.info}>
              <div className={styles.name} style={{ color: agent.color }}>{agent.name}</div>
              <div className={styles.strategy}>{agent.strategy}</div>
            </div>
            <div className={styles.right}>
              <div className={styles.pct} style={{ color: isPos ? 'var(--green)' : 'var(--red)' }}>
                {isPos ? '+' : ''}{agent.pct?.toFixed(2)}%
              </div>
              <div className={styles.winRate}>{agent.win_rate ?? agent.winRate}% win</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
