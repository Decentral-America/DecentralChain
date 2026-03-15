# Final Security Audit Prompt

> **Version**: 1.1.0 — March 6, 2026
> **Scope**: Any `@decentralchain/*` package that has completed Phases 1 (Bulletproof) and 2 (Modernize)
> **Goal**: Enterprise-grade, military-grade security validation — the last gate before publishing
>
> **Context**: DecentralChain is financial infrastructure that moves money. Every published
> package directly affects whether users make or lose funds. This audit must be performed
> with the rigor expected of a billion-dollar institution.

---

## How to Use This File

1. Complete **Phase 2** (2-BULLETPROOF.md) — all quality gates passing.
2. Complete **Phase 3** (3-MODERNIZE.md) — fully modernized, rebranded, ESM-native.
3. **Copy everything below the `--- BEGIN PROMPT ---` line** into your AI assistant.
4. Fill in the `[VARIABLES]` section with the target package's details.
5. The AI will perform a comprehensive security audit and implement all fixes.

This prompt is **reusable across every package** in the DecentralChain SDK. It is designed to be the final gate before `npm publish`.

---

## --- BEGIN PROMPT ---

You are performing a **final security audit** on a DecentralChain SDK package. This is financial infrastructure — the software moves money for users. Treat every finding as if it could cause financial loss.

You must be **thorough, opinionated, and actionable**. Do NOT ask for permission to fix things — fix them. Only flag issues you cannot resolve as "requires team decision."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## [VARIABLES]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```yaml
PACKAGE_NAME: '@decentralchain/XXXXX'
PACKAGE_FOLDER: 'DCC-XX'                    # local folder name
PACKAGE_TYPE: 'library'                       # library | application | types-only
HAS_CRYPTO: false                             # true if package does any encryption, hashing, signing, key generation
HAS_NETWORK: false                            # true if package makes HTTP/WS/gRPC calls
HAS_BROWSER_API: false                        # true if package uses postMessage, localStorage, DOM APIs
HAS_USER_INPUT: false                         # true if package accepts user-provided data (seeds, addresses, amounts)
UPSTREAM_DEPS: []                             # list of @decentralchain/* packages this depends on
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## AUDIT PHASES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execute every phase in order. Do not skip phases. Report findings as you go.

---

### Phase A — Dependency & Supply Chain Audit

**Goal:** Ensure the dependency tree is minimal, trusted, and free of known vulnerabilities.

#### Checklist

- [ ] Run `npm audit --audit-level=high` — zero high/critical vulnerabilities
- [ ] Run `npm ls --all` — inspect full dependency tree for unexpected packages
- [ ] Check for `npm:` aliases (e.g., `npm:@waves/...`) — any alias is a **supply chain risk**
  - If found: document which alias, what it resolves to, and whether a `@decentralchain` fork exists
  - If a fork exists locally or on npm: replace the alias with the real package
- [ ] Check for stale dependencies (`npm outdated`) — anything > 1 major version behind needs justification
- [ ] Check for CJS-only dependencies in an ESM package — run `npm ls` and verify module format compatibility
- [ ] Verify `package-lock.json` exists and is committed
- [ ] Verify `publishConfig.provenance: true` is set (signed npm builds)
- [ ] Count runtime dependencies — for financial libraries, fewer = better; 0 is ideal

#### Supply Chain Red Flags

| Finding | Severity | Action |
|---------|----------|--------|
| `npm:@waves/*` alias still in use | **CRITICAL** | Replace with `@decentralchain` fork immediately |
| Runtime dep with no ESM export | HIGH | Vendor it (inline the code) or find ESM alternative |
| Runtime dep last published > 2 years ago | HIGH | Vendor or replace |
| Runtime dep with > 10 transitive dependencies | MEDIUM | Evaluate alternatives |
| `Math.random()` used for IDs or nonces | HIGH | Replace with `crypto.getRandomValues()` or `crypto.randomUUID()` |
| No `package-lock.json` | HIGH | Generate and commit immediately |

---

### Phase B — Static Code Analysis

**Goal:** Identify dead code, unused exports, unreachable branches, and code quality issues.

#### Automated Checks

Run these tools and fix all findings:

```bash
# 1. Dead code detection (install globally, not as project dep)
npm install -g knip
knip

# 2. Lint with maximum strictness
npm run lint:check

# 3. Type check
npm run typecheck

# 4. Build (catches import/export issues)
npm run build
```

#### Manual Review Checklist

- [ ] **Unused imports**: Search all source and test files for imports not referenced in the file
- [ ] **Unused exports**: Verify every `export` in `src/` is either re-exported from `index.ts` or consumed by at least one test
- [ ] **CJS remnants**: Search for `require(`, `module.exports`, `__dirname`, `__filename` — remove or replace with ESM equivalents
- [ ] **Dead branches**: Look for `if (false)`, `if (true)`, impossible conditions, unreachable `return` after `throw`
- [ ] **Console statements**: Verify `console.log` is not in production code (only `console.warn` and `console.error` are acceptable, and only for security warnings)
- [ ] **TODO/FIXME/HACK**: Search for these comments — each one is a potential unfixed issue
- [ ] **Duplicate code**: Identify copy-pasted logic that should be a shared function

> **Lesson learned (DCC-18):** knip found 14 unused named exports in test helpers, 1 unused devDependency, and identified duplicate exports — all legitimate cleanup. It also correctly identified intentional semantic aliases (`isPublicKey = isHash`) which should be kept for domain clarity.

---

### Phase C — Security-Sensitive Code Review

**Goal:** Line-by-line review of all code that handles keys, seeds, passwords, network calls, or user input.

#### Cryptography (if `HAS_CRYPTO: true`)

- [ ] **Key derivation**: What KDF is used? Is it a standard algorithm (PBKDF2, scrypt, Argon2id)?
  - If using iterative SHA-256 or MD5: document as **legacy** and note the iteration count
  - OWASP 2024 minimums: PBKDF2-SHA256 = 600,000 iterations; PBKDF2-SHA512 = 210,000
  - If the legacy KDF cannot be changed (backward compatibility with encrypted seeds), add prominent documentation and runtime warnings
- [ ] **Encryption**: What cipher and mode? AES-CBC requires proper IV handling. AES-GCM is preferred for authenticated encryption
- [ ] **Random number generation**: `Math.random()` is **never acceptable** for security-relevant values. Use `crypto.getRandomValues()` or `crypto.randomUUID()`
- [ ] **Seed phrase handling**: Are seed phrases ever logged, stored in plain text, or transmitted unencrypted?
- [ ] **Private key exposure**: Verify private keys are never in error messages, logs, or serialized objects
- [ ] **Error messages in crypto paths**: Catch blocks should not leak information about why decryption failed (prevents oracle attacks). Use generic messages like "wrong password" — never "HMAC mismatch" or "bad padding"
- [ ] **Immutability**: Verify that key pairs, seed objects, and other sensitive data are `Object.freeze()`-d after creation
- [ ] **Error cause chains**: Verify re-thrown errors preserve the original cause via `{ cause: originalError }` for debugging without leaking to end users

#### Network (if `HAS_NETWORK: true`)

- [ ] **HTTPS enforcement**: Are all endpoint URLs `https://`? Is there any fallback to `http://`?
- [ ] **Timeout handling**: Do all network calls have timeouts? Default timeout should be ≤ 30 seconds
- [ ] **Response validation**: Are network responses validated before use? (e.g., JSON schema, type guards)
- [ ] **Error handling**: Do network errors produce actionable messages? Are retries bounded?
- [ ] **Credential handling**: Are API keys, seeds, or private keys ever sent as URL parameters? (They must be in request bodies or headers)

#### Browser APIs (if `HAS_BROWSER_API: true`)

- [ ] **`postMessage` origin**: Is `'*'` used as the target origin? This is a **critical security risk** for financial applications — OWASP and MDN explicitly warn against it. Always use a specific target origin
- [ ] **`postMessage` validation**: Are incoming messages validated for origin, structure, and type?
- [ ] **`localStorage`/`sessionStorage`**: Is sensitive data (seeds, keys, passwords) ever stored in browser storage? It should not be
- [ ] **Cross-origin considerations**: Document CSP (Content-Security-Policy) requirements for consumers
- [ ] **iframe sandboxing**: If the library communicates with iframes, document required `sandbox` attributes

#### Input Validation (if `HAS_USER_INPUT: true`)

- [ ] **Address validation**: Are blockchain addresses validated for checksum, length, and chain ID?
- [ ] **Amount validation**: Are monetary amounts validated for sign (no negative), overflow, and precision?
- [ ] **Fee validation**: Are transaction fees validated against minimums? Can a user set fee to 0?
- [ ] **Script validation**: If the package accepts compiled scripts, is the input validated for length and format?
- [ ] **String length limits**: Are there maximum lengths enforced for aliases, attachment data, data entry keys?
- [ ] **Type coercion risks**: Does the code use `==` instead of `===`? Are numeric inputs checked for `NaN`/`Infinity`?

---

### Phase D — Test Quality Audit

**Goal:** Verify tests are professional-grade — the kind a senior engineer at a financial institution would write.

#### Coverage Analysis

```bash
npm run test:coverage
```

- [ ] Overall coverage ≥ thresholds set in `vitest.config.ts`
- [ ] Identify files with < 50% coverage — these are the highest risk
- [ ] For each low-coverage file: add tests for uncovered branches and error paths

#### Test Quality Checklist

- [ ] **Happy path tests**: Every public function has at least one successful-use test
- [ ] **Error path tests**: Every `throw` and `catch` block has a test that triggers it
- [ ] **Edge cases**: Empty strings, `null`, `undefined`, 0, negative numbers, `Number.MAX_SAFE_INTEGER`, extremely long strings
- [ ] **Round-trip tests**: For any serialize/deserialize, encrypt/decrypt, or encode/decode pair — verify `f(g(x)) === x`
- [ ] **Determinism tests**: Same input → same output (especially for signing, hashing)
- [ ] **Immutability tests**: Verify that public objects are frozen and cannot be mutated
- [ ] **No network in unit tests**: Tests must not depend on external services unless explicitly in an `integration/` folder excluded from CI
- [ ] **No hardcoded secrets**: Test seed phrases and keys should be clearly synthetic/known test values, never real
- [ ] **Test isolation**: Tests must not depend on execution order or shared mutable state

> **Lesson learned (DCC-18):** `seedUtils` had only 2.77% coverage — the most security-critical module in the package. Adding 16 targeted tests brought it to 88.88% and caught a missing `{ cause }` in error re-throw.

---

### Phase E — Configuration & CI Audit

**Goal:** Verify the project's tooling configuration is maximally strict and the CI pipeline catches everything.

#### tsconfig.json

- [ ] `strict: true` — all strict checks enabled
- [ ] `noUncheckedIndexedAccess: true` — array/object index returns `T | undefined`
- [ ] `noFallthroughCasesInSwitch: true` — no fall-through in switch
- [ ] `noImplicitOverride: true` — requires `override` keyword
- [ ] `skipLibCheck: true` — skip `.d.ts` checking (avoids upstream issues)
- [ ] Document any strictness options that had to remain `false` and why (e.g., `noUnusedLocals: false` due to upstream `.ts` source shipping)

#### Biome

- [ ] `biome.json` exists with `linter.enabled: true` and `formatter.enabled: true`
- [ ] `linter.rules.recommended: true` is set
- [ ] `noUnusedVariables: "error"` and `noUnusedImports: "error"` are configured
- [ ] `files.ignore` excludes `dist/**`, `coverage/**`, `*.d.ts`
- [ ] No stale rule overrides (e.g., rules that were copied from an old ESLint config but don’t apply to Biome)

#### CI Pipeline

- [ ] `npm ci` (not `npm install`) — verifies lockfile integrity
- [ ] `npm audit --audit-level=high` — runs before tests
- [ ] `npm run bulletproof:check` — full check-only pipeline
- [ ] `npm run build` — clean build
- [ ] `npm run validate` — publint + attw + size-limit
- [ ] Node.js version matrix covers `MIN_NODE` and `RECOMMENDED_NODE`
- [ ] Dependabot configured for weekly dependency updates

#### Package Publishing

- [ ] `"files"` field in `package.json` includes only `dist/`, `LICENSE`, `README.md`
- [ ] `npm pack --dry-run` shows no unexpected files (no `src/`, no `test/`, no `.env`)
- [ ] `publishConfig.provenance: true` for signed builds
- [ ] `"engines"` field enforces minimum Node.js version
- [ ] `"type": "module"` is set (ESM-only)

---

### Phase F — Branding & Legal Audit

**Goal:** Verify complete separation from Waves ecosystem. No residual branding.

#### Search Patterns

Run these searches across the entire project (including test files, configs, docs):

```bash
# Must return zero results in source code and configs:
grep -ri "wavesplatform\|waves\.exchange\|wavesnodes\.com\|wavesexplorer" --include="*.ts" --include="*.js" --include="*.json" --include="*.yml" --include="*.md" .

# Must return zero results in package.json dependencies:
grep "npm:@waves" package.json

# Acceptable exceptions (document each one):
# - .proto files: "package waves;" is a wire-format identifier, not branding
# - CHANGELOG.md: historical entries describing the migration from Waves
# - KNOWN_ISSUES.md: documenting remaining dependencies on Waves packages
```

#### Branding Checklist

- [ ] Package name is `@decentralchain/*` (not `@waves/*`)
- [ ] `author` field is `"DecentralChain"`
- [ ] `repository` URL points to `github.com/Decentral-America/*`
- [ ] `homepage` and `bugs` URLs point to DecentralChain domains
- [ ] README badges reference DecentralChain URLs
- [ ] License copyright says "DecentralChain"
- [ ] No `npm:@waves/*` aliases in dependencies (unless unavoidable — must be documented in KNOWN_ISSUES.md)
- [ ] Comments and JSDoc do not reference Waves (except in wire-format documentation)

---

## OUTPUT FORMAT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After completing all phases, produce a structured report:

### 1. Findings Summary Table

| # | Phase | Finding | Severity | Status |
|---|-------|---------|----------|--------|
| 1 | A | `npm:@waves/foo` alias still in use | CRITICAL | Fixed / Requires team decision |
| 2 | C | `Math.random()` used for session IDs | HIGH | Fixed |
| ... | | | | |

### Severity Definitions

| Level | Definition | SLA |
|-------|-----------|-----|
| **CRITICAL** | Could directly cause financial loss, fund theft, or key exposure | Must fix before publish. No exceptions. |
| **HIGH** | Creates a meaningful attack surface or violates security best practices | Must fix before publish or document explicit risk acceptance. |
| **MEDIUM** | Code quality issue that could lead to bugs under edge conditions | Fix in current release if feasible; otherwise file a ticket. |
| **LOW** | Cosmetic, stylistic, or documentation issue | Fix when convenient. |
| **INFO** | Observation that requires no action (e.g., wire-format names that cannot change) | Document for future maintainers. |

### 2. Changes Made

List every file modified with a one-line description:

```
src/seedUtils/index.ts    — Added console.warn for weak passwords and low encryption rounds
src/generic.ts            — Added { cause: _e } to error re-throw in chainIdFromRecipient
test/seed.spec.ts         — Added 16 tests for Seed class, strengthenPassword, generateNewSeed
...
```

### 3. Full Pipeline Verification

Show the final state of all quality gates:

```bash
npm run bulletproof        # ✅ Exit 0
npm run build              # ✅ Exit 0
npm run test:coverage      # ✅ All tests pass, coverage meets thresholds
npm audit --audit-level=high  # ✅ No high/critical vulnerabilities
knip                       # ✅ No findings (or only documented exceptions)
```

### 4. Known Issues

Any findings that could not be resolved in this session must be added to `KNOWN_ISSUES.md` at the workspace root with:

- Problem description
- Why it cannot be fixed now
- Recommended resolution path
- Risk level
- Affected files with line numbers

### 5. CHANGELOG Update

Add a `[version] - date` entry to `CHANGELOG.md` documenting all security fixes, test additions, dead code removal, and configuration changes made during the audit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## QUALITY STANDARD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is the **final gate** before code is published to npm and consumed by DecentralChain developers and end users worldwide. The audited package will be used in wallets, exchanges, and dApps that handle real money.

**The standard is simple: would you trust this code with your own money?**

If the answer is not an unqualified **yes**, keep auditing.

Work methodically through every phase. Do not rush. Do not skip files. Do not assume something is "probably fine." Verify everything.

After the audit is complete, the package must pass this final litmus test:

```bash
npm run bulletproof:check && npm run build && npm run validate && npm audit --audit-level=high
```

**Zero errors. Zero warnings. Zero exceptions.**

---

> **📋 REMINDER — Naming Convention (DCC-### is the universal link)**
>
> Every change must be tracked in **Jira** (ticket `DCC-###`) and linked via **Conventional Commits**.
>
> **One format, every surface:** `<type>(DCC-###): <lowercase imperative description, no period>`
>
> | Surface | Format | Example |
> |:--------|:-------|:--------|
> | Branch | `<type>/DCC-###-short-description` | `feat/DCC-15-proto-reserved-directive` |
> | Commit | `<type>(DCC-###): <description>` | `feat(DCC-15): add reserved directive` |
> | PR title | `<type>(DCC-###): <description>` | `feat(DCC-15): add reserved directive` |
> | GH Issue | `<type>(DCC-###): <description>` | `refactor(DCC-28): extract shared query module` |
>
> Types: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert`
>
> Full specification: See **1-MIGRATE.md § Documentation & Traceability**.

## --- END PROMPT ---



