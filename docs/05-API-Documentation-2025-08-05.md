# Analytics MVP API Documentation

**Created**: August 5, 2025  
**Last Updated**: August 5, 2025  
**Version**: 1.0

## API Overview

### Base URL
```
Development: http://localhost:8000/api
Production: https://api.analytics-mvp.com/api
```

### Authentication
All API endpoints require JWT authentication except for data collection endpoints.

```http
Authorization: Bearer <jwt_token>
```

### Rate Limiting
- **Data Collection**: 100 requests/minute per IP
- **Analytics**: 1000 requests/minute per user
- **Predictions**: 100 requests/minute per user

## Data Collection Endpoints

### Track Page Visit
Records a page visit with analytics data.

```http
POST /api/track
Content-Type: application/json
```

#### Request Body
```json
{
  "page_url": "https://example.com/page",
  "visitor_id": "visitor_123",
  "session_id": "session_456",
  "time_on_page": 120,
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  "device_type": "desktop",
  "browser": "Chrome",
  "os": "Windows",
  "screen_resolution": "1920x1080",
  "language": "en-US"
}
```

#### Required Fields
- `page_url`: The URL of the visited page
- `visitor_id`: Unique identifier for the visitor
- `session_id`: Unique identifier for the session

#### Optional Fields
- `time_on_page`: Time spent on page in seconds
- `referrer`: Referring URL
- `user_agent`: Browser user agent string
- `device_type`: Device type (desktop, mobile, tablet)
- `browser`: Browser name
- `os`: Operating system
- `screen_resolution`: Screen resolution
- `language`: Browser language

#### Response
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "message": "Page visit tracked successfully",
  "data": {
    "id": 12345,
    "timestamp": "2025-08-05T16:30:23Z"
  }
}
```

#### Error Responses
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": "Validation failed",
  "details": {
    "page_url": "Page URL is required"
  }
}
```

## Analytics Endpoints

### Get Daily Metrics
Retrieves aggregated daily metrics for a date range.

```http
GET /api/metrics/daily?start_date=2025-08-01&end_date=2025-08-05
Authorization: Bearer <jwt_token>
```

#### Query Parameters
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `metrics` (optional): Comma-separated list of metrics to include

#### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": [
    {
      "date": "2025-08-01",
      "page_visits": 1250,
      "page_views": 3200,
      "unique_visitors": 980,
      "avg_time_on_page": 145.5,
      "bounce_rate": 0.35,
      "avg_session_duration": 420.3
    },
    {
      "date": "2025-08-02",
      "page_visits": 1320,
      "page_views": 3450,
      "unique_visitors": 1050,
      "avg_time_on_page": 152.1,
      "bounce_rate": 0.32,
      "avg_session_duration": 445.7
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 10
  }
}
```

### Get Real-time Metrics
Retrieves current real-time analytics data.

```http
GET /api/metrics/realtime
Authorization: Bearer <jwt_token>
```

#### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "current_visitors": 45,
    "today_visits": 1250,
    "today_views": 3200,
    "avg_time_today": 145.5,
    "bounce_rate_today": 0.35,
    "top_pages": [
      {
        "url": "/home",
        "visits": 450,
        "views": 1200
      },
      {
        "url": "/about",
        "visits": 320,
        "views": 850
      }
    ]
  }
}
```

### Get Top Pages
Retrieves the most visited pages.

```http
GET /api/metrics/pages?limit=10&period=7d
Authorization: Bearer <jwt_token>
```

#### Query Parameters
- `limit` (optional): Number of pages to return (default: 10)
- `period` (optional): Time period (1d, 7d, 30d, 90d)

#### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": [
    {
      "url": "/home",
      "visits": 4500,
      "views": 12000,
      "avg_time": 145.5,
      "bounce_rate": 0.25
    },
    {
      "url": "/about",
      "visits": 3200,
      "views": 8500,
      "avg_time": 180.2,
      "bounce_rate": 0.15
    }
  ]
}
```

### Get Traffic Sources
Retrieves traffic source analytics.

```http
GET /api/metrics/sources?limit=10&period=7d
Authorization: Bearer <jwt_token>
```

#### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": [
    {
      "source": "google",
      "visits": 2500,
      "percentage": 0.45,
      "avg_time": 160.3,
      "bounce_rate": 0.30
    },
    {
      "source": "direct",
      "visits": 1800,
      "percentage": 0.32,
      "avg_time": 200.1,
      "bounce_rate": 0.20
    }
  ]
}
```

## Prediction Endpoints

### Get Page Visit Predictions
Retrieves LSTM-based predictions for page visits.

```http
GET /api/predictions/page-visits?days=7
Authorization: Bearer <jwt_token>
```

#### Query Parameters
- `days` (optional): Number of days to predict (default: 7, max: 30)

#### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "predictions": [
      {
        "date": "2025-08-06",
        "predicted_visits": 1350,
        "confidence_interval": 0.85,
        "lower_bound": 1200,
        "upper_bound": 1500
      },
      {
        "date": "2025-08-07",
        "predicted_visits": 1420,
        "confidence_interval": 0.82,
        "lower_bound": 1280,
        "upper_bound": 1560
      }
    ],
    "model_info": {
      "version": "1.2.0",
      "accuracy": 0.87,
      "last_trained": "2025-08-05T10:00:00Z",
      "training_data_points": 90
    }
  }
}
```

### Get Model Accuracy
Retrieves current model performance metrics.

```http
GET /api/predictions/accuracy
Authorization: Bearer <jwt_token>
```

#### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "overall_accuracy": 0.87,
    "mae": 45.2,
    "rmse": 67.8,
    "r2_score": 0.82,
    "recent_predictions": [
      {
        "date": "2025-08-01",
        "predicted": 1250,
        "actual": 1280,
        "error": 30
      }
    ]
  }
}
```

### Retrain Model
Triggers model retraining with latest data.

```http
POST /api/predictions/retrain
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "force_retrain": false,
  "use_latest_data": true
}
```

#### Response
```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "success": true,
  "message": "Model retraining started",
  "data": {
    "job_id": "retrain_12345",
    "estimated_duration": "30 minutes",
    "status": "queued"
  }
}
```

## Recommendation Endpoints

### Get Recommendations
Retrieves actionable recommendations for website optimization.

```http
GET /api/recommendations?status=pending&priority=high
Authorization: Bearer <jwt_token>
```

#### Query Parameters
- `status` (optional): Filter by status (pending, implemented, dismissed)
- `priority` (optional): Filter by priority (low, medium, high)
- `type` (optional): Filter by type (content, performance, seo)

#### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "content",
      "title": "Optimize Homepage Content",
      "description": "Homepage has high bounce rate. Consider adding more engaging content.",
      "priority": "high",
      "status": "pending",
      "data": {
        "current_bounce_rate": 0.45,
        "target_bounce_rate": 0.30,
        "affected_pages": ["/home"]
      },
      "created_at": "2025-08-05T10:00:00Z"
    },
    {
      "id": 2,
      "type": "performance",
      "title": "Improve Page Load Speed",
      "description": "About page takes 4.2s to load. Optimize images and scripts.",
      "priority": "medium",
      "status": "pending",
      "data": {
        "current_load_time": 4.2,
        "target_load_time": 2.0,
        "affected_pages": ["/about"]
      },
      "created_at": "2025-08-05T09:30:00Z"
    }
  ]
}
```

### Update Recommendation Status
Updates the status of a recommendation.

```http
PUT /api/recommendations/{id}/status
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "status": "implemented",
  "notes": "Added more engaging content to homepage"
}
```

#### Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "Recommendation status updated",
  "data": {
    "id": 1,
    "status": "implemented",
    "updated_at": "2025-08-05T16:30:00Z"
  }
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_ERROR`: Invalid or missing authentication
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Rate limit exceeded
- `INTERNAL_ERROR`: Server error

### HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `202 Accepted`: Request accepted for processing
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1640995200
```

### Rate Limit Exceeded Response
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}
```

## Pagination

### Pagination Headers
```http
X-Total-Count: 150
X-Page: 1
X-Per-Page: 10
X-Total-Pages: 15
```

### Pagination Query Parameters
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

## Webhooks

### Webhook Events
- `page_visit.tracked`: New page visit recorded
- `prediction.generated`: New predictions available
- `recommendation.created`: New recommendation generated
- `model.retrained`: Model retraining completed

### Webhook Payload Example
```json
{
  "event": "page_visit.tracked",
  "timestamp": "2025-08-05T16:30:23Z",
  "data": {
    "page_url": "https://example.com/page",
    "visitor_id": "visitor_123",
    "session_id": "session_456"
  }
}
```

---

**Last Updated**: August 5, 2025  
**Next Review**: August 12, 2025 