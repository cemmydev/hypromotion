# Website Visit Tracker

A high-performance REST API and web application for tracking website visits by country with real-time statistics visualization.

## Features

- **High Performance**: Optimized for 1000+ requests per second
- **Real-time Analytics**: Track visits by country with live statistics
- **Modern UI**: Beautiful, responsive web interface with interactive charts
- **Redis Integration**: Fast, scalable data storage
- **Dynamic Country Data**: Uses npm package for comprehensive country codes and names
- **Comprehensive Testing**: Unit and integration tests included
- **Production Ready**: Error handling, logging, and monitoring
- **Easy Deployment**: Docker support with docker-compose for one-command setup
- **Containerized**: Full Docker support with optimized multi-stage builds

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │     Redis       │
│   (Port 8080)   │◄──►│   (Port 3000)   │◄──►│   (Port 6379)   │
│                 │    │                 │    │                 │
│ • Web Interface │    │ • REST API      │    │ • Data Storage  │
│ • Charts        │    │ • Rate Limiting │    │ • High Speed    │
│ • Real-time UI  │    │ • Validation    │    │ • Persistence   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Option 1: Docker (Recommended)

The easiest way to run the application is using Docker Compose:

1. **Clone the repository**
   ```bash
   git clone https://github.com/cemmydev/hypromotion.git
   cd hypromotion
   ```

2. **Start all services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000
   - Redis Commander (optional): http://localhost:8081

4. **View logs**
   ```bash
   docker-compose logs -f
   ```

5. **Stop services**
   ```bash
   docker-compose down
   ```

### Option 2: Manual Installation

#### Prerequisites

- Node.js 18+ 
- Redis 6+
- npm or yarn

#### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hypromotion
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Start Redis**
   ```bash
   # Using Docker (recommended)
   docker run -d --name redis -p 6379:6379 redis:7-alpine
   
   # Or install Redis locally
   # Ubuntu/Debian: sudo apt install redis-server
   # macOS: brew install redis
   # Windows: Download from https://redis.io/download
   ```

4. **Configure environment** (optional)
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Start the services**
   ```bash
   # Terminal 1: Start backend
   npm run dev
   
   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Endpoints

#### Track Visit
```http
POST /api/visits/track
Content-Type: application/json

{
  "countryCode": "us"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Visit tracked successfully",
  "data": {
    "success": true,
    "country": "us",
    "count": 123
  }
}
```

#### Get All Statistics
```http
GET /api/visits/stats
```

**Response:**
```json
{
  "success": true,
  "message": "Statistics retrieved successfully",
  "data": {
    "us": 456,
    "uk": 123,
    "de": 89,
    "fr": 67
  }
}
```

#### Get Country Statistics
```http
GET /api/visits/stats/:countryCode
```

**Response:**
```json
{
  "success": true,
  "message": "Country statistics retrieved successfully",
  "data": {
    "country": "us",
    "count": 456
  }
}
```

#### Get Top Countries
```http
GET /api/visits/top?limit=10
```

**Response:**
```json
{
  "success": true,
  "message": "Top countries retrieved successfully",
  "data": {
    "limit": 10,
    "countries": [
      {"country": "us", "count": 456},
      {"country": "uk", "count": 123},
      {"country": "de", "count": 89}
    ]
  }
}
```

#### Get Total Visits
```http
GET /api/visits/total
```

**Response:**
```json
{
  "success": true,
  "message": "Total visits retrieved successfully",
  "data": {
    "total": 735
  }
}
```

#### Reset Statistics
```http
DELETE /api/visits/reset
```

**Response:**
```json
{
  "success": true,
  "message": "Statistics reset successfully",
  "data": {
    "success": true,
    "message": "Statistics reset successfully"
  }
}
```

#### Get Countries
```http
GET /api/visits/countries?popular=true
GET /api/visits/countries?search=united
GET /api/visits/countries
```

**Response:**
```json
{
  "success": true,
  "message": "Countries retrieved successfully",
  "data": {
    "countries": [
      {"code": "us", "name": "United States"},
      {"code": "gb", "name": "United Kingdom"},
      {"code": "de", "name": "Germany"}
    ],
    "total": 3
  }
}
```

#### Get Country Information
```http
GET /api/visits/countries/:countryCode
```

**Response:**
```json
{
  "success": true,
  "message": "Country information retrieved successfully",
  "data": {
    "code": "us",
    "name": "United States"
  }
}
```

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "uptime": 123.456,
  "message": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "visit-tracker",
  "version": "1.0.0",
  "database": "connected"
}
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "countryCode",
      "message": "Country code is required"
    }
  ]
}
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Backend server port |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `LOG_LEVEL` | `info` | Logging level |
| `FRONTEND_PORT` | `8080` | Frontend server port |
| `BACKEND_URL` | `http://localhost:3000` | Backend URL for frontend |
| `FRONTEND_URL` | `http://localhost:8080` | Frontend URL for CORS |

### Redis Configuration

The application uses Redis for high-performance data storage:

- **Data Structure**: Hash (`visit_stats`)
- **Key Format**: `visit_stats`
- **Field Format**: Country code (e.g., `us`, `uk`)
- **Value Format**: Visit count (integer)

## Performance Features

### High Load Optimization

- **Connection Pooling**: Multiple Redis connections for concurrent requests
- **Rate Limiting**: 1000 requests per 15 minutes per IP
- **Compression**: Automatic response compression
- **Keep-Alive**: HTTP connection reuse
- **Memory Monitoring**: Automatic garbage collection
- **Batch Operations**: Efficient Redis pipeline operations

### Monitoring

- **Performance Metrics**: Request duration and memory usage tracking
- **Health Checks**: Built-in health and readiness endpoints
- **Structured Logging**: JSON logs with Winston
- **Error Tracking**: Comprehensive error handling and logging

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run load tests
npm test -- --testPathPattern=load.test.js
```

### Test Structure

- **Unit Tests**: Model and utility function tests
- **Integration Tests**: API endpoint tests
- **Load Tests**: High-concurrency performance tests
- **Mock Redis**: Tests use Redis mock for isolation

## Deployment

### Docker Deployment (Recommended)

The easiest way to deploy is using Docker Compose:

1. **Production deployment with Docker Compose**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd hypromotion
   
   # Set production environment
   export NODE_ENV=production
   
   # Start all services
   docker-compose up -d
   
   # Check service status
   docker-compose ps
   
   # View logs
   docker-compose logs -f
   ```

2. **Enable Redis Commander for monitoring (optional)**
   ```bash
   docker-compose --profile tools up -d
   ```

3. **Scale services for high load**
   ```bash
   # Scale backend instances
   docker-compose up -d --scale backend=3
   
   # Use a load balancer (nginx, traefik, etc.)
   ```

4. **Update services**
   ```bash
   # Pull latest changes
   git pull
   
   # Rebuild and restart
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

### Production Deployment

1. **Set production environment**
   ```bash
   export NODE_ENV=production
   ```

2. **Configure Redis for production**
   ```bash
   # Redis configuration for production
   redis-server --maxmemory 1gb --maxmemory-policy allkeys-lru
   ```

3. **Use PM2 for process management**
   ```bash
   npm install -g pm2
   
   # Start backend
   pm2 start src/server.js --name "visit-tracker-backend"
   
   # Start frontend
   cd frontend
   pm2 start server.js --name "visit-tracker-frontend"
   ```

4. **Use nginx as reverse proxy**
   ```nginx
   upstream backend {
       server localhost:3000;
   }
   
   upstream frontend {
       server localhost:8080;
   }
   
   server {
       listen 80;
       
       location /api/ {
           proxy_pass http://backend;
       }
       
       location / {
           proxy_pass http://frontend;
       }
   }
   ```

### Scaling

For high-traffic scenarios:

1. **Horizontal Scaling**: Deploy multiple backend instances behind a load balancer
2. **Redis Cluster**: Use Redis Cluster for distributed caching
3. **CDN**: Use a CDN for frontend static assets
4. **Monitoring**: Implement APM tools (New Relic, DataDog, etc.)

## Development

### Project Structure

```
hypromotion/
├── src/                    # Backend source code
│   ├── config/            # Configuration files
│   ├── middleware/        # Express middleware
│   ├── models/           # Data models
│   ├── routes/           # API routes
│   └── server.js         # Main server file
├── frontend/             # Frontend application
│   ├── public/          # Static files
│   └── server.js        # Frontend server
├── tests/               # Test files
├── logs/               # Log files (created at runtime)
├── package.json        # Backend dependencies
└── README.md          # This file
```

### Adding New Features

1. **Backend Changes**
   - Add new routes in `src/routes/`
   - Update models in `src/models/`
   - Add middleware in `src/middleware/`

2. **Frontend Changes**
   - Update UI in `frontend/public/`
   - Add new API calls in `frontend/public/app.js`

3. **Testing**
   - Add unit tests in `tests/models/`
   - Add integration tests in `tests/routes/`
   - Update load tests in `tests/integration/`

### Code Quality

- **ESLint**: Code linting (add `.eslintrc.js` if needed)
- **Prettier**: Code formatting (add `.prettierrc` if needed)
- **Jest**: Testing framework with coverage
- **Winston**: Structured logging

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Check if Redis is running
   redis-cli ping
   
   # Start Redis if not running
   redis-server
   ```

2. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Kill the process or use a different port
   export PORT=3001
   ```

3. **High Memory Usage**
   ```bash
   # Enable garbage collection
   node --expose-gc src/server.js
   ```

4. **Slow Performance**
   - Check Redis memory usage
   - Monitor CPU and memory usage
   - Review application logs
   - Consider scaling horizontally

### Logs

Logs are stored in the `logs/` directory:
- `combined.log`: All logs
- `error.log`: Error logs only


## Support

For issues and questions:
- Check the troubleshooting section
- Review the logs
- Create an issue in the repository
