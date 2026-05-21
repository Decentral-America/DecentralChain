# Release Checklist

> **Purpose:** Single pre-release reference — extension gate checklist, backend health verification, and Go/No-Go sign-off template. Run through this top-to-bottom before any store submission or production deploy.
>
> **Applies to:** Cubensis Connect extension releases, Exchange deploys, Scanner deploys.

---

## Table of Contents

1. [Go / No-Go Decision Template](#1-go--no-go-decision-template)
2. [Gate 1 — Supply-Chain Integrity](#2-gate-1--supply-chain-integrity)
3. [Gate 2 — Build Quality](#3-gate-2--build-quality)
4. [Gate 3 — Manifest & Extension Policy](#4-gate-3--manifest--extension-policy)
5. [Gate 4 — UX / Onboarding Safety](#5-gate-4--ux--onboarding-safety)
6. [Gate 5 — Backend Services Health](#6-gate-5--backend-services-health)
7. [Gate 6 — Store Submission](#7-gate-6--store-submission)
8. [Artifact Checksums](#8-artifact-checksums)
9. [Open P-Level Items at Sign-Off](#9-open-p-level-items-at-sign-off)
10. [Waiver Process](#10-waiver-process)

---

## 1. Go / No-Go Decision Template

Fill in and attach to the release PR before any approval gate is signed off.

```
Go / No-Go Decision: Cubensis Connect vX.Y.Z
Date:        2026-05-20 (DCC-230 — Gate Execution Run)
Approvers:  Engineering Lead — [ ]
            Security Lead    — [ ]
            Product Lead     — [ ]
Decision:   [ ] GO   [x] NO-GO
Notes:
  BLOCKED — backend infrastructure not yet deployed.
  DNS does not resolve for mainnet-node.decentralchain.io, testnet-node.decentralchain.io,
  api.decentralchain.io, mainnet-matcher.decentralchain.io (all return NXDOMAIN).
  Gate 5 (Backend Services Health) cannot be cleared until node deployment is complete.

  All other gates CLEAR as of DCC-230 (2026-05-20):
  · Gate 1 (Supply Chain): zero @keeper-wallet deps, zero Cognito code, SBOM wired in release.yml ✅
  · Gate 2 (Build Quality): 3/3 apps — typecheck 0 errors, lint 0 errors, 551 tests passing (10+352+189), 0 vulnerabilities ✅
  · Gate 3 (Manifest): 18/18 — MV3 Chrome/Edge, MV2 Firefox/Opera, CSP clean, permissions minimal ✅
             Source map exclusion FIXED: zip.js now excludes .map files; zip 15 MB (CJK fonts ~12 MB) ✅
             Analytics: disabled in all builds (API keys not set in CI) — see note below
  · Gate 4 (UX/Onboarding): lossWarning 10/10 locales, no import-email route, password ≥8 enforced ✅
  · Gate 5 (Backend Services): ⬜ BLOCKED — DNS not resolving, deployment pending
  · Gate 6 (Store Submission): pending Gate 5 clearance

  OPEN NOTES (tracked, not blocking):
  · Analytics event names still say "Keeper" (installKeeper, openKeeper) — branding issue, fix before enabling analytics
  · Mixpanel ?ip=1 (IP geolocation) — user opt-in/consent mechanism required before setting MIXPANEL_TOKEN in CI
  · Zip filenames contain "undefined" in local builds — expected; CUBENSIS_VERSION must be set in CI
```

---

> **Previous run:** 2026-03-26 (Audit Round 11) — same gate status, Gates 1-4 cleared, Gate 5 blocked.

```
Go / No-Go Decision: Cubensis Connect vX.Y.Z
Date:        2026-03-26 (Audit Round 11)
Approvers:  Engineering Lead — [ ]
            Security Lead    — [ ]
            Product Lead     — [ ]
Decision:   [ ] GO   [x] NO-GO
Notes:
  BLOCKED — backend infrastructure not yet deployed.
  DNS does not resolve for mainnet-node.decentralchain.io, testnet-node.decentralchain.io,
  api.decentralchain.io, mainnet-matcher.decentralchain.io (all return NXDOMAIN).
  Gate 5 (Backend Services Health) cannot be cleared until node deployment is complete.

  All other gates CLEAR as of Audit Round 11:
  · Gate 1 (Supply Chain): zero @keeper-wallet deps, zero Cognito code ✅
  · Gate 2 (Build Quality): biome-lint 25/25, typecheck 25/25, test 25/25 (1,228 tests) ✅
  · Gate 3 (Manifest): MV3 16/16 — no unsafe-inline, wasm-unsafe-eval correct ✅
  · Gate 4 (UX/Onboarding): 1-of-1 seed model, no custodial component ✅
  · Gate 5 (Backend Services): ⬜ BLOCKED — DNS not resolving, deployment pending
  · Gate 6 (Store Submission): pending Gate 5 clearance
```

---

## 2. Gate 1 — Supply-Chain Integrity

| Check | Criteria | Owner |
|-------|----------|-------|
| No `@keeper-wallet/*` packages | `grep -r "keeper-wallet" apps/cubensis-connect/package.json` returns zero matches | Platform Infra |
| No `amazon-cognito-identity-js` | `grep "amazon-cognito" apps/cubensis-connect/package.json` returns zero matches | Platform Infra |
| No WX/Cognito identity code | `grep -r "IdentityController\|identityController\|cognitoSessions" apps/cubensis-connect/src/` returns zero matches | Platform Infra |
| SBOM generated | `pnpm sbom` (or equivalent) attached to the release PR | Platform Infra |

**Domain whitelist spot-check:**
```bash
grep -r "keeper-wallet\|waves\.exchange\|cognito" \
  apps/cubensis-connect/src/ \
  apps/cubensis-connect/scripts/
# Expected: zero matches
```

---

## 3. Gate 2 — Build Quality

| Check | Criteria | Owner |
|-------|----------|-------|
| TypeScript passes | `pnpm nx run cubensis-connect:typecheck` — zero errors in files we own | Engineering |
| Biome lint clean | `pnpm nx run cubensis-connect:lint` — zero errors | Engineering |
| Unit tests pass | `pnpm nx run cubensis-connect:test` — 100% green | Engineering |
| Exchange typecheck | `pnpm nx run exchange:typecheck` — zero errors | Engineering |
| Exchange lint | `pnpm nx run exchange:lint` — zero errors | Engineering |
| Exchange tests | `pnpm nx run exchange:test` — 100% green | Engineering |
| Scanner typecheck | `pnpm nx run scanner:typecheck` — zero errors | Engineering |
| Scanner lint | `pnpm nx run scanner:lint` — zero errors | Engineering |
| Scanner tests | `pnpm nx run scanner:test:fast` — 100% green | Engineering |
| No vulnerabilities | `pnpm audit --audit-level=moderate` — zero results | Security |
| Bundle size ≤ limit | `node apps/cubensis-connect/scripts/zip.js` — Chrome zip ≤ 20 MB (CJK fonts ~12 MB, source maps excluded) | Engineering |

Or run the full gate in one command from monorepo root:
```bash
bash scripts/run-with-required-node.sh pnpm nx run cubensis-connect:ci:check
```

> **2026-05-20 results:** cubensis-connect 10/10, exchange 352/352, scanner 189/189 tests; 0 TS errors; 0 lint errors; 0 vulnerabilities; chrome zip 15 MB ✅

---

## 4. Gate 3 — Manifest & Extension Policy

| Check | Criteria | Owner |
|-------|----------|-------|
| MV3 Chrome | Built `dist/chrome/manifest.json` contains `"manifest_version": 3` and `host_permissions` | Engineering |
| MV3 Edge | Built `dist/edge/manifest.json` contains `"manifest_version": 3` and `host_permissions` | Engineering |
| MV2 Firefox | Built `dist/firefox/manifest.json` contains `"manifest_version": 2` and `http://*/*`, `https://*/*` in `permissions` | Engineering |
| MV2 Opera | Built `dist/opera/manifest.json` contains `"manifest_version": 2` and `http://*/*`, `https://*/*` in `permissions` | Engineering |
| CSP no-eval | `content_security_policy` contains `script-src 'self' 'wasm-unsafe-eval'` — no `unsafe-eval`, no `unsafe-inline` | Security |
| Permissions minimal | MV3: `permissions` contains only `alarms`, `clipboardWrite`, `idle`, `storage`, `unlimitedStorage`, `tabs` (URL patterns go in `host_permissions`). MV2: same API permissions plus `http://*/*`, `https://*/*` (required — no separate `host_permissions` in MV2). | Security |
| No unreviewed analytics | Analytics (`statistics.ts`) is **gated behind `AMPLITUDE_API_KEY`/`MIXPANEL_TOKEN` env vars** — both empty in CI. Amplitude URL tree-shaken from bundle when key is `""`. Mixpanel drain present but events never queued. Event names rebranded from Keeper → Cubensis (`installCubensis`, `openCubensis`, `idleCubensis`). Mixpanel `?ip=1` (server-side IP collection) removed. **Do not set these env vars until: user opt-in consent flow is added.** | Security |
| Source maps excluded | Extension zip must not contain `.map` files (`zip.js` excludes `**/*.map` since 2026-05-20) | Security |
| Manifest validator | `node apps/cubensis-connect/scripts/validate-manifest.mjs` — all platforms pass | Engineering |

**MV3 manifest spot-check:**
```bash
node --input-type=module <<'EOF'
import { readFileSync } from 'fs';
const m = JSON.parse(readFileSync('apps/cubensis-connect/dist/chrome/manifest.json', 'utf8'));
console.assert(m.manifest_version === 3, 'Expected MV3');
console.assert(Array.isArray(m.host_permissions), 'Missing host_permissions');
console.assert(!m.permissions.some(p => p.startsWith('http')), 'Host pattern in permissions');
const csp = m.content_security_policy?.extension_pages ?? '';
console.assert(!csp.includes('unsafe-eval') || csp.includes('wasm-unsafe-eval'), 'unsafe-eval without wasm restriction');
console.assert(!csp.includes('unsafe-inline'), 'unsafe-inline present');
console.log('Manifest check: PASS');
EOF
```

> **2026-05-20 results:** 18/18 checks pass (`node apps/cubensis-connect/scripts/validate-manifest.mjs`). Chrome/Edge MV3, Firefox/Opera MV2, CSP clean, `use_dynamic_url: true` on MV3 platforms. Permissions exactly `[alarms, clipboardWrite, idle, storage, unlimitedStorage, tabs]` on all platforms. Source maps excluded from zip. ✅

> **2026-05-20 deep audit:** Firefox/Opera MV2 manifests were missing `http://*/*` and `https://*/*` — extension could not reach DCC nodes on those platforms. **Fixed** in `adaptManifestToPlatform.js` (now adds URL patterns to MV2 `permissions`). MV3 `host_permissions` verified correct. `CUBENSIS_VERSION` fallback (`|| '0.0.0'`) added to prevent `undefined`/`""` in manifest version and zip filename (using `||` not `??` to also guard against empty-string env var). Zip filename fallback: `|| 'local'` for local builds. `validate-manifest.mjs` enhanced with two new checks: (5) MV3 `host_permissions` URL presence, (6) MV2 permissions URL presence — both now CI-gated. `zip.js` rewritten to top-level `await Promise.all(map)` — eliminates `forEach(async)` silent-swallow bug. **22/22 checks pass.** ✅

---

## 5. Gate 4 — UX / Onboarding Safety

| Check | Criteria | Owner |
|-------|----------|-------|
| Seed loss warning displayed | BackupSeed page renders `backupSeed.lossWarning` text in all 10 supported locales | Product |
| No email/Cognito import path | `/import-email` route absent from built bundle; no `importEmail` i18n keys | Product |
| Password strength enforcement | New vault creation rejects passwords shorter than 8 characters | Engineering |

> **2026-05-20 results:** `backupSeed.lossWarning` present in all 10 locales (en/es/id/ja/pt/ru/th/tr/vi/zh). Zero `import-email`/`importEmail` hits in source and built bundle. `wallet.ts:288` enforces `password.length < CONFIG.PASSWORD_MIN_LENGTH` (NIST SP 800-63B §5.1.1). ✅

---

## 6. Gate 5 — Backend Services Health

Run all checks from a production-equivalent environment immediately before sign-off.

### DecentralChain Node API

| Network | URL | Verification |
|---------|-----|--------------|
| Mainnet | `https://mainnet-node.decentralchain.io` | `curl -sf .../blocks/height \| jq .height` → positive int |
| Testnet | `https://testnet-node.decentralchain.io` | same |

```bash
curl -sf https://mainnet-node.decentralchain.io/blocks/height | jq .height
curl -sf https://testnet-node.decentralchain.io/blocks/height | jq .height
```

| | Mainnet | Testnet |
|-|---------|---------|
| Last verified | (fill at release time) | (fill at release time) |
| Status | ☐ PASS / ☐ FAIL | ☐ PASS / ☐ FAIL |

### Data Service API

```bash
curl -sf https://api.decentralchain.io/ | jq .version
```
Status: ☐ PASS / ☐ FAIL

### DEX Matcher API

```bash
curl -sf https://mainnet-matcher.decentralchain.io/matcher
# Expected: Base58-encoded public key string
```
Status: ☐ PASS / ☐ FAIL

### TradingView Charts Proxy (Exchange only)

Load any chart page in Exchange and confirm chart renders.
Status: ☐ PASS / ☐ FAIL

### Cross-Service Compatibility

Verify no backend API version bumps introduced breaking changes since last release.

| Consumer | Backend API | Breaking-change risk | Signed off? |
|----------|-------------|---------------------|-------------|
| Cubensis Connect | Node API | Transaction serialisation format | ☐ |
| Cubensis Connect | Data Service | Asset info schema | ☐ |
| Exchange | Matcher | Order type fields | ☐ |
| Exchange | Node API | Block / transaction response schema | ☐ |
| Scanner | Node API | Block header format | ☐ |
| Scanner | Data Service | Transaction enrichment fields | ☐ |

---

## 7. Gate 6 — Store Submission

| Check | Criteria | Owner |
|-------|----------|-------|
| Chrome Web Store listing ready | Store listing text, screenshots, and privacy policy updated | Marketing |
| Firefox AMO listing ready | AMO listing and source code submission package prepared | Marketing |
| Version bump applied | `CUBENSIS_VERSION` env var set; `CHANGELOG.md` updated | Engineering |
| Release PR approved | Minimum 2 engineering approvals + 1 security approval | All |

---

## 8. Artifact Checksums

Generate and attach to the release PR:

```bash
cd apps/cubensis-connect
pnpm nx run cubensis-connect:build
sha256sum dist/*.zip
```

| Platform | Zip File | SHA-256 |
|----------|----------|---------|
| chrome | `cubensis-connect-chrome-vX.Y.Z.zip` | (attach before sign-off) |
| firefox | `cubensis-connect-firefox-vX.Y.Z.zip` | (attach before sign-off) |
| edge | `cubensis-connect-edge-vX.Y.Z.zip` | (attach before sign-off) |
| opera | `cubensis-connect-opera-vX.Y.Z.zip` | (attach before sign-off) |

---

## 9. Open P-Level Items at Sign-Off

List any items from [STATUS.md](./STATUS.md) that are unresolved at release sign-off. Each must have an owner and deadline.

| Jira | Priority | Description | Owner | Deadline |
|------|----------|-------------|-------|----------|
| (fill at release time) | | | | |

---

## 10. Waiver Process

Any gate that cannot be fully satisfied at release time must be:
1. Documented in the release PR description with risk assessment
2. Approved by the engineering lead and security lead
3. Given a remediation deadline (maximum 30 days post-release)
4. Tracked in Jira

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-05-20 | DCC-230 | Full gate execution run — Gates 1-4 all PASS. Fix: zip.js excludes .map files (source security). Gate 2 limit updated to 20 MB (CJK fonts). Gate 3 analytics row updated with complete status. Gate 4 results added. Gate 5 still BLOCKED (DNS). |
| 2026-05-20 | STREAM-F | `blockchain-postgres-sync` migrated into monorepo at `apps/blockchain-postgres-sync` via `nx import` — all 364 commits grafted (original Waves JS history + DCC Rust rewrite). Added `project.json` (Nx `nx:run-commands` targets: build, build:dev, test, lint, fmt:check, fmt, audit, doc, clean) and `.github/workflows/bps.yml` (fmt/clippy/test/doc + `cargo-deny-action` v2.0.18 + Docker GHCR build/push + infra reusable deploy). `ARCHITECTURE.md` updated. |
| 2026-05-20 | DEEP-AUDIT | Enterprise audit pass: (1) Firefox/Opera MV2 missing `http://*/*`/`https://*/*` in permissions — wallets could not reach DCC nodes — **FIXED** in `adaptManifestToPlatform.js`. (2) `CUBENSIS_VERSION` env-var used without fallback — manifest version and zip filenames would be `undefined` in local builds — **FIXED** with `|| '0.0.0'` / `|| 'local'`. (3) `statistics.ts` Keeper branding: `KEEPER_VERSION` renamed → `CUBENSIS_VERSION`; event types `installKeeper`/`openKeeper`/`idleKeeper` renamed → `installCubensis`/`openCubensis`/`idleCubensis`; storage keys `lastIdleKeeper`/`lastOpenKeeper` renamed; `?ip=1` (Mixpanel server-side IP) removed (GDPR). (4) `zip-a-folder@6.1.1` confirmed latest; `anchore/sbom-action@v0.24.0` SHA confirmed. Gate 3 checklist updated with MV2 Opera row and correct criteria. |
| 2026-05-20 | DEEP-AUDIT-2 | Second audit pass: (1) `zip.js` `forEach(async)` bug fixed — async errors were silently swallowed; replaced with `await Promise.all(map)` top-level await pattern. (2) `??` → `||` in both `zip.js` and `adaptManifestToPlatform.js` — guards against empty-string `CUBENSIS_VERSION=""` which `??` does not catch. (3) `validate-manifest.mjs` gained two new checks: MV3 `host_permissions` URL presence (check 5) and MV2 permissions URL presence (check 6) — the MV2 fix is now CI-gated and cannot silently regress. **22/22 checks pass.** |
| 2026-05-20 | DEEP-AUDIT-5 | Fifth audit pass (complete 20-workflow SHA sweep): Two findings fixed. (1) **`sbt/setup-sbt` stale**: `v1.1.23` SHA `93e926cb...` in `ride.yml` (3 occurrences) and `publish-ride.yml` (1 occurrence) — v1.1.24 released May 18 with disk cache feature; updated all 4 to `2e222825...  # v1.1.24`. (2) **`dtolnay/rust-toolchain` SHA inconsistency**: `groth16.yml` and `publish-groth16.yml` were pinned to `efa25f7f...` (Feb 12 commit: "Add 1.93.1 patch release") while `ci.yml` correctly used `3c5f7ea2...` (Mar 27 commit: "Add 1.94.1 patch release"). Updated 3 occurrences across both groth16 workflows to match `ci.yml` at latest master HEAD. (3) **`publish-protobuf-serialization.yml` Java 11 confirmed intentional**: `pom.xml` explicitly sets `<source>11</source>/<target>11</target>` with `javax.annotation-api` dependency — deliberate SDK compatibility constraint; no change needed. All other 20-workflow actions confirmed at latest: docker/setup-buildx v4.0.0 ✅, docker/login v4.1.0 ✅, docker/metadata v6.0.0 ✅, docker/build-push v7.1.0 ✅, anchore/sbom v0.24.0 ✅, pnpm/action-setup v6.0.8 ✅, actions/setup-java v5.2.0 ✅, actions/setup-node v6.4.0 ✅. |
| 2026-05-20 | DEEP-AUDIT-4 | Fourth audit pass (global pnpm/action-setup SHA sweep): **CRITICAL SUPPLY-CHAIN FINDING** — the SHA `d15e628ca66d93ee5f352c71671a7bc6a97af5c9` previously believed to be v6.0.8 (from stale memory recorded May 12) returns a **404 on GitHub** — the commit does not exist in pnpm/action-setup. Three workflows (`ci.yml`, `ride.yml`, `publish-ride.yml`) were referencing this phantom SHA as `# v6.0.8`. Two additional workflows (`deploy-exchange.yml`, `release.yml`) remained on stale `ab5d408 # v6.0.7`. **ALL 5 fixed** to confirmed-correct v6.0.8 commit `0e279bb959325dab635dd2c09392533439d90093` (verified from GitHub releases page + commit page: message "fix: update pnpm to 11.1.1", tagged `v6.0.8`+`v6`, merged via PR #248). All 7 pnpm/action-setup usages in the monorepo now use the same canonical SHA. |
| 2026-05-20 | DEEP-AUDIT-3 | Third audit pass (CI/deploy pipeline): (1) **CRITICAL**: `deploy-cubensis.yml` `Build extension` step missing `CUBENSIS_VERSION` env — all shipped manifests had `version: '0.0.0'` (zip filenames were correct but the manifest inside the zip was wrong; stores would reject or display 0.0.0). **FIXED**: added `env: CUBENSIS_VERSION` to build step. (2) **CI GAP**: `validate-manifest.mjs` (22 checks) never called in deploy pipeline — was only in `ci:check` script skipped by deploy. **FIXED**: added `Validate platform manifests (22 checks)` step between build and zip. (3) `pnpm/action-setup` upgraded v6.0.7→v6.0.8 (SHA `0e279bb9...`) in both `deploy-cubensis.yml` and `cubensis-nightly-e2e.yml` — v6.0.8 fixes Windows standalone+self-update PATH bug; prior SHA `ab5d408` did not match v6.0.7 tag commit `739bfe42`. Verified: `wdzeng/firefox-addon@b78a4d0 # v1.2.0` ✅ latest; `wdzeng/edge-addon@d4db1ee # v2.1.0` ✅ latest; `mnao305/chrome-extension-upload@fdfe794 # v6.0.0` ✅ latest. |
| 2026-03 | Josué Rojas | Merged RELEASE-GATES, GO-NO-GO-INFRA, BACKEND-DEPS-READINESS into single doc |
