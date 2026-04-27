import React, { useState } from 'react';
import { getStrength } from '../services/encryption';
import StrengthMeter from './StrengthMeter';
import styles from '../styles/passwordgen.module.css';

interface Props {
  onSaveToVault?: (password: string) => void;
}

const CHARS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

type OptsKey = 'lower' | 'upper' | 'numbers' | 'symbols';
type Opts = Record<OptsKey, boolean>;

function generatePassword(length: number, opts: Opts): string {
  let charset = '';
  if (opts.lower) charset += CHARS.lower;
  if (opts.upper) charset += CHARS.upper;
  if (opts.numbers) charset += CHARS.numbers;
  if (opts.symbols) charset += CHARS.symbols;
  if (!charset) charset = CHARS.lower;

  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, v => charset[v % charset.length]).join('');
}

export default function PasswordGenerator({ onSaveToVault }: Props) {
  const [length, setLength] = useState(24);
  const [opts, setOpts] = useState<Opts>({ lower: true, upper: true, numbers: true, symbols: true });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = () => setPassword(generatePassword(length, opts));

  const copy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = password ? getStrength(password) : null;

  const toggle = (key: OptsKey) => setOpts(o => ({ ...o, [key]: !o[key] }));

  const optList: Array<{ key: OptsKey; label: string }> = [
    { key: 'lower', label: 'Lowercase (a-z)' },
    { key: 'upper', label: 'Uppercase (A-Z)' },
    { key: 'numbers', label: 'Numbers (0-9)' },
    { key: 'symbols', label: 'Symbols (!@#...)' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>🎲 Password Generator</div>
      </div>

      <div className={styles.options}>
        <div className={styles.optRow}>
          <span className={styles.optLabel}>Length</span>
          <div className={styles.lengthRow}>
            <span className={styles.lengthVal}>{length}</span>
            <input type="range" className={styles.slider} min={8} max={64} value={length} onChange={e => setLength(+e.target.value)} />
          </div>
        </div>
        {optList.map(o => (
          <div key={o.key} className={styles.optRow}>
            <span className={styles.optLabel}>{o.label}</span>
            <label className={styles.toggle}>
              <input type="checkbox" checked={opts[o.key]} onChange={() => toggle(o.key)} />
              <span className={styles.toggleSlider} />
            </label>
          </div>
        ))}
      </div>

      {password && (
        <>
          <div className={styles.output}>{password}</div>
          {strength && <div style={{ marginBottom: 14 }}><StrengthMeter strength={strength} /></div>}
        </>
      )}

      <div className={styles.actions}>
        <button id="gen-password-btn" className="btn-primary" onClick={generate}>🎲 Generate</button>
        {password && <button className="btn-secondary" onClick={copy}>{copied ? '✅ Copied!' : '📋 Copy'}</button>}
        {password && onSaveToVault && (
          <button className="btn-secondary" onClick={() => onSaveToVault(password)}>🔒 Save to Vault</button>
        )}
      </div>
    </div>
  );
}
