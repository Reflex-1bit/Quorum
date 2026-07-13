import { useMemo } from 'react';
import { AGENTS } from '../data/constants';

export default function EquityChart({ curves, selectedAgent }) {
  const W = 600, H = 120;

  const paths = useMemo(() => {
    return AGENTS.map(agent => {
      const data = curves[agent.id];
      if (!data || data.length < 2) return null;

      const minV = Math.min(...Object.values(curves).flat());
      const maxV = Math.max(...Object.values(curves).flat());
      const range = maxV - minV || 1;

      const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((v - minV) / range) * (H - 10) - 5;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });

      const isSelected = selectedAgent === null || selectedAgent === agent.id;

      return {
        id: agent.id,
        d: `M ${pts.join(' L ')}`,
        color: agent.accent,
        opacity: isSelected ? 0.9 : 0.15,
        strokeWidth: selectedAgent === agent.id ? 2 : 1.2,
      };
    }).filter(Boolean);
  }, [curves, selectedAgent]);

  const gridLines = [0.25, 0.5, 0.75].map(p => ({
    y: H - p * (H - 10) - 5,
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      {gridLines.map((l, i) => (
        <line
          key={i}
          x1={0} y1={l.y} x2={W} y2={l.y}
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={1}
        />
      ))}
      {paths.map(p => (
        <path
          key={p.id}
          d={p.d}
          fill="none"
          stroke={p.color}
          strokeWidth={p.strokeWidth}
          opacity={p.opacity}
          style={{ transition: 'opacity 0.3s' }}
        />
      ))}
    </svg>
  );
}
