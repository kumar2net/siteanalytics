const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AnalyticsService {
  // Track a page visit or event
  async trackPageVisit(data) {
    const { 
      page_url, visitor_id, session_id, time_on_page, referrer, user_agent, ip_address, 
      event_name, event_data, country, region, city, latitude, longitude,
      device_type, browser, browser_version, operating_system, os_version, screen_resolution 
    } = data;
    
    const query = `
      INSERT INTO page_visits (
        page_url, visitor_id, session_id, time_on_page, referrer, user_agent, ip_address, 
        event_name, event_data, country, region, city, latitude, longitude,
        device_type, browser, browser_version, operating_system, os_version, screen_resolution
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id, timestamp
    `;
    
    const values = [
      page_url, visitor_id, session_id, time_on_page, referrer, user_agent, ip_address, 
      event_name || null, event_data || null, country || null, region || null, city || null, 
      latitude || null, longitude || null, device_type || null, browser || null, 
      browser_version || null, operating_system || null, os_version || null, screen_resolution || null
    ];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error tracking page visit:', error);
      throw error;
    }
  }

  // Get page visits for a date range
  async getPageVisits(startDate, endDate, pageUrl = null, limit = 100, offset = 0) {
    let query = `
      SELECT 
        id, page_url, visitor_id, session_id, timestamp, 
        time_on_page, referrer, user_agent, ip_address
      FROM page_visits 
      WHERE timestamp >= $1 AND timestamp <= $2
    `;
    
    const values = [startDate, endDate];
    let paramIndex = 3;
    
    if (pageUrl) {
      query += ` AND page_url = $${paramIndex}`;
      values.push(pageUrl);
      paramIndex++;
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(limit, offset);
    
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Error getting page visits:', error);
      throw error;
    }
  }

  // Get daily metrics for a date range
  async getDailyMetrics(startDate, endDate) {
    const query = `
      SELECT 
        date, page_visits, page_views, avg_time_on_page, 
        bounce_rate, unique_visitors
      FROM daily_metrics 
      WHERE date >= $1 AND date <= $2
      ORDER BY date DESC
    `;
    
    try {
      const result = await pool.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting daily metrics:', error);
      throw error;
    }
  }

  // Calculate and store daily metrics
  async calculateDailyMetrics(date) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Calculate metrics for the given date
      const metricsQuery = `
        WITH daily_stats AS (
          SELECT 
            DATE(timestamp) as visit_date,
            COUNT(DISTINCT visitor_id) as unique_visitors,
            COUNT(*) as page_views,
            AVG(time_on_page) as avg_time_on_page,
            COUNT(DISTINCT session_id) as sessions
          FROM page_visits 
          WHERE DATE(timestamp) = $1
          GROUP BY DATE(timestamp)
        ),
        bounce_sessions AS (
          SELECT 
            DATE(timestamp) as visit_date,
            COUNT(DISTINCT session_id) as bounce_sessions
          FROM (
            SELECT session_id, DATE(timestamp) as visit_date
            FROM page_visits 
            WHERE DATE(timestamp) = $1
            GROUP BY session_id, DATE(timestamp)
            HAVING COUNT(*) = 1
          ) single_page_sessions
          GROUP BY DATE(timestamp)
        )
        SELECT 
          ds.visit_date,
          ds.unique_visitors,
          ds.page_views,
          COALESCE(ds.avg_time_on_page, 0) as avg_time_on_page,
          CASE 
            WHEN ds.sessions > 0 THEN 
              ROUND((COALESCE(bs.bounce_sessions, 0)::FLOAT / ds.sessions::FLOAT) * 100, 2)
            ELSE 0 
          END as bounce_rate
        FROM daily_stats ds
        LEFT JOIN bounce_sessions bs ON ds.visit_date = bs.visit_date
      `;
      
      const metricsResult = await client.query(metricsQuery, [date]);
      
      if (metricsResult.rows.length > 0) {
        const metrics = metricsResult.rows[0];
        
        // Upsert daily metrics
        const upsertQuery = `
          INSERT INTO daily_metrics (date, page_visits, page_views, avg_time_on_page, bounce_rate, unique_visitors)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (date) 
          DO UPDATE SET 
            page_visits = EXCLUDED.page_visits,
            page_views = EXCLUDED.page_views,
            avg_time_on_page = EXCLUDED.avg_time_on_page,
            bounce_rate = EXCLUDED.bounce_rate,
            unique_visitors = EXCLUDED.unique_visitors,
            updated_at = CURRENT_TIMESTAMP
        `;
        
        await client.query(upsertQuery, [
          metrics.visit_date,
          metrics.unique_visitors,
          metrics.page_views,
          metrics.avg_time_on_page,
          metrics.bounce_rate,
          metrics.unique_visitors
        ]);
      }
      
      await client.query('COMMIT');
      return metricsResult.rows[0] || null;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error calculating daily metrics:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get real-time metrics (last 24 hours)
  async getRealTimeMetrics() {
    const query = `
      SELECT 
        COUNT(DISTINCT visitor_id) as active_visitors,
        COUNT(*) as page_views_24h,
        AVG(time_on_page) as avg_time_on_page_24h
      FROM page_visits 
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
    `;
    
    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      throw error;
    }
  }

  // Get top pages
  async getTopPages(startDate, endDate, limit = 10) {
    const query = `
      SELECT 
        page_url,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(*) as page_views,
        AVG(time_on_page) as avg_time_on_page
      FROM page_visits 
      WHERE timestamp >= $1 AND timestamp <= $2
      GROUP BY page_url
      ORDER BY page_views DESC
      LIMIT $3
    `;
    
    try {
      const result = await pool.query(query, [startDate, endDate, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting top pages:', error);
      throw error;
    }
  }

  // Generate visitor ID if not provided
  generateVisitorId() {
    return uuidv4();
  }

  // Generate session ID
  generateSessionId() {
    return uuidv4();
  }

  // Get visitors by geolocation
  async getVisitorsByGeolocation(startDate, endDate, limit = 20) {
    const query = `
      SELECT 
        country,
        region,
        city,
        latitude,
        longitude,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(*) as page_views,
        AVG(time_on_page) as avg_time_on_page
      FROM page_visits 
      WHERE timestamp >= $1 AND timestamp <= $2
        AND country IS NOT NULL
      GROUP BY country, region, city, latitude, longitude
      ORDER BY unique_visitors DESC
      LIMIT $3
    `;
    
    try {
      const result = await pool.query(query, [startDate, endDate, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting visitors by geolocation:', error);
      throw error;
    }
  }

  // Get visitors by device type and technology
  async getVisitorsByDevice(startDate, endDate, limit = 20) {
    const query = `
      SELECT 
        device_type,
        browser,
        browser_version,
        operating_system,
        os_version,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(*) as page_views,
        AVG(time_on_page) as avg_time_on_page
      FROM page_visits 
      WHERE timestamp >= $1 AND timestamp <= $2
        AND device_type IS NOT NULL
      GROUP BY device_type, browser, browser_version, operating_system, os_version
      ORDER BY unique_visitors DESC
      LIMIT $3
    `;
    
    try {
      const result = await pool.query(query, [startDate, endDate, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting visitors by device:', error);
      throw error;
    }
  }

  // Get device type breakdown
  async getDeviceTypeBreakdown(startDate, endDate) {
    const query = `
      SELECT 
        COALESCE(device_type, 'Unknown') as device_type,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(*) as page_views,
        ROUND(((COUNT(DISTINCT visitor_id)::FLOAT / 
          (SELECT COUNT(DISTINCT visitor_id) FROM page_visits WHERE timestamp >= $1 AND timestamp <= $2)::FLOAT) * 100)::NUMERIC, 2) as percentage
      FROM page_visits 
      WHERE timestamp >= $1 AND timestamp <= $2
      GROUP BY device_type
      ORDER BY unique_visitors DESC
    `;
    
    try {
      const result = await pool.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting device type breakdown:', error);
      throw error;
    }
  }

  // Get browser breakdown
  async getBrowserBreakdown(startDate, endDate) {
    const query = `
      SELECT 
        COALESCE(browser, 'Unknown') as browser,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(*) as page_views,
        ROUND(((COUNT(DISTINCT visitor_id)::FLOAT / 
          (SELECT COUNT(DISTINCT visitor_id) FROM page_visits WHERE timestamp >= $1 AND timestamp <= $2)::FLOAT) * 100)::NUMERIC, 2) as percentage
      FROM page_visits 
      WHERE timestamp >= $1 AND timestamp <= $2
      GROUP BY browser
      ORDER BY unique_visitors DESC
    `;
    
    try {
      const result = await pool.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting browser breakdown:', error);
      throw error;
    }
  }

  // Get operating system breakdown
  async getOSBreakdown(startDate, endDate) {
    const query = `
      SELECT 
        COALESCE(operating_system, 'Unknown') as operating_system,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(*) as page_views,
        ROUND(((COUNT(DISTINCT visitor_id)::FLOAT / 
          (SELECT COUNT(DISTINCT visitor_id) FROM page_visits WHERE timestamp >= $1 AND timestamp <= $2)::FLOAT) * 100)::NUMERIC, 2) as percentage
      FROM page_visits 
      WHERE timestamp >= $1 AND timestamp <= $2
      GROUP BY operating_system
      ORDER BY unique_visitors DESC
    `;
    
    try {
      const result = await pool.query(query, [startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting OS breakdown:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService(); 