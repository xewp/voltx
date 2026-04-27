const express = require('express');
const { body } = require('express-validator');
const { getSecrets, createSecret, updateSecret, deleteSecret } = require('../controllers/secretController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

const VALID_CATEGORIES = ['API Keys', 'Database', 'Tokens', 'SSH', 'Environment Variables', 'Passwords', 'Custom'];

router.get('/', getSecrets);

router.post('/', [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required'),
  body('category').isIn(VALID_CATEGORIES).withMessage('Invalid category'),
  body('encryptedValue').notEmpty().withMessage('Encrypted value is required'),
], createSecret);

router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 100 }),
  body('category').optional().isIn(VALID_CATEGORIES),
], updateSecret);

router.delete('/:id', deleteSecret);

module.exports = router;
