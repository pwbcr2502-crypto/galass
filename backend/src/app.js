const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import configurations
const { pool } = require('./config/database');
const { redisClient } = require('./config/redis');
const { logger, logInfo, logError } = require('./config/logger');

// Import routes
const apiRoutes = require('./routes');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:8082'],
    credentials: true
  }
});

// Trust proxy (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:8082',
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:8082',
      'http://127.0.0.1:3000'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      console.log('CORS allowed origin:', origin);
      callback(null, true);
    } else {
      // Log the rejected origin for debugging
      console.log('CORS blocked origin:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token', 'X-Device-ID', 'X-Timestamp', 'X-User-Agent']
}));

// Compression middleware
app.use(compression());

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
const morganFormat = process.env.NODE_ENV === 'production' 
  ? 'combined' 
  : ':remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms';

app.use(morgan(morganFormat, {
  stream: {
    write: (message) => {
      logger.info(message.trim(), { source: 'morgan' });
    }
  }
}));

// Global rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    code: 429,
    message: 'Too many requests from this IP, please try again later.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Request ID middleware (for tracking)
app.use((req, res, next) => {
  req.id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  res.set('X-Request-ID', req.id);
  next();
});

// Add Socket.IO instance to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Mount API routes
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes); // Alias for backward compatibility

// Serve static files (for QR codes, if needed)
app.use('/static', express.static('public'));

// Serve missing assets (icons, etc) with a fallback
app.get('/icon-:size.png', (req, res) => {
  // Return a simple favicon placeholder for missing icons
  res.status(404).json({
    code: 404,
    message: 'Icon not found',
    data: null
  });
});

// Handle favicon requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).send();
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: 'Anniversary Voting System API',
    data: {
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logError('Global error handler', error, {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    code: error.status || 500,
    message: error.message || 'Internal server error',
    data: isDevelopment ? {
      stack: error.stack,
      details: error
    } : null,
    requestId: req.id
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: 'Endpoint not found',
    data: {
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    },
    requestId: req.id
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logInfo('Client connected to WebSocket', { 
    socketId: socket.id,
    clientIP: socket.handshake.address
  });

  // Join event room (for targeted broadcasting)
  socket.on('join-event', (eventId) => {
    socket.join(`event-${eventId}`);
    logInfo('Client joined event room', { 
      socketId: socket.id,
      eventId 
    });
  });

  // Leave event room
  socket.on('leave-event', (eventId) => {
    socket.leave(`event-${eventId}`);
    logInfo('Client left event room', { 
      socketId: socket.id,
      eventId 
    });
  });

  socket.on('disconnect', (reason) => {
    logInfo('Client disconnected from WebSocket', { 
      socketId: socket.id,
      reason 
    });
  });

  // Handle connection errors
  socket.on('error', (error) => {
    logError('Socket.IO error', error, { 
      socketId: socket.id 
    });
  });
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logInfo('SIGTERM received. Starting graceful shutdown...');
  
  httpServer.close(async () => {
    logInfo('HTTP server closed');
    
    try {
      await pool.end();
      logInfo('Database pool closed');
      
      if (redisClient.isOpen) {
        await redisClient.quit();
        logInfo('Redis connection closed');
      }
      
      logInfo('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logError('Error during shutdown', error);
      process.exit(1);
    }
  });
});

process.on('SIGINT', async () => {
  logInfo('SIGINT received. Starting graceful shutdown...');
  
  httpServer.close(async () => {
    logInfo('HTTP server closed');
    
    try {
      await pool.end();
      logInfo('Database pool closed');
      
      if (redisClient.isOpen) {
        await redisClient.quit();
        logInfo('Redis connection closed');
      }
      
      logInfo('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logError('Error during shutdown', error);
      process.exit(1);
    }
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection', reason, { promise });
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  logInfo(`Server started on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    processId: process.pid
  });
});

// Export for testing
module.exports = { app, httpServer, io };