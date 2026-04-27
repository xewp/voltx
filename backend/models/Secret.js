const mongoose = require('mongoose');

const CATEGORIES = ['API Keys', 'Database', 'Tokens', 'SSH', 'Environment Variables', 'Passwords', 'Custom'];

const secretSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'Custom',
    },
    encryptedValue: {
      type: String,
      required: [true, 'Encrypted value is required'],
    },
    // iv is now embedded in the encryptedValue blob (AES-GCM format: salt+iv+ciphertext)
    // Kept for backward-compatibility with any existing records
    iv: { type: String, default: '' },
    tags: { type: [String], default: [] },
    notes: {
      type: String,
      default: '',
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    favorite: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Compound index: covers userId+category filter queries sorted by updatedAt
secretSchema.index({ userId: 1, category: 1, updatedAt: -1 });

// Text index: enables server-side full-text search on title, notes, tags
secretSchema.index({ title: 'text', notes: 'text', tags: 'text' });

module.exports = mongoose.model('Secret', secretSchema);
