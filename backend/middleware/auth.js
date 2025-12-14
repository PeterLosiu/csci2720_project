// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.js'); // <-- note: ../models/user.js

// Require any logged-in user (user OR admin)
const protect = async (req, res, next) => {
  let token;

  // Expect header: Authorization: Bearer <token>
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev_jwt_secret' // use env var in production
    );

    // decoded should contain { id, isAdmin } from your login controller
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // attach user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('auth protect error:', err);
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// Only allow admins
const adminOnly = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res
      .status(403)
      .json({ message: 'Admin only: you do not have permission' });
  }
  next();
};

module.exports = {
  protect,
  adminOnly,
};