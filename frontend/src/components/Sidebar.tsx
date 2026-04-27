import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useVault } from '../context/VaultContext';
import styles from '../styles/sidebar.module.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { lockVault }    = useVault();
  const navigate         = useNavigate();

  // logout is now async (calls /api/auth/logout to clear httpOnly cookie)
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/secrets',   icon: '🔑', label: 'My Secrets' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <div className={styles.logoIcon}>🔐</div>
        <div className={styles.logoText}>Vault<span>-X</span></div>
      </div>

      <span className={styles.sectionLabel}>Navigation</span>
      {navItems.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          className={({ isActive }) => `${styles.navLink}${isActive ? ' ' + styles.active : ''}`}
        >
          <span className={styles.navIcon}>{n.icon}</span>{n.label}
        </NavLink>
      ))}

      <div className={styles.spacer} />

      {/* lockVault is used directly — no pointless wrapper function */}
      <button id="lock-vault-btn" className={styles.lockBtn} onClick={lockVault}>
        <span className={styles.navIcon}>🔒</span> Lock Vault
      </button>
      <button id="logout-btn" className={styles.lockBtn} onClick={handleLogout}>
        <span className={styles.navIcon}>🚪</span> Sign Out
      </button>

      <div className={styles.userBox}>
        <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
        <div>
          <div className={styles.userName}>{user?.name}</div>
          <div className={styles.userEmail}>{user?.email}</div>
        </div>
      </div>
    </aside>
  );
}
