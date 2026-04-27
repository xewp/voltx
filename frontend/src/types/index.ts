export type SecretCategory =
  | 'API Keys'
  | 'Database'
  | 'Tokens'
  | 'SSH'
  | 'Environment Variables'
  | 'Passwords'
  | 'Custom';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Secret {
  _id: string;
  userId: string;
  title: string;
  category: SecretCategory;
  encryptedValue: string;
  iv: string;
  tags: string[];
  notes: string;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecretFormData {
  title: string;
  category: SecretCategory;
  value: string;
  tags: string[];
  notes: string;
}

export interface ActivityEntry {
  id: string;
  action: 'added' | 'viewed' | 'copied' | 'edited' | 'deleted' | 'locked' | 'unlocked';
  target: string;
  timestamp: Date;
}

export const CATEGORIES: SecretCategory[] = [
  'API Keys', 'Database', 'Tokens', 'SSH', 'Environment Variables', 'Passwords', 'Custom',
];

export const CATEGORY_ICONS: Record<SecretCategory, string> = {
  'API Keys': '🔑',
  'Database': '🗄️',
  'Tokens': '🪙',
  'SSH': '🔐',
  'Environment Variables': '⚙️',
  'Passwords': '🛡️',
  'Custom': '📦',
};
