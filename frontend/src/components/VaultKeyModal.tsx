import React, { useState } from 'react';
import { useVault } from '../context/VaultContext';
import styles from '../styles/modal.module.css';

export default function VaultKeyModal() {
  const { unlockVault, registerVaultKey, hasRegisteredKey } = useVault();
  const [key, setKey] = useState('');
  const [confirmKey, setConfirmKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegistering = !hasRegisteredKey;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (key.trim().length < 8) {
      setError('Vault key must be at least 8 characters.');
      return;
    }

    if (isRegistering) {
      if (key !== confirmKey) {
        setError('Keys do not match. Please confirm your vault key.');
        return;
      }
      setLoading(true);
      await registerVaultKey(key.trim());
      setLoading(false);
    } else {
      setLoading(true);
      const ok = await unlockVault(key.trim());
      setLoading(false);
      if (!ok) {
        setError('Incorrect vault key. Please try again.');
        setKey('');
      }
    }
  };

  return (
    <div className={styles.overlay} style={{ background: 'var(--bg-primary)' }}>
      <div className={styles.vaultCard}>
        <span className={styles.lockIcon}>{isRegistering ? '🔑' : '🔐'}</span>
        <h1 className={styles.vaultTitle}>
          {isRegistering ? 'Create Vault Key' : 'Vault Locked'}
        </h1>
        <p className={styles.vaultSubtitle}>
          {isRegistering ? (
            <>
              Set a <strong style={{ color: 'var(--accent-gold)' }}>Vault Key</strong> to encrypt your secrets.<br />
              You will need this key every time you unlock the vault.
            </>
          ) : (
            <>
              Enter your <strong style={{ color: 'var(--accent-gold)' }}>Vault Key</strong> to decrypt your secrets.<br />
              This key never leaves your device.
            </>
          )}
        </p>

        {error && (
          <div className="form-group" style={{ marginBottom: 12 }}>
            <div style={{ padding: '10px 14px', background: 'var(--danger-dim)', border: '1px solid rgba(224,82,82,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.85rem' }}>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Vault Key</label>
            <div style={{ position: 'relative' }}>
              <input
                id="vault-key-input"
                type={showKey ? 'text' : 'password'}
                className="form-input mono"
                placeholder={isRegistering ? 'Create a vault key...' : 'Enter your vault key...'}
                value={key}
                onChange={e => { setKey(e.target.value); setError(''); }}
                autoFocus
                style={{ paddingRight: 44 }}
              />
              <button type="button" className={styles.toggleBtn} onClick={() => setShowKey(!showKey)}>
                {showKey ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {isRegistering && (
            <div className="form-group">
              <label className="form-label">Confirm Vault Key</label>
              <input
                id="vault-key-confirm-input"
                type={showKey ? 'text' : 'password'}
                className="form-input mono"
                placeholder="Confirm your vault key..."
                value={confirmKey}
                onChange={e => { setConfirmKey(e.target.value); setError(''); }}
              />
            </div>
          )}

          <button
            id="unlock-vault-btn"
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: 13 }}
            disabled={loading}
          >
            {loading ? '⏳ Please wait...' : isRegistering ? '🔑 Create & Unlock Vault' : '🔓 Unlock Vault'}
          </button>
        </form>

        <p className={styles.hint}>
          {isRegistering
            ? '⚠️ There is no way to recover a lost vault key. Store it safely.'
            : '⚠️ Your vault key is never stored or sent to any server.'}
        </p>
      </div>
    </div>
  );
}
