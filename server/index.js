require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const recruiterRoutes = require('./routes/recruiter');
const jobRoutes = require('./routes/job');
const companyRoutes = require('./routes/company');
const applicationRoutes = require('./routes/application');
const adminRoutes = require('./routes/adminRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const publicRoutes = require('./routes/publicRoutes');
const messageRoutes = require('./routes/messageRoutes');
const requestRoutes = require('./routes/requests');
const settingsRoutes = require('./routes/settingsRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const collaborationRoutes = require('./routes/collaborationRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const payPerRoutes = require('./routes/payPerRoutes');
const collegeRoutes = require('./routes/collegeRoutes');
const skillTestRoutes = require('./routes/skillTestRoutes');
const whatsappRoutes = require('./routes/whatsapp');
const couponRoutes = require('./routes/couponRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const seedRoles = require('./config/seedRoles');
const seedAdmin = require('./config/seedAdmin');
const { seedSubscriptions, migrateUsersToFreePlan } = require('./config/seedSubscriptions');
const { startCronJobs } = require('./cron');
const path = require('path');

const session = require('express-session');
const passport = require('passport');

require('./config/passport'); // Passport Configuration

const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

const normalizeOrigin = (origin) => origin?.trim().replace(/\/$/, '');
const allowedOrigins = new Set([
  'https://velaivaaipu.in',
  'https://www.velaivaaipu.in',
  'https://admin.velaivaaipu.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...((process.env.FRONTEND_URL || '').split(',').map(normalizeOrigin).filter(Boolean)),
]);

const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header are server-to-server, health checks, or
    // same-origin traffic. Browser cross-origin requests must match the allowlist.
    if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 204,
};

const io = new Server(server, {
  cors: corsOptions,
});

const PORT = process.env.PORT || 5000;

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const userId = decoded.id || decoded.userId;
      if (userId) socket.join(`user:${userId}`);
    } catch (err) {
      console.warn('Socket authentication failed:', err.message);
    }
  }

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on('send_message', (data) => {
    // data: { roomId, content, senderId, timestamp, attachment }
    io.to(data.roomId).emit('receive_message', data);
  });

  socket.on('join_group', (groupId) => {
    socket.join(groupId);
    console.log(`User ${socket.id} joined group: ${groupId}`);
  });

  socket.on('send_group_message', (data) => {
    // data: { groupId, message }
    io.to(data.groupId).emit('receive_group_message', data.message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Middleware
// Register CORS before logging, body parsing, sessions, and routes so successful
// responses, validation errors, and automatic OPTIONS responses all include it.
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());

// Attach io to req for use in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

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
app.use('/api/company', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/pay-per', payPerRoutes);
app.use('/api/college', collegeRoutes);
app.use('/api/skill-tests', skillTestRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);


// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/jobportal';

console.log(`Connecting to MongoDB at: ${MONGODB_URI.replace(/\/\/.*@/, '//****:****@')}`);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB');
    await seedRoles();
    await seedAdmin();
    await seedSubscriptions();
    await migrateUsersToFreePlan();
    startCronJobs();
  })
  .catch((err) => {
    console.error('MongoDB connection error details:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.error('TIP: Make sure your MongoDB service is running and accessible.');
    }
  });

app.get('/', (req, res) => {
  res.send('Velaivaaipu API is running...');
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown handlers to prevent EADDRINUSE and zombie processes on nodemon restarts.
const gracefulShutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.once('SIGUSR2', () => {
  console.log('Received SIGUSR2 (nodemon restart). Closing server...');
  server.close(() => {
    console.log('HTTP server closed on nodemon restart.');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed on nodemon restart. Re-emitting SIGUSR2...');
      process.kill(process.pid, 'SIGUSR2');
    });
  });
});
