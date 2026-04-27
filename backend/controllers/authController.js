const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const generateToken = require('../utils/generateToken');

// Shared cookie options — httpOnly prevents JS access (XSS protection)
const cookieOptions = (req) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const salt = await bcrypt.genSalt(12);
    // Use a distinct local variable name to avoid shadowing the schema field
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, hashedPassword: passwordHash });
    const token = generateToken(user._id);

    res.cookie('vaultx_jwt', token, cookieOptions(req));
    res.status(201).json({
      message: 'Account created successfully',
      user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error('[register]', err.message);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id);

    res.cookie('vaultx_jwt', token, cookieOptions(req));
    res.json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    console.error('[login]', err.message);
    res.status(500).json({ message: 'Login failed' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, name: user.name, email: user.email, createdAt: user.createdAt });
  } catch (err) {
    console.error('[getMe]', err.message);
    res.status(500).json({ message: 'Failed to get user info' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('vaultx_jwt', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ message: 'Logged out successfully' });
};
