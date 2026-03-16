#!/usr/bin/env bash

set -euo pipefail

if [[ ! -f .node-version ]]; then
  echo "[task-runtime] .node-version not found in workspace root" >&2
  exit 1
fi

required_major="$(tr -d '[:space:]' < .node-version)"

current_major=""
if command -v node >/dev/null 2>&1; then
  current_major="$(node -p "process.versions.node.split('.')[0]")"
fi

if [[ "$current_major" != "$required_major" ]]; then
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    # shellcheck source=/dev/null
    . "$HOME/.nvm/nvm.sh"
    nvm use --silent "$required_major" >/dev/null
  fi
fi

if ! command -v node >/dev/null 2>&1; then
  echo "[task-runtime] Node.js is not available" >&2
  exit 1
fi

resolved_major="$(node -p "process.versions.node.split('.')[0]")"
if [[ "$resolved_major" != "$required_major" ]]; then
  echo "[task-runtime] Node major mismatch: required $required_major, got $(node -v)" >&2
  echo "[task-runtime] Install/activate Node $required_major (nvm recommended)" >&2
  exit 1
fi

exec "$@"
