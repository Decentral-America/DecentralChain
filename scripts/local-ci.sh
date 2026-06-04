#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# local-ci.sh — Run the same checks as .github/workflows/ci.yml locally.
#
# Use this before pushing to validate changes without burning CI minutes.
# Mirrors the CI job steps that are possible to run locally (skips GitHub-only
# actions like Trivy secret scanning, Codecov upload, and dependency-review).
#
# Usage:
#   ./scripts/local-ci.sh          # full check (build + test + lint + typecheck)
#   ./scripts/local-ci.sh --quick  # lint + typecheck only (no build/test)
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

export NX_NO_CLOUD=true

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

step() { echo -e "\n${CYAN}▶ $1${NC}"; }
pass() { echo -e "${GREEN}✓ $1${NC}"; }
fail() { echo -e "${RED}✗ $1${NC}"; exit 1; }

cd "$(dirname "$0")/.."

QUICK=false
[[ "${1:-}" == "--quick" ]] && QUICK=true

# ── Install ──────────────────────────────────────────────────────────────────
step "Install dependencies (frozen lockfile)"
pnpm install --frozen-lockfile || fail "pnpm install failed"
pass "Dependencies installed"

# ── Security audit ───────────────────────────────────────────────────────────
step "Security audit"
pnpm audit --audit-level=moderate || fail "Security audit failed"
pass "No vulnerabilities found"

# ── Module boundaries ────────────────────────────────────────────────────────
step "Check module boundaries"
node scripts/check-boundaries.mjs || fail "Module boundary violations"
pass "Module boundaries OK"

# ── Biome lint ───────────────────────────────────────────────────────────────
step "Biome lint"
pnpm nx run-many -t biome-lint || fail "Biome lint errors"
pass "Biome lint passed"

# ── Format check ─────────────────────────────────────────────────────────────
step "Format check"
pnpm exec biome format --reporter=summary . || fail "Formatting issues"
pass "Format OK"

if [[ "$QUICK" == "true" ]]; then
  # ── Typecheck only in quick mode ─────────────────────────────────────────
  step "Typecheck"
  pnpm nx run-many -t typecheck \
    --exclude=blst,crypto,curve25519,groth16,java-sdk,transactions \
    || fail "Type errors"
  pass "Typecheck passed"
  echo -e "\n${GREEN}═══ Quick local CI: ALL PASSED ═══${NC}\n"
  exit 0
fi

# ── Build ────────────────────────────────────────────────────────────────────
step "Build"
pnpm nx run-many -t build \
  --exclude=blockchain-postgres-sync,blst,crypto,curve25519,groth16,java-sdk,ride,transactions \
  || fail "Build failed"
pass "Build succeeded"

# ── Typecheck ────────────────────────────────────────────────────────────────
step "Typecheck"
pnpm nx run-many -t typecheck \
  --exclude=blst,crypto,curve25519,groth16,java-sdk,transactions \
  || fail "Type errors"
pass "Typecheck passed"

# ── Test ─────────────────────────────────────────────────────────────────────
step "Test"
pnpm nx run-many -t test \
  --exclude=blockchain-postgres-sync,blst,crypto,curve25519,groth16,java-sdk,@decentralchain/ride,ride,transactions \
  || fail "Tests failed"
pass "Tests passed"

# ── Package exports ──────────────────────────────────────────────────────────
step "Verify package exports"
pnpm nx run-many -t check:exports \
  --exclude=cubensis-connect,exchange,scanner \
  || fail "Package exports check failed"
pass "Package exports OK"

# ── Publint ──────────────────────────────────────────────────────────────────
step "Verify package publishing"
pnpm nx run-many -t check:publint \
  --exclude=cubensis-connect,exchange,scanner,types \
  || fail "publint check failed"
pass "Publint OK"

# ── Bundle size ──────────────────────────────────────────────────────────────
step "Verify bundle size"
pnpm nx run-many -t check:size \
  --exclude=cubensis-connect,exchange,scanner \
  || fail "Bundle size check failed"
pass "Bundle size OK"

# ── License scan ─────────────────────────────────────────────────────────────
step "License scan"
pnpm licenses list --prod 2>&1 | tail -1
pass "License scan complete"

echo -e "\n${GREEN}═══ Full local CI: ALL PASSED ═══${NC}\n"
