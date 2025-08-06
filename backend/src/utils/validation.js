const Joi = require('joi');

// Page visit tracking schema
const pageVisitSchema = Joi.object({
  page_url: Joi.string().uri().required().max(500),
  page_title: Joi.string().max(200).optional(),
  visitor_id: Joi.string().required().max(100),
  session_id: Joi.string().required().max(100),
  time_on_page: Joi.number().integer().min(0).max(86400).default(0), // Max 24 hours in seconds
  referrer: Joi.string().uri().allow('').max(500).optional(),
  user_agent: Joi.string().max(1000).optional(),
  ip_address: Joi.string().ip().optional(),
  // Event tracking fields (optional)
  event_name: Joi.string().max(100).optional(),
  event_data: Joi.object().optional(),
  // Geolocation fields (optional)
  country: Joi.string().max(100).optional(),
  region: Joi.string().max(100).optional(),
  city: Joi.string().max(100).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  // Device and technology fields (optional)
  device_type: Joi.string().valid('desktop', 'mobile', 'tablet', 'other').optional(),
  browser: Joi.string().max(100).optional(),
  browser_version: Joi.string().max(50).optional(),
  operating_system: Joi.string().max(100).optional(),
  os_version: Joi.string().max(50).optional(),
  screen_resolution: Joi.string().max(20).optional(),
  // Additional fields from analytics tracker
  screen_width: Joi.number().integer().min(0).optional(),
  screen_height: Joi.number().integer().min(0).optional(),
  language: Joi.string().max(10).optional(),
  timezone: Joi.string().max(50).optional(),
  timestamp: Joi.string().isoDate().optional()
});

// Analytics query schema
const analyticsQuerySchema = Joi.object({
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')).required(),
  page_url: Joi.string().uri().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0)
});

// Daily metrics query schema
const dailyMetricsSchema = Joi.object({
  days: Joi.number().integer().min(1).max(365).default(30),
  start_date: Joi.date().iso().optional(),
  end_date: Joi.date().iso().optional()
});

// Prediction query schema
const predictionSchema = Joi.object({
  metric_name: Joi.string().valid('page_visits', 'page_views', 'unique_visitors').required(),
  days_ahead: Joi.number().integer().min(1).max(30).default(7)
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: {
          message: 'Validation Error',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }
    
    req.validatedData = value;
    next();
  };
};

// Query validation middleware
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        error: {
          message: 'Query Validation Error',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }
    
    req.validatedQuery = value;
    next();
  };
};

module.exports = {
  pageVisitSchema,
  analyticsQuerySchema,
  dailyMetricsSchema,
  predictionSchema,
  validate,
  validateQuery
}; 