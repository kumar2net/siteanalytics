const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'siteanalytics',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

async function seedData() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database with sample data...');
    
    // Clear existing data
    await client.query('DELETE FROM page_visits');
    await client.query('DELETE FROM daily_metrics');
    await client.query('DELETE FROM predictions');
    
    // Generate sample page visits for the last 30 days
    const pages = [
      '/',
      '/about',
      '/contact',
      '/blog',
      '/products',
      '/services',
      '/pricing',
      '/faq'
    ];
    
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
      'Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68.0 Firefox/68.0'
    ];
    
    const referrers = [
      'https://google.com',
      'https://bing.com',
      'https://facebook.com',
      'https://twitter.com',
      'https://linkedin.com',
      'direct'
    ];
    
    // Generate 30 days of data
    for (let day = 29; day >= 0; day--) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate random number of visits for this day (50-200)
      const dailyVisits = Math.floor(Math.random() * 150) + 50;
      
      for (let i = 0; i < dailyVisits; i++) {
        const page = pages[Math.floor(Math.random() * pages.length)];
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        const referrer = referrers[Math.floor(Math.random() * referrers.length)];
        const timeOnPage = Math.floor(Math.random() * 300) + 30; // 30-330 seconds
        
        // Random time during the day
        const hour = Math.floor(Math.random() * 24);
        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        const timestamp = new Date(date);
        timestamp.setHours(hour, minute, second);
        
        await client.query(`
          INSERT INTO page_visits (page_url, visitor_id, session_id, timestamp, time_on_page, referrer, user_agent)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          page,
          `visitor_${Math.floor(Math.random() * 1000)}`,
          `session_${Math.floor(Math.random() * 1000)}`,
          timestamp,
          timeOnPage,
          referrer,
          userAgent
        ]);
      }
      
      // Calculate daily metrics
      const visitsResult = await client.query(`
        SELECT 
          COUNT(DISTINCT visitor_id) as unique_visitors,
          COUNT(*) as page_views,
          AVG(time_on_page) as avg_time_on_page
        FROM page_visits 
        WHERE DATE(timestamp) = $1
      `, [dateStr]);
      
      const { unique_visitors, page_views, avg_time_on_page } = visitsResult.rows[0];
      
      // Calculate bounce rate (simplified)
      const bounceRate = Math.random() * 0.4 + 0.2; // 20-60%
      
      await client.query(`
        INSERT INTO daily_metrics (date, page_visits, page_views, avg_time_on_page, bounce_rate, unique_visitors)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        dateStr,
        parseInt(unique_visitors),
        parseInt(page_views),
        parseFloat(avg_time_on_page || 0),
        parseFloat(bounceRate),
        parseInt(unique_visitors)
      ]);
      
      console.log(`📊 Added data for ${dateStr}: ${unique_visitors} visitors, ${page_views} views`);
    }
    
    // Add some sample predictions
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const dateStr = futureDate.toISOString().split('T')[0];
      
      const predictedVisits = Math.floor(Math.random() * 100) + 80;
      const confidenceInterval = Math.random() * 0.2 + 0.1; // 10-30%
      
      await client.query(`
        INSERT INTO predictions (metric_name, predicted_date, predicted_value, confidence_interval, model_version, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'page_visits',
        dateStr,
        predictedVisits,
        confidenceInterval,
        'v1.0.0',
        new Date()
      ]);
    }
    
    console.log('✅ Sample data seeded successfully!');
    console.log('📈 Generated 30 days of analytics data');
    console.log('🔮 Added 7 days of predictions');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedData(); 