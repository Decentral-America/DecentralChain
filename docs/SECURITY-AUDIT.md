# Security Audit Playbook

> **Purpose**: Reusable, comprehensive security audit checklist designed for financial blockchain infrastructure. Use this as the audit procedure for all SDK packages and applications.
>
> **Quality Standard**: *Would you trust this code with your own money?* That is the bar every package must clear.
>
> **Audience**: Security auditors, maintainers running self-audits, AI agents performing automated review.

---

## Table of Contents

1. [Severity Definitions](#1-severity-definitions)
2. [Phase A — Dependency & Supply Chain](#2-phase-a--dependency--supply-chain)
3. [Phase B — Static Code Analysis](#3-phase-b--static-code-analysis)
4. [Phase C — Security-Sensitive Code Review](#4-phase-c--security-sensitive-code-review)
5. [Phase D — Test Quality Audit](#5-phase-d--test-quality-audit)
6. [Phase E — Configuration & CI Audit](#6-phase-e--configuration--ci-audit)
7. [Phase F — Branding & Legal Audit](#7-phase-f--branding--legal-audit)
8. [Output Format](#8-output-format)
9. [Audit Execution Checklist](#9-audit-execution-checklist)

---

## 1. Severity Definitions

> **Why severity tiers with SLAs?** Financial SDKs handle private keys and sign transactions that move real money. A CRITICAL finding in a signing library is qualitatively different from a CRITICAL in a static website — it can result in permanent, irreversible fund loss. The SLA tiers ensure that the response urgency matches the blast radius: CRITICAL = stop everything and fix, HIGH = fix before the next release, MEDIUM = current sprint. Without explicit SLAs, security findings languish in backlogs alongside feature requests.

| Severity | Definition | Response SLA |
|----------|-----------|--------------|
| **CRITICAL** | Exploitable in the wild; data loss, key theft, or fund theft possible. Blocks release. | Immediate fix |
| **HIGH** | Exploitable with moderate effort; weakens security posture significantly. | Fix before release |
| **MEDIUM** | Defence-in-depth gap; may become HIGH if environment changes. | Fix in current sprint |
| **LOW** | Minor concern; best-practice deviation without immediate exploit path. | Track, fix when convenient |
| **INFO** | Observation or suggestion; no security impact. | Optional |

---

## 2. Phase A — Dependency & Supply Chain

### Checks

- [ ] Run `npm audit` (or `pnpm audit`) — zero HIGH/CRITICAL findings
- [ ] Run `knip` — no phantom or unlisted dependencies
- [ ] Verify lockfile integrity — `pnpm-lock.yaml` hashes match published packages
- [ ] No Waves-controlled packages in dependency tree (except documented wire-format deps)
- [ ] No deprecated packages with known replacements
- [ ] No `file:` or `link:` protocol dependencies in published packages
- [ ] Check npm download counts + last-publish dates for all deps (abandoned packages = risk)
- [ ] No postinstall scripts from third-party packages unless explicitly approved
- [ ] Verify `pnpm.overrides` or `resolutions` are necessary and documented
- [ ] Verify Renovate config (`renovate.json`) — `@waves/ride-lang` and `@waves/ride-repl` are in `ignoreDeps`, `security:minimumReleaseAgeNpm` is active (3-day npm unpublish protection), `abandonments:recommended` flags unmaintained packages

### Red Flags

```
@waves/* (non-wire-format deps), @keeper-wallet/*
file: or link: in production dependencies
postinstall scripts from untrusted packages
Packages with 0 maintainers or >2yr since last publish
```

---

## 3. Phase B — Static Code Analysis

### Checks

- [ ] **Biome**: `biome check --reporter=summary` — zero errors
- [ ] **TypeScript**: `tsc --noEmit` — zero errors with strict mode
- [ ] **No** `@ts-nocheck`, `@ts-ignore`, `as any` (use `as unknown as T` with justification)
- [ ] **No** `eslint-disable`, `biome-ignore` without documented justification
- [ ] **Grep audit** for dangerous patterns:

```bash
# Run from package root
grep -rn 'eval\|Function(' src/
grep -rn 'dangerouslySetInnerHTML' src/
grep -rn 'innerHTML\s*=' src/
grep -rn 'document\.write' src/
grep -rn 'Math\.random' src/
grep -rn 'new RegExp(' src/        # ReDoS risk
grep -rn 'child_process\|exec\|spawn' src/
grep -rn 'http://' src/            # Insecure transport
```

### Red Flags

```
eval(), new Function() — code injection
Math.random() in crypto context — predictable randomness
http:// URLs in production code — downgrade attack
innerHTML assignments — XSS
```

---

## 4. Phase C — Security-Sensitive Code Review

This is the deepest phase, organized into four sub-domains relevant to blockchain SDK code.

### C.1 — Cryptography

- [ ] All random generation uses `crypto.getRandomValues()` or equivalent CSPRNG
- [ ] No custom cryptographic implementations when audited libraries exist
- [ ] Key derivation uses standard algorithms (ed25519, curve25519, blake2b, SHA-256, Keccak)
- [ ] Seed phrases: generated, stored, transmitted, and wiped securely
- [ ] Private keys never logged, serialized to JSON, or included in error messages
- [ ] Timing-safe comparison for signature verification (`crypto.timingSafeEqual` or constant-time compare)
- [ ] WASM crypto modules: verify build reproducibility, no debug symbols in release

### C.2 — Network & Transport

- [ ] All external URLs use HTTPS exclusively (no fallback to HTTP)
- [ ] API timeouts configured (≤30s for user-facing, ≤120s for background)
- [ ] No hardcoded IP addresses or internal network references
- [ ] WebSocket connections: verify origin, implement reconnection with backoff
- [ ] Rate limiting on retry logic (prevent amplification)
- [ ] CORS: No `Access-Control-Allow-Origin: *` on state-mutating endpoints
- [ ] DNS rebinding protection if applicable

### C.3 — Browser & Extension Security

- [ ] Content Security Policy headers verified
- [ ] `postMessage` uses specific origin (not `'*'`) in production
- [ ] Extension permissions are minimal (no `<all_urls>` without justification)
- [ ] Web-accessible resources are minimal
- [ ] Storage: sensitive data uses `chrome.storage.session` not `localStorage`
- [ ] XSS prevention: all user input sanitized, no `v-html` / `dangerouslySetInnerHTML` with untrusted data
- [ ] External links: `rel="noopener noreferrer"` on all `target="_blank"` links
- [ ] Source maps disabled in production builds

### C.4 — Input Validation & Data Integrity

- [ ] All external input validated at system boundaries (type, length, range)
- [ ] Transaction amounts: integer arithmetic only (no floating point)
- [ ] Protobuf deserialization: malformed messages don't crash or leak state
- [ ] JSON parsing: `BigInt`/large-number handling verified (no silent precision loss)
- [ ] Address validation: checksum verification for all blockchain addresses
- [ ] No prototype pollution vectors in object merging/spreading

---

## 5. Phase D — Test Quality Audit

### Checks

- [ ] All `src/` modules have corresponding test files
- [ ] Test coverage meets thresholds:
  - **Established packages** (>1yr): ≥90% lines, ≥85% branches
  - **New packages** (<1yr): ≥80% lines, ≥75% branches
  - **Critical paths** (crypto, signing, serialization): ≥95%
- [ ] No `test.skip`, `test.only`, `describe.skip` in committed code
- [ ] Negative test cases exist for:
  - Invalid inputs (malformed transactions, bad addresses)
  - Network failures (timeout, DNS failure, 5xx)
  - Edge cases (zero amounts, max `Long` values, empty arrays)
- [ ] Snapshot tests are reviewed (not blindly updated)
- [ ] No hardcoded test seeds/keys that match mainnet addresses
- [ ] Mocks are minimal — prefer real implementations where possible

### Red Flags

```
test.only — masks other test failures
Empty test suites (file exists, zero assertions)
Coverage report exclusions hiding untested code
Tests that always pass (no meaningful assertions)
```

---

## 6. Phase E — Configuration & CI Audit

### Checks

- [ ] CI runs: lint → typecheck → test → build → publint → attw (in order)
- [ ] Branch protection: require PR, require CI pass, require review
- [ ] npm publish: only from CI, with `--provenance` flag
- [ ] Docker images: non-root user, minimal base image, no secrets in layers
- [ ] Environment variables: no secrets in source code or CI config files
- [ ] `.gitignore`: no `node_modules/`, `.env`, `*.pem`, `dist/` committed
- [ ] Lefthook: pre-commit hooks active and not bypassed
- [ ] GitHub Actions: pinned action versions (SHA, not `@v4`), minimal permissions

### Red Flags

```
npm publish from local machine — no provenance
Docker RUN as root
Secrets in docker-compose.yml or nginx.conf
CI skip comments in main branch
```

---

## 7. Phase F — Branding & Legal Audit

### Checks

- [ ] No Waves branding except documented wire-format constraints (see [UPSTREAM.md](UPSTREAM.md))
- [ ] All LICENSE files present and correct (MIT)
- [ ] `package.json` → `author`, `repository`, `homepage` reference DCC
- [ ] No `waves.exchange`, `keeper-wallet.app`, or `wavesplatform.com` URLs except in historical docs
- [ ] README files reference DecentralChain, not Waves
- [ ] Extension store descriptions and screenshots use DCC branding
- [ ] Contributor license: CONTRIBUTING.md present and references correct legal entity

### Immutable Waves References (Do Not Remove)

These are wire-format constants required for blockchain compatibility:

| Constant | Location | Why Immutable |
|----------|----------|---------------|
| `'WAVES'` asset ID | transactions, node-api-js | On-chain protocol identifier |
| `waves` protobuf namespace | protobuf-serialization | Binary wire format |
| `WavesWalletAuthentication` prefix | cubensis-connect | Signature verification backward compat |
| `'WAVES'` Ledger secret | ledger | APDU command firmware constraint |
| `44'/5741560'` BIP44 path | ts-lib-crypto | HD derivation standard |

---

## 8. Output Format

Each finding should be documented as:

```markdown
### [SEVERITY] Finding Title

**Package**: `@decentralchain/package-name`
**File**: `src/path/to/file.ts:42`
**Phase**: C.1 — Cryptography

**Description**: Clear explanation of the vulnerability or concern.

**Evidence**:
\`\`\`typescript
// Affected code snippet
\`\`\`

**Impact**: What could go wrong if this is exploited.

**Recommendation**: Specific fix with code example.

**Status**: ⬜ Open | 🔄 In Progress | ✅ Fixed
```

---

## 9. Audit Execution Checklist

Use this checklist when performing a full audit pass:

```markdown
## Audit: @decentralchain/<package-name>
**Date**: YYYY-MM-DD
**Auditor**: <name or agent>

### Phase A — Dependency & Supply Chain
- [ ] npm audit clean
- [ ] knip clean
- [ ] No unauthorized Waves deps

### Phase B — Static Analysis
- [ ] Biome clean
- [ ] TypeScript clean
- [ ] Grep audit clean

### Phase C — Security Review
- [ ] C.1 Crypto: reviewed
- [ ] C.2 Network: reviewed
- [ ] C.3 Browser: reviewed (if applicable)
- [ ] C.4 Input validation: reviewed

### Phase D — Tests
- [ ] Coverage thresholds met
- [ ] Negative cases present
- [ ] No test.only / test.skip

### Phase E — Config & CI
- [ ] CI pipeline complete
- [ ] No secrets in source

### Phase F — Branding
- [ ] No unauthorized Waves refs
- [ ] LICENSE correct

### Summary
- **CRITICAL**: 0
- **HIGH**: 0
- **MEDIUM**: 0
- **LOW**: 0
- **INFO**: 0

**Verdict**: PASS / CONDITIONAL PASS / FAIL
```
