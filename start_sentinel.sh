#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "=================================================================="
echo "🚨 STARTING SENTINEL-AI: GUJARAT POLICE C2 PLATFORM (HACKATHON 2026)"
echo "=================================================================="

# Activate virtualenv
source .venv/bin/activate

# Function to kill background jobs on exit
cleanup() {
  echo ""
  echo "Stopping SENTINEL-AI services..."
  kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Start Backend on Port 8000
echo "Starting FastAPI Backend on http://localhost:8000..."
.venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

# Start Unified Frame Relay & Local AI Worker
echo "Starting Unified Frame Relay & Local AI ANPR Engine..."
.venv/bin/python frame_relay.py --local &
RELAY_PID=$!

# Start Frontend on Port 5173
echo "Starting React/Vite Frontend on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=================================================================="
echo "✅ SENTINEL-AI IS RUNNING!"
echo "   Operational Dashboard: http://localhost:5173"
echo "   API & Swagger Docs:    http://localhost:8000/docs"
echo "   Live WebSocket Feed:   ws://localhost:8000/ws/stream"
echo "=================================================================="
echo "Press Ctrl+C to stop all services."

wait
