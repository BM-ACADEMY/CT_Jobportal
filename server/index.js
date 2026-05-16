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
const seedRoles = require('./config/seedRoles');
const seedAdmin = require('./config/seedAdmin');
const { seedSubscriptions, migrateUsersToFreePlan } = require('./config/seedSubscriptions');
const path = require('path');

const session = require('express-session');
const passport = require('passport');

require('./config/passport'); // Passport Configuration

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

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
app.use(cors());
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
app.use('/api/interviews', interviewRoutes);
app.use('/api/collaboration', collaborationRoutes);


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

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
