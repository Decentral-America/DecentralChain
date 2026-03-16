# Ecosystem Status

> **Purpose**: Single source of truth for the health, history, and remediation status of every package in the DecentralChain SDK. Updated as packages evolve.
>
> **Audience**: Maintainers tracking per-package issues, AI agents needing package-specific context, contributors assessing where to focus effort.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Timeline](#2-project-timeline)
3. [Ecosystem Tech Stack](#3-ecosystem-tech-stack)
4. [TypeScript Strictness Matrix](#4-typescript-strictness-matrix)
5. [Per-Package Status](#5-per-package-status)
6. [npm Distribution](#6-npm-distribution)
7. [Remediation Priority Matrix](#7-remediation-priority-matrix)

---

## 1. Executive Summary

DecentralChain forked 24 packages from the Waves blockchain ecosystem in February–March 2026. All have completed migration (rebrand → bulletproof → modernize → audit) and are consolidated in this monorepo.

**Current state:**
- **22 SDK libraries**: Clean, publish-ready, modern tooling (ESM, Vitest, tsdown, Biome, TS 5.9 strict)
- **3 applications**: cubensis-connect (wallet), exchange (DEX), explorer (block explorer)
- **1 P0 risk remains**: User seeds stored in potentially Waves-owned AWS Cognito pools (cubensis-connect)
- **2 unforked Waves deps**: `@waves/ride-lang` + `@waves/ride-repl` (LOW — chain-agnostic Scala.js)
- **0 npm audit vulnerabilities** across all packages

---

## 2. Project Timeline

### Security Fixes & Hardening (Jul 2025)

- **signer 2.0.0**: CRITICAL — `getBalance()` was multiplying by `10^decimals` instead of dividing. Fixed swallowed provider errors. Removed constructor info leak.
- **node-api-js 2.0.0**: Removed `node-fetch`, switched to native `fetch`. Fixed lost consensus module.
- **cubensis-connect-provider 1.0.1**: Added 10s timeout on fee calculation. HTTPS enforcement warning.
- **transactions 5.0.1**: Coverage improved 70% → 82.7%.

### Fork & Rebrand (Feb 27 – Mar 2, 2026)

All 23 Waves packages forked, rebranded `@waves/*` → `@decentralchain/*`, ESM-only, Vitest, tsup, strict TypeScript, CI, governance docs.

### Modernize & Standardize (Mar 5–7, 2026)

Build tooling standardization. ride-js webpack→tsup, Jest→Vitest, security fixes (30s timeout, `console.error`, removed `test.only` masking). Explorer and exchange initial ESM + Biome migration.

### Cubensis-Connect Rebrand (Mar 8–9, 2026)

Wallet extension rebrand: KeeperWallet→CubensisConnect, WavesDomains removed, 10 locales updated, icons replaced, network URLs migrated. **Not done**: webpack→Vite, Babel→TS native, full modernization.

### Swap Client Fork (Mar 10, 2026)

`@keeper-wallet/swap-client` was private/deleted. Source extracted from npm tarball, protobuf schema reverse-engineered, full migration to DCC toolchain. Published as `@decentralchain/swap-client@1.0.0`.

### Production Hardening (Mar 11, 2026)

Full ecosystem audit: 141+ dead files deleted, `useLiteralKeys` re-enabled across 6 packages (typed interfaces replace `Record<string, unknown>`), 242 Biome auto-fixes in cubensis-connect, `exactOptionalPropertyTypes` enabled in 19/24 packages.

### Monorepo Consolidation (Mar 2026)

All 25 projects imported into single monorepo via `nx import` with full git history. Nx + pnpm workspace configured. Root biome.json, tsconfig.base.json, vitest.base.config.ts.

---

## 3. Ecosystem Tech Stack

### Standard Toolchain (22 SDK packages)

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | 5.9.x | Type safety (tsdown handles emit) |
| tsdown | 0.x | ESM-only bundling |
| Biome | 2.4.x | Lint + format (replaces ESLint + Prettier) |
| Vitest | 4.x | Test runner + V8 coverage |
| Lefthook | 1.x | Git hook enforcement |
| publint | 0.3.x | Package.json exports validation |
| attw | 0.18.x | TypeScript export verification |
| size-limit | 12.x | Bundle size budgets |

### Quality Pipeline

```
git commit → lefthook pre-commit →
  parallel: biome check (staged files) + tsc --noEmit
  → bulletproof: lint:fix → typecheck → test
```

### Deviations

| Package | Deviation | Reason |
|---------|-----------|--------|
| ride-js | `strict: false`, `sideEffects: true` | JS source wrapping Scala.js; `interop.js` mutates globalThis |
| protobuf-serialization | No tsdown | Uses `pbjs`/`pbts` codegen directly |
| crypto | wasm-pack build | Rust/WASM hybrid |
| cubensis-connect | webpack, TS 5.9.3, Biome | Partially modernized (Phase 2-3 complete) |
| explorer | No TypeScript compilation | Vite app with JS source |
| exchange | `target: ES2020` | Broader browser support for Electron |

---

## 4. TypeScript Strictness Matrix

| Package | strict | noUncheckedIndexedAccess | exactOptionalPropertyTypes | verbatimModuleSyntax |
|---------|:------:|:------------------------:|:--------------------------:|:--------------------:|
| browser-bus | ✅ | ✅ | ✅ | ✅ |
| swap-client | ✅ | ✅ | ✅ | ✅ |
| ts-types | ✅ | ✅ | ✅ | ✅ |
| parse-json-bignumber | ✅ | ✅ | ✅ | ✅ |
| data-service-client-js | ✅ | ✅ | ✅ | ✅ |
| bignumber | ✅ | ✅ | ✅ | — |
| ts-lib-crypto | ✅ | ✅ | — | — |
| marshall | ✅ | ✅ | ✅ | — |
| data-entities | ✅ | ✅ | ✅ | — |
| assets-pairs-order | ✅ | ✅ | ✅ | — |
| oracle-data | ✅ | ✅ | ✅ | — |
| money-like-to-node | ✅ | ✅ | ✅ | — |
| node-api-js | ✅ | ✅ | ✅ | — |
| ledger | ✅ | ✅ | ✅ | — |
| signature-adapter | ✅ | ✅ | ✅ | — |
| signer | ✅ | ✅ | ✅ | — |
| cubensis-connect-types | ✅ | ✅ | ✅ | — |
| cubensis-connect-provider | ✅ | ✅ | ✅ | — |
| transactions | ✅ | ✅ | ✅ | — |
| ride-js | — ¹ | — | ✅ | — |
| protobuf-serialization | ✅ | ✅ | — ² | — |
| crypto | ✅ | ✅ | ✅ | — |

¹ ride-js uses `strictNullChecks: true` individually (JS source, `noImplicitAny` would produce ~40 errors).
² protobuf-serialization: ~28 errors from protobufjs codegen nullability (`T | null` vs `T | undefined`).

---

## 5. Per-Package Status

### SDK Libraries — All Clean

All 22 SDK libraries have:
- ✅ biome.json, vitest.config.ts, lefthook.yml, strict TypeScript
- ✅ Test suites passing, coverage thresholds enforced
- ✅ Zero `@waves/*` deps (except ride-js: `@waves/ride-lang`, `@waves/ride-repl`)
- ✅ Zero `Math.random()`, `eval()`, `dangerouslySetInnerHTML` in `src/`
- ✅ Zero hardcoded secrets, zero insecure transport

### Notable Open Issues by Package

| Package | Issue | Severity |
|---------|-------|----------|
| **transactions** | `chainId` defaults to `'L'` not DCC mainnet `'?'` | Medium |
| **transactions** | `protobuf-serialization` linked via `file:` | Low |
| **node-api-js** | Default chainId `'L'` may not match all networks | Low |
| **browser-bus** | Wildcard `'*'` targetOrigin still allowed (warned) | Low |
| **signature-adapter** | `ramda` adds bundle weight | Low |
| **ride-js** | Depends on unforked `@waves/ride-lang` + `@waves/ride-repl` | Low |
| **ledger** | `SECRET = 'WAVES'` in APDU — firmware constraint | Info |

### Applications

#### cubensis-connect (Wallet Extension)

**Migration**: Phase 1 (Rebrand) ✅ | Phase 2-3 (Modernize) ✅ | Phase 4 (Audit) ✅

**Critical issues:**
- **P0**: Cognito pool ownership — are `eu-central-1_AXIpDLJQx` and `eu-central-1_6Bo3FEwt5` DCC-owned? If Waves-owned, they could revoke access to user seeds.
- **P1**: `@keeper-wallet/waves-crypto` still used in 21 files — supply-chain risk (fork path: `@decentralchain/wallet-crypto`)
- **P1**: `keeper-wallet.app` domains in whitelist — Waves-controlled

**Security fixes applied:** Math.random replaced, XSS mitigation (2 findings), source maps disabled in prod, `noreferrer` added to external links.

#### exchange (DEX)

**Critical issues:**
- Nginx `Access-Control-Allow-Origin: *` on financial application
- No Content-Security-Policy in production nginx
- `set_real_ip_from 0.0.0.0/0` — IP spoofing risk
- Docker runs as root
- Only 6 test files for 405 source files
- All 13 signing functions throw "Not implemented"

#### explorer (Block Explorer)

**Critical issues:**
- Zero test files — CI gate is vacuous
- `launch.sh` injects `$API_NODE_URL` unsanitized into JS — script injection risk
- README references `gulp`, `yarn` (project uses Vite + npm)
- 59 class components with `_isMounted` anti-pattern

**Positive:** Waves migration 100% complete, nginx config excellent (CSP, HSTS 1yr, X-Frame-Options DENY).

---

## 6. npm Distribution

### Packages Where `latest` ≠ `next`

These require `npm install @decentralchain/<pkg>@next`:

| Package | `latest` (old) | `next` (current) |
|---------|-----------------|-------------------|
| assets-pairs-order | 4.0.0 | 5.0.1 |
| marshall | 0.14.0 | 1.0.0 |
| node-api-js | 1.2.5-beta.18 | 2.0.0 |
| signer | 1.1.0-beta | 2.0.0 |
| signature-adapter | 6.1.7 | 7.0.0 |

**Action**: Run `npm dist-tag add @decentralchain/<pkg>@<version> latest` to promote.

### Not Published to npm

ride-js (manual workflow_dispatch), explorer, exchange (private apps), cubensis-connect (extension).

---

## 7. Remediation Priority Matrix

| Priority | Item | Action | Status |
|----------|------|--------|--------|
| **P0** | Cognito pool ownership | Verify DCC owns the AWS Cognito pools | ⬜ Pending |
| **P1** | Fork `@keeper-wallet/waves-crypto` | Fork → `@decentralchain/wallet-crypto`; update 21 imports | ⬜ Pending |
| **P1** | Remove `keeper-wallet.app` from whitelist | Delete 2 lines in constants.ts | ⬜ Pending |
| **P1** | Promote npm `next` → `latest` | 5 packages need dist-tag promotion | ⬜ Pending |
| **P2** | Rename `waves-community` repo | Rename GitHub repo + update scam token URL | ⬜ Pending |
| **P2** | Set up Sentry DSN | Create project, inject via build env | ⬜ Pending |
| **P2** | Exchange nginx hardening | Fix CORS, add CSP, fix IP trust, add USER directive | ⬜ Pending |
| **P2** | Explorer test coverage | Add tests for critical paths | ⬜ Pending |
| **P3** | Extension store listings | Chrome Web Store + Firefox AMO submission | ⬜ Pending |
| **P3** | `WavesWalletAuthentication` dual prefix | Add `DccWalletAuthentication` with old as fallback | ⬜ Pending |
| **N/A** | `'WAVES'` asset ID | Do not rename — wire format | — |
| **N/A** | Protobuf `waves` namespace | Do not rename — wire format | — |
| **N/A** | `@waves/ride-lang` + `ride-repl` | No action unless RIDE language modified | — |
