#!/usr/bin/env bash
# Idempotent Cursor Cloud install for the Apps Script / clasp toolchain.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Prefer nvm Node over /exec-daemon/node so global npm installs land in a writable prefix.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm use --silent default >/dev/null 2>&1 || nvm use --silent node >/dev/null 2>&1 || true
fi

if [[ -d "$HOME/.nvm/versions/node" ]]; then
  LATEST_NODE_BIN="$(ls -1d "$HOME/.nvm/versions/node"/v*/bin 2>/dev/null | sort -V | tail -n 1 || true)"
  if [[ -n "${LATEST_NODE_BIN:-}" ]]; then
    export PATH="$LATEST_NODE_BIN:$PATH"
  fi
fi

echo "Node: $(node -v) ($(command -v node))"
echo "npm:  $(npm -v) ($(command -v npm))"

# Materialize clasp credentials from a Cursor Runtime Secret when present.
# Dashboard secret name: CLASPRC_JSON (contents of ~/.clasprc.json)
if [[ -n "${CLASPRC_JSON:-}" ]]; then
  printf '%s\n' "$CLASPRC_JSON" >"$HOME/.clasprc.json"
  chmod 600 "$HOME/.clasprc.json"
  echo "Wrote $HOME/.clasprc.json from CLASPRC_JSON"
else
  echo "CLASPRC_JSON not set; clasp auth will be unavailable until the secret is configured"
fi

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

# Ensure clasp is available as `clasp` even when PATH order is odd.
if ! command -v clasp >/dev/null 2>&1; then
  npm install -g @google/clasp --prefix "$(npm prefix -g)"
fi

echo "clasp: $(npx --no-install clasp --version 2>/dev/null || clasp --version)"
npm run typecheck
echo "Cloud install complete"
