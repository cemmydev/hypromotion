#!/bin/bash

# Website Visit Tracker Startup Script

echo "🚀 Starting Website Visit Tracker..."

# Check if Redis is running
echo "📡 Checking Redis connection..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis first:"
    echo "   docker run -d --name redis -p 6379:6379 redis:7-alpine"
    echo "   or install and start Redis locally"
    exit 1
fi
echo "✅ Redis is running"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
fi

# Create logs directory
mkdir -p logs

echo "🎯 Starting services..."

# Start backend in background
echo "🔧 Starting backend server on port 3000..."
npm run dev > logs/backend.log 2>&1 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "🎨 Starting frontend server on port 8080..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Website Visit Tracker is now running!"
echo ""
echo "📊 Frontend: http://localhost:8080"
echo "🔌 Backend API: http://localhost:3000"
echo "❤️  Health Check: http://localhost:3000/health"
echo ""
echo "📝 Logs:"
echo "   Backend: logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "🛑 To stop the services, run: ./stop.sh"
echo "   or press Ctrl+C and kill processes $BACKEND_PID and $FRONTEND_PID"

# Save PIDs for stop script
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

# Wait for user interrupt
trap 'echo ""; echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; rm -f .backend.pid .frontend.pid; echo "✅ Services stopped"; exit 0' INT

# Keep script running
wait
