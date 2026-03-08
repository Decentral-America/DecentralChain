# DCC-React Security Audit Report

**Application**: DecentralChain Wallet (dcc-react)  
**Classification**: Enterprise-grade financial wallet  
**Pipeline Status**: ALL GREEN  

---

## Pipeline Results

| Check | Result |
|-------|--------|
| TypeScript (`tsc -b --noEmit`) | **0 errors** |
| Biome | **0 errors**, 378 warnings (all `no-explicit-any`) |
| Tests (Vitest) | **67/67 passing** (6 suites) |
| npm audit | **0 vulnerabilities** |
| Waves branding | **0 references** in source |
| console.log in production | **0 instances** (except logger.ts itself) |

---

## Fixes Applied This Session

### CRITICAL Security Fixes

1. **Fake Password Change (CRITICAL)** — `ChangePasswordModal.tsx`  
   WAS: `setTimeout(500)` then reports success without doing anything.  
   NOW: Calls `multiAccount.changePassword()` with 600K PBKDF2 rounds. Real re-encryption of encrypted vault.

2. **Math.random() for Security-Sensitive IDs (HIGH)** — 4 files  
   WAS: `Math.random().toString(36)` for session IDs, queue IDs, toast IDs, announcement IDs.  
   NOW: `crypto.randomUUID()` — cryptographically secure.  
   Files: `SessionContext.tsx`, `useQueue.ts`, `ToastContext.tsx`, `LiveRegion.tsx`

3. **Unsigned Order Cancel (HIGH)** — `UserOrders.tsx`  
   WAS: Sending empty `signature: ''` to matcher for order cancellation.  
   NOW: Blocked client-side with error message explaining signing is not yet implemented.

4. **Vendored waves-transactions.min.js (HIGH)**  
   WAS: 571KB minified file containing `eval()`, `postMessage('*')`, CJS remnants loaded via `<script>` tag.  
   NOW: Deleted file and removed script tag from `index.html`. No source code referenced it.

5. **PBKDF2 Rounds Mismatch (HIGH)** — `LoginForm.tsx`  
   WAS: `multiAccount.signIn(..., 5000, ...)` — only 5,000 PBKDF2 iterations.  
   NOW: `multiAccount.signIn(..., 600000, ...)` — 600K iterations matching OWASP 2024 recommendation.

6. **Login Brute-Force Protection (MEDIUM)** — `LoginForm.tsx`  
   WAS: Unlimited password attempts with no throttling.  
   NOW: Exponential backoff after 3 failed attempts (5s → 15s → 30s → 60s → max 5min lockout).

7. **Double-Broadcast Guard (MEDIUM)** — `useBroadcast.ts`  
   WAS: No protection against concurrent broadcast attempts.  
   NOW: `broadcastInFlightRef` mutex prevents double-click sending two transactions.

8. **Inconsistent Password Minimums (MEDIUM)** — `PasswordProtection.tsx`  
   WAS: 8-character minimum (vs 12 in CreateAccount).  
   NOW: 12-character minimum standardized across all auth flows.

9. **Electron Auto-Download (MEDIUM)** — `electron/main.ts`  
   WAS: `autoUpdater.autoDownload = true` — downloads updates without user consent.  
   NOW: `autoDownload = false` — prompts user before downloading/installing.

### Branding Fixes

10. **Waves → DecentralChain in Config Files** — 3 environments  
    All 3 config files (mainnet, testnet, stagenet): wavesnodes.com → decentralchain.io, HTTP → HTTPS, waves-client-config → dcc-client-config, wavesExchangeLink → exchangeLink.

11. **Waves → DecentralChain in Locale Files** — 17 locales  
    ~600 Waves references replaced with DecentralChain/DCC across all 17 translation files. All locale JSON validated as valid JSON.

### Code Quality Fixes

12. **console.log Elimination** — 55+ files  
    All production `console.log()` calls replaced with `logger.debug()` which suppresses output in production and redacts sensitive fields (seed, privatekey, password, mnemonic, secret, proof).

13. **Unused imports/variables cleanup** — `UserOrders.tsx`  
    Removed unused `useQueryClient` import and `removeUserOrder` destructure.

---

## Security Posture Assessment

### Strong Areas (Already Well-Implemented)

| Area | Details |
|------|---------|
| Encryption | AES-256-GCM + PBKDF2 600K iterations (OWASP 2024) |
| Seed Protection | One-time read via `secureTransfer.ts`, 30s auto-expiry, never in storage |
| Session Management | 4-hour hard ceiling, 15-min idle timeout, sessionStorage only |
| HTTPS Enforcement | `validateBaseURL()` throws on HTTP in production |
| Electron Security | `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, whitelisted IPC |
| XSS Prevention | No `innerHTML`/`dangerouslySetInnerHTML`, comprehensive `sanitize.ts` |
| Logger Sanitization | Production-silent, redacts 6 sensitive field patterns |
| No eval/Function | Zero instances in source code |
| No postMessage | No cross-frame messaging |
| No hardcoded secrets | All env vars are placeholders |

### Accepted Risks

| Risk | Mitigation | Status |
|------|-----------|--------|
| Password in JS memory | JavaScript strings are immutable; no secure-wipe possible in browser | Accepted |
| Idle timer 60s granularity | 15-min window makes 59s deviation acceptable | Accepted |
| `as any` in data-service legacy layer | Structural limitation from porting Angular code | Tracked |

### Known Structural Limitations (Not Fixable in This Pass)

1. **`useTransactionSigning` is entirely stubbed** — All 13 signing functions throw "Not implemented". The `@decentralchain/dcc-transactions` package is commented out with "TODO: Re-enable when fixed for Vite". This means NO actual transaction signing works yet.

2. **~85 `as any` type assertions** — 28 DANGEROUS (in crypto/signing/money code), 27 MEDIUM (data handling), 30 LOW (styled-components). Root cause: `@decentralchain/dcc-transactions` stubs + legacy data-service layer. Fix requires: (a) restoring real package types, (b) typed wrapper for data-service, (c) declaring `window.DCCApp` interface.

3. **Seed Wordlist Validation** — `ImportAccount.tsx` only checks `words.length !== 15`, does not validate against BIP39/DCC wordlist. A user could enter 15 random non-dictionary words.

4. **Ledger Integration** — Hardware wallet signing is stubbed. `useLedger.ts` casts adapter to `any`.

---

## Phase Compliance Checklist

### Phase 1: BULLETPROOF

| Item | Status |
|------|--------|
| Node 24 LTS enforcement | PASS — `"engines": { "node": ">=24" }` + `.nvmrc` |
| ESM-only | PASS — `"type": "module"`, zero CJS in src/ |
| TypeScript strict mode | PASS — 0 errors |
| Biome flat config | PASS — 0 errors |
| Vitest tests | PASS — 67/67 |
| npm audit clean | PASS — 0 vulnerabilities |

### Phase 2: MODERNIZE

| Item | Status |
|------|--------|
| CryptoJS → Web Crypto | PASS — AES-256-GCM with PBKDF2 600K |
| Waves → DecentralChain | PASS — 0 Waves references in source |
| ESM enforcement | PASS — including Electron main process |

### Phase 3: AUDIT

| Item | Status |
|------|--------|
| XOR/weak crypto | PASS — all AES-256-GCM |
| Secure seed transfer | PASS — one-time read, auto-expiry |
| Session key exposure | PASS — sessionStorage, password re-auth on reload |
| Sensitive logging | PASS — logger redacts 6 field patterns, silent in production |
| HTTPS enforcement | PASS — throws on HTTP in production |
| Double-send prevention | PASS — broadcast mutex added |
| Weak passwords | PASS — 12-char minimum + complexity requirements |
| Import whitelist | PASS — Electron preload whitelists IPC channels |
| console.log in production | PASS — 0 instances |
| eval/Function | PASS — 0 instances |
| Math.random for security | PASS — crypto.randomUUID() |
| Brute-force protection | PASS — exponential backoff after 3 attempts |
