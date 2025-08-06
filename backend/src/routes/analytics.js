const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { 
  pageVisitSchema, 
  analyticsQuerySchema, 
  dailyMetricsSchema,
  validate, 
  validateQuery 
} = require('../utils/validation');

const router = express.Router();

// Track page visit
router.post('/track', validate(pageVisitSchema), analyticsController.trackPageVisit);

// Get page visits with query validation
router.get('/visits', validateQuery(analyticsQuerySchema), analyticsController.getPageVisits);

// Get daily metrics
router.get('/metrics/daily', validateQuery(dailyMetricsSchema), analyticsController.getDailyMetrics);

// Get real-time metrics
router.get('/metrics/realtime', analyticsController.getRealTimeMetrics);

// Get top pages
router.get('/pages/top', analyticsController.getTopPages);

// Calculate daily metrics (admin)
router.post('/metrics/calculate', analyticsController.calculateDailyMetrics);

// Generate visitor and session IDs
router.get('/ids', analyticsController.generateIds);

module.exports = router; 