import React from 'react';
import styles from '../styles/modal.module.css';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirmation dialog — replaces window.confirm() across the app.
 * Clicking the backdrop cancels the action.
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className={styles.confirmCard}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <span>{danger ? '🗑️' : '❓'}</span>
            {title}
          </div>
        </div>
        <div className={styles.confirmBody}>
          <p>{message}</p>
        </div>
        <div className={styles.modalFooter}>
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
