require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { assertJwtConfig, getJwtSecret } = require('./config/jwt');
// Refuse to start with a missing/weak JWT secret rather than falling back to a guessable one.
try {
  assertJwtConfig();
} catch (err) {
  console.error(`FATAL: ${err.message}`);
  process.exit(1);
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const onboardingRoutes = require('./routes/onboardingRoutes');
const recruiterRoutes = require('./routes/recruiter');
const jobRoutes = require('./routes/job');
const companyRoutes = require('./routes/company');
const applicationRoutes = require('./routes/application');
const adminRoutes = require('./routes/adminRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const { captureWebhookRawBody } = require('./utils/webhookRawBody');
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
const emailWebhookRoutes = require('./routes/emailWebhook');
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
const Conversation = require('./models/Conversation');
const CollaborationGroup = require('./models/CollaborationGroup');

const app = express();
// Needed so req.ip (used by the rate limiter) is the real client IP behind Vercel/Render/nginx.
app.set('trust proxy', 1);
const server = http.createServer(app);

const normalizeOrigin = (origin) => origin?.trim().replace(/\/$/, '');

// Fallback origins used only if ALLOWED_ORIGINS/FRONTEND_URL aren't set in the environment.
// To allow a new domain (next CORS error), add it to ALLOWED_ORIGINS in .env instead of editing
// this list — comma-separated, e.g. ALLOWED_ORIGINS=https://velaivaaipu.in,https://new-domain.com
const DEFAULT_ORIGINS = [
  'https://velaivaaipu.in',
  'https://www.velaivaaipu.in',
  'https://admin.velaivaaipu.in',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const envOrigins = [process.env.ALLOWED_ORIGINS, process.env.FRONTEND_URL]
  .filter(Boolean)
  .join(',')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = new Set([...DEFAULT_ORIGINS, ...envOrigins]);

const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header are server-to-server, health checks, or
    // same-origin traffic. Browser cross-origin requests must match the allowlist.
    if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
      return callback(null, true);
    }
    return callback(null, false);
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
// Every connection must present a valid JWT. The user id always comes from the token, and a
// socket can only join / write to conversations and groups it actually belongs to.
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, getJwtSecret());
    const userId = decoded.id || decoded.userId || decoded.user?.id;
    if (!userId) return next(new Error('Authentication required'));
    socket.data.userId = String(userId);
    next();
  } catch (err) {
    next(new Error('Authentication required'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  socket.join(`user:${userId}`);

  socket.on('join_room', async (roomId) => {
    try {
      const allowed = await Conversation.exists({ _id: roomId, participants: userId });
      if (allowed) socket.join(String(roomId));
    } catch (err) {
      // invalid id or lookup failure: simply do not join
    }
  });

  socket.on('send_message', (data) => {
    // Only relay into a room this socket has joined, and never trust a client-supplied sender id.
    const roomId = data && String(data.roomId || '');
    if (!roomId || !socket.rooms.has(roomId)) return;
    io.to(roomId).emit('receive_message', { ...data, senderId: userId });
  });

  socket.on('join_group', async (groupId) => {
    try {
      const allowed = await CollaborationGroup.exists({
        _id: groupId,
        $or: [{ members: userId }, { admin: userId }],
      });
      if (allowed) socket.join(String(groupId));
    } catch (err) {
      // invalid id or lookup failure: simply do not join
    }
  });

  // Group messages are created and broadcast by the REST controller (which checks permissions);
  // clients may not inject their own broadcast into a group.
});

// Middleware
// Register CORS before logging, body parsing, sessions, and routes so successful
// responses, validation errors, and automatic OPTIONS responses all include it.
app.use(cors(corsOptions));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
});
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// The Razorpay webhook needs the unparsed body to check its signature (see utils/webhookRawBody.js).
app.use(express.json({ verify: captureWebhookRawBody }));

// Attach io to req for use in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Static folder for file uploads
// Documents (resumes, MoUs, reports, KYC proofs) hold personal data. When PROTECT_DOCUMENT_UPLOADS=true
// they need a valid token (Authorization header or ?token=); images (avatars, logos, covers) stay public.
// Leave it off until the client links to documents with ?token= (see LAUNCH_READINESS.md).
const PUBLIC_UPLOAD_EXT = new Set(['.webp', '.png', '.jpg', '.jpeg', '.gif']);
app.use('/uploads', (req, res, next) => {
  if (process.env.PROTECT_DOCUMENT_UPLOADS !== 'true') return next();
  if (PUBLIC_UPLOAD_EXT.has(path.extname(req.path).toLowerCase())) return next();
  const header = req.header('Authorization');
  const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : req.query.token;
  try {
    jwt.verify(String(token || ''), getJwtSecret());
    return next();
  } catch (err) {
    return res.status(401).json({ msg: 'Authentication required to view this file' });
  }
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Session Middleware (needed for OAuth state management)
app.use(session({
  secret: getJwtSecret(),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/onboarding', onboardingRoutes);
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
app.use('/api/webhooks/email', emailWebhookRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/notifications', notificationRoutes);


// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/velaivaaipu';

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
    // Exit so the host/process manager restarts us instead of serving requests with no database.
    process.exit(1);
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
