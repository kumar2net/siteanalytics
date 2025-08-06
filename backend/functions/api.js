const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const serverless = require('serverless-http');
require('dotenv').config();

const { errorHandler } = require('../src/middleware/errorHandler');
const { rateLimiter } = require('../src/middleware/rateLimiter');
const { healthCheck } = require('../src/controllers/healthController');
const memoryAnalyticsController = require('../src/controllers/memoryAnalyticsController');

const app = express();

// Security middleware with CSP configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://kumarsite.netlify.app", "https://siteanalyticsak.netlify.app"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration for production
app.use(cors({
  origin: [
    'https://kumarsite.netlify.app',
    'https://siteanalyticsak.netlify.app',
    'https://kumar2net.github.io',
    'http://localhost:5173',
    'http://localhost:3000',
    'https://*.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimiter);

// Health check routes
app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

// Analytics routes using memory storage
app.post('/api/analytics/track', memoryAnalyticsController.trackPageVisit);
app.get('/api/analytics/metrics/realtime', memoryAnalyticsController.getRealTimeMetrics);
app.get('/api/analytics/metrics/daily', memoryAnalyticsController.getDailyMetrics);
app.get('/api/analytics/pages/top', memoryAnalyticsController.getTopPages);
app.get('/api/analytics/stats', memoryAnalyticsController.getStats);

// Additional analytics endpoints for geolocation and device data
app.get('/api/analytics/geolocation', memoryAnalyticsController.getGeolocation);
app.get('/api/analytics/devices/breakdown', memoryAnalyticsController.getDeviceBreakdown);
app.get('/api/analytics/browsers/breakdown', memoryAnalyticsController.getBrowserBreakdown);
app.get('/api/analytics/os/breakdown', memoryAnalyticsController.getOSBreakdown);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Website Analytics API',
    version: '1.0.0',
    status: 'running',
    environment: 'production'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use(errorHandler);

// Export the serverless handler
module.exports.handler = serverless(app); 