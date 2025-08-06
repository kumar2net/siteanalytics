const request = require('supertest');
const app = require('../src/index');
const { pool } = require('../src/config/database');

describe('Analytics API', () => {
  beforeAll(async () => {
    // Initialize database tables
    const { initializeDatabase } = require('../src/config/database');
    await initializeDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/analytics/track', () => {
    it('should track a page visit successfully', async () => {
      const pageVisitData = {
        page_url: 'https://example.com/test',
        visitor_id: 'test-visitor-123',
        session_id: 'test-session-456',
        time_on_page: 120,
        referrer: 'https://google.com',
        user_agent: 'Mozilla/5.0 (Test Browser)'
      };

      const response = await request(app)
        .post('/api/analytics/track')
        .send(pageVisitData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should reject invalid page URL', async () => {
      const invalidData = {
        page_url: 'not-a-valid-url',
        visitor_id: 'test-visitor-123',
        session_id: 'test-session-456'
      };

      const response = await request(app)
        .post('/api/analytics/track')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/analytics/visits', () => {
    it('should return page visits for date range', async () => {
      const response = await request(app)
        .get('/api/analytics/visits')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          limit: 10,
          offset: 0
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('visits');
      expect(response.body.data).toHaveProperty('pagination');
    });
  });

  describe('GET /api/analytics/metrics/daily', () => {
    it('should return daily metrics for date range', async () => {
      const response = await request(app)
        .get('/api/analytics/metrics/daily')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-01-31'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('metrics');
      expect(response.body.data).toHaveProperty('period');
    });
  });

  describe('GET /api/analytics/metrics/realtime', () => {
    it('should return real-time metrics', async () => {
      const response = await request(app)
        .get('/api/analytics/metrics/realtime')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('metrics');
      expect(response.body.data).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.services).toHaveProperty('database');
    });
  });
}); 