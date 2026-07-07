const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (userId, roleName) => {
  return jwt.sign(
    { id: userId, role: roleName },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '365d' }
  );
};

console.log(generateToken('60d5ecb74d6bb89287413d71', 'jobseeker'));
