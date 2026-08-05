#!/usr/bin/env bash
# WikiBot showcase local server toggle (run again to stop)
# Port 5175. URL: http://localhost:5175
# Usage: bash serve.sh    (macOS / Linux / Git Bash)
cd "$(dirname "$0")"
PORT=5175
PIDFILE=serve.pid

# --- helper: PIDs currently listening on $PORT (cross-platform) ---
listener_pids() {
    if command -v lsof >/dev/null 2>&1; then
        lsof -ti tcp:"$PORT" 2>/dev/null
    fi
    if command -v netstat >/dev/null 2>&1; then
        netstat -ano 2>/dev/null | grep ":$PORT " | grep -i LISTENING | awk '{print $NF}'
    fi
}

# --- stop: if we recorded a PID AND it is the current listener, kill it ---
if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE" 2>/dev/null)
    if [ -n "$PID" ] && echo "$(listener_pids)" | grep -qw "$PID"; then
        echo "[stop] killing our server PID=$PID ..."
        kill "$PID" 2>/dev/null || true
        # Git Bash / Windows: native PID needs taskkill
        command -v taskkill >/dev/null 2>&1 && taskkill //PID "$PID" //F >/dev/null 2>&1 || true
        sleep 1
        rm -f "$PIDFILE"
        echo done.
        exit 0
    fi
    rm -f "$PIDFILE"
fi

# --- something is on PORT but NOT ours: warn, do not kill ---
if curl -s -o /dev/null --max-time 1 "http://localhost:$PORT/" 2>/dev/null; then
    echo "[!] port $PORT is in use, but NOT by this script's server."
    echo "    Refusing to kill an unknown process. PID(s) on port $PORT:"
    echo "    $(listener_pids | tr '\n' ' ')"
    echo "    Close it manually, then run serve.sh again."
    exit 1
fi

# --- start: pick python, run in background, detach from terminal ---
# validate each candidate actually runs (filters out the Windows Store python3 stub)
pick_python() {
    for c in "$@"; do
        command -v "$c" >/dev/null 2>&1 || continue
        "$c" -c 'import http.server' 2>/dev/null || continue
        echo "$c"; return
    done
}
if command -v taskkill >/dev/null 2>&1; then
    # Windows / Git Bash: prefer real python, avoid Store python3 stub
    PY=$(pick_python python python3 py) || { echo "[x] python not found"; exit 1; }
else
    PY=$(pick_python python3 python) || { echo "[x] python not found"; exit 1; }
fi

echo "[start] launching background server on port $PORT ..."
if command -v nohup >/dev/null 2>&1; then
    nohup $PY -m http.server "$PORT" --directory "$(pwd)" > serve.log 2>&1 &
else
    $PY -m http.server "$PORT" --directory "$(pwd)" > serve.log 2>&1 &
fi
PID=$!
echo "$PID" > "$PIDFILE"
disown 2>/dev/null || true

# reconcile pidfile with the actual listener PID (MSYS $! may differ on Git Bash)
sleep 1
LPID=$(listener_pids | grep -oE '[0-9]+' | head -1)
if [ -n "$LPID" ]; then echo "$LPID" > "$PIDFILE"; fi

sleep 1
echo
echo "  ============================================"
echo "    URL    :  http://localhost:$PORT"
echo "    mode   :  background (survives terminal close)"
echo "    stop   :  bash serve.sh again"
echo "    logs   :  serve.log"
echo "  ============================================"

# open browser (best-effort, non-blocking)
( sleep 1
  (command -v open >/dev/null && open "http://localhost:$PORT") \
  || (command -v xdg-open >/dev/null && xdg-open "http://localhost:$PORT") \
  || (command -v start >/dev/null && start "http://localhost:$PORT") \
  || true ) &
