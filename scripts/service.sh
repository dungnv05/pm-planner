#!/usr/bin/env bash

SERVICE_NAME="pm-resource-planner"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${PROJECT_DIR}/logs"
PID_FILE="${LOG_DIR}/service.pid"
PORT=9397

mkdir -p "$LOG_DIR"

start_service() {
  echo "🚀 Starting background service on port ${PORT}..."

  # Check if already running by PID or port
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      echo "⚠️  Service is already running (PID: ${PID}) on http://localhost:${PORT}"
      return 0
    fi
    rm -f "$PID_FILE"
  fi

  EXISTING_PID=$(lsof -ti :${PORT} 2>/dev/null)
  if [ -n "$EXISTING_PID" ]; then
    echo "⚠️  Port ${PORT} is already in use by PID ${EXISTING_PID}."
    echo "${EXISTING_PID}" > "$PID_FILE"
    echo "✅ Service is running on http://localhost:${PORT}"
    return 0
  fi

  # Start using nohup in background
  cd "$PROJECT_DIR" || exit 1
  nohup npm run dev > "${LOG_DIR}/service.log" 2> "${LOG_DIR}/service.err" &
  NEW_PID=$!
  echo "$NEW_PID" > "$PID_FILE"

  echo "Waiting for server to listen on port ${PORT}..."
  for i in {1..10}; do
    sleep 1
    if lsof -i :${PORT} >/dev/null 2>&1; then
      echo "✅ Server started successfully!"
      echo "🌐 Application available at: http://localhost:${PORT}"
      return 0
    fi
  done

  if kill -0 "$NEW_PID" 2>/dev/null; then
    echo "✅ Process started (PID: ${NEW_PID}), waiting for Vite build complete. Check http://localhost:${PORT}"
  else
    echo "❌ Service failed to start. Check logs via 'npm run service:logs'"
    return 1
  fi
}

stop_service() {
  echo "🛑 Stopping background service..."
  STOPPED=0

  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" 2>/dev/null || true
      sleep 1
      if kill -0 "$PID" 2>/dev/null; then
        kill -9 "$PID" 2>/dev/null || true
      fi
      echo "  - Process ${PID} terminated."
      STOPPED=1
    fi
    rm -f "$PID_FILE"
  fi

  # Cleanup any remaining process on port 9397
  PORT_PID=$(lsof -ti :${PORT} 2>/dev/null)
  if [ -n "$PORT_PID" ]; then
    kill -9 $PORT_PID 2>/dev/null || true
    echo "  - Process on port ${PORT} (PID: ${PORT_PID}) killed."
    STOPPED=1
  fi

  if [ $STOPPED -eq 1 ]; then
    echo "✅ Service stopped successfully."
  else
    echo "ℹ️  No running service found on port ${PORT}."
  fi
}

status_service() {
  echo "📊 Background Service Status:"
  PORT_PID=$(lsof -ti :${PORT} 2>/dev/null)
  if [ -n "$PORT_PID" ]; then
    echo "  - Status: RUNNING"
    echo "  - PID: ${PORT_PID}"
    echo "  - URL: http://localhost:${PORT}"
  else
    echo "  - Status: STOPPED"
    echo "  - Port ${PORT}: Free"
  fi
}

logs_service() {
  echo "📋 Service Logs (${LOG_DIR}):"
  echo "=== service.err ==="
  tail -n 25 "${LOG_DIR}/service.err" 2>/dev/null || echo "(No error log content)"
  echo "=== service.log ==="
  tail -n 25 "${LOG_DIR}/service.log" 2>/dev/null || echo "(No output log content)"
}

case "$1" in
  start)
    start_service
    ;;
  stop)
    stop_service
    ;;
  restart)
    stop_service
    sleep 1
    start_service
    ;;
  status)
    status_service
    ;;
  logs)
    logs_service
    ;;
  *)
    echo "Usage: npm run service:[start|stop|restart|status|logs]"
    exit 1
    ;;
esac
