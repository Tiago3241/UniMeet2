#!/usr/bin/env bash
set -euo pipefail

HOST="0.0.0.0"
PORT="${PORT:-3000}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      PORT="${2:-$PORT}"
      shift 2
      ;;
    --port=*)
      PORT="${1#*=}"
      shift
      ;;
    --host)
      HOST="${2:-$HOST}"
      shift 2
      ;;
    --host=*)
      HOST="${1#*=}"
      shift
      ;;
    *)
      shift
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$ROOT_DIR"

export PYTHONPATH="${ROOT_DIR}/backend"
export DATABASE_URL="${DATABASE_URL:-sqlite:///${ROOT_DIR}/backend/unimeet.db}"

VENV_PY="${ROOT_DIR}/backend/.venv/bin/python"
VENV_UVICORN="${ROOT_DIR}/backend/.venv/bin/uvicorn"

if [[ ! -x "$VENV_UVICORN" ]]; then
  if python3 -m virtualenv "${ROOT_DIR}/backend/.venv" >/dev/null 2>&1; then
    :
  elif python3 -m venv "${ROOT_DIR}/backend/.venv" >/dev/null 2>&1; then
    :
  else
    rm -rf "${ROOT_DIR}/backend/.venv"
    python3 -c "import urllib.request; urllib.request.urlretrieve('https://bootstrap.pypa.io/get-pip.py', '/tmp/get-pip.py')"
    python3 /tmp/get-pip.py --no-cache-dir
    rm -f /tmp/get-pip.py
    python3 -m pip install --no-cache-dir virtualenv
    python3 -m virtualenv "${ROOT_DIR}/backend/.venv"
  fi
  "${VENV_PY}" -m pip install --no-cache-dir -r "${ROOT_DIR}/backend/requirements.txt"
fi

# Ensure schema & demo data exist on first boot in non-production environments
if [[ "${ENVIRONMENT:-development}" != "production" ]]; then
  "${VENV_PY}" -m app.seed >/dev/null 2>&1 || true
fi

exec "${VENV_UVICORN}" app.main:app \
  --host "$HOST" \
  --port "$PORT" \
  --proxy-headers \
  --forwarded-allow-ips="*"
