import React, { useEffect, useState, useCallback } from 'react';
import { useVault } from '../context/VaultContext';
import { secretsAPI } from '../services/api';
import { Secret, SecretCategory, CATEGORIES } from '../types';
import { encrypt } from '../services/encryption';
import Sidebar from '../components/Sidebar';
import SecretCard from '../components/SecretCard';
import SecretModal from '../components/SecretModal';
import VaultKeyModal from '../components/VaultKeyModal';
import ConfirmModal from '../components/ConfirmModal';
import styles from '../styles/secrets.module.css';

export default function SecretsPage() {
  const { isLocked, vaultKey, logActivity } = useVault();
  const [secrets, setSecrets]     = useState<Secret[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter]       = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Secret | null>(null);
  // Replaces window.confirm() — stores the deletion target
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Debounce search: only update debouncedSearch 400ms after the user stops typing.
  // This prevents firing one API call per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchSecrets = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await secretsAPI.getAll({
        category: filter !== 'All' ? filter : undefined,
        search: debouncedSearch || undefined,
      });
      setSecrets(data);
    } catch {
      // Errors handled globally by the Axios interceptor
    } finally {
      setLoading(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    if (!isLocked) fetchSecrets();
  }, [isLocked, fetchSecrets]);

  if (isLocked) return <VaultKeyModal />;

  const handleSave = async (formData: {
    title: string;
    category: SecretCategory;
    value: string;
    tags: string[];
    notes: string;
  }) => {
    if (!vaultKey) return;
    // encrypt() is now async (Web Crypto API)
    const encryptedValue = await encrypt(formData.value, vaultKey);
    const payload = {
      title: formData.title,
      category: formData.category,
      encryptedValue,
      tags: formData.tags,
      notes: formData.notes,
    };
    if (editing) {
      await secretsAPI.update(editing._id, payload);
      logActivity('edited', formData.title);
    } else {
      await secretsAPI.create(payload);
      logActivity('added', formData.title);
    }
    setShowModal(false);
    setEditing(null);
    fetchSecrets();
  };

  // Open the confirm dialog instead of calling window.confirm()
  const handleDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await secretsAPI.remove(deleteTarget.id);
      logActivity('deleted', deleteTarget.title);
      fetchSecrets();
    } catch {
      // Errors handled globally
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleEdit = (s: Secret) => {
    setEditing(s);
    setShowModal(true);
  };

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div className={`${styles.searchWrapper} form-group`} style={{ marginBottom: 0 }}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              id="secrets-search"
              type="text"
              className={`form-input ${styles.searchInput}`}
              placeholder="Search secrets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            id="secrets-filter"
            className={styles.filterSelect}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            id="add-secret-btn"
            className={`btn-primary ${styles.addBtn}`}
            onClick={() => { setEditing(null); setShowModal(true); }}
          >
            + Add Secret
          </button>
        </div>

        <p className={styles.count}>
          <span>{secrets.length}</span> secret{secrets.length !== 1 ? 's' : ''} found
        </p>

        {loading ? (
          <div className={styles.emptyState}><span className="loading-spinner" /></div>
        ) : (
          <div className={styles.grid}>
            {secrets.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔒</div>
                <div className={styles.emptyTitle}>No secrets found</div>
                <p className={styles.emptyText}>Add your first secret to get started.</p>
                <button
                  className="btn-primary"
                  style={{ marginTop: 12 }}
                  onClick={() => setShowModal(true)}
                >
                  + Add Secret
                </button>
              </div>
            ) : (
              secrets.map((s) => (
                <SecretCard key={s._id} secret={s} onEdit={handleEdit} onDelete={handleDelete} />
              ))
            )}
          </div>
        )}
      </main>

      {showModal && (
        <SecretModal
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSave={handleSave}
          editing={editing}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Secret"
          message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          confirmLabel="🗑️ Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
