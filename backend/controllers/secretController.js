const Secret = require('../models/Secret');
const { validationResult } = require('express-validator');

exports.getSecrets = async (req, res) => {
  try {
    const { category, search } = req.query;

    // Always filter by the authenticated user
    const filter = { userId: req.user.id };

    if (category && category !== 'All') {
      filter.category = category;
    }

    // Use MongoDB text search instead of in-memory JS filtering.
    // Requires the text index defined in Secret.js.
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    const secrets = await Secret.find(filter).sort({ updatedAt: -1 });
    res.json(secrets);
  } catch (err) {
    console.error('[getSecrets]', err.message);
    res.status(500).json({ message: 'Failed to fetch secrets' });
  }
};

exports.createSecret = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { title, category, encryptedValue, iv, tags, notes } = req.body;
    const secret = await Secret.create({
      userId: req.user.id,
      title,
      category,
      encryptedValue,
      iv: iv || '',
      tags: tags || [],
      notes: notes || '',
    });
    res.status(201).json(secret);
  } catch (err) {
    console.error('[createSecret]', err.message);
    res.status(500).json({ message: 'Failed to create secret' });
  }
};

exports.updateSecret = async (req, res) => {
  try {
    // findOne with userId enforces ownership — prevents accessing other users' secrets
    const secret = await Secret.findOne({ _id: req.params.id, userId: req.user.id });
    if (!secret) return res.status(404).json({ message: 'Secret not found' });

    const fields = ['title', 'category', 'encryptedValue', 'iv', 'tags', 'notes', 'favorite'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) secret[f] = req.body[f];
    });

    await secret.save();
    res.json(secret);
  } catch (err) {
    console.error('[updateSecret]', err.message);
    res.status(500).json({ message: 'Failed to update secret' });
  }
};

exports.deleteSecret = async (req, res) => {
  try {
    const secret = await Secret.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!secret) return res.status(404).json({ message: 'Secret not found' });
    res.json({ message: 'Secret deleted successfully' });
  } catch (err) {
    console.error('[deleteSecret]', err.message);
    res.status(500).json({ message: 'Failed to delete secret' });
  }
};
