const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  // Track page visit or event
  async trackPageVisit(req, res) {
    try {
      const data = req.validatedData;
      
      // Add IP address from request
      data.ip_address = req.ip || req.connection.remoteAddress;
      
      // Check if this is an event or page visit
      const isEvent = data.event_name && data.event_data;
      
      const result = await analyticsService.trackPageVisit(data);
      
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

  // Get page visits
  async getPageVisits(req, res) {
    try {
      const { start_date, end_date, page_url, limit, offset } = req.validatedQuery;
      
      const visits = await analyticsService.getPageVisits(
        start_date, 
        end_date, 
        page_url, 
        limit, 
        offset
      );
      
      res.json({
        success: true,
        data: {
          visits,
          pagination: {
            limit,
            offset,
            total: visits.length
          }
        }
      });
    } catch (error) {
      console.error('Error in getPageVisits:', error);
      res.status(500).json({
        error: {
          message: 'Failed to retrieve page visits',
          details: error.message
        }
      });
    }
  }

  // Get daily metrics
  async getDailyMetrics(req, res) {
    try {
      const { days, start_date, end_date } = req.validatedQuery;
      
      let calculatedStartDate, calculatedEndDate;
      
      if (days) {
        // Calculate date range based on days parameter
        calculatedEndDate = new Date();
        calculatedStartDate = new Date();
        calculatedStartDate.setDate(calculatedStartDate.getDate() - days);
      } else if (start_date && end_date) {
        // Use provided date range
        calculatedStartDate = new Date(start_date);
        calculatedEndDate = new Date(end_date);
      } else {
        // Default to last 30 days
        calculatedEndDate = new Date();
        calculatedStartDate = new Date();
        calculatedStartDate.setDate(calculatedStartDate.getDate() - 30);
      }
      
      const metrics = await analyticsService.getDailyMetrics(calculatedStartDate, calculatedEndDate);
      
      res.json({
        success: true,
        data: {
          metrics,
          period: {
            start_date: calculatedStartDate.toISOString(),
            end_date: calculatedEndDate.toISOString(),
            days: days || 30
          }
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

  // Get real-time metrics
  async getRealTimeMetrics(req, res) {
    try {
      const metrics = await analyticsService.getRealTimeMetrics();
      
      res.json({
        success: true,
        data: {
          metrics,
          timestamp: new Date().toISOString()
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

  // Get top pages
  async getTopPages(req, res) {
    try {
      const { start_date, end_date, limit = 10 } = req.query;
      
      if (!start_date || !end_date) {
        return res.status(400).json({
          error: {
            message: 'start_date and end_date are required'
          }
        });
      }
      
      const pages = await analyticsService.getTopPages(start_date, end_date, limit);
      
      res.json({
        success: true,
        data: {
          pages,
          period: {
            start_date,
            end_date
          }
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

  // Calculate daily metrics (admin endpoint)
  async calculateDailyMetrics(req, res) {
    try {
      const { date } = req.body;
      
      if (!date) {
        return res.status(400).json({
          error: {
            message: 'date is required'
          }
        });
      }
      
      const metrics = await analyticsService.calculateDailyMetrics(date);
      
      res.json({
        success: true,
        data: {
          metrics,
          message: 'Daily metrics calculated successfully'
        }
      });
    } catch (error) {
      console.error('Error in calculateDailyMetrics:', error);
      res.status(500).json({
        error: {
          message: 'Failed to calculate daily metrics',
          details: error.message
        }
      });
    }
  }

  // Generate visitor and session IDs
  async generateIds(req, res) {
    try {
      const visitorId = analyticsService.generateVisitorId();
      const sessionId = analyticsService.generateSessionId();
      
      res.json({
        success: true,
        data: {
          visitor_id: visitorId,
          session_id: sessionId
        }
      });
    } catch (error) {
      console.error('Error in generateIds:', error);
      res.status(500).json({
        error: {
          message: 'Failed to generate IDs',
          details: error.message
        }
      });
    }
  }
}

module.exports = new AnalyticsController(); 