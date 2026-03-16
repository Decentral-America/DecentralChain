#!/usr/bin/env bash
set -euo pipefail

# Archive the 25 original polyrepo repositories on GitHub.
#
# Prerequisites:
#   - GitHub CLI (`gh`) installed and authenticated
#   - Org admin permissions on Decentral-America
#
# Usage:
#   ./scripts/archive-polyrepos.sh          # dry-run (default)
#   ./scripts/archive-polyrepos.sh --apply  # actually archive

ORG="Decentral-America"
MONOREPO="https://github.com/${ORG}/DecentralChain"

REPOS=(
  assets-pairs-order
  bignumber
  browser-bus
  crypto
  cubensis-connect
  cubensis-connect-provider
  cubensis-connect-types
  data-entities
  data-service-client-js
  exchange
  scanner
  ledger
  marshall
  money-like-to-node
  node-api-js
  oracle-data
  parse-json-bignumber
  protobuf-serialization
  ride-js
  signature-adapter
  signer
  swap-client
  transactions
  ts-lib-crypto
  ts-types
)

DRY_RUN=true
[[ "${1:-}" == "--apply" ]] && DRY_RUN=false

echo "=== Archive polyrepos (dry_run=${DRY_RUN}) ==="
echo ""

for repo in "${REPOS[@]}"; do
  full="${ORG}/${repo}"

  if $DRY_RUN; then
    echo "[dry-run] Would archive ${full}"
  else
    echo "Archiving ${full}..."

    # Update description to point to monorepo
    gh repo edit "${full}" \
      --description "[ARCHIVED] Moved to ${MONOREPO}" \
      --homepage "${MONOREPO}" 2>/dev/null || true

    # Archive
    gh repo archive "${full}" --yes
    echo "  ✓ ${full} archived"
  fi
done

echo ""
echo "Done. ${#REPOS[@]} repositories processed."
