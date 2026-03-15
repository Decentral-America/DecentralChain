# Production Readiness Review

**Project:** DecentralExchange (React Wallet)
**Version:** 0.0.0 (pre-release)
**Date:** 2026-03-14
**Verdict:** **NO-GO** — 2 blockers, 19 gaps (14 code-only, 5 infra-blocked)

---

## 1. Pipeline & Quality Gates

| Gate | Result | Detail |
|------|--------|--------|
| Dependency allowlist | **PASS** | `governance/dependency-allowlist.json` enforced |
| Feature-flag policy | **PASS** | `governance/feature-flags.json` enforced |
| npm audit (high/critical) | **PASS** | 0 high/critical. 3 moderate (Electron transitive `yauzl` — no safe fix) |
| Biome lint | **PASS** | 0 errors, 0 warnings. 4 info-level `useLiteralKeys` (required by TS strict) |
| TypeScript strict mode | **PASS** | 0 errors. `exactOptionalPropertyTypes`, `verbatimModuleSyntax` enabled |
| Unit tests | **PASS** | 67/67 (6 suites: API client, crypto, sanitize, logger, password, secure transfer) |
| Production build | **PASS** | Vite 8.0.0, 13,770 modules, builds in ~1.3s |
| `eval` / `dangerouslySetInnerHTML` | **PASS** | 0 occurrences |
| `console.log` (non-logger) | **PASS** | 0 occurrences — all logging via `@/lib/logger` |
| Explicit `any` types | **PASS** | 0 (excluding 1 justified `forms.ts` with `biome-ignore`) |
| `@ts-ignore` / `@ts-nocheck` | **PASS** | 0 occurrences |
| `window.confirm/alert/prompt` | **PASS** | 0 occurrences |
| Hardcoded secrets | **PASS** | 0 (Sentry DSN is empty placeholder in `.env.production`) |
| Enterprise governance | **PASS** | dep-allowlist + feature-flag checks in `npm run validate` |

---

## 2. Runtime Stack

| Component | Version |
|-----------|---------|
| Node.js | 24.14.0 |
| npm | 11.9.0 |
| TypeScript | 5.9.3 |
| Vite | 8.0.0 |
| React | 19.2.4 |
| Biome | 2.4.7 |
| Vitest | 4.1.0 |
| Dependencies | 34 runtime, 17 dev |
| Module system | ESM (`"type": "module"`) |
| License | MIT |

---

## 3. Security Posture

### Present

| Control | Status |
|---------|--------|
| `X-Frame-Options: SAMEORIGIN` | Configured in nginx |
| `X-Content-Type-Options: nosniff` | Configured in nginx |
| `X-XSS-Protection: 1; mode=block` | Configured in nginx |
| `Referrer-Policy: origin` | Configured in nginx |
| `Strict-Transport-Security` | max-age=2592000 (~30 days), includeSubDomains |
| AES-256-GCM encryption | Web Crypto API, PBKDF2 key derivation |
| Input sanitization | `@/lib/sanitize` with 31 tests |
| Error boundary | App root (`ErrorBoundary` in `App.tsx`) |
| Sentry error monitoring | Wired (`@sentry/react`), DSN placeholder in env |
| Rate limiting hooks | 6 references in source |
| Docker healthcheck | `wget --spider http://localhost/health`, 30s interval |
| Monitoring endpoint | `/_status` (stub_status, localhost-only) |

### Issues

| ID | Severity | Issue | Action |
|----|----------|-------|--------|
| S-1 | **HIGH** | No `Content-Security-Policy` header | Add CSP to nginx config. At minimum: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.decentralchain.io` |
| S-2 | **MEDIUM** | `Access-Control-Allow-Origin: *` — wildcard CORS | Restrict to known origins or remove if not needed for SPA |
| S-3 | **LOW** | HSTS `max-age=2592000` (30 days) is short | Increase to `max-age=31536000` (1 year) + add `preload` for HSTS preload list |
| S-4 | **LOW** | `.env.production` checked into repo (no secrets, but pattern risk) | Add `.env.production` to `.gitignore`, inject via CI/CD |

---

## 4. Production Build

### Bundle Analysis

| Chunk | Raw | Gzip |
|-------|-----|------|
| `index` (main app) | **7,050 KB** | 1,941 KB |
| `mui-core` | 425 KB | 127 KB |
| `vendor` | 178 KB | 56 KB |
| `router` | 92 KB | 31 KB |
| `ui` | 31 KB | 12 KB |
| `secureTransfer` | 0.12 KB | 0.11 KB |
| **Total** | **7,777 KB** | **2,167 KB** |

### Infrastructure

| Component | Status |
|-----------|--------|
| Dockerfile.production | Multi-stage (build → nginx:alpine) |
| docker-compose.yml | 3 environments (mainnet/testnet/stagenet) with healthchecks |
| nginx config | Reverse proxy for API, matcher, TradingView; SPA fallback; gzip enabled |
| Network configs | `configs/mainnet.json`, `testnet.json`, `stagenet.json` |
| Environment files | `.env.development`, `.env.production`, `.env.staging`, `.env.example` |

---

## 5. Feature Completeness

### Unimplemented Feature Stubs (21 TODOs)

These are active UI paths that reach `// TODO: Implement` dead ends:

| Category | File | Stub |
|----------|------|------|
| **Token Creation** | `pages/CreateToken.tsx:169` | Token creation logic not implemented |
| **Account Mgmt** | `features/settings/modals/DeleteAccountModal.tsx:107` | Account deletion not implemented |
| **Script Engine** | `features/settings/modals/ScriptModal.tsx:76` | Script compilation/setting not implemented |
| **Signing** | `hooks/useTransactionSigning.ts:8,193` | Module disabled for Vite; seed decryption not implemented |
| **Security** | `features/settings/SecuritySettings.tsx:219` | Seed validation disabled |
| **Ledger** | `pages/LedgerImportPage.tsx:236` | Ledger account import not implemented |
| **Restore** | `pages/RestoreFromBackupPage.tsx:277` | Restore logic not implemented |
| **Bridge** | `pages/Bridge/Bridge.tsx:106` | Balance integration pending |
| **Balance History** | `features/wallet/BalanceChart.tsx:41,142,174` | Historical balance API not integrated |
| **Asset Loading** | `features/wallet/AssetList.tsx:59` | Awaiting backend endpoint |
| **DEX Realtime** | `features/dex/tradingview/datafeed.ts:195` | WebSocket datafeed not implemented |
| **Matcher Auth** | `api/services/matcherService.ts:222,290` | Matcher signature auth not implemented |
| **App Version** | `features/settings/InfoSettings.tsx:72` | Hardcoded "1.0.0" |
| **Data Service** | `lib/data-service/` (3 files) | Internal TODOs (enum, error catch, client lib) |

---

## 6. Code Health

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Biome errors | 0 | 0 | **PASS** |
| Biome warnings | 0 | 0 | **PASS** |
| TypeScript errors | 0 | 0 | **PASS** |
| Test pass rate | 67/67 (100%) | 100% | **PASS** |
| Explicit `any` | 0 | 0 | **PASS** |
| `biome-ignore` suppressions | 34 | < 50 | **PASS** (30+ are justified `noArrayIndexKey` in skeletons/charts) |
| Unused files (knip raw) | 129 | — | ⚠️ See C-10 ||
| ↳ Truly dead (safe to delete) | 42 | < 20 | **FAIL** |
| ↳ Migration in-progress (DO NOT DELETE) | 57 | — | Expected — 28% migration |
| ↳ Review-then-decide | 30 | — | Needs team input |
| Unused exports (knip) | 445 | < 50 | **FAIL** (many from migration files) |
| Unused exported types (knip) | 204 | < 20 | **FAIL** (many from migration files) |
| Unused dependencies | 2 | 0 | **FAIL** (`@hookform/resolvers`, `zod` — only used from dead files) |

---

## 7. Blockers

### BLOCKER 1: No Route-Level Code Splitting

| | |
|---|---|
| **Dependency** | 🟢 CODE-ONLY |
| **Severity** | CRITICAL |
| **Impact** | 7 MB unsplit main chunk. Unacceptable first-load on mobile/3G. |
| **Current state** | All 20+ page components eagerly imported in `src/routes/index.tsx` via static `import`. |

**Fix:** Convert non-critical routes to `React.lazy()` + `<Suspense>`:
```tsx
const CreateToken = lazy(() => import('@/pages/CreateToken'));
const Bridge = lazy(() => import('@/pages/Bridge'));
// ... etc for ~15 non-auth pages
```

### BLOCKER 2: Unimplemented Feature Stubs Behind Active UI

| | |
|---|---|
| **Dependency** | 🟡 MIXED (5 code-only, 5 infra, 1 hardware) |
| **Severity** | CRITICAL |
| **Impact** | Users reach buttons/forms that do nothing. Token creation, account deletion, Ledger import, transaction signing, and restore from backup are non-functional. |

**Recommendation:** Remove route definitions for unimplemented pages entirely. Re-add when implemented. Hide corresponding nav links.

#### Stub Breakdown by Dependency

**🟢 Code-only stubs** (can fix now):
| Stub | File | What's missing |
|------|------|----------------|
| Restore from backup | `pages/RestoreFromBackupPage.tsx:277` | Parse + decrypt logic (all crypto primitives already exist) |
| Account deletion | `features/settings/modals/DeleteAccountModal.tsx:107` | Clear account from encrypted storage |
| Seed decryption | `hooks/useTransactionSigning.ts:193` | Decrypt seed for tx signing (crypto lib exists) |
| Token creation | `pages/CreateToken.tsx:169` | Build + broadcast issue tx |
| Script modal | `features/settings/modals/ScriptModal.tsx:76` | Script compilation/broadcast |

**🔴 Infra-blocked stubs** (require backend/API):
| Stub | File | Blocked by |
|------|------|------------|
| Balance chart | `features/wallet/BalanceChart.tsx` | Historical balance API (backend) |
| Asset list | `features/wallet/AssetList.tsx:59` | Asset data endpoint (backend) |
| DEX WebSocket | `features/dex/tradingview/datafeed.ts:195` | WebSocket datafeed (infra) |
| Bridge | `pages/Bridge/Bridge.tsx:106` | Bridge service integration (infra) |
| Matcher auth | `api/services/matcherService.ts:222,290` | Matcher signing protocol (backend) |

**🟠 Hardware-blocked stubs:**
| Stub | File | Blocked by |
|------|------|------------|
| Ledger import | `pages/LedgerImportPage.tsx:236` | No Ledger SDK in `package.json` |

---

## 8. Complete Gap Inventory

### 🟢 CODE-ONLY — Can Fix Now (14 items)

No external dependencies. Fixable in the repo today.

| ID | Severity | Category | Gap | Detail |
|----|----------|----------|-----|--------|
| C-1 | **CRITICAL** | Performance | No route-level code splitting | All pages eagerly imported → 7 MB main chunk |
| C-2 | **CRITICAL** | Web | No favicon or app icons | Uses `vite.svg` — browsers show Vite logo in tabs/bookmarks |
| C-3 | **CRITICAL** | Web | No `<meta name="description">` | Zero SEO discoverability; blank in search results and social shares |
| C-4 | **CRITICAL** | Web | No Open Graph / Twitter card meta | Shared links show no preview (title, image, description) |
| C-5 | **CRITICAL** | Web | No per-page document titles | Every page shows "Decentral Exchange" — no differentiation |
| C-6 | **CRITICAL** | Metadata | Package version `0.0.0` | No release version; builds have no traceability |
| C-7 | **HIGH** | Security | No `Content-Security-Policy` header | XSS attack surface in nginx config |
| C-8 | **HIGH** | Security | Wildcard CORS `Access-Control-Allow-Origin: *` | Any origin can make credentialed requests |
| C-9 | **HIGH** | Security | HSTS max-age only 30 days | Should be 1 year (31536000) for HSTS preload eligibility |
| C-10 | **HIGH** | Code health | 42 truly dead files + 2 unused deps (87 files are migration in-progress) | Dead code increases attack surface; migration code must be preserved |
| C-11 | **HIGH** | Testing | Zero component/page tests | 67 tests exist but ALL are utility-only. No UI behavior coverage. |
| C-12 | **HIGH** | Testing | Zero E2E tests | No Playwright/Cypress. No confidence in real user flows. |
| C-13 | **HIGH** | Feature | 5 code-only stubs behind active UI | Users reach non-functional forms (restore, account deletion, seed decrypt, token create, script modal) |
| C-14 | **MEDIUM** | Web | No `robots.txt` | Crawlers have no directives (minor for wallet, but standard practice) |

---

### 🟢 CODE-ONLY — Implementation Playbook

Best-practice solution for each code-only gap, verified against the actual stack.

---

#### C-1: Route-Level Code Splitting

| | |
|---|---|
| **Stack** | React Router v7.13 + `createBrowserRouter` |
| **Wrong approach** | `React.lazy()` + `<Suspense>` wrapping each element |
| **Right approach** | **React Router `lazy` property** on route objects — framework-native, zero deps |

React Router v7 supports a `lazy` property on route definitions used with `createBrowserRouter`. This is superior to `React.lazy()` because:
- Router-native: loading is managed by the router, not manual `Suspense` boundaries
- Can also lazy-load `loader`, `action`, `errorElement` per route
- Automatic parallel prefetching on `<Link>` hover when combined with `unstable_patchRoutesOnNavigation`
- `RouteLoadingFallback` already exists in `src/components/RouteLoadingFallback.tsx` — use as `hydrateFallbackElement`

**Implementation:**

```tsx
// src/routes/index.tsx — AFTER (lazy routes)
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      // Auth pages — KEEP EAGER (critical entry points, small)
      { path: '/', element: <LandingPage /> },
      { path: '/welcome', element: <Welcome /> },
      { path: '/signup', element: <SignUp /> },
      { path: '/create-account', element: <SignUp /> },
      { path: '/signin', element: <SignIn /> },
      { path: '/sign-in', element: <SignIn /> },
      { path: '/import-account', element: <ImportAccountPage /> },
      { path: '/save-seed', element: <SaveSeedPage /> },

      // Non-critical pages — LAZY LOAD
      {
        path: '/restore-backup',
        lazy: () => import('@/pages/RestoreFromBackup').then(m => ({ Component: m.RestoreFromBackupPage })),
      },
      {
        path: '/import/ledger',
        lazy: () => import('@/pages/ImportLedger').then(m => ({ Component: m.ImportLedger })),
      },
      {
        path: '/desktop',
        element: <ProtectedRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              // ... wallet/dex/settings route modules also lazy-loadable
              {
                path: 'bridge',
                lazy: () => import('@/pages/Bridge').then(m => ({ Component: m.Bridge })),
              },
              // ... etc
            ],
          },
        ],
      },
    ],
  },
]);
```

**Pages to keep eager** (auth critical path): `LandingPage`, `Welcome`, `SignUp`, `SignIn`, `ImportAccountPage`, `SaveSeedPage`

**Pages to lazy-load** (~15): `RestoreFromBackup`, `ImportLedger`, `Bridge`, `CreateToken`, `Swap`, `Markets`, `OrderBook`, `Analytics`, `Messages`, `DexPairAdmin`, `Dashboard`, `Wallet`, `Dex`, `SettingsPage`, `Portfolio`, `LeasingModern`, `TransactionsModern`, `AliasManagement`

**Validation:** Run `npm run build` and verify main chunk drops from 7 MB to < 2 MB.

---

#### C-2: Favicon + App Icons

| | |
|---|---|
| **Standard** | [Web App Manifest spec](https://www.w3.org/TR/appmanifest/) + Apple HIG |
| **Wrong approach** | Replace `vite.svg` with a single `favicon.ico` |
| **Right approach** | Full icon set with SVG favicon (modern browsers) + ICO fallback + PWA-ready manifest |

**Required assets** (design team delivers, code wires them):

| File | Size | Purpose |
|------|------|---------|
| `public/favicon.svg` | Scalable | Modern browsers (Chrome, Firefox, Edge) |
| `public/favicon.ico` | 32×32 | Legacy fallback (Safari, older browsers) |
| `public/apple-touch-icon.png` | 180×180 | iOS home screen |
| `public/icon-192.png` | 192×192 | Android Chrome manifest |
| `public/icon-512.png` | 512×512 | Android install / splash |
| `public/site.webmanifest` | — | PWA metadata |

**`index.html` additions:**
```html
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
```

**`public/site.webmanifest`:**
```json
{
  "name": "DecentralExchange",
  "short_name": "DCC",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#0D47A1",
  "background_color": "#121212",
  "display": "standalone"
}
```

---

#### C-3 + C-4: Meta Description + Open Graph / Twitter Cards

| | |
|---|---|
| **Standard** | [Open Graph Protocol](https://ogp.me/) + [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup) |
| **Wrong approach** | Use `react-helmet-async` (adds a dependency for static meta) |
| **Right approach** | Static tags in `index.html` — SPA has one URL, no SSR, no per-page social sharing |

**`index.html` `<head>` additions:**
```html
<meta name="description" content="Secure non-custodial cryptocurrency wallet and decentralized exchange for DecentralChain. Trade, stake, and manage DCC tokens." />
<meta name="theme-color" content="#0D47A1" />

<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="DecentralExchange — Decentralized Wallet & DEX" />
<meta property="og:description" content="Secure non-custodial cryptocurrency wallet and decentralized exchange for DecentralChain." />
<meta property="og:image" content="https://exchange.decentralchain.io/og-image.png" />
<meta property="og:url" content="https://exchange.decentralchain.io" />
<meta property="og:site_name" content="DecentralExchange" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="DecentralExchange — Decentralized Wallet & DEX" />
<meta name="twitter:description" content="Secure non-custodial cryptocurrency wallet and decentralized exchange for DecentralChain." />
<meta name="twitter:image" content="https://exchange.decentralchain.io/og-image.png" />
```

**Required asset:** `public/og-image.png` — 1200×630px OG preview image (design team delivers).

---

#### C-5: Per-Page Document Titles

| | |
|---|---|
| **Stack** | React Router v7.13 `handle` + `useMatches()` |
| **Wrong approach** | Install `react-helmet-async` (unnecessary dependency) |
| **Wrong approach** | Raw `useEffect` + `document.title` in every page (scattered, unmaintainable) |
| **Right approach** | **React Router `handle.title` convention** + single `useDocumentTitle` hook |

React Router v7 route objects accept a `handle` property for arbitrary metadata. Pair with `useMatches()` to read the deepest matching title.

**Step 1 — Add `handle.title` to every route:**
```tsx
// In route definitions:
{ path: 'portfolio', element: <Portfolio />, handle: { title: 'Portfolio' } },
{ path: 'transactions', element: <TransactionsModern />, handle: { title: 'Transactions' } },
{ path: 'leasing', element: <LeasingModern />, handle: { title: 'Leasing' } },
{ path: 'settings', element: <SettingsPage />, handle: { title: 'Settings' } },
{ path: 'dex', element: <Dex />, handle: { title: 'Trade' } },
// ... etc
```

**Step 2 — Single hook in `RootLayout`:**
```tsx
// src/hooks/useDocumentTitle.ts
import { useMatches } from 'react-router-dom';
import { useEffect } from 'react';

interface RouteHandle { title?: string }

export function useDocumentTitle() {
  const matches = useMatches();
  useEffect(() => {
    const match = [...matches].reverse().find(m => (m.handle as RouteHandle)?.title);
    const title = (match?.handle as RouteHandle)?.title;
    document.title = title ? `${title} — DecentralExchange` : 'DecentralExchange';
  }, [matches]);
}
```

**Step 3 — Call once in `RootLayout`:**
```tsx
export const RootLayout = () => {
  useDocumentTitle();
  return <Outlet />;
};
```

Zero dependencies. Framework-native. Centralized. Each route declares its own title.

---

#### C-6: Package Version

| | |
|---|---|
| **Standard** | [Semantic Versioning 2.0.0](https://semver.org/) |
| **Wrong approach** | Set to `1.0.0` (implies feature-complete, stable API) |
| **Right approach** | `0.1.0-rc.1` (pre-1.0, release candidate — features incomplete, API unstable) |

**Change in `package.json`:**
```json
"version": "0.1.0-rc.1"
```

Expose via `import.meta.env.PACKAGE_VERSION` in Vite build:
```ts
// vite.config.ts — add to defineConfig
define: {
  'import.meta.env.PACKAGE_VERSION': JSON.stringify(require('./package.json').version),
}
```

Replace the hardcoded `"1.0.0"` in `features/settings/InfoSettings.tsx:72`.

---

#### C-7: Content Security Policy

| | |
|---|---|
| **Standard** | [CSP Level 3](https://www.w3.org/TR/CSP3/) + [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html) |
| **Wrong approach** | Loose `script-src 'unsafe-inline' 'unsafe-eval'` to avoid breakage |
| **Wrong approach** | Nonce-based (requires server-side nonce generation per request — nginx can't do this natively) |
| **Right approach** | **Hash-based or strict allow-list**, deployed as `Report-Only` first, then promoted |

The dev CSP in `vite.config.ts` already enumerates all required domains. Production version tightens it:

**Add to `docker/nginx/default.conf`:**
```nginx
# Content Security Policy — deployed as Report-Only for validation
# Promote to Content-Security-Policy after 2 weeks with zero violations
add_header Content-Security-Policy-Report-Only "default-src 'self'; script-src 'self' https://s3.tradingview.com https://*.tradingview.com; style-src 'self' 'unsafe-inline' https://s3.tradingview.com https://*.tradingview.com; img-src 'self' data: https:; connect-src 'self' https://*.decentralchain.io wss://*.decentralchain.io https://raw.githubusercontent.com https://s3.tradingview.com https://*.tradingview.com; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'self' https://s3.tradingview.com https://*.tradingview.com https://www.tradingview-widget.com https://s.tradingview.com; frame-ancestors 'self'" always;
```

**Why `'unsafe-inline'` for `style-src` only:** styled-components injects `<style>` tags at runtime. No workaround without SSR + nonce injection. This is acceptable — `style-src 'unsafe-inline'` is lower risk than `script-src 'unsafe-inline'`.

**Why NOT nonce-based:** nginx cannot generate per-request nonces without Lua/OpenResty or a reverse proxy. For a static SPA on nginx:alpine, hash/allow-list CSP is the correct approach.

**Rollout:** Report-Only for 2 weeks → review violation reports → promote to enforcing.

---

#### C-8: Remove Wildcard CORS

| | |
|---|---|
| **Standard** | [OWASP CORS Guide](https://cheatsheetseries.owasp.org/cheatsheets/CORS_Cheat_Sheet.html) |
| **Wrong approach** | Restrict to specific origin list (overcomplicates) |
| **Right approach** | **Remove CORS header entirely** — SPA + nginx proxy = same-origin, no CORS needed |

The app proxies API calls through nginx (`proxy_pass`). Browser sees same-origin requests. CORS headers serve no purpose and widen the attack surface.

**Change in `docker/nginx/default.conf`:**
```diff
- add_header Access-Control-Allow-Origin "*";
  # CORS removed: SPA proxies all API calls through nginx — same-origin policy applies
```

If a future external consumer needs CORS, add it to specific `location` blocks only, never globally.

---

#### C-9: HSTS Max-Age

| | |
|---|---|
| **Standard** | [HSTS RFC 6797](https://tools.ietf.org/html/rfc6797) + [hstspreload.org](https://hstspreload.org/) |
| **Wrong approach** | Add `preload` immediately (irreversible, affects all subdomains permanently) |
| **Right approach** | Increase to 1 year, defer `preload` until domain owner confirms at hstspreload.org |

**Change in `docker/nginx/default.conf`:**
```diff
- add_header Strict-Transport-Security "max-age=2592000; includeSubDomains" always;
+ add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Do NOT add `preload` — it requires submission to hstspreload.org and is **permanent and irreversible**. Only add after infra team explicitly confirms.

---

#### C-10: Dead Code Cleanup

| | |
|---|---|
| **Standard** | Incremental deletion with pipeline validation |
| **Wrong approach** | `npx knip --fix` (auto-deletes — can break imports, misses side effects) |
| **CRITICAL WARNING** | **Many "unused" files are UNMIGRATED in-progress migration work, NOT dead code** |

Knip reports 129 unused files (28,223 lines). However, the SSOT (`SINGLE_SOURCE_OF_TRUTH.md`) documents this exchange as an **Angular-to-React migration at ~28% completion**. Cross-referencing knip output against the SSOT's 6 critical gaps and 5 phased workstreams reveals three distinct categories:

---

**🔴 DO NOT DELETE — Migration-Planned Features (57 files, ~16,000 lines)**

These files implement features explicitly required by the SSOT migration plan and are not yet wired because the migration is incomplete. Deleting them destroys work that will need to be redone.

| Category | SSOT Workstream | Files | Why needed |
|----------|-----------------|-------|------------|
| **Advanced tx forms** | WS1 (parity), Phase C (signing) | `features/advanced/AliasForm.tsx` (244), `DataTransactionForm.tsx` (329), `MassTransferForm.tsx` (402), `SetScriptForm.tsx` (311), `index.ts` | Alias creation, data tx, mass transfer, set-script — core blockchain tx types needed for parity |
| **Asset management** | WS1 (parity), Phase B (live data) | `features/assets/AssetInfo.tsx` (292), `BurnTokenForm.tsx` (405), `IssueTokenForm.tsx` (324), `ReissueTokenForm.tsx` (416), `index.ts` | Issue/burn/reissue tokens — required token operations |
| **Auth/account flow** | WS2 (auth), Phase A (security) | `features/auth/AccountSwitcher.tsx` (241), `PasswordProtection.tsx` (321), `index.ts` | Multi-account switching + password protection — SSOT gap #1 |
| **DEX realtime** | WS1 (parity), Phase B (live data) | `features/dex/tradingview/datafeed.ts` (203), `useDexWebSocket.ts` (300), `useMarketData.ts` (294), `index.ts` | WebSocket feeds + market data — SSOT gap #3 |
| **Session management** | WS2 (auth) | `features/sessions/SessionContext.tsx` (347), `types.ts`, `index.ts` | Session lifecycle — SSOT gap #1 |
| **Wallet modals** | WS1 (parity), Phase B (live data) | `features/wallet/AssetInfoModal.tsx` (205), `BurnAssetModal.tsx` (354), `DepositAssetModal.tsx` (289), `ReissueAssetModal.tsx` (392), `SepaAssetModal.tsx` (191) | Asset operations UI — mirrors Angular wallet modals |
| **Wallet settings** | WS1 (parity) | `features/settings/BackupSettings.tsx`, `LanguageSettings.tsx`, `ThemeSettings.tsx`, `index.ts` | Settings subsections not yet wired into tabbed UI |
| **Gateway/bridge** | WS4 (gateway), Phase D (bridge) | `services/gateways/GatewayService.ts` (248), `DCCGatewayProvider.ts` (114), `types.ts` (140), `index.ts` | Gateway deposit/withdraw — SSOT gap #6 |
| **Transaction signing** | WS2 (signing), Phase C | `hooks/useTransactionSigning.ts` (already tracked as TODO stub) | Order signing & broadcast — SSOT gap #4 |
| **Transaction UX** | WS1 (parity), Phase C | `components/wallet/TransactionConfirmationFlow.tsx` (380), `TransactionDetailsModal.tsx` (271) | Tx confirmation flow — required for signing UX |
| **Ledger** | WS3 (Ledger), Phase D | `components/modals/LedgerSignModal.tsx` (152), `pages/LedgerImportPage.tsx` (608) | Ledger sign + import — SSOT gap #5 |
| **Import/account pages** | WS2 (auth), Phase A | `pages/ImportPage.tsx` (259), `KeeperImportPage.tsx` (937), `AccountManager/AccountManagerPage.tsx` (310), `SwitchAccountPage.tsx` (316), `RestoreFromBackupPage.tsx` (597) | Import flows — SSOT gap #2 |
| **Tokens/migration** | WS1 (parity) | `pages/TokensPage.tsx` (403), `MigratePage.tsx` (582), `MigratePage_part1.tsx` (475) | Token listing + migration flow |
| **Data service hooks** | Phase B (live data) | `hooks/useTradingPairs.ts` (105), `useMultiAccount.ts` (142), `useAuthEvents.ts` (53), `usePoll.ts` (294), `usePollCache.ts` (323), `useQueue.ts` (357), `useTimeline.ts` (457), `useStorage.ts` (90), `useExplorerLinks.ts` (81), `useAssetName.ts` (34) | Data integration hooks — SSOT gap #3 |
| **Secure storage** | WS2 (auth) | `lib/secureStorage.ts` (306) | Encrypted vault — SSOT gap #1 |
| **Seed dictionary** | WS2 (auth) | `lib/data-service/utils/seedDictionary.ts` (2,050) | BIP39 word list for seed validation |
| **WebSocket** | Phase B (live data) | `services/websocket/index.ts` | Real-time data connection |
| **Explorer links** | WS1 (parity) | `services/explorerLinks.ts` | Links to block explorer |

---

**🟡 REVIEW THEN DECIDE — Display/UI Components (30 files, ~5,500 lines)**

These are pre-built UI components that may be needed as the migration progresses. Not yet wired but represent substantial implementation. Review before deleting — they may be consumed when migration pages are connected.

| Category | Files | Why to review |
|----------|-------|---------------|
| **Display components** | `components/display/Balance.tsx` (236), `Change24.tsx` (174), `DateDisplay.tsx` (268), `NiceNumber.tsx` (253), `QRCode.tsx` (221) | Wallet/DEX UIs will need these when live data replaces placeholders |
| **Charts** | `components/charts/RechartsWrapper.tsx` | Chart library wrapper — likely needed by BalanceChart |
| **Atom components** | `atoms/Avatar.tsx` (75), `Box.tsx` (154), `Divider.tsx` (107), `GlassCard.tsx` (145), `Grid.tsx` (104), `Radio.tsx` (67), `Tooltip.tsx` (47) | Generic UI — MUI may have replaced them |
| **Asset name** | `components/AssetName.tsx`, `Breadcrumbs.tsx` | May be needed for wallet pages |
| **Modal system** | `components/modals/AlertModal.tsx`, `index.ts` | May complement existing modal context |
| **Organisms** | `organisms/LanguageSwitcher.tsx`, `organisms/index.ts` | Language switching UI |
| **Notifications** | `notifications/index.ts` | Barrel |
| **Contexts** | `contexts/EventContext.tsx` | Event bus — may be replaced by different pattern |
| **Landing** | `components/landing/TestimonialsStrip.tsx` | UI for landing page |
| **Type defs** | `types/charting_library.d.ts`, `types/react19-compat.d.ts`, `styles/styled.d.ts` | May be needed at compile-time even if not directly imported |

---

**🟢 SAFE TO DELETE — Truly Dead Code (42 files, ~6,700 lines)**

These files are superseded, scaffolding, obsolete, or duplicated. No migration path requires them.

| Category | Files | Why safe |
|----------|-------|----------|
| **Storybook files** (no Storybook installed) | `atoms/Button.stories.tsx`, `Card.stories.tsx`, `Input.stories.tsx` | No Storybook in `devDependencies` — dead scaffolding |
| **Barrel re-exports** (orphaned) | `api/index.ts`, `atoms/index.ts`, `lib/index.ts`, `stores/index.ts`, `services/index.ts`, `services/api/index.ts`, `services/auth/index.ts`, `services/storage/index.ts`, `types/index.ts`, `utils/index.ts` | Only re-export from files that are themselves unused |
| **Superseded pages** | `DesktopPage.tsx` (old layout — `MainLayout` replaced it), `DesktopUpdatePage.tsx` (Electron-only, not in routes), `DexDemoPage.tsx` (demo page), `StandPage.tsx` (unknown), `UnavailablePage.tsx` (placeholder) | Replaced by current page implementations |
| **Duplicate utils** | `lib/api.ts` (replaced by `api/client.ts`), `lib/errorHandler.ts` (replaced by `lib/logger.ts`), `lib/memoUtils.ts`, `utils/helpers.ts`, `utils/constants.ts`, `utils/network.ts`, `utils/validators.ts`, `utils/explorerLinks.ts` (duplicate of `services/explorerLinks.ts`), `utils/seed.ts`, `utils/storageExporter.ts`, `utils/styleManager.ts`, `utils/componentList.ts` | Functionality exists in newer counterparts |
| **Superseded styles** | `styles/mixins.ts`, `styles/modernTheme.ts`, `styles/responsive.ts`, `styles/tokens.ts` | MUI theme in `theme/mui-theme.ts` replaced these |
| **Superseded types** | `types/api.ts`, `types/common.ts`, `types/components.ts`, `types/data-service.d.ts` | Type definitions co-located with actual modules now |
| **Superseded services** | `services/defaultSettings.ts` | Settings context replaced it |
| **Electron type defs** | `electron/main.d.ts`, `electron/preload.d.ts` | Generated declarations — `.js` files are the build output |
| **Camera hook** | `hooks/useMediaStream.ts` (602 lines) | Camera/microphone access — no QR scanning feature in scope |
| **Forms lib** | `lib/forms.ts` | react-hook-form replaced it (has `biome-ignore any`) |
| **Broadcast types** | `lib/data-service/broadcast/interface.d.ts` | Legacy data-service types — unused even within data-service |

---

**Also safe to remove:** 2 unused dependencies
- `@hookform/resolvers` — only consumed by dead `lib/forms.ts`
- `zod` — only consumed by dead `lib/forms.ts`

---

**Summary:**

| Classification | Files | Lines | Action |
|---------------|-------|-------|--------|
| 🔴 Migration-planned (DO NOT DELETE) | 57 | ~16,000 | Keep — required by SSOT workstreams |
| 🟡 Review-then-decide | 30 | ~5,500 | Review with team before deleting |
| 🟢 Safe to delete | 42 | ~6,700 | Delete in batched PRs with pipeline validation |
| **Total** | 129 | 28,223 | |

**Process for the 42 safe-to-delete:**
```bash
# Step 1: Remove unused dependencies
npm uninstall @hookform/resolvers zod

# Step 2: Delete in batches of ~15 by category
# Batch 1: Storybook + orphaned barrels
# Batch 2: Superseded pages + duplicate utils
# Batch 3: Superseded styles + types + services
# After each batch: npm run validate
```

**Do NOT run `knip --fix`** — it would delete migration-critical code.

---

#### C-11: Component Tests

| | |
|---|---|
| **Stack** | Vitest 4.1 + jsdom + `@testing-library/jest-dom` (already installed) |
| **Missing dep** | `@testing-library/react` and `@testing-library/user-event` — **NOT in `package.json`** |
| **Wrong approach** | Snapshot tests (brittle, no behavioral coverage) |
| **Right approach** | **Behavioral tests** with React Testing Library — test what users see and do, not implementation |

**Step 1 — Install missing deps:**
```bash
npm install -D @testing-library/react @testing-library/user-event
```

**Step 2 — Minimum viable test suite (priority order):**

| Test file | What it covers | Why critical |
|-----------|---------------|-------------|
| `ErrorBoundary.test.tsx` | Catches render errors, shows fallback | Prevents white-screen-of-death |
| `ProtectedRoute.test.tsx` | Redirects unauthenticated users | Auth gate correctness |
| `SignIn.test.tsx` | Form validation, submit flow | Primary entry point |
| `SignUp.test.tsx` | Seed generation, password validation | Account creation |
| `Dashboard.test.tsx` | Renders with mock data, loading states | Most-visited authenticated page |
| `MainLayout.test.tsx` | Navigation renders, sidebar links | Navigation integrity |

**Step 3 — Testing conventions:**
```tsx
// Use render + screen + userEvent — never enzyme, never shallow render
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Wrap with required providers (router, theme, i18n, query client)
// Create a shared test utility: src/test/render.tsx
```

---

#### C-12: E2E Tests

| | |
|---|---|
| **Standard** | [Playwright](https://playwright.dev/) (faster, multi-browser, better TypeScript support than Cypress) |
| **Wrong approach** | Cypress (slower, single-tab, heavier, no WebKit support) |
| **Right approach** | **Playwright with minimal smoke suite** — 3-5 critical user journeys |

**Step 1 — Install + configure:**
```bash
npm init playwright@latest
# Select: TypeScript, tests in e2e/, GitHub Actions CI, install browsers
```

**Step 2 — Minimum viable E2E suite:**

| Test | Flow | Why critical |
|------|------|-------------|
| `landing.spec.ts` | Load `/` → verify hero renders, CTA buttons visible | Entry point works |
| `auth-signup.spec.ts` | `/` → "Create Account" → fill form → see seed page | Account creation flow |
| `auth-signin.spec.ts` | `/signin` → enter credentials → redirected to `/desktop/wallet` | Login flow |
| `navigation.spec.ts` | Authenticated → click Wallet/DEX/Settings → correct page loads | Navigation integrity |
| `settings.spec.ts` | `/desktop/settings` → change language → verify UI updates | Settings work |

**Step 3 — CI integration:**
```yaml
# Add to .github/workflows/ci-cd.yml
- name: Run E2E tests
  run: npx playwright test
```

---

#### C-13: Gate/Remove Unimplemented Routes

| | |
|---|---|
| **Wrong approach** | Feature flags in `governance/feature-flags.json` (build-time flags for runtime UI — leaky abstraction) |
| **Right approach** | **Remove route definitions entirely** + remove/`disabled` nav links. Re-add when implemented. |

**Routes to remove from `src/routes/index.tsx`:**
- `/restore-backup` (RestoreFromBackupPage)
- `/import/ledger` (ImportLedger)
- `/desktop/bridge` (Bridge)
- `/desktop/create-token` (CreateToken)

**Also:** Remove or disable corresponding navigation menu items (sidebar links, buttons on landing page).

**For any existing deep links:** The `*` catch-all already redirects to `/`, so removed routes automatically 404-redirect.

This is cleaner than feature flags because:
- No dead code shipped to production
- No conditional rendering complexity
- No "flag management" overhead
- Git history tracks when routes are added

---

#### C-14: robots.txt

| | |
|---|---|
| **Standard** | [Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309) |
| **Wrong approach** | `Allow: /` (wallet is auth-gated, no public content to index) |
| **Right approach** | **Disallow authenticated routes**, allow public landing page |

**Create `public/robots.txt`:**
```
User-agent: *
Allow: /
Disallow: /desktop/
Disallow: /signin
Disallow: /signup
Disallow: /import-account
Disallow: /save-seed

Sitemap: https://exchange.decentralchain.io/sitemap.xml
```

Only the landing page (`/`) has SEO value. All authenticated routes are gated and should not be crawled.

### 🔴 INFRA-BLOCKED — Requires External Systems (5 items)

Depends on backend services, DNS, CI/CD pipeline, or hardware.

| ID | Severity | Category | Gap | Blocked by |
|----|----------|----------|-----|------------|
| I-1 | **HIGH** | Monitoring | Sentry DSN empty in `.env.production` | Requires Sentry project creation + DSN provisioning |
| I-2 | **HIGH** | Feature | 5 infra-dependent stubs (balance chart, asset list, DEX WS, bridge, matcher auth) | Backend APIs / WebSocket / bridge service not deployed |
| I-3 | **HIGH** | Feature | Ledger hardware wallet import | Requires adding Ledger SDK to `package.json` + USB/HID access |
| I-4 | **MEDIUM** | Security | `.env.production` committed to repo (no secrets, but bad pattern) | Requires CI/CD env injection pipeline |
| I-5 | **MEDIUM** | Feature | No network switching UI | Requires environment-aware config endpoint or multi-deploy strategy |

---

## 9. Acceptance Checklist

| # | Criterion | Status | Dep |
|---|-----------|--------|-----|
| 1 | Pipeline passes (`npm run validate`) | ✅ | — |
| 2 | Zero lint errors/warnings | ✅ | — |
| 3 | Zero TypeScript errors | ✅ | — |
| 4 | All tests pass | ✅ | — |
| 5 | No hardcoded secrets in source | ✅ | — |
| 6 | No `eval`/`dangerouslySetInnerHTML` | ✅ | — |
| 7 | Error boundary at app root | ✅ | — |
| 8 | 404 catch-all route | ✅ | — |
| 9 | Docker healthcheck configured | ✅ | — |
| 10 | Security headers in nginx (CSP) | ❌ Missing CSP | 🟢 CODE |
| 11 | Route-level code splitting | ❌ Not implemented | 🟢 CODE |
| 12 | Unimplemented features gated/removed | ❌ 21 stubs reachable | 🟡 MIXED |
| 13 | Bundle size < 2 MB gzipped main chunk | ⚠️ 1,941 KB (borderline) | 🟢 CODE |
| 14 | Error monitoring active | ❌ Sentry DSN empty | 🔴 INFRA |
| 15 | `.env` files excluded from repo | ⚠️ Committed (no secrets) | 🔴 INFRA |
| 16 | Proper favicon + app icons | ❌ Uses vite.svg | 🟢 CODE |
| 17 | Meta description + OG/social tags | ❌ None | 🟢 CODE |
| 18 | Per-page document titles | ❌ Static title only | 🟢 CODE |
| 19 | Component/page test coverage | ❌ Zero | 🟢 CODE |
| 20 | E2E test coverage | ❌ Zero | 🟢 CODE |
| 21 | Dead code removed (truly dead only) | ❌ 42 dead files + 2 deps | 🟢 CODE |
| 22 | CORS restricted to known origins | ❌ Wildcard `*` | 🟢 CODE |
| 23 | HSTS max-age ≥ 1 year | ❌ 30 days | 🟢 CODE |
| 24 | Package version set | ❌ `0.0.0` | 🟢 CODE |
| 25 | `robots.txt` present | ❌ Missing | 🟢 CODE |

**Score: 9/25 PASS | 2/25 WARN | 14/25 FAIL**

---

## 10. Strengths (What's Already Solid)

| Area | Evidence |
|------|----------|
| Encryption | AES-256-GCM, PBKDF2, Web Crypto API (268 refs) |
| Input sanitization | `@/lib/sanitize` with 31 unit tests |
| Session security | Idle auto-logout timer, auto-lock, inactivity detection |
| Electron hardening | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` |
| Logging discipline | Zero `console.log`; all via `@/lib/logger` with sensitive field redaction |
| Scam/phishing protection | Scam asset list fetching, address validation, suspicious asset warnings |
| i18n coverage | 17 locales, 647 `useTranslation` calls across app |
| Accessibility foundations | `LiveRegion`, `SkipNav`, `a11y/` component directory, 91 ARIA refs |
| Form validation | 258 refs across app |
| API resilience | 30s `AbortSignal` timeouts, retry logic, rate limiting hooks (6 refs) |
| CI/CD | 5 GitHub Actions workflows + Jenkinsfile |
| Infrastructure | Multi-stage Docker, 3 env configs, nginx healthcheck, gzip |

---

## 11. Verdict

**NO-GO** with 2 blockers + 19 open gaps.

### Path to GO — Code-Only (no infra needed)

| Priority | Action | IDs |
|----------|--------|-----|
| 1 | Add `React.lazy()` code splitting to routes | C-1 |
| 2 | Remove/gate unimplemented page routes from UI | C-13 |
| 3 | Add nonce-based CSP to nginx (report-only first) | C-7 |
| 4 | Restrict CORS to known origins | C-8 |
| 5 | Increase HSTS max-age to 1 year | C-9 |
| 6 | Add favicon, apple-touch-icon, app icons | C-2 |
| 7 | Add `<meta description>`, OG tags, Twitter cards to `index.html` | C-3, C-4 |
| 8 | Add per-page `document.title` via route meta | C-5 |
| 9 | Set package version to `0.1.0-rc.1` | C-6 |
| 10 | Dead code cleanup (129 files, batched with validation) | C-10 |
| 11 | Add `robots.txt` to `public/` | C-14 |
| 12 | Add component tests for critical flows (auth, wallet, nav) | C-11 |
| 13 | Add E2E smoke tests (login → dashboard → send) | C-12 |

### Infra-Blocked (requires external provisioning)

| Priority | Action | IDs | Blocked by |
|----------|--------|-----|------------|
| 1 | Provision Sentry DSN and populate env | I-1 | Sentry project |
| 2 | Implement backend-dependent features | I-2 | API/WebSocket deployment |
| 3 | Add Ledger SDK + hardware wallet support | I-3 | SDK evaluation + USB access |
| 4 | Move `.env.production` to CI/CD injection | I-4 | CI/CD secret management |
| 5 | Build network switching UI | I-5 | Multi-environment deployment strategy |

After completing code-only items 1–9, the application meets minimum production deployment criteria for the working feature subset.
