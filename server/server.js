const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const http = require('http');
const { initializeSocket } = require('./sockets/tracking');
const { validateEnv, getAllowedOrigins } = require('./config/security');
const sanitizeRequest = require('./middleware/sanitize');

dotenv.config();
validateEnv();

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// Security Headers & Content Security Policy (CSP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://unpkg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        connectSrc: ["'self'", 'ws:', 'wss:', 'https:', 'http:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    xssFilter: true,
    frameguard: { action: 'deny' },
  })
);

// Feature & Permissions-Policy Header
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)'
  );
  next();
});

const corsOptions = {
  origin(origin, callback) {
    const allowed = getAllowedOrigins();
    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(hpp());
app.use(sanitizeRequest);

// Global API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Try again later.' },
});

// Strict auth rate limiter (brute-force defense)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again later.' },
});

// Search rate limiter (prevent mass scraping of donor contact details)
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many search requests. Please slow down.' },
});

// Sensitive creation limiter (prevent spamming notifications/camps/emergency requests)
const creationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Action limit reached. Please try again later.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/donors/nearby', searchLimiter);

// Specific limiters for creation
app.post('/api/emergency', creationLimiter);
app.post('/api/camps', creationLimiter);
app.post('/api/blood-requests', creationLimiter);

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

app.get('/', (req, res) => {
  res.json({ message: 'Blood Donation Finder API' });
});

// Centralized error handling middleware with generic responses
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Request could not be completed' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Invalid request' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }

  res.status(err.statusCode || 500).json({
    message: 'Request could not be completed',
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

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };
