require('dotenv').config();
const jwt = require('jsonwebtoken');

const { getJwtSecret } = require('../config/jwt');
const User = require('../models/User');

const verifyToken = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, getJwtSecret());
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid' });
  }

  req.user = decoded.user || decoded;

  // A token is valid for days, so a block applied by an admin must take effect immediately.
  // Admin-panel accounts live in a separate collection, so a missing User row is fine here.
  try {
    const account = await User.findById(req.user.id).select('isAdminBlocked').lean();
    if (account && account.isAdminBlocked) {
      return res.status(403).json({ msg: 'Access denied: Account blocked.' });
    }
  } catch (err) {
    console.error('Auth block check failed:', err.message);
    return res.status(503).json({ msg: 'Service temporarily unavailable' });
  }
  next();
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

const optionalVerifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.user = decoded.user || decoded;
    next();
  } catch (err) {
    // If token is invalid, we still proceed but without req.user
    console.warn(`Optional JWT Verification Failed: ${err.message}`);
    next();
  }
};

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied: Admin only' });
  }
};

module.exports = {
  verifyToken,
  optionalVerifyToken,
  authorizeRoles,
  isAdmin
};
