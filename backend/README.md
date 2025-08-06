# Website Analytics Backend

A Node.js/Express backend for tracking website analytics with real-time data collection and aggregation.

## Features

- **Real-time Analytics Tracking**: Collect page visits, time on page, and user sessions
- **Data Aggregation**: Daily metrics calculation with bounce rate and engagement metrics
- **RESTful API**: Clean API endpoints for data retrieval and analysis
- **Data Validation**: Comprehensive input validation using Joi
- **Rate Limiting**: Protection against API abuse
- **Health Monitoring**: Built-in health check endpoints
- **PostgreSQL Integration**: Robust data storage with proper indexing

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

3. **Set up PostgreSQL database:**
   ```sql
   CREATE DATABASE siteanalytics;
   CREATE USER siteanalytics_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE siteanalytics TO siteanalytics_user;
   ```

4. **Start the server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001` and automatically create the required database tables.

## API Endpoints

### Analytics Tracking

#### Track Page Visit
```http
POST /api/analytics/track
Content-Type: application/json

{
  "page_url": "https://example.com/page",
  "visitor_id": "uuid-string",
  "session_id": "uuid-string",
  "time_on_page": 120,
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0..."
}
```

#### Get Page Visits
```http
GET /api/analytics/visits?start_date=2024-01-01&end_date=2024-01-31&limit=100&offset=0
```

#### Get Daily Metrics
```http
GET /api/analytics/metrics/daily?start_date=2024-01-01&end_date=2024-01-31
```

#### Get Real-time Metrics
```http
GET /api/analytics/metrics/realtime
```

#### Get Top Pages
```http
GET /api/analytics/pages/top?start_date=2024-01-01&end_date=2024-01-31&limit=10
```

### Health Checks

#### Basic Health Check
```http
GET /api/health
```

#### Detailed Health Check
```http
GET /api/health/detailed
```

## JavaScript Tracking Script

Include the tracking script in your website:

```html
<script src="https://your-api-domain.com/shared/analytics-tracker.js"></script>
<script>
  SiteAnalytics.init('https://your-api-domain.com', {
    debug: true,
    autoTrack: true
  });
</script>
```

Or with data attributes:

```html
<script 
  src="https://your-api-domain.com/shared/analytics-tracker.js"
  data-api-endpoint="https://your-api-domain.com"
  data-debug="true"
  data-auto-track="true">
</script>
```

## Database Schema

### page_visits
- `id`: Primary key
- `page_url`: URL of the visited page
- `visitor_id`: Unique visitor identifier
- `session_id`: Session identifier
- `timestamp`: Visit timestamp
- `time_on_page`: Time spent on page (seconds)
- `referrer`: Referring URL
- `user_agent`: Browser user agent
- `ip_address`: Visitor IP address

### daily_metrics
- `id`: Primary key
- `date`: Date of metrics
- `page_visits`: Number of unique page visits
- `page_views`: Total page views
- `avg_time_on_page`: Average time on page
- `bounce_rate`: Bounce rate percentage
- `unique_visitors`: Number of unique visitors

### predictions
- `id`: Primary key
- `metric_name`: Name of predicted metric
- `predicted_date`: Date of prediction
- `predicted_value`: Predicted value
- `confidence_interval`: Confidence interval
- `model_version`: ML model version

## Development

### Scripts

```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm test            # Run tests
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
```

### Project Structure

```
src/
├── config/         # Database and app configuration
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── models/         # Data models (if using ORM)
├── routes/         # API route definitions
├── services/       # Business logic
├── utils/          # Utility functions
└── index.js        # Main application file
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | siteanalytics |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | password |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Deployment

### Production Setup

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT and session secrets
4. Configure proper CORS origins
5. Set up SSL/TLS certificates
6. Configure reverse proxy (nginx/Apache)

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Monitoring

The application includes built-in health checks and metrics:

- Health endpoint: `/api/health`
- Detailed health: `/api/health/detailed`
- Application logs with Morgan
- Database connection monitoring

## Security

- Helmet.js for security headers
- Rate limiting to prevent abuse
- Input validation with Joi
- CORS configuration
- SQL injection protection with parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 