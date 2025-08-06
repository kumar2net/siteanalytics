const memoryStorage = require('../config/memoryStorage');

class MemoryAnalyticsController {
  // Track page visit or event
  async trackPageVisit(req, res) {
    try {
      const data = req.body;
      
      // Add IP address from request
      data.ip_address = req.ip || req.connection.remoteAddress;
      
      // Check if this is an event or page visit
      const isEvent = data.event_name && data.event_data;
      
      const result = memoryStorage.addPageVisit(data);
      
      res.status(201).json({
        success: true,
        data: {
          id: result.id,
          timestamp: result.timestamp,
          message: isEvent ? 'Event tracked successfully' : 'Page visit tracked successfully',
          type: isEvent ? 'event' : 'page_visit'
        }
      });
    } catch (error) {
      console.error('Error in trackPageVisit:', error);
      res.status(500).json({
        error: {
          message: 'Failed to track data',
          details: error.message
        }
      });
    }
  }

  // Get real-time metrics
  async getRealTimeMetrics(req, res) {
    try {
      const metrics = memoryStorage.getRealtimeMetrics();
      
      res.json({
        success: true,
        data: {
          metrics
        }
      });
    } catch (error) {
      console.error('Error in getRealTimeMetrics:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve real-time metrics',
          details: error.message
        }
      });
    }
  }

  // Get daily metrics
  async getDailyMetrics(req, res) {
    try {
      const { days = 7 } = req.query;
      
      const metrics = memoryStorage.getDailyMetrics(parseInt(days));
      
      res.json({
        success: true,
        data: {
          metrics
        }
      });
    } catch (error) {
      console.error('Error in getDailyMetrics:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve daily metrics',
          details: error.message
        }
      });
    }
  }

  // Get top pages
  async getTopPages(req, res) {
    try {
      const { limit = 5, start_date, end_date } = req.query;
      
      const pages = memoryStorage.getTopPages(parseInt(limit), start_date, end_date);
      
      res.json({
        success: true,
        data: {
          pages
        }
      });
    } catch (error) {
      console.error('Error in getTopPages:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve top pages',
          details: error.message
        }
      });
    }
  }

  // Get stats
  async getStats(req, res) {
    try {
      const stats = memoryStorage.getStats();
      
      res.json({
        success: true,
        data: {
          stats
        }
      });
    } catch (error) {
      console.error('Error in getStats:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve stats',
          details: error.message
        }
      });
    }
  }

  // Get geolocation data
  async getGeolocation(req, res) {
    try {
      const { start_date, end_date, limit = 20 } = req.query;
      
      const geolocation = memoryStorage.getGeolocation(start_date, end_date, parseInt(limit));
      
      res.json({
        success: true,
        data: {
          geolocation
        }
      });
    } catch (error) {
      console.error('Error in getGeolocation:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve geolocation data',
          details: error.message
        }
      });
    }
  }

  // Get device breakdown
  async getDeviceBreakdown(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      const deviceTypes = memoryStorage.getDeviceBreakdown(start_date, end_date);
      
      res.json({
        success: true,
        data: {
          device_types: deviceTypes
        }
      });
    } catch (error) {
      console.error('Error in getDeviceBreakdown:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve device breakdown',
          details: error.message
        }
      });
    }
  }

  // Get browser breakdown
  async getBrowserBreakdown(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      const browsers = memoryStorage.getBrowserBreakdown(start_date, end_date);
      
      res.json({
        success: true,
        data: {
          browsers
        }
      });
    } catch (error) {
      console.error('Error in getBrowserBreakdown:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve browser breakdown',
          details: error.message
        }
      });
    }
  }

  // Get OS breakdown
  async getOSBreakdown(req, res) {
    try {
      const { start_date, end_date } = req.query;
      
      const operatingSystems = memoryStorage.getOSBreakdown(start_date, end_date);
      
      res.json({
        success: true,
        data: {
          operating_systems: operatingSystems
        }
      });
    } catch (error) {
      console.error('Error in getOSBreakdown:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve OS breakdown',
          details: error.message
        }
      });
    }
  }
}

module.exports = new MemoryAnalyticsController(); 