import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { ActivityEntry } from '../types';

const VAULT_KEY_HASH_STORAGE = 'vaultx_key_hash';
const PBKDF2_ITERATIONS = 300_000;

/**
 * Derive a slow hash of the vault key using PBKDF2-SHA256.
 * Much stronger than plain SHA-256 — a GPU cannot brute-force this in reasonable time.
 */
async function deriveVaultKeyHash(key: string): Promise<string> {
  const enc  = new TextEncoder();
  // Static salt is acceptable here — the hash is used only for local verification,
  // not for password storage. Per-user uniqueness is not needed.
  const salt = enc.encode('vaultx-key-verification-salt-v2');
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

interface VaultContextType {
  vaultKey: string | null;
  isLocked: boolean;
  hasRegisteredKey: boolean;
  activityLog: ActivityEntry[];
  unlockVault: (key: string) => Promise<boolean>;
  registerVaultKey: (key: string) => Promise<void>;
  lockVault: () => void;
  logActivity: (action: ActivityEntry['action'], target: string) => void;
  resetInactivityTimer: () => void;
}

const VaultContext = createContext<VaultContextType | null>(null);

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutes

export const VaultProvider = ({ children }: { children: ReactNode }) => {
  const [vaultKey, setVaultKey]           = useState<string | null>(null);
  const [isLocked, setIsLocked]           = useState(true);
  const [hasRegisteredKey, setHasRegisteredKey] = useState<boolean>(
    !!localStorage.getItem(VAULT_KEY_HASH_STORAGE)
  );
  const [activityLog, setActivityLog]     = useState<ActivityEntry[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logActivity = useCallback((action: ActivityEntry['action'], target: string) => {
    const entry: ActivityEntry = {
      id: crypto.randomUUID(),
      action,
      target,
      timestamp: new Date(),
    };
    setActivityLog((prev) => [entry, ...prev].slice(0, 50));
  }, []);

  const lockVault = useCallback(() => {
    setVaultKey(null);
    setIsLocked(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    logActivity('locked', 'vault');
  }, [logActivity]);

  const resetInactivityTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => lockVault(), INACTIVITY_MS);
  }, [lockVault]);

  const registerVaultKey = useCallback(async (key: string) => {
    const hash = await deriveVaultKeyHash(key);
    localStorage.setItem(VAULT_KEY_HASH_STORAGE, hash);
    setHasRegisteredKey(true);
    setVaultKey(key);
    setIsLocked(false);
    resetInactivityTimer();
    logActivity('unlocked', 'vault');
  }, [logActivity, resetInactivityTimer]);

  const unlockVault = useCallback(async (key: string): Promise<boolean> => {
    const storedHash = localStorage.getItem(VAULT_KEY_HASH_STORAGE);

    if (storedHash) {
      const inputHash = await deriveVaultKeyHash(key);
      if (inputHash !== storedHash) {
        return false; // wrong key
      }
    }

    setVaultKey(key);
    setIsLocked(false);
    resetInactivityTimer();
    logActivity('unlocked', 'vault');
    return true;
  }, [logActivity, resetInactivityTimer]);

  // Attach inactivity listeners only while vault is unlocked
  useEffect(() => {
    if (!vaultKey) return;
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => resetInactivityTimer();
    events.forEach((e) => window.addEventListener(e, handler));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [vaultKey, resetInactivityTimer]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <VaultContext.Provider
      value={{
        vaultKey, isLocked, hasRegisteredKey, activityLog,
        unlockVault, registerVaultKey, lockVault, logActivity, resetInactivityTimer,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = (): VaultContextType => {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used within VaultProvider');
  return ctx;
};
