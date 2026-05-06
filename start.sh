#!/bin/bash
# SPA Admin Portal – Start Script
# Admin Backend  → http://localhost:5001
# Admin Frontend → http://localhost:5173

set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   SPA Admin Portal                  ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Backend ───────────────────────────────────────────────────────────────────
echo "▶  Starting Backend (Flask + MongoDB) on port 5001..."
cd backend

if [ ! -d ".venv" ]; then
  echo "   Creating Python virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -r requirements.txt -q

PORT=5001 python app.py &
BACKEND_PID=$!
cd ..

sleep 2

# ── Frontend ──────────────────────────────────────────────────────────────────
echo "▶  Starting Frontend (React + Vite) on port 5173..."
cd frontend

if [ ! -d "node_modules" ]; then
  echo "   Installing npm dependencies..."
  npm install -q
fi

npm run dev &
FRONTEND_PID=$!
cd ..

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "✅  Admin Portal is running:"
echo "   Frontend  →  http://localhost:5173"
echo "   Backend   →  http://localhost:5001"
echo ""
echo "   Press Ctrl+C to stop all services."
echo ""

trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
