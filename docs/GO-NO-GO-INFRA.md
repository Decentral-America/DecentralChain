# Cubensis Connect — Go / No-Go Infrastructure Evidence Pack

> **Purpose:** This document captures the cross-application dependency evidence
> required for the DCC-115 epic Go/No-Go decision. Updated evidence must be
> attached to the release PR before any approval gate is signed off.

---

## Decision Template

```
Go / No-Go Decision: Cubensis Connect vX.Y.Z
Date:
Approvers:  Engineering Lead — [ ]
            Security Lead    — [ ]
            Product Lead     — [ ]
Decision:   [ ] GO   [ ] NO-GO
Notes:
```

---

## Section 1 — Dependency Ownership Evidence

### 1.1 Cognito Removal

| Check | Status | Evidence |
|-------|--------|----------|
| `amazon-cognito-identity-js` removed | ✅ Done — DCC-117 | `grep amazon-cognito apps/cubensis-connect/package.json` → 0 matches |
| `IdentityController.ts` deleted | ✅ Done — DCC-118 | File does not exist in source tree |
| All Cognito source references | ✅ Done | `grep -r cognito apps/cubensis-connect/src/` → 0 matches |

### 1.2 npm Package Ownership

| Package | Registry | Owner | Status |
|---------|----------|-------|--------|
| `amazon-cognito-identity-js` | npmjs.com | Amazon Web Services | **Removed** — not in `apps/cubensis-connect/package.json` as of DCC-117 |

### 1.3 Domain Whitelist Audit

Verify no `keeper-wallet.app`, `waves.exchange`, or third-party identity domains
remain in the extension's CSP or permissions:

```bash
# Run from monorepo root
grep -r "keeper-wallet\|waves\.exchange\|cognito" \
  apps/cubensis-connect/src/ \
  apps/cubensis-connect/scripts/
# Expected output: zero matches
```

---

## Section 2 — Backend Service Health Checks

Run these checks from a production-equivalent network environment immediately
before release sign-off.

### 2.1 DecentralChain Node API (mainnet)

```bash
curl -s https://nodes.decentralchain.io/blocks/height | jq .height
# Expected: positive integer (current block height)
```

### 2.2 DecentralChain Node API (testnet)

```bash
curl -s https://nodes-testnet.decentralchain.io/blocks/height | jq .height
# Expected: positive integer
```

### 2.3 Data Service API

```bash
curl -s https://api.decentralchain.io/ | jq .version
# Expected: version string
```

### 2.4 Remote Config

```bash
curl -s https://raw.githubusercontent.com/Decentral-America/dcc-configs/main/main.json | jq .version
# Expected: valid JSON with .version field
```

---

## Section 3 — Build Artifact Checksums

Attach the SHA-256 checksums of the distributable ZIP files for each target
platform. Generate with:

```bash
cd apps/cubensis-connect
pnpm nx run cubensis-connect:build
# (or your build script that produces dist/*.zip)
sha256sum dist/*.zip
```

| Platform | Zip File | SHA-256 |
|----------|----------|---------|
| chrome | `cubensis-connect-chrome-vX.Y.Z.zip` | (attach before sign-off) |
| firefox | `cubensis-connect-firefox-vX.Y.Z.zip` | (attach before sign-off) |
| edge | `cubensis-connect-edge-vX.Y.Z.zip` | (attach before sign-off) |
| opera | `cubensis-connect-opera-vX.Y.Z.zip` | (attach before sign-off) |

---

## Section 4 — Security Verification

### 4.1 MV3 Manifest Spot-Check

```bash
node --input-type=module <<'EOF'
import { readFileSync } from 'fs';
const m = JSON.parse(readFileSync('apps/cubensis-connect/dist/chrome/manifest.json', 'utf8'));
console.assert(m.manifest_version === 3, 'Expected MV3');
console.assert(Array.isArray(m.host_permissions), 'Missing host_permissions');
console.assert(!m.permissions.some(p => p.startsWith('http')), 'Host pattern in permissions');
console.log('MV3 manifest check: PASS');
EOF
```

### 4.2 No Private Key Leakage in Background Script

```bash
# Background bundle must not contain seed or private key in plaintext
# (Spot-check; automated scan recommended via CI)
grep -c "mnemonic\|privateKey\|seed" apps/cubensis-connect/dist/chrome/background.js || echo "0 matches — PASS"
```

### 4.3 CSP Validation

```bash
node --input-type=module <<'EOF'
import { readFileSync } from 'fs';
const m = JSON.parse(readFileSync('apps/cubensis-connect/dist/chrome/manifest.json', 'utf8'));
const csp = m.content_security_policy?.extension_pages ?? '';
console.assert(!csp.includes('unsafe-eval') || csp.includes('wasm-unsafe-eval'), 'unsafe-eval without wasm restriction');
console.assert(!csp.includes('unsafe-inline'), 'unsafe-inline present');
console.log('CSP check: PASS');
EOF
```

---

## Section 5 — Outstanding P-Level Items at Sign-Off

List any open items from [STATUS.md](./STATUS.md) that are still unresolved at
release sign-off. Each item must have an owner and a remediation deadline.

| Jira | Priority | Description | Owner | Deadline |
|------|----------|-------------|-------|----------|
| (fill at release time) | | | | |

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-03 | Josué Rojas | Initial version (DCC-121) |
