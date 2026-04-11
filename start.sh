#!/usr/bin/env bash
# Start the Travel Planner dev servers (FastAPI + Vite).
# Usage: ./start.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

# ── Cleanup on exit ──────────────────────────────────────────────
cleanup() {
  echo ""
  echo "Shutting down..."
  kill "$API_PID" "$VITE_PID" 2>/dev/null || true
  wait "$API_PID" "$VITE_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ── Load .env if present ─────────────────────────────────────────
if [ -f "$ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

# ── FastAPI backend ──────────────────────────────────────────────
echo "Starting FastAPI on :8000 ..."
"$ROOT/venv/bin/uvicorn" travel_agent.adapters.fastapi_app:app \
  --host 0.0.0.0 --port 8000 --reload \
  --app-dir "$ROOT" &
API_PID=$!

# ── Vite frontend ────────────────────────────────────────────────
echo "Starting Vite on :5173 ..."
cd "$ROOT/web"
npx vite --host &
VITE_PID=$!

echo ""
echo "  API  → http://localhost:8000"
echo "  Web  → http://localhost:5173"
echo ""

# ── Wait for both (exit when either dies) ────────────────────────
wait "$API_PID" "$VITE_PID"
