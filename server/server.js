const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const http = require('http');
const { initializeSocket } = require('./sockets/tracking');

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
// Allow both Vite dev server (5173) and legacy dev server (3000) by default
const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000'];
const corsOptions = {
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : defaultOrigins,
  credentials: true,
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/location', require('./routes/location'));
app.use('/api/donors', require('./routes/search'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/blood-requests', require('./routes/bloodRequests'));
app.use('/api/camps', require('./routes/camps'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/donations', require('./routes/donations'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Blood Donation Finder API' });
});

// Debug route: list active tracking sessions (development only)
try {
  const trackingUtils = require('./utils/trackingSocket');
  app.get('/api/debug/tracking-sessions', (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ message: 'Disabled in production' });
    try {
      const sessions = trackingUtils.listTrackingSessions();
      res.json({ success: true, sessions });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
} catch (err) {
  // ignore if module not available
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors: messages
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    message: err.message || 'Something went wrong!'
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    initializeSocket(server);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`\n${signal} received. Closing server...`);
      server.close(() => {
        mongoose.disconnect();
        process.exit(0);
      });
      setTimeout(() => process.exit(0), 3000).unref();
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGHUP', () => shutdown('SIGHUP'));
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
