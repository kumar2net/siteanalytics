// Simple health check for serverless environment
const healthCheck = (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'memory_storage',
      api: 'operational'
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
};

module.exports = { healthCheck }; 