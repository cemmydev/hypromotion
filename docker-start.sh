#!/bin/bash

# Docker Start Script for Website Visit Tracker

echo "🐳 Starting Website Visit Tracker with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Set production environment
export NODE_ENV=production

echo "🚀 Starting services with Docker Compose..."

# Start services
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🎉 Website Visit Tracker is now running!"
echo ""
echo "📊 Frontend: http://localhost:8080"
echo "🔌 Backend API: http://localhost:3000"
echo "❤️  Health Check: http://localhost:3000/health"
echo "🔧 Redis Commander: http://localhost:8081 (optional)"
echo ""
echo "📝 View logs with: docker-compose logs -f"
echo "🛑 Stop services with: docker-compose down"
echo ""
echo "💡 To enable Redis Commander: docker-compose --profile tools up -d"
