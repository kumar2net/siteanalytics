const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AnalyticsService {
  // Track a page visit or event
  async trackPageVisit(data) {
    const { page_url, visitor_id, session_id, time_on_page, referrer, user_agent, ip_address, event_name, event_data } = data;
    
    const query = `
      INSERT INTO page_visits (page_url, visitor_id, session_id, time_on_page, referrer, user_agent, ip_address, event_name, event_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, timestamp
    `;
    
    const values = [page_url, visitor_id, session_id, time_on_page, referrer, user_agent, ip_address, event_name || null, event_data || null];
    
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
}

module.exports = new AnalyticsService(); 