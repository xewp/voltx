import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import { secretsAPI } from '../services/api';
import { Secret, CATEGORY_ICONS } from '../types';
import Sidebar from '../components/Sidebar';
import VaultKeyModal from '../components/VaultKeyModal';
import styles from '../styles/dashboard.module.css';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default function DashboardPage() {
  const { user } = useAuth();
  const { isLocked, vaultKey } = useVault();
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If the vault is locked, reset loading to false so we don't leave it stuck.
    // When it unlocks, isLocked changes to false and we fetch secrets then.
    if (isLocked) {
      setLoading(false);
      return;
    }
    setLoading(true);
    secretsAPI
      .getAll()
      .then((r) => setSecrets(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLocked]);

  if (isLocked) return <VaultKeyModal />;

  const categories = [...new Set(secrets.map((s) => s.category))];
  const recent     = secrets.slice(0, 5);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.greeting}>
            {greeting}, <span>{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className={styles.subtitle}>
            Your vault is unlocked and secured with AES-256-GCM encryption.
          </p>
        </div>

        <div className={styles.statsGrid}>
          {[
            { icon: '🔑', value: secrets.length,                             label: 'Total Secrets' },
            { icon: '📂', value: categories.length,                          label: 'Categories Used' },
            { icon: '⭐', value: secrets.filter((s) => s.favorite).length,   label: 'Favourites' },
            { icon: '🛡️', value: 'AES-256-GCM',                             label: 'Encryption' },
          ].map((stat, i) => (
            <div key={i} className={styles.statCard}>
              <span className={styles.statIcon}>{stat.icon}</span>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.sections}>
          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>Recent Secrets</div>
            {loading ? (
              <div className={styles.emptyState}>Loading...</div>
            ) : recent.length === 0 ? (
              <div className={styles.emptyState}>No secrets yet. Add your first one!</div>
            ) : (
              <div className={styles.recentList}>
                {recent.map((s) => (
                  <div key={s._id} className={styles.recentItem}>
                    <div className={styles.recentIcon}>{CATEGORY_ICONS[s.category]}</div>
                    <div className={styles.recentInfo}>
                      <div className={styles.recentTitle}>{s.title}</div>
                      <div className={styles.recentCat}>{s.category}</div>
                    </div>
                    <div className={styles.recentDate}>{formatDate(s.updatedAt)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>Security Status</div>
            <div className={styles.securityStatus}>
              {[
                { label: 'Vault Encryption',  status: 'AES-256-GCM',       ok: true },
                { label: 'Vault Key',          status: vaultKey ? 'In Memory Only' : 'Not Set', ok: !!vaultKey },
                { label: 'Session',            status: 'Active',            ok: true },
                { label: 'Auto-Lock',          status: '5 min inactivity',  ok: true },
                { label: 'Data on Server',     status: 'Encrypted Only',    ok: true },
                { label: 'Auth Transport',     status: 'httpOnly Cookie',   ok: true },
              ].map((row, i) => (
                <div key={i} className={styles.statusRow}>
                  <span className={styles.statusLabel}>{row.label}</span>
                  <span className={`${styles.statusBadge} ${row.ok ? styles.ok : styles.warn}`}>
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
