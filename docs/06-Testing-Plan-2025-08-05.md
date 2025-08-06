# Testing Plan

## Overview

This document outlines the comprehensive testing strategy for the Website Analytics System, including unit tests, integration tests, and end-to-end testing procedures.

## Test Environment Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Environment Variables
```bash
# Test Database
DATABASE_URL=postgresql://username:password@localhost:5432/siteanalytics_test

# Test Server
PORT=3002
NODE_ENV=test

# Test CORS
FRONTEND_URL=http://localhost:3000
```

## Unit Tests

### Backend API Tests

#### Test Structure
```
backend/tests/
├── unit/
│   ├── controllers/
│   │   ├── analyticsController.test.js
│   │   └── healthController.test.js
│   ├── services/
│   │   ├── analyticsService.test.js
│   │   └── databaseService.test.js
│   ├── middleware/
│   │   ├── validation.test.js
│   │   ├── errorHandler.test.js
│   │   └── rateLimiter.test.js
│   └── utils/
│       └── helpers.test.js
├── integration/
│   ├── api/
│   │   ├── analytics.test.js
│   │   ├── health.test.js
│   │   └── tracking.test.js
│   └── database/
│       └── analytics.test.js
└── e2e/
    ├── tracking.test.js
    ├── dashboard.test.js
    └── performance.test.js
```

#### Running Tests
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep "analytics"

# Run with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage Targets
- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

## API Endpoint Testing

### 1. Health Check Endpoint

#### Test Cases
```javascript
describe('GET /api/health', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('healthy');
    expect(response.body.services.database).toBe('connected');
  });

  it('should include uptime and memory info', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.uptime).toBeDefined();
    expect(response.body.memory).toBeDefined();
  });
});
```

### 2. Analytics Tracking Endpoint

#### Test Cases
```javascript
describe('POST /api/analytics/track', () => {
  it('should track page visit successfully', async () => {
    const pageVisitData = {
      page_url: 'https://example.com/test',
      visitor_id: 'test-visitor-123',
      session_id: 'test-session-456',
      time_on_page: 30,
      referrer: 'https://google.com',
      user_agent: 'Mozilla/5.0 (Test Browser)'
    };

    const response = await request(app)
      .post('/api/analytics/track')
      .send(pageVisitData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.type).toBe('page_visit');
    expect(response.body.data.message).toBe('Page visit tracked successfully');
  });

  it('should track event successfully', async () => {
    const eventData = {
      page_url: 'https://example.com/test',
      visitor_id: 'test-visitor-123',
      session_id: 'test-session-456',
      event_name: 'button_click',
      event_data: { button_name: 'cta_button' }
    };

    const response = await request(app)
      .post('/api/analytics/track')
      .send(eventData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.type).toBe('event');
    expect(response.body.data.message).toBe('Event tracked successfully');
  });

  it('should validate required fields', async () => {
    const invalidData = {
      visitor_id: 'test-visitor-123'
      // Missing page_url and session_id
    };

    const response = await request(app)
      .post('/api/analytics/track')
      .send(invalidData)
      .expect(400);

    expect(response.body.error.message).toBe('Validation Error');
    expect(response.body.error.details).toHaveLength(2);
  });

  it('should validate URL format', async () => {
    const invalidData = {
      page_url: 'invalid-url',
      visitor_id: 'test-visitor-123',
      session_id: 'test-session-456'
    };

    const response = await request(app)
      .post('/api/analytics/track')
      .send(invalidData)
      .expect(400);

    expect(response.body.error.details[0].field).toBe('page_url');
  });
});
```

### 3. Real-time Metrics Endpoint

#### Test Cases
```javascript
describe('GET /api/analytics/metrics/realtime', () => {
  beforeEach(async () => {
    // Setup test data
    await analyticsService.trackPageVisit({
      page_url: 'https://example.com/test1',
      visitor_id: 'visitor-1',
      session_id: 'session-1',
      time_on_page: 30
    });
  });

  it('should return real-time metrics', async () => {
    const response = await request(app)
      .get('/api/analytics/metrics/realtime')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.metrics).toBeDefined();
    expect(response.body.data.metrics.active_visitors).toBeDefined();
    expect(response.body.data.metrics.page_views_24h).toBeDefined();
  });

  it('should return correct visitor count', async () => {
    const response = await request(app)
      .get('/api/analytics/metrics/realtime')
      .expect(200);

    expect(parseInt(response.body.data.metrics.active_visitors)).toBeGreaterThan(0);
  });
});
```

### 4. Daily Metrics Endpoint

#### Test Cases
```javascript
describe('GET /api/analytics/metrics/daily', () => {
  it('should return daily metrics with days parameter', async () => {
    const response = await request(app)
      .get('/api/analytics/metrics/daily?days=7')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.metrics).toBeInstanceOf(Array);
    expect(response.body.data.period.days).toBe(7);
  });

  it('should return daily metrics with date range', async () => {
    const startDate = '2025-08-01T00:00:00.000Z';
    const endDate = '2025-08-07T23:59:59.999Z';

    const response = await request(app)
      .get(`/api/analytics/metrics/daily?start_date=${startDate}&end_date=${endDate}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.period.start_date).toBe(startDate);
    expect(response.body.data.period.end_date).toBe(endDate);
  });

  it('should validate days parameter range', async () => {
    const response = await request(app)
      .get('/api/analytics/metrics/daily?days=400')
      .expect(400);

    expect(response.body.error.message).toBe('Query Validation Error');
  });
});
```

### 5. Top Pages Endpoint

#### Test Cases
```javascript
describe('GET /api/analytics/pages/top', () => {
  it('should return top pages', async () => {
    const startDate = '2025-08-01T00:00:00.000Z';
    const endDate = '2025-08-07T23:59:59.999Z';

    const response = await request(app)
      .get(`/api/analytics/pages/top?start_date=${startDate}&end_date=${endDate}&limit=5`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.pages).toBeInstanceOf(Array);
    expect(response.body.data.period).toBeDefined();
  });

  it('should require start_date and end_date', async () => {
    const response = await request(app)
      .get('/api/analytics/pages/top?limit=5')
      .expect(400);

    expect(response.body.error.message).toBe('start_date and end_date are required');
  });
});
```

## Frontend Integration Testing

### 1. Analytics Tracker Script

#### Test Cases
```javascript
describe('Analytics Tracker', () => {
  beforeEach(() => {
    // Setup DOM environment
    document.body.innerHTML = '<div id="root"></div>';
  });

  it('should initialize with correct configuration', () => {
    window.SiteAnalytics.init('http://localhost:3001', {
      debug: true,
      autoTrack: false
    });

    expect(window.SiteAnalytics).toBeDefined();
  });

  it('should generate visitor and session IDs', () => {
    window.SiteAnalytics.init('http://localhost:3001');
    
    const visitorId = window.SiteAnalytics.getVisitorId();
    const sessionId = window.SiteAnalytics.getSessionId();
    
    expect(visitorId).toBeDefined();
    expect(sessionId).toBeDefined();
    expect(visitorId).toMatch(/^[a-f0-9-]{36}$/);
    expect(sessionId).toMatch(/^[a-f0-9-]{36}$/);
  });

  it('should track page views', async () => {
    window.SiteAnalytics.init('http://localhost:3001');
    
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    window.SiteAnalytics.track();
    
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/api/analytics/track',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  it('should track custom events', async () => {
    window.SiteAnalytics.init('http://localhost:3001');
    
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    window.SiteAnalytics.trackEvent('button_click', {
      button_name: 'cta_button'
    });
    
    const callArgs = fetch.mock.calls[0][1];
    const body = JSON.parse(callArgs.body);
    
    expect(body.event_name).toBe('button_click');
    expect(body.event_data.button_name).toBe('cta_button');
  });
});
```

### 2. React Hook Testing

#### Test Cases
```javascript
describe('useAnalytics Hook', () => {
  it('should initialize analytics on mount', () => {
    const { result } = renderHook(() => useAnalytics());
    
    expect(result.current.isInitialized).toBe(true);
  });

  it('should track page views on route change', () => {
    const mockTrack = jest.fn();
    window.SiteAnalytics = { track: mockTrack };
    
    const { result } = renderHook(() => useAnalytics());
    
    // Simulate route change
    act(() => {
      result.current.trackEvent('page_view');
    });
    
    expect(mockTrack).toHaveBeenCalled();
  });

  it('should provide tracking methods', () => {
    const { result } = renderHook(() => useAnalytics());
    
    expect(result.current.trackClick).toBeDefined();
    expect(result.current.trackEvent).toBeDefined();
    expect(result.current.trackFormSubmit).toBeDefined();
    expect(result.current.trackExternalLink).toBeDefined();
  });
});
```

## Performance Testing

### 1. Load Testing

#### Test Scenarios
```javascript
describe('Performance Tests', () => {
  it('should handle 100 concurrent tracking requests', async () => {
    const requests = Array.from({ length: 100 }, () =>
      request(app)
        .post('/api/analytics/track')
        .send({
          page_url: 'https://example.com/test',
          visitor_id: 'visitor-' + Math.random(),
          session_id: 'session-' + Math.random(),
          time_on_page: 30
        })
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    responses.forEach(response => {
      expect(response.status).toBe(201);
    });
  });

  it('should handle 1000 requests per minute', async () => {
    const requests = Array.from({ length: 1000 }, () =>
      request(app)
        .get('/api/analytics/metrics/realtime')
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(30000); // 30 seconds
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

### 2. Database Performance

#### Test Cases
```javascript
describe('Database Performance', () => {
  it('should handle large dataset queries', async () => {
    // Insert 10,000 test records
    const testData = Array.from({ length: 10000 }, (_, i) => ({
      page_url: `https://example.com/page${i}`,
      visitor_id: `visitor-${i}`,
      session_id: `session-${i}`,
      time_on_page: Math.floor(Math.random() * 300)
    }));

    await Promise.all(
      testData.map(data => analyticsService.trackPageVisit(data))
    );

    const startTime = Date.now();
    const metrics = await analyticsService.getDailyMetrics(
      new Date('2025-08-01'),
      new Date('2025-08-07')
    );
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000); // 1 second
    expect(metrics).toBeDefined();
  });
});
```

## Security Testing

### 1. Input Validation

#### Test Cases
```javascript
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousData = {
      page_url: "'; DROP TABLE page_visits; --",
      visitor_id: 'test',
      session_id: 'test'
    };

    const response = await request(app)
      .post('/api/analytics/track')
      .send(maliciousData)
      .expect(400);

    // Verify table still exists
    const tableExists = await checkTableExists('page_visits');
    expect(tableExists).toBe(true);
  });

  it('should validate URL format', async () => {
    const invalidUrls = [
      'javascript:alert("xss")',
      'data:text/html,<script>alert("xss")</script>',
      'file:///etc/passwd'
    ];

    for (const url of invalidUrls) {
      const response = await request(app)
        .post('/api/analytics/track')
        .send({
          page_url: url,
          visitor_id: 'test',
          session_id: 'test'
        })
        .expect(400);

      expect(response.body.error.message).toBe('Validation Error');
    }
  });

  it('should prevent XSS in event data', async () => {
    const maliciousEventData = {
      page_url: 'https://example.com',
      visitor_id: 'test',
      session_id: 'test',
      event_name: 'test',
      event_data: {
        message: '<script>alert("xss")</script>'
      }
    };

    const response = await request(app)
      .post('/api/analytics/track')
      .send(maliciousEventData)
      .expect(201);

    // Verify data is stored safely
    const storedData = await getLastTrackingRecord();
    expect(storedData.event_data.message).toBe('<script>alert("xss")</script>');
  });
});
```

### 2. Rate Limiting

#### Test Cases
```javascript
describe('Rate Limiting', () => {
  it('should enforce rate limits', async () => {
    const requests = Array.from({ length: 110 }, () =>
      request(app)
        .post('/api/analytics/track')
        .send({
          page_url: 'https://example.com/test',
          visitor_id: 'test',
          session_id: 'test'
        })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it('should include rate limit headers', async () => {
    const response = await request(app)
      .post('/api/analytics/track')
      .send({
        page_url: 'https://example.com/test',
        visitor_id: 'test',
        session_id: 'test'
      });

    expect(response.headers['x-ratelimit-limit']).toBeDefined();
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
  });
});
```

## CORS Testing

### Test Cases
```javascript
describe('CORS Configuration', () => {
  it('should allow requests from localhost:3000', async () => {
    const response = await request(app)
      .post('/api/analytics/track')
      .set('Origin', 'http://localhost:3000')
      .send({
        page_url: 'https://example.com/test',
        visitor_id: 'test',
        session_id: 'test'
      });

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('should allow requests from localhost:5173', async () => {
    const response = await request(app)
      .post('/api/analytics/track')
      .set('Origin', 'http://localhost:5173')
      .send({
        page_url: 'https://example.com/test',
        visitor_id: 'test',
        session_id: 'test'
      });

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('should handle preflight requests', async () => {
    const response = await request(app)
      .options('/api/analytics/track')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'Content-Type')
      .expect(204);

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  });
});
```

## End-to-End Testing

### 1. Complete User Journey

#### Test Scenario
```javascript
describe('End-to-End Analytics Flow', () => {
  it('should track complete user session', async () => {
    // 1. User visits website
    await page.goto('http://localhost:5173');
    
    // 2. Analytics should be initialized
    const analyticsInitialized = await page.evaluate(() => {
      return window.SiteAnalytics && window.SiteAnalytics.getVisitorId();
    });
    expect(analyticsInitialized).toBeTruthy();

    // 3. Navigate to different pages
    await page.click('a[href="/about"]');
    await page.waitForTimeout(1000);
    
    await page.click('a[href="/projects"]');
    await page.waitForTimeout(1000);

    // 4. Click on navigation elements
    await page.click('a[href="/contact"]');
    await page.waitForTimeout(1000);

    // 5. Check analytics dashboard
    await page.goto('http://localhost:5173/analytics');
    await page.waitForSelector('.analytics-dashboard');

    // 6. Verify data is displayed
    const visitorCount = await page.$eval('.visitor-count', el => el.textContent);
    expect(parseInt(visitorCount)).toBeGreaterThan(0);

    const pageViews = await page.$eval('.page-views', el => el.textContent);
    expect(parseInt(pageViews)).toBeGreaterThan(0);
  });
});
```

### 2. Dashboard Functionality

#### Test Cases
```javascript
describe('Analytics Dashboard', () => {
  it('should display real-time metrics', async () => {
    await page.goto('http://localhost:5173/analytics');
    
    await page.waitForSelector('.real-time-metrics');
    
    const activeVisitors = await page.$eval('.active-visitors', el => el.textContent);
    const pageViews = await page.$eval('.page-views', el => el.textContent);
    
    expect(activeVisitors).toBeDefined();
    expect(pageViews).toBeDefined();
  });

  it('should display daily trends', async () => {
    await page.goto('http://localhost:5173/analytics');
    
    await page.waitForSelector('.daily-trends');
    
    const trendData = await page.$$eval('.trend-item', items => 
      items.map(item => item.textContent)
    );
    
    expect(trendData.length).toBeGreaterThan(0);
  });

  it('should display top pages', async () => {
    await page.goto('http://localhost:5173/analytics');
    
    await page.waitForSelector('.top-pages');
    
    const topPages = await page.$$eval('.page-item', items => 
      items.map(item => item.textContent)
    );
    
    expect(topPages.length).toBeGreaterThan(0);
  });
});
```

## Test Data Management

### Test Database Setup
```javascript
beforeAll(async () => {
  // Setup test database
  await setupTestDatabase();
});

afterEach(async () => {
  // Clean test data
  await cleanTestData();
});

afterAll(async () => {
  // Teardown test database
  await teardownTestDatabase();
});
```

### Mock Data Generation
```javascript
const generateTestData = (count = 100) => {
  return Array.from({ length: count }, (_, i) => ({
    page_url: `https://example.com/page${i}`,
    visitor_id: `visitor-${i}`,
    session_id: `session-${i}`,
    time_on_page: Math.floor(Math.random() * 300),
    referrer: `https://google.com/search?q=page${i}`,
    user_agent: 'Mozilla/5.0 (Test Browser)',
    event_name: Math.random() > 0.7 ? 'button_click' : null,
    event_data: Math.random() > 0.7 ? { button_name: `button-${i}` } : null
  }));
};
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Test Analytics System

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: siteanalytics_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/siteanalytics_test
          NODE_ENV: test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Test Reporting

### Coverage Reports
- **HTML Coverage**: `coverage/index.html`
- **LCOV Coverage**: `coverage/lcov.info`
- **Console Summary**: Coverage percentage in test output

### Test Results
- **Jest Reporter**: Detailed test results in console
- **JUnit XML**: `test-results.xml` for CI integration
- **HTML Report**: `test-report.html` for detailed analysis

## Performance Benchmarks

### Baseline Metrics
- **API Response Time**: < 100ms for tracking endpoints
- **Database Queries**: < 50ms for analytics queries
- **Memory Usage**: < 100MB for typical usage
- **Concurrent Users**: 1000+ simultaneous tracking requests

### Monitoring
- **Real-time Metrics**: Response times, error rates, throughput
- **Database Performance**: Query execution times, connection pool usage
- **Memory Usage**: Heap size, garbage collection frequency
- **Error Tracking**: Failed requests, validation errors, database errors

---

**Last Updated**: August 6, 2025  
**Next Review**: August 13, 2025 