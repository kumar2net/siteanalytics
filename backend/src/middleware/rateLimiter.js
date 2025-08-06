const { RateLimiterMemory } = require('rate-limiter-flexible');

// Rate limiter for analytics tracking
const analyticsLimiter = new RateLimiterMemory({
  keyGenerator: (req) => {
    // Use IP address as key, fallback to user agent
    return req.ip || req.headers['user-agent'] || 'unknown';
  },
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
});

// Rate limiter for API endpoints
const apiLimiter = new RateLimiterMemory({
  keyGenerator: (req) => {
    return req.ip || req.headers['user-agent'] || 'unknown';
  },
  points: 1000, // Number of requests
  duration: 60, // Per 60 seconds
});

const rateLimiter = async (req, res, next) => {
  try {
    // Apply different limits based on endpoint
    if (req.path.includes('/track') || req.path.includes('/analytics/track')) {
      await analyticsLimiter.consume(req.ip || req.headers['user-agent'] || 'unknown');
    } else {
      await apiLimiter.consume(req.ip || req.headers['user-agent'] || 'unknown');
    }
    next();
  } catch (rejRes) {
    const secs = Math.round(rejRes.msBeforeNext / 1000) || 1;
    res.set('Retry-After', String(secs));
    res.status(429).json({
      error: {
        message: 'Too many requests',
        retryAfter: secs
      }
    });
  }
};

module.exports = { rateLimiter }; 