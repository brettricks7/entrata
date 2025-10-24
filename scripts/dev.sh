#!/usr/bin/env bash
set -euo pipefail

# Determine repository root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Default ports (can override server with PORT env var)
SERVER_PORT="${PORT:-4000}"
WEB_PORT=5173
WEB_URL="http://localhost:${WEB_PORT}"

cleanup() {
  # Stop child processes if they are still running
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" || true
  fi
  if [[ -n "${WEB_PID:-}" ]] && kill -0 "${WEB_PID}" 2>/dev/null; then
    kill "${WEB_PID}" || true
  fi
}
trap cleanup INT TERM EXIT

wait_for_url() {
  local url="$1"
  local name="$2"
  local timeout="${3:-90}"
  local elapsed=0
  until curl -sSf -o /dev/null "$url"; do
    sleep 1
    elapsed=$((elapsed+1))
    if (( elapsed >= timeout )); then
      echo "Timed out waiting for $name at $url after ${timeout}s" >&2
      return 1
    fi
  done
}

echo "Starting backend (server) and frontend (web)..."

(cd "$ROOT_DIR/server" && npm install && npm run dev) &
SERVER_PID=$!

(cd "$ROOT_DIR/web" && npm install && npm run dev) &
WEB_PID=$!

echo "Waiting for server health at http://localhost:${SERVER_PORT}/health ..."
if ! wait_for_url "http://localhost:${SERVER_PORT}/health" "server" 120; then
  echo "Server may still be starting; continuing..."
fi

echo "Frontend available at ${WEB_URL}. Open it in your browser."

echo "Servers running. Press Ctrl+C to stop."
wait "${SERVER_PID}" "${WEB_PID}" || true


