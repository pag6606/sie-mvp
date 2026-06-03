#!/bin/bash
# SIE Development Environment
# Usage: ./dev.sh

echo "🐳 Starting Docker services..."
docker compose up -d

echo "⏳ Waiting for services..."
sleep 5

echo "🔧 Starting backend..."
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev &
BACKEND_PID=$!

echo "🎨 Starting frontend..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ SIE Development Environment Ready"
echo "   Backend:  http://localhost:8080"
echo "   Frontend: http://localhost:5173"
echo "   Mailpit:  http://localhost:8025"
echo "   RabbitMQ: http://localhost:15672"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID; docker compose down" EXIT
wait
