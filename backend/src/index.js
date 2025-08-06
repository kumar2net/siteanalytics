const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const { rateLimiter } = require('./middleware/rateLimiter');
const analyticsRoutes = require('./routes/analytics');
const healthRoutes = require('./routes/health');
const webhookRoutes = require('./routes/webhooks');
const { initializeDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

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

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173', // Personal website
    'http://localhost:3000',  // Original analytics frontend
    'https://kumarsite.netlify.app', // Production personal website
    'https://siteanalyticsak.netlify.app', // Production analytics frontend
    'https://*.netlify.app' // Allow all Netlify subdomains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (tracking script and demo)
app.use('/shared', express.static('../shared'));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Rate limiting
app.use(rateLimiter);

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/webhooks', webhookRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Website Analytics API',
    version: '1.0.0',
    status: 'running'
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

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Analytics API: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📝 Demo page: http://localhost:${PORT}/shared/demo-geolocation-device.html`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app; 