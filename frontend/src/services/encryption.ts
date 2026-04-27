/**
 * Vault-X Encryption Service — Web Crypto API (AES-256-GCM + PBKDF2)
 *
 * Replaces the legacy crypto-js library which used the weak EVP_BytesToKey KDF.
 * All functions are async and use the browser's native SubtleCrypto API.
 *
 * Ciphertext format (base64 encoded):
 *   [ 16 bytes salt | 12 bytes IV | remaining bytes AES-GCM ciphertext ]
 *
 * ⚠️  MIGRATION NOTE: This format is incompatible with the old crypto-js format.
 *      Any secrets encrypted with crypto-js must be re-encrypted or wiped.
 */

const PBKDF2_ITERATIONS = 310_000;

/** Derive an AES-256-GCM CryptoKey from a string passphrase using PBKDF2 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = new TextEncoder().encode(passphrase);
  const raw = await crypto.subtle.importKey(
    'raw',
    keyMaterial,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Encrypt plaintext with the vault key. Returns a base64 string. */
export async function encrypt(plaintext: string, vaultKey: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(vaultKey, salt);

  const cipherBuf = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  // Pack: salt (16) + iv (12) + ciphertext
  const combined = new Uint8Array(16 + 12 + cipherBuf.byteLength);
  combined.set(salt, 0);
  combined.set(iv, 16);
  combined.set(new Uint8Array(cipherBuf), 28);

  return btoa(String.fromCharCode(...combined));
}

/** Decrypt a base64 ciphertext produced by encrypt(). Throws on wrong key or corruption. */
export async function decrypt(ciphertext: string, vaultKey: string): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
    const salt     = combined.slice(0, 16);
    const iv       = combined.slice(16, 28);
    const data     = combined.slice(28);

    const key = await deriveKey(vaultKey, salt);

    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(plainBuf);
  } catch {
    throw new Error('Decryption failed — incorrect vault key or corrupted data.');
  }
}

/** Calculate password entropy in bits */
export const calcEntropy = (password: string): number => {
  const charsetSize = (() => {
    let size = 0;
    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/[0-9]/.test(password)) size += 10;
    if (/[^a-zA-Z0-9]/.test(password)) size += 32;
    return size;
  })();
  return charsetSize > 0 ? Math.round(password.length * Math.log2(charsetSize)) : 0;
};

export type StrengthLevel = 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';

export const getStrength = (
  password: string
): { level: StrengthLevel; score: number; entropy: number } => {
  const entropy = calcEntropy(password);
  if (entropy < 28) return { level: 'Very Weak', score: 1, entropy };
  if (entropy < 40) return { level: 'Weak',      score: 2, entropy };
  if (entropy < 60) return { level: 'Fair',       score: 3, entropy };
  if (entropy < 80) return { level: 'Strong',     score: 4, entropy };
  return { level: 'Very Strong', score: 5, entropy };
};
