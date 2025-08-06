# Geolocation and Device Analytics API Documentation

## Overview

This document describes the new geolocation and device analytics features that provide insights into visitor locations and device technology usage.

## New Database Fields

The `page_visits` table has been extended with the following fields:

### Geolocation Fields
- `country` (VARCHAR(100)) - Country name
- `region` (VARCHAR(100)) - State/Province/Region
- `city` (VARCHAR(100)) - City name
- `latitude` (DECIMAL(10, 8)) - Latitude coordinate
- `longitude` (DECIMAL(11, 8)) - Longitude coordinate

### Device and Technology Fields
- `device_type` (VARCHAR(50)) - Device category (desktop, mobile, tablet, other)
- `browser` (VARCHAR(100)) - Browser name
- `browser_version` (VARCHAR(50)) - Browser version
- `operating_system` (VARCHAR(100)) - Operating system name
- `os_version` (VARCHAR(50)) - Operating system version
- `screen_resolution` (VARCHAR(20)) - Screen resolution (e.g., "1920x1080")

## API Endpoints

### 1. Track Page Visit with Device/Geolocation Data

**POST** `/api/analytics/track`

Enhanced tracking endpoint that accepts device and geolocation information.

#### Request Body
```json
{
  "page_url": "https://example.com/page",
  "visitor_id": "visitor-123",
  "session_id": "session-456",
  "time_on_page": 120,
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)...",
  "ip_address": "192.168.1.1",
  
  // Geolocation fields (optional)
  "country": "United States",
  "region": "California",
  "city": "San Francisco",
  "latitude": 37.7749,
  "longitude": -122.4194,
  
  // Device fields (optional - will be auto-parsed from user_agent if not provided)
  "device_type": "mobile",
  "browser": "Safari",
  "browser_version": "14.1.2",
  "operating_system": "iOS",
  "os_version": "14.7.1",
  "screen_resolution": "375x812"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": 123,
    "timestamp": "2024-01-15T10:30:00Z",
    "message": "Page visit tracked successfully",
    "type": "page_visit"
  }
}
```

### 2. Get Visitors by Geolocation

**GET** `/api/analytics/geolocation`

Returns visitor analytics grouped by geographic location.

#### Query Parameters
- `start_date` (required) - Start date in ISO format
- `end_date` (required) - End date in ISO format
- `limit` (optional) - Number of results to return (default: 20, max: 100)

#### Example Request
```
GET /api/analytics/geolocation?start_date=2024-01-01&end_date=2024-01-31&limit=10
```

#### Response
```json
{
  "success": true,
  "data": {
    "geolocation": [
      {
        "country": "United States",
        "region": "California",
        "city": "San Francisco",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "unique_visitors": 150,
        "page_views": 450,
        "avg_time_on_page": 120.5
      },
      {
        "country": "Canada",
        "region": "Ontario",
        "city": "Toronto",
        "latitude": 43.6532,
        "longitude": -79.3832,
        "unique_visitors": 75,
        "page_views": 225,
        "avg_time_on_page": 95.2
      }
    ],
    "period": {
      "start_date": "2024-01-01",
      "end_date": "2024-01-31"
    }
  }
}
```

### 3. Get Visitors by Device Type and Technology

**GET** `/api/analytics/devices`

Returns visitor analytics grouped by device type and technology.

#### Query Parameters
- `start_date` (required) - Start date in ISO format
- `end_date` (required) - End date in ISO format
- `limit` (optional) - Number of results to return (default: 20, max: 100)

#### Example Request
```
GET /api/analytics/devices?start_date=2024-01-01&end_date=2024-01-31&limit=10
```

#### Response
```json
{
  "success": true,
  "data": {
    "devices": [
      {
        "device_type": "mobile",
        "browser": "Safari",
        "browser_version": "14.1.2",
        "operating_system": "iOS",
        "os_version": "14.7.1",
        "unique_visitors": 200,
        "page_views": 600,
        "avg_time_on_page": 85.3
      },
      {
        "device_type": "desktop",
        "browser": "Chrome",
        "browser_version": "91.0.4472.124",
        "operating_system": "Windows",
        "os_version": "10",
        "unique_visitors": 150,
        "page_views": 450,
        "avg_time_on_page": 120.7
      }
    ],
    "period": {
      "start_date": "2024-01-01",
      "end_date": "2024-01-31"
    }
  }
}
```

### 4. Get Device Type Breakdown

**GET** `/api/analytics/devices/breakdown`

Returns percentage breakdown of visitors by device type.

#### Query Parameters
- `start_date` (required) - Start date in ISO format
- `end_date` (required) - End date in ISO format

#### Example Request
```
GET /api/analytics/devices/breakdown?start_date=2024-01-01&end_date=2024-01-31
```

#### Response
```json
{
  "success": true,
  "data": {
    "device_types": [
      {
        "device_type": "mobile",
        "unique_visitors": 200,
        "page_views": 600,
        "percentage": 50.0
      },
      {
        "device_type": "desktop",
        "unique_visitors": 150,
        "page_views": 450,
        "percentage": 37.5
      },
      {
        "device_type": "tablet",
        "unique_visitors": 50,
        "page_views": 150,
        "percentage": 12.5
      }
    ],
    "period": {
      "start_date": "2024-01-01",
      "end_date": "2024-01-31"
    }
  }
}
```

### 5. Get Browser Breakdown

**GET** `/api/analytics/browsers/breakdown`

Returns percentage breakdown of visitors by browser.

#### Query Parameters
- `start_date` (required) - Start date in ISO format
- `end_date` (required) - End date in ISO format

#### Example Request
```
GET /api/analytics/browsers/breakdown?start_date=2024-01-01&end_date=2024-01-31
```

#### Response
```json
{
  "success": true,
  "data": {
    "browsers": [
      {
        "browser": "Chrome",
        "unique_visitors": 180,
        "page_views": 540,
        "percentage": 45.0
      },
      {
        "browser": "Safari",
        "unique_visitors": 120,
        "page_views": 360,
        "percentage": 30.0
      },
      {
        "browser": "Firefox",
        "unique_visitors": 60,
        "page_views": 180,
        "percentage": 15.0
      }
    ],
    "period": {
      "start_date": "2024-01-01",
      "end_date": "2024-01-31"
    }
  }
}
```

### 6. Get Operating System Breakdown

**GET** `/api/analytics/os/breakdown`

Returns percentage breakdown of visitors by operating system.

#### Query Parameters
- `start_date` (required) - Start date in ISO format
- `end_date` (required) - End date in ISO format

#### Example Request
```
GET /api/analytics/os/breakdown?start_date=2024-01-01&end_date=2024-01-31
```

#### Response
```json
{
  "success": true,
  "data": {
    "operating_systems": [
      {
        "operating_system": "Windows",
        "unique_visitors": 150,
        "page_views": 450,
        "percentage": 37.5
      },
      {
        "operating_system": "iOS",
        "unique_visitors": 120,
        "page_views": 360,
        "percentage": 30.0
      },
      {
        "operating_system": "Android",
        "unique_visitors": 80,
        "page_views": 240,
        "percentage": 20.0
      }
    ],
    "period": {
      "start_date": "2024-01-01",
      "end_date": "2024-01-31"
    }
  }
}
```

## Device Parser Utility

The system includes a `DeviceParser` utility that automatically extracts device information from user agent strings:

### Features
- **Automatic Device Detection**: Parses user agent strings to identify device type, browser, and OS
- **Geolocation Validation**: Validates latitude/longitude coordinates
- **Screen Resolution Parsing**: Converts screen data objects to string format
- **Device Type Mapping**: Standardizes device types to: desktop, mobile, tablet, other

### Usage Example
```javascript
const DeviceParser = require('./utils/deviceParser');

// Parse user agent
const deviceInfo = DeviceParser.parseUserAgent(userAgentString);

// Validate geolocation
const validatedGeo = DeviceParser.validateGeolocation({
  country: 'United States',
  latitude: 37.7749,
  longitude: -122.4194
});
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": {
    "message": "Error description",
    "details": "Detailed error information"
  }
}
```

Common error scenarios:
- Missing required parameters (start_date, end_date)
- Invalid date formats
- Database connection issues
- Invalid geolocation coordinates

## Rate Limiting

All endpoints are subject to the same rate limiting as existing analytics endpoints.

## Data Privacy

- IP addresses are stored for geolocation purposes
- Geolocation data is optional and can be omitted
- Device information is automatically parsed from user agent strings
- No personally identifiable information is collected beyond what's necessary for analytics 