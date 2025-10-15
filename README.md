# Website Visit Tracker

High-performance REST API and web application for tracking website visits by country with real-time statistics.

## Features

- **High Performance**: Optimized for 1000+ requests per second
- **Real-time Analytics**: Track visits by country with live statistics
- **Modern UI**: Beautiful, responsive web interface with interactive charts
- **Redis Integration**: Fast, scalable data storage with Docker support
- **Dynamic Country Data**: Comprehensive country codes and names via npm package

## Quick Start

### Docker (Recommended)

```bash
git clone https://github.com/cemmydev/hypromotion.git
cd hypromotion
docker-compose up -d
```

**Access:**
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Redis Commander: http://localhost:8081

### Manual Setup

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Start Redis
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Start services
npm run dev                    # Backend
cd frontend && npm run dev     # Frontend
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/visits/track` | Track a visit for a country |
| GET | `/api/visits/stats` | Get all visit statistics |
| GET | `/api/visits/stats/:countryCode` | Get country-specific stats |
| GET | `/api/visits/top` | Get top countries by visits |
| GET | `/api/visits/total` | Get total visit count |
| GET | `/api/visits/countries` | Get available countries |
| DELETE | `/api/visits/reset` | Reset all statistics |
| GET | `/health` | Health check |

### Example Usage

```bash
# Track a visit
curl -X POST http://localhost:3000/api/visits/track \
  -H "Content-Type: application/json" \
  -d '{"countryCode": "us"}'

# Get statistics
curl http://localhost:3000/api/visits/stats
```

## Testing

```bash
npm test                    # Run all tests
npm run test:coverage      # Run with coverage
npm test -- --testPathPattern=load.test.js  # Load tests
```

## Docker Commands

```bash
npm run docker:up          # Start services
npm run docker:down        # Stop services
npm run docker:logs        # View logs
npm run docker:build       # Build containers
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Backend port |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `BACKEND_URL` | `http://localhost:3000` | Backend URL for frontend |

## Support

For issues and questions, create an issue in the repository.