import React from 'react';
import { ActivityEntry } from '../types';
import { useVault } from '../context/VaultContext';

const ACTION_ICON: Record<ActivityEntry['action'], string> = {
  added: '➕', viewed: '👁️', copied: '📋',
  edited: '✏️', deleted: '🗑️', locked: '🔒', unlocked: '🔓',
};

const ACTION_COLOR: Record<ActivityEntry['action'], string> = {
  added: 'var(--success)', viewed: 'var(--accent-gold)', copied: 'var(--info, #52a0e0)',
  edited: 'var(--warning)', deleted: 'var(--danger)', locked: 'var(--text-muted)', unlocked: 'var(--success)',
};

const fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

export default function ActivityLog() {
  const { activityLog } = useVault();

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        📋 Session Activity
        <span style={{ fontSize: '0.7rem', background: 'var(--accent-glow)', color: 'var(--accent-gold)', border: '1px solid var(--border-card)', borderRadius: 20, padding: '1px 8px' }}>{activityLog.length}</span>
      </div>

      {activityLog.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>No activity yet this session.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
          {activityLog.map(entry => (
            <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '1rem' }}>{ACTION_ICON[entry.action]}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: ACTION_COLOR[entry.action], textTransform: 'capitalize' }}>{entry.action}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}> — {entry.target}</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{fmtTime(entry.timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
