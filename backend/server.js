const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');

dotenv.config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const { reminderJob } = require('./services/reminderService');

// Connect Database
connectDB();

const app = express();

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security Headers
app.use(helmet());

// Sanitize NoSQL injection
app.use(mongoSanitize());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Rate Limiter - Global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests from this IP, please try again later.'
});

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts, please try again later.'
});

// AI chatbot limiter (per tenant)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Chat rate limit exceeded, slow down.'
});

app.use('/api', globalLimiter);
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/chat', chatLimiter);

// Dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── ROUTES ──────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const tenantRoutes       = require('./routes/tenants');
const userRoutes         = require('./routes/users');
const patientRoutes      = require('./routes/patients');
const appointmentRoutes  = require('./routes/appointments');
const dentistRoutes      = require('./routes/dentists');
const treatmentRoutes    = require('./routes/treatments');
const invoiceRoutes      = require('./routes/invoices');
const chatRoutes         = require('./routes/chat');
const analyticsRoutes    = require('./routes/analytics');
const serviceRoutes      = require('./routes/services');
const subscriptionRoutes = require('./routes/subscriptions');
const auditRoutes        = require('./routes/audit');

app.use('/api/v1/auth',          authRoutes);
app.use('/api/v1/tenants',       tenantRoutes);
app.use('/api/v1/users',         userRoutes);
app.use('/api/v1/patients',      patientRoutes);
app.use('/api/v1/appointments',  appointmentRoutes);
app.use('/api/v1/dentists',      dentistRoutes);
app.use('/api/v1/treatments',    treatmentRoutes);
app.use('/api/v1/invoices',      invoiceRoutes);
app.use('/api/v1/chat',          chatRoutes);
app.use('/api/v1/analytics',     analyticsRoutes);
app.use('/api/v1/services',      serviceRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/audit',         auditRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── CRON JOBS ────────────────────────────────────────────
// Send appointment reminders daily at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Running appointment reminder job...');
  await reminderJob();
});

// ─── ERROR HANDLER ────────────────────────────────────────
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
