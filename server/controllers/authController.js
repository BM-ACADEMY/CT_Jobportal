const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key_123'; // Matches existing secret from index.js / auth.js expectation

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Resolve dynamic Role ID
    const requestedRole = role ? role.toLowerCase() : 'jobseeker';
    const roleDoc = await Role.findOne({ name: requestedRole });

    if (!roleDoc) {
      return res.status(400).json({ msg: 'Invalid role specified' });
    }

    user = new User({ 
      name, 
      email, 
      password, 
      role: roleDoc._id 
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Token payload expects role string to keep frontend compatible
    const payload = { 
      user: { 
        id: user.id, 
        role: roleDoc.name 
      } 
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.status(201).json({ 
        token, 
        user: { id: user.id, name: user.name, email: user.email, role: roleDoc.name } 
      });
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Populate role to get string equivalent
    let user = await User.findOne({ email }).populate('role');
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const roleName = user.role ? user.role.name : 'jobseeker';
    const payload = { 
      user: { 
        id: user.id, 
        role: roleName 
      } 
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token, 
        user: { id: user.id, name: user.name, email: user.email, role: roleName } 
      });
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).send('Server error');
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('role');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const roleName = user.role ? user.role.name : 'jobseeker';
    res.json({ id: user.id, name: user.name, email: user.email, role: roleName });
  } catch (err) {
    console.error('Get profile error:', err.message);
    res.status(500).send('Server Error');
  }
}

module.exports = {
  registerUser,
  loginUser,
  getMe
};
