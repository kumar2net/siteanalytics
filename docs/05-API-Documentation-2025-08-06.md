# API Documentation

## Overview

The Website Analytics API provides comprehensive tracking and analytics capabilities for websites. It supports both page visit tracking and custom event tracking.

**Base URL**: `http://localhost:3001/api`

## Authentication

Currently, the API does not require authentication for development purposes. In production, consider implementing API key authentication.

## Endpoints

### 1. Health Check

**GET** `/health`

Check the health status of the API and database.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-06T01:44:52.578Z",
  "services": {
    "database": "connected",
    "database_timestamp": "2025-08-06T01:44:52.578Z"
  },
  "uptime": 123.456,
  "memory": {
    "rss": 72122368,
    "heapTotal": 20971520,
    "heapUsed": 12037664
  }
}
```

### 2. Track Page Visit or Event

**POST** `/analytics/track`

Track a page visit or custom event.

**Request Body:**
```json
{
  "page_url": "https://example.com/page",
  "visitor_id": "uuid-string",
  "session_id": "uuid-string",
  "time_on_page": 30,
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0...",
  "event_name": "button_click",        // Optional - for events only
  "event_data": {                      // Optional - for events only
    "button_name": "cta_button",
    "location": "hero_section"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3511,
    "timestamp": "2025-08-06T01:44:48.672Z",
    "message": "Page visit tracked successfully",
    "type": "page_visit"
  }
}
```

**Event Response:**
```json
{
  "success": true,
  "data": {
    "id": 3510,
    "timestamp": "2025-08-06T01:44:39.704Z",
    "message": "Event tracked successfully",
    "type": "event"
  }
}
```

### 3. Get Real-time Metrics

**GET** `/analytics/metrics/realtime`

Get real-time analytics metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "active_visitors": "1",
      "page_views_24h": "7",
      "avg_time_on_page_24h": "5.0000000000000000"
    },
    "timestamp": "2025-08-06T01:44:52.578Z"
  }
}
```

### 4. Get Daily Metrics

**GET** `/analytics/metrics/daily`

Get daily metrics for a specified period.

**Query Parameters:**
- `days` (optional): Number of days to retrieve (1-365, default: 30)
- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Example Request:**
```
GET /analytics/metrics/daily?days=7
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": [
      {
        "date": "2025-08-05T18:30:00.000Z",
        "page_visits": 83,
        "page_views": 84,
        "avg_time_on_page": 184.5,
        "bounce_rate": 0.467,
        "unique_visitors": 83
      }
    ],
    "period": {
      "start_date": "2025-07-30T01:39:42.807Z",
      "end_date": "2025-08-06T01:39:42.807Z",
      "days": 7
    }
  }
}
```

### 5. Get Top Pages

**GET** `/analytics/pages/top`

Get the most visited pages for a specified period.

**Query Parameters:**
- `start_date` (required): Start date in ISO format
- `end_date` (required): End date in ISO format
- `limit` (optional): Number of pages to return (1-100, default: 10)

**Example Request:**
```
GET /analytics/pages/top?start_date=2025-07-30T00:00:00.000Z&end_date=2025-08-06T23:59:59.999Z&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pages": [
      {
        "page_url": "/analytics",
        "unique_visitors": "5",
        "page_views": "8",
        "avg_time_on_page": "12.5"
      }
    ],
    "period": {
      "start_date": "2025-07-30T00:00:00.000Z",
      "end_date": "2025-08-06T23:59:59.999Z"
    }
  }
}
```

### 6. Get Page Visits

**GET** `/analytics/visits`

Get detailed page visit data.

**Query Parameters:**
- `start_date` (required): Start date in ISO format
- `end_date` (required): End date in ISO format
- `page_url` (optional): Filter by specific page URL
- `limit` (optional): Number of records to return (1-1000, default: 100)
- `offset` (optional): Number of records to skip (default: 0)

**Example Request:**
```
GET /analytics/visits?start_date=2025-08-01T00:00:00.000Z&end_date=2025-08-06T23:59:59.999Z&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "id": 3511,
        "page_url": "http://localhost:5173/about",
        "visitor_id": "test",
        "session_id": "test",
        "timestamp": "2025-08-06T01:44:48.672Z",
        "time_on_page": 15,
        "referrer": "",
        "user_agent": "Mozilla/5.0...",
        "ip_address": "::1",
        "event_name": null,
        "event_data": null
      }
    ],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 1
    }
  }
}
```

### 7. Calculate Daily Metrics (Admin)

**POST** `/analytics/metrics/calculate`

Calculate and store daily metrics for a specific date.

**Request Body:**
```json
{
  "date": "2025-08-06"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "metrics": {
      "date": "2025-08-06",
      "page_visits": 5,
      "page_views": 8,
      "unique_visitors": 2,
      "avg_time_on_page": 12.5,
      "bounce_rate": 0.4
    },
    "message": "Daily metrics calculated successfully"
  }
}
```

### 8. Generate IDs

**GET** `/analytics/ids`

Generate visitor and session IDs.

**Response:**
```json
{
  "success": true,
  "data": {
    "visitor_id": "6bc4402a-5ad1-42de-b310-abb55e0be687",
    "session_id": "6f7eec76-4466-4749-8d12-b5c26b843b59"
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "message": "Validation Error",
    "details": [
      {
        "field": "page_url",
        "message": "\"page_url\" must be a valid uri"
      }
    ]
  }
}
```

## CORS Configuration

The API supports CORS for the following origins:
- `http://localhost:3000` (Original analytics frontend)
- `http://localhost:5173` (Personal website)
- Custom origins via `FRONTEND_URL` environment variable

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per minute per IP address
- 1000 requests per hour per IP address

## Database Schema

### page_visits Table
```sql
CREATE TABLE page_visits (
  id SERIAL PRIMARY KEY,
  page_url VARCHAR(500) NOT NULL,
  visitor_id VARCHAR(100) NOT NULL,
  session_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  time_on_page INTEGER DEFAULT 0,
  referrer VARCHAR(500),
  user_agent TEXT,
  ip_address INET,
  event_name VARCHAR(100),
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### daily_metrics Table
```sql
CREATE TABLE daily_metrics (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  page_visits INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  avg_time_on_page DECIMAL(10,2) DEFAULT 0,
  bounce_rate DECIMAL(5,4) DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/siteanalytics

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Integration Examples

### JavaScript/React Integration

```javascript
// Initialize analytics
window.SiteAnalytics.init('http://localhost:3001', {
  debug: true,
  autoTrack: true
});

// Track custom event
window.SiteAnalytics.trackEvent('button_click', {
  button_name: 'cta_button',
  location: 'hero_section'
});

// Track page view
window.SiteAnalytics.track({
  page_title: 'Home Page',
  custom_data: 'value'
});
```

### cURL Examples

```bash
# Track page visit
curl -X POST http://localhost:3001/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "page_url": "https://example.com",
    "visitor_id": "visitor-123",
    "session_id": "session-456",
    "time_on_page": 30
  }'

# Track event
curl -X POST http://localhost:3001/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "page_url": "https://example.com",
    "visitor_id": "visitor-123",
    "session_id": "session-456",
    "event_name": "form_submit",
    "event_data": {"form_type": "contact"}
  }'

# Get real-time metrics
curl http://localhost:3001/api/analytics/metrics/realtime

# Get daily metrics
curl "http://localhost:3001/api/analytics/metrics/daily?days=7"
```

---

**Last Updated**: August 6, 2025  
**Next Review**: August 13, 2025 