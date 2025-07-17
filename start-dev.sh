#!/bin/bash
# Start development environment

echo "Starting Quiz Platform development environment..."

# Start backend
echo "Starting backend..."
cd backend && npm run dev &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "Services started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "URLs:"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait