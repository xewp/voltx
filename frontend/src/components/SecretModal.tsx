import React, { useState, useEffect } from 'react';
import { Secret, SecretCategory, SecretFormData, CATEGORIES } from '../types';
import { useVault } from '../context/VaultContext';
import { decrypt, getStrength } from '../services/encryption';
import StrengthMeter from './StrengthMeter';
import styles from '../styles/modal.module.css';

interface Props {
  onClose: () => void;
  onSave: (data: SecretFormData & { value: string }) => Promise<void>;
  editing: Secret | null;
}

export default function SecretModal({ onClose, onSave, editing }: Props) {
  const { vaultKey }  = useVault();
  const [title, setTitle]         = useState('');
  const [category, setCategory]   = useState<SecretCategory>('Custom');
  const [value, setValue]         = useState('');
  const [notes, setNotes]         = useState('');
  const [tags, setTags]           = useState<string[]>([]);
  const [tagInput, setTagInput]   = useState('');
  const [showVal, setShowVal]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  // decrypt() is now async — use an inner async IIFE inside the effect
  useEffect(() => {
    if (editing && vaultKey) {
      setTitle(editing.title);
      setCategory(editing.category);
      setNotes(editing.notes);
      setTags(editing.tags);
      (async () => {
        try {
          setValue(await decrypt(editing.encryptedValue, vaultKey));
        } catch {
          setError('Cannot decrypt with current vault key.');
        }
      })();
    }
  }, [editing, vaultKey]);

  const addTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) { setError('Secret value cannot be empty.'); return; }
    setLoading(true);
    try {
      await onSave({ title, category, value, tags, notes });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save secret.');
    } finally {
      setLoading(false);
    }
  };

  const strength = value ? getStrength(value) : null;

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <span>{editing ? '✏️' : '➕'}</span>
            {editing ? 'Edit Secret' : 'Add New Secret'}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && (
              <div role="alert" style={{ padding: '10px 14px', background: 'var(--danger-dim)', border: '1px solid rgba(224,82,82,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--danger)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Title</label>
              <input id="secret-title" type="text" className="form-input"
                placeholder="e.g. Stripe API Key" value={title}
                onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select id="secret-category" className="form-input" value={category}
                onChange={(e) => setCategory(e.target.value as SecretCategory)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Secret Value</label>
              <div className={styles.valueWrapper}>
                <input id="secret-value" type={showVal ? 'text' : 'password'} className="form-input"
                  placeholder="Paste your secret here..." value={value}
                  onChange={(e) => setValue(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)', paddingRight: 44 }} />
                <button type="button" className={styles.toggleBtn}
                  onClick={() => setShowVal(!showVal)}
                  aria-label={showVal ? 'Hide secret value' : 'Show secret value'}>
                  {showVal ? '🙈' : '👁️'}
                </button>
              </div>
              {strength && <StrengthMeter strength={strength} />}
            </div>

            <div className="form-group">
              <label className="form-label">
                Tags <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(press Enter)</span>
              </label>
              <div className={styles.tagsInput} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '8px 12px', minHeight: 44 }}>
                {tags.map((t) => (
                  <span key={t} className={styles.tagChip}>{t}
                    <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}>✕</button>
                  </span>
                ))}
                <input className={styles.tagField} placeholder="Add tag..."
                  value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <textarea id="secret-notes" className="form-input"
                placeholder="Additional context..." value={notes}
                onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button id="save-secret-btn" type="submit" className="btn-primary" disabled={loading}>
              {loading ? '⏳ Saving...' : editing ? '✅ Update Secret' : '🔒 Encrypt & Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
