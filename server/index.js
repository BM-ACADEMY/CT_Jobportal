require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const recruiterRoutes = require('./routes/recruiter');
const jobRoutes = require('./routes/job');
const seedRoles = require('./config/seedRoles');
const path = require('path');

const session = require('express-session');
const passport = require('passport');

require('./config/passport'); // Passport Configuration

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Static folder for file uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Session Middleware (needed for OAuth state management)
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback_session_secret',
  resave: false,
  saveUninitialized: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/recruiter', recruiterRoutes);
app.use('/api/jobs', jobRoutes);


// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal';

console.log(`Connecting to MongoDB at: ${MONGODB_URI.replace(/\/\/.*@/, '//****:****@')}`);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB');
    await seedRoles();
  })
  .catch((err) => {
    console.error('MongoDB connection error details:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('TIP: Make sure your MongoDB service is running and accessible.');
    }
  });

app.get('/', (req, res) => {
  res.send('Job Portal API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
