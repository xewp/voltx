import React from 'react';

interface StrengthInfo { level: string; score: number; entropy: number; }

const COLORS = ['', '#e05252', '#e0b852', '#c9a84c', '#52c48a', '#52c4c4'];
const BG = ['', 'var(--danger-dim)', 'var(--warning-dim)', 'rgba(201,168,76,0.1)', 'var(--success-dim)', 'rgba(82,196,196,0.1)'];

export default function StrengthMeter({ strength }: { strength: StrengthInfo }) {
  const { score, level, entropy } = strength;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? COLORS[score] : 'var(--bg-surface)', transition: 'all 0.3s ease' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
        <span style={{ color: COLORS[score], fontWeight: 600, padding: '2px 8px', background: BG[score], borderRadius: 20 }}>{level}</span>
        <span style={{ color: 'var(--text-muted)' }}>{entropy} bits entropy</span>
      </div>
    </div>
  );
}
