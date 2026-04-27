import React, { useState } from 'react';
import { Secret, CATEGORY_ICONS } from '../types';
import { useVault } from '../context/VaultContext';
import { decrypt } from '../services/encryption';

interface Props {
  secret: Secret;
  onEdit: (s: Secret) => void;
  onDelete: (id: string, title: string) => void;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-card)',
  borderRadius: 'var(--radius-lg)', padding: '20px 22px',
  transition: 'all 0.2s ease', animation: 'fadeUp 0.35s ease forwards',
  display: 'flex', flexDirection: 'column', gap: 12, position: 'relative',
};

export default function SecretCard({ secret, onEdit, onDelete }: Props) {
  const { vaultKey, logActivity } = useVault();
  const [revealed, setRevealed]   = useState(false);
  const [decrypted, setDecrypted] = useState('');
  const [copyMsg, setCopyMsg]     = useState('');
  const [error, setError]         = useState('');
  const [hover, setHover]         = useState(false);

  // decrypt() is now async (Web Crypto API)
  const handleReveal = async () => {
    if (!vaultKey) return;
    if (revealed) { setRevealed(false); setDecrypted(''); return; }
    try {
      const val = await decrypt(secret.encryptedValue, vaultKey);
      setDecrypted(val); setRevealed(true); setError('');
      logActivity('viewed', secret.title);
    } catch {
      setError('Wrong vault key or corrupted data.');
    }
  };

  const handleCopy = async () => {
    if (!vaultKey) return;
    try {
      const val = revealed ? decrypted : await decrypt(secret.encryptedValue, vaultKey);
      await navigator.clipboard.writeText(val);
      setCopyMsg('Copied! Clears in 20s');
      logActivity('copied', secret.title);
      setTimeout(() => setCopyMsg(''), 20000);
    } catch {
      setError('Copy failed.');
    }
  };

  return (
    <div
      style={{
        ...cardStyle,
        borderColor: hover ? 'var(--accent-gold)' : 'var(--border-card)',
        boxShadow: hover ? 'var(--shadow-gold)' : 'none',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ width: 40, height: 40, background: 'var(--accent-glow)', border: '1px solid var(--border-card)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
          {CATEGORY_ICONS[secret.category]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {secret.title}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {secret.category}
          </div>
        </div>
        {secret.favorite && <span title="Favourite" aria-label="Favourite">⭐</span>}
      </div>

      {/* Value display */}
      <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: revealed ? 'var(--accent-gold)' : 'var(--text-muted)', wordBreak: 'break-all', minHeight: 40 }}>
        {revealed ? decrypted : '•••••••••••••••••••••'}
      </div>

      {error   && <div role="alert" style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>{error}</div>}
      {copyMsg && <div role="status" style={{ fontSize: '0.78rem', color: 'var(--success)' }}>✅ {copyMsg}</div>}

      {/* Tags */}
      {secret.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {secret.tags.map((t) => <span key={t} className="badge">{t}</span>)}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button
          className="btn-icon"
          onClick={handleReveal}
          aria-label={revealed ? 'Hide secret value' : 'Reveal secret value'}
          title={revealed ? 'Hide' : 'Reveal'}
        >
          {revealed ? '🙈' : '👁️'}
        </button>
        <button
          className="btn-icon"
          onClick={handleCopy}
          aria-label="Copy secret value to clipboard"
          title="Copy"
        >
          📋
        </button>
        <button
          className="btn-icon"
          onClick={() => onEdit(secret)}
          aria-label={`Edit ${secret.title}`}
          title="Edit"
        >
          ✏️
        </button>
        <button
          className="btn-icon"
          onClick={() => onDelete(secret._id, secret.title)}
          aria-label={`Delete ${secret.title}`}
          title="Delete"
          style={{ marginLeft: 'auto', color: 'var(--danger)' }}
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
