const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'siteanalytics',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Initialize database tables
const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    
    // Create page_visits table
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_visits (
        id SERIAL PRIMARY KEY,
        page_url VARCHAR(500) NOT NULL,
        visitor_id VARCHAR(100) NOT NULL,
        session_id VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        time_on_page INTEGER DEFAULT 0,
        referrer VARCHAR(500),
        user_agent TEXT,
        ip_address INET,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create daily_metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS daily_metrics (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        page_visits INTEGER DEFAULT 0,
        page_views INTEGER DEFAULT 0,
        avg_time_on_page FLOAT DEFAULT 0,
        bounce_rate FLOAT DEFAULT 0,
        unique_visitors INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create predictions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS predictions (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(50) NOT NULL,
        predicted_date DATE NOT NULL,
        predicted_value FLOAT NOT NULL,
        confidence_interval FLOAT,
        model_version VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_page_visits_timestamp ON page_visits(timestamp);
      CREATE INDEX IF NOT EXISTS idx_page_visits_visitor_id ON page_visits(visitor_id);
      CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON page_visits(session_id);
      CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
      CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(predicted_date);
    `);

    client.release();
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

module.exports = {
  pool,
  initializeDatabase
}; 