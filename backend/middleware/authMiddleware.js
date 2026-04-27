const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    // Prefer httpOnly cookie; fall back to Authorization header for API clients/testing
    const token =
      req.cookies?.vaultx_jwt ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized — no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-hashedPassword');
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized — user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized — invalid or expired token' });
  }
};

module.exports = { protect };
