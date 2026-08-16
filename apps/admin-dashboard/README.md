# DCC Admin Dashboard

> Full architecture + operations reference for this app — nav structure, file map, auth flow, secrets,
> deploy flow, and known outstanding issues. **Written for:** a developer who has never seen this codebase.
>
> **Absorbed into git 2026-08-13** (was `Ecosystem/ADMIN-DASHBOARD-HANDOFF.md`, untracked/gitignored at
> the shared root — same at-risk-of-loss problem as `HANDOFF.md`/`INCIDENT-GEN0-PEERS.md`/`DEPLOY.md`,
> all absorbed the same day). Corrected in this pass: the Maven Central nav/code references below said
> `io.github.decentral-america` — the real, verified namespace is `io.decentralchain` (fixed live in
> PR #98 the same day, confirmed against `repo1.maven.org`). §10's Treasury design spec is reframed as
> historical (it's long since built, not "next to build"). §15's GHCR_TOKEN scope item is corrected —
> confirmed good via a real successful `delete:packages` operation, not still an open issue.
>
> **Last updated:** 2026-06-21. **Verified/updated 2026-08-04:** spot-checked against the current
> `apps/admin-dashboard` tree (repo commits through `f4151a7228`). Fixed: the §14 table wrongly marked
> Treasury sweep/fund as "NOT YET BUILT" — both shipped 2026-06-21, same day as this doc's original
> write-up, and were just never reflected in that table. Fixed: "Operations" nav renamed to
> "Integrations" (2026-06-22, file still `Operations.tsx`); Load Test / E2E Test Runner nav bullets
> updated to match §11's already-documented 2026-07-21 move from local child-process spawning to GitHub
> Actions dispatch; `dcc_admin` → `admin_testnet` database-name references corrected. Not independently
> verified: whether `real_wallets_2000_details.csv` has since been copied to Newark (§14 row flagged,
> check the server directly).

---

## 1. Product vision

The admin dashboard is the private operations control plane for the DCC blockchain infrastructure. It lives at `testnet-admin.decentralchain.io` and is restricted to `Decentral-America` GitHub org members via OAuth.

The public-facing node owner view (generator earnings, block production, APY) is at `testnet.decentralscan.com/generator?addr=<address>` — that is SEPARATE and already complete. Do not rebuild it.

### Full nav structure (current + planned)

```
testnet-admin.decentralchain.io
│
├── Infrastructure
│   ├── Nodes ← BUILT
│   │   ├── Live peer list (connected / all / suspended / blacklisted tabs)
│   │   ├── Block production leaderboard (last 500 blocks, per generator)
│   │   ├── Chain stats: height, avg block time, active generators, connected peers
│   │   └── Links to scanner /generator page for each address
│   ├── Chain Health ← BUILT
│   │   ├── Height, TPS (last 10 blocks), avg block time (100 blocks), last block TXs
│   │   ├── Block time line chart (last 100 blocks, 15s auto-refresh)
│   │   └── Fork detection: highlights block gaps > 5× target (300s)
│   └── Generator Performance ← BUILT
│       ├── Uptime % (blocks produced / expected based on generating balance share)
│       ├── Skip rate (missed block opportunities)
│       ├── Per-generator earnings trend chart (click row to switch generator)
│       └── Generating balance, reward totals — 500-block sample, 60s auto-refresh
│
├── Testing
│   ├── Load Test ← BUILT (REVISED 2026-07-21 — dispatched to GitHub Actions, not local spawn; see §11)
│   │   ├── Config: target node, workers, TPS, duration, chain ID, sender count
│   │   ├── No seed phrase required to start a run — dispatched `stress-test.yml` sources its own
│   │   │     signer from `secrets.GEN_0_SEED_PHRASE` on the ephemeral runner; the seed is only used
│   │   │     here for the optional Treasury auto-fund/sweep convenience
│   │   ├── Treasury integration: Auto-fund N wallets before test (MassTransfer)
│   │   ├── Treasury integration: Auto-sweep wallets after test completes (server-side)
│   │   ├── Start → dispatches `infra/.github/workflows/stress-test.yml` via `workflow_dispatch`,
│   │   │     polls run status (ETag-conditional), downloads JSONL results artifact on completion
│   │   ├── Coarse status (queued/running/done) + link to the GitHub Actions run — no live-scrolling
│   │   │     log or live TPS chart (GitHub's API doesn't expose live logs for in-progress runs)
│   │   ├── Final summary rendered in one shot once the run completes
│   │   └── Run auto-persisted to PostgreSQL `admin_testnet.load_test_runs`
│   ├── Stress History ← BUILT
│   │   ├── Reads from PostgreSQL — survives container redeploys
│   │   ├── TPS trend chart across last 50 runs
│   │   ├── Table: when, target node, workers, target TPS, avg TPS, sent, errors, user
│   │   └── Delete individual runs
│   └── E2E Test Runner ← BUILT (REVISED 2026-07-21 — dispatched to GitHub Actions, not local spawn; see §11)
│       ├── Suite picker: Smoke (30s, 3 specs) or Full (8min, 162 tests)
│       ├── Dispatches `infra/.github/workflows/admin-e2e.yml`, polls, downloads vitest JSON results
│       ├── No child process spawned in this container; no seed phrase required
│       ├── Parsed pass/fail tree by spec file with per-test durations (from the fetched artifact)
│       └── Raw log tab with ANSI-aware coloring
│
├── Treasury ← BUILT
│   ├── Wallets tab
│   │   ├── SSE-streamed scan — results appear incrementally (no 8s block)
│   │   ├── Columns: address, available, generating, status (funded/dust/error)
│   │   └── Filter: show funded only / show all
│   └── Sweep tab (recovery tool)
│       ├── Destination address input (or auto-derive from seed server-side)
│       ├── SSE-streamed sweep — EventEmitter-based, in-process
│       ├── Progress bar: wallets processed, DCC recovered, errors
│       └── Sweep auto-triggered from Load Test when "Auto-sweep" checkbox checked
│
└── Integrations ← BUILT (renamed from "Operations" 2026-06-22; page file is still `Operations.tsx`)
    ├── Grafana — iframe embed (set GRAFANA_URL env var to activate)
    ├── Sentry — recent unresolved issues (requires SENTRY_AUTH_TOKEN in env)
    ├── Codecov — coverage % bar across all 4 repos (public API)
    ├── NPM — @decentralchain/* latest published versions (public registry)
    ├── Maven Central — io.decentralchain artifacts (proxied server-side; search.maven.org's own
    │     solrsearch index is stale for this namespace, so the backend queries central.sonatype.com's
    │     mirror instead — see api.maven.artifacts.ts)
    └── NX Cloud cache card (restored 2026-06-22); CI Runs card lives under CI/CD Status instead, not here
```

---

## 2. Repositories

| Repo | Local path | Remote |
|---|---|---|
| DecentralChain monorepo | `Ecosystem/DecentralChain/` (= `Ecosystem/decentralchain/` on macOS) | `github.com/Decentral-America/DecentralChain` |
| Infrastructure | `Ecosystem/infra/` | `github.com/Decentral-America/infra` |
| DCC Node | `Ecosystem/node-scala/` | `github.com/Decentral-America/node-scala` |
| Matcher | `Ecosystem/matcher/` | `github.com/Decentral-America/matcher` |
| dcc-mass-transfer | `Ecosystem/dcc-mass-transfer/` | archived (read-only) — DO NOT DELETE LOCAL COPY |

---

## 3. Live infrastructure (testnet)

### Services and URLs
| Service | URL | Port on Newark | Notes |
|---|---|---|---|
| Admin dashboard | `testnet-admin.decentralchain.io` | 3001 | Private — GitHub OAuth |
| Block explorer | `testnet.decentralscan.com` | 3000 | Public |
| DCC node REST API | `testnet-node.decentralchain.io` | 6869 | Public |
| DCC node P2P | — | 6868 | P2P protocol |
| Data service | `testnet-data-service.decentralchain.io` | 8080 | Public |
| WebSocket API | `testnet-ws.decentralchain.io` | 8081 | Public |
| Matcher REST | `testnet-matcher.decentralchain.io` | 6886 | Public |

Caddy sits in front of all of these on Newark, handles TLS via Let's Encrypt.

### Servers
**Newark (primary)**: `66.228.55.154`
- Runs: DCC main node, Caddy, scanner, admin-dashboard, matcher, data-service, websocket-api, blockchain-postgres-sync, Redis, PostgreSQL
- SSH: `ssh -i /Users/jourlez/Documents/Code/Blockchain/deploy_key_testnet deploy@66.228.55.154`
- Secrets file: `/opt/dcc/secrets/testnet.env`
- Compose files: `/opt/dcc/compose/*.yml`
- Caddy config: `/opt/dcc/caddy/Caddyfile` (generated — never edit manually)

**LKE Frankfurt cluster**: `139.162.152.128`
- Runs: gen-0 (:6863), gen-1 (:6864), val-0 (:6865), metrics-exporter
- Managed by: FluxCD GitOps (push to infra → reconcile in 5 min)
- Cluster ID: 615553

### Node addresses and balances
| Var name | Address | Balance | Role |
|---|---|---|---|
| `MAIN_NODE_WALLET_SEED` | `31RPEKcz71a3hdxt8z7qLhTpRMuRV2kUyr6` | 50,001,056 DCC | Provider/API node, Newark |
| `GEN0_NODE_WALLET_SEED` | `31PmKNdHAU5sZbtg8TrzKh8WfE7E8xBc9WD` | 35M DCC | Generator 0, Frankfurt |
| `GEN1_NODE_WALLET_SEED` | `31dLhqhGoGVhtkf5msWFmgZn1ErrVR6b9qV` | 15M DCC | Generator 1, Frankfurt |
| `VAL0_NODE_WALLET_SEED` | — | 0 DCC | Validator 0, Frankfurt |

### Known infrastructure issue (2026-06-22)
LKE nodes (gen-0, gen-1, val-0) are **running** (`kubectl get pods -n dcc` shows `1/1 Running`) but P2P connections to Newark dropped. Dashboard shows 0 connected peers and only MAIN_NODE generating blocks.

gen-0 showed `Accepted handshake` at 01:13 UTC — reconnection in progress.

**To check**: `KUBECONFIG=/tmp/testnet-kubeconfig.yaml kubectl logs dcc-gen-0-0 -n dcc --tail=50`
**To get kubeconfig**: trigger `export-kubeconfig.yml` workflow in infra repo, download artifact, decrypt with `DCC_TRANSPORT_KEY` from KeeWeb.
**If still no peers after 1h**: check `/opt/dcc/config/node-testnet/dcc.conf` known-peers setting on each LKE node.

---

## 4. Admin dashboard — complete file map

```
DecentralChain/apps/admin-dashboard/
│
├── biome.json               ← local biome config (extends root, CSS linting off for Tailwind v4)
├── Dockerfile               ← multi-stage build: node:24-alpine + wasm build + prod deploy
├── package.json             ← name: admin-dashboard, deps include pino, jose, recharts
├── react-router.config.ts   ← SSR: true, all v8 future flags enabled
├── tsconfig.json            ← strict, verbatimModuleSyntax, paths: @/ → src/
├── vite.config.ts           ← reactRouterTypesResolver plugin (strips leading / from relFromSrc)
│
└── src/
    ├── app.css              ← Tailwind v4 @import "tailwindcss" + theme vars
    ├── entry.client.tsx     ← HydratedRouter, StrictMode
    ├── entry.server.tsx     ← SSR handler, pino startup warnings, security headers
    ├── root.tsx             ← root loader: JWT verify → pass {user, nodeUrl, scannerUrl}
    ├── routes.ts            ← all routes: healthz, robots.txt, login, oauth, layout+pages, load-test-stream
    ├── Layout.tsx           ← sidebar nav (Nodes/Load Test/Treasury), user email, sign out link
    │
    ├── components/
    │   ├── ThemeProvider.tsx        ← next-themes wrapper with children?: React.ReactNode fix
    │   └── ui/                      ← shadcn components: badge, button, card, input, skeleton, table, tabs, toast*
    │
    ├── lib/
    │   ├── auth.ts          ← signToken(username), verifyToken, getTokenFromRequest, makeSessionCookie
    │   │                       SESSION_DURATION=8h, Secure flag in production, SameSite=Lax
    │   ├── api.ts           ← fetchHeight, fetchNodeStatus, fetchConnectedPeers, fetchAllPeers,
    │   │                       fetchSuspendedPeers, fetchBlacklistedPeers, fetchBlockHeadersSeq,
    │   │                       fetchBlockHeadersSeqPaginated (100-block pages, Promise.allSettled),
    │   │                       fetchBalanceDetails, fetchRewards — all with AbortSignal.timeout(10_000)
    │   ├── db.ts            ← postgres.js singleton connecting to admin_testnet database
    │   │                       (renamed from dcc_admin 2026-06-22; env var override
    │   │                       `ADMIN_DASHBOARD_PG_DATABASE`),
    │   │                       migrateSchema() (CREATE TABLE IF NOT EXISTS load_test_runs),
    │   │                       called once from entry.server.tsx on startup
    │   ├── logger.ts        ← pino({ name: 'admin-dashboard', level: process.env.LOG_LEVEL ?? 'info' })
    │   ├── query-client.ts  ← TanStack Query singleton
    │   ├── utils.ts         ← cn() (clsx + tailwind-merge)
    │   └── wallets.ts       ← readWalletCsv(), scanBalances() (batched 50/req, AbortSignal),
    │                           isFunded(), sweepAmount(), TRANSFER_FEE constants
    │
    ├── pages/
    │   ├── Login.tsx             ← "Sign in with GitHub" button → /api/auth/github, error states
    │   ├── Nodes.tsx             ← SSR loader: peers + block headers + balance fetches in parallel
    │   │                            Peer tabs (4), block production leaderboard, stat cards
    │   ├── ChainHealth.tsx       ← client-side: height/TPS/avg block time stat cards,
    │   │                            block time line chart, fork detection (15s auto-refresh)
    │   ├── GeneratorPerformance.tsx ← uptime%, skip rate, rewards trend chart, 500-block sample
    │   ├── LoadTest.tsx          ← config form, auto-fund/auto-sweep checkboxes,
    │   │                            POST start → SSE stream → recharts, final summary
    │   ├── StressHistory.tsx     ← reads from PostgreSQL, TPS trend chart, run table + delete
    │   ├── E2ERunner.tsx         ← suite picker (smoke/full), SSE log stream,
    │   │                            parsed pass/fail tree, raw log tab
    │   ├── Treasury.tsx          ← Wallets tab (SSE-streamed scan), Sweep tab (SSE progress)
    │   └── Operations.tsx        ← Grafana iframe, Sentry issues, Codecov bars, NPM versions,
    │                                Maven Central artifacts
    │
    └── routes/
        ├── healthz.ts                      ← GET /healthz → "ok" (no auth)
        ├── robots.txt.ts                   ← GET /robots.txt → Disallow: /
        ├── api.auth.github.ts              ← GET /api/auth/github → redirect to GitHub OAuth
        ├── api.auth.github.callback.ts     ← GET callback: exchange code → verify org → JWT
        ├── api.auth.logout.ts              ← POST /api/auth/logout → clear cookie → /login
        ├── api.load-test.stream.ts         ← GET/POST dispatches stress-test.yml (see §11);
        │                                      auto-persists final result to admin_testnet.load_test_runs
        ├── api.load-test.history.ts        ← GET (last 50 runs from PG) + POST save/delete
        ├── api.treasury.scan.ts            ← GET SSE: streams 2000 wallet balances incrementally
        │                                      (batch 50 at a time, progress events between batches)
        ├── api.treasury.stream.ts          ← GET SSE + POST start sweep; accepts senderAddress
        │                                      OR senderSeed (server derives address securely)
        ├── api.treasury.fund.ts            ← POST: MassTransfer from sender to N wallets
        │                                      (called by Load Test auto-fund checkbox)
        └── api.e2e.stream.ts               ← GET SSE + POST start/stop; spawns vitest as
                                               child process (same SSE pattern as load-tester)
```

---

## 5. Auth flow (end to end)

```
User visits testnet-admin.decentralchain.io
  → root.tsx loader runs server-side
  → getTokenFromRequest(request) extracts admin_token cookie
  → if no token: throw redirect('/login')
  → verifyToken(token): jwtVerify with getSecret() → { username }
  → if invalid: throw redirect('/login')

User clicks "Sign in with GitHub" on /login
  → GET /api/auth/github
  → redirects to: https://github.com/login/oauth/authorize
      ?client_id=$OAUTH_CLIENT_ID
      &redirect_uri=https://testnet-admin.decentralchain.io/api/auth/github/callback
      &scope=read:org

GitHub redirects back to /api/auth/github/callback?code=...
  → POST https://github.com/login/oauth/access_token (exchange code)
  → GET https://api.github.com/user (get login username)
  → GET https://api.github.com/orgs/Decentral-America/members/{username}
      → 204 = member → proceed
      → non-204 = not a member → redirect /login?error=not_a_member
  → signToken(username) → HS256 JWT { username, role: 'admin', exp: +8h }
  → makeSessionCookie(token) → HttpOnly; SameSite=Lax; Secure (prod only); Max-Age=28800
  → redirect('/')

All subsequent requests: cookie verified on every page load server-side
User email shown in sidebar bottom-left, signed in as GitHub username
Sign out: POST /api/auth/logout → clearSessionCookie() → redirect('/login')
```

---

## 6. Load test flow (end to end)

```
User fills form: target node URL, workers, TPS, duration, chain ID, sender count, seed phrase
User clicks Start:
  1. POST /api/load-test/stream { intent: 'start', ...params }
     → validateStartParams() (URL format, integer bounds, 12-word seed, single-char chainId)
     → spawn('/opt/dcc/load-tester', ['--json', '--node', ..., '--sender-count', ...], {
          env: { ...process.env, DCC_PRIVATE_KEY: seedPhrase }  ← seed NOT in CLI args
        })
     → store child in runs Map<string, ChildProcess>
     → return { runId }
  2. EventSource('/api/load-test/stream?runId=...')
     → streams child stdout as SSE data: {...json...}\n\n
     → AbortSignal kills child on browser disconnect
     → cleanup: close controller, delete from runs Map (idempotent with cleaned flag)
  3. Child process emits every 1 second during each phase:
     { event: 'tick', phase, elapsed_s, tps, total_sent, errors, p50_ms, p95_ms, p99_ms, p999_ms, max_ms }
  4. After each phase:
     { event: 'phase_end', phase, ...same fields }
     (MetricsCollector.reset() called between phases — each phase shows its own stats)
  5. After sustained phase (last):
     { event: 'final', ...sustained phase stats }
     (reset() NOT called after final phase — final report reads real data)
User clicks Stop:
  → POST /api/load-test/stream { intent: 'stop', runId }
  → child.kill('SIGTERM')
```

---

## 7. Secrets — complete inventory

> **Known overlap, not yet reconciled (2026-08-13):** this section covers similar ground to
> `infra/README.md`'s "Master secrets inventory" and `infra/DEPLOY.md`'s Sections A/C/D. All three
> were written independently and may have drifted — treat this section as admin-dashboard-specific
> detail, not the sole source of truth for secret status across the ecosystem.

All secrets are in `infra/secrets/testnet.env` (SOPS-encrypted with age).

**To edit**:
```bash
cd Ecosystem/infra
SOPS_AGE_KEY=<AGE_SECRET_KEY from KeeWeb> sops secrets/testnet.env
# Edit in $EDITOR (decrypted), save → auto re-encrypts
git add secrets/testnet.env
git commit -m "..."
git push origin main
# Then trigger push-secrets.yml workflow
```

**Current keys in testnet.env** (18 total):
```
MAIN_NODE_WALLET_SEED       ← Newark node wallet (50M DCC), base58
MAIN_NODE_WALLET_PASSWORD   ← Newark node wallet encryption password
POSTGRES_PASSWORD           ← PostgreSQL dcc user password
MATCHER_ACCOUNT_PASSWORD    ← Matcher account.dat AES encryption password
MATCHER_SEED                ← Matcher wallet mnemonic (15 words)
MATCHER_API_KEY_HASH        ← Base58(keccak256(blake2b256(api_key))) for matcher local.conf
GEN0_NODE_WALLET_SEED       ← Frankfurt gen-0 wallet (35M DCC)
GEN1_NODE_WALLET_SEED       ← Frankfurt gen-1 wallet (15M DCC)
GEN0_NODE_REST_API_KEY      ← gen-0 REST API key (plaintext, hashed in config)
GEN1_NODE_REST_API_KEY      ← gen-1 REST API key
VAL0_NODE_REST_API_KEY      ← val-0 REST API key
VAL0_NODE_WALLET_SEED       ← val-0 wallet (0 DCC)
MAIN_NODE_REST_API_KEY      ← Newark REST API key — used by Caddy for /peers/* (value in KeeWeb)
ADMIN_DASHBOARD_GITHUB_OAUTH_CLIENT_ID     ← (value in KeeWeb)
ADMIN_DASHBOARD_GITHUB_OAUTH_CLIENT_SECRET ← (value in KeeWeb)
ADMIN_DASHBOARD_JWT_SECRET                 ← 64-char hex (generated 2026-06-22; value in KeeWeb)
TREASURY_SEED                              ← dedicated treasury wallet, added 2026-08-13; server-side
                                              fallback for Load Test auto-fund/sweep when the UI field
                                              is left blank (value in KeeWeb entry #27)
```

**push-secrets.yml writes these to `/opt/dcc/secrets/testnet.env` on Newark**:
```
PGPASSWORD, POSTGRES__PASSWORD   ← for psql and BPS
DCC_WALLET_SEED, DCC_WALLET_PASSWORD  ← for node-scala container
REDIS_PASSWORD, REPO__PASSWORD, REDIS_URL
MAIN_NODE_REST_API_KEY           ← for Caddy X-API-Key injection
DEFAULT_MATCHER                  ← fetched from matcher API
ADMIN_DASHBOARD_GITHUB_OAUTH_CLIENT_ID, _SECRET, _JWT_SECRET
GITHUB_ADMIN_PAT                 ← for CI/CD status page (Actions:Read)
GRAFANA_URL                      ← if in SOPS
SENTRY_AUTH_TOKEN                ← if in SOPS (NOT the GitHub org secret)
```

**Important**: `SENTRY_AUTH_TOKEN` in the GitHub org secret is for CI source-map uploads only.
The admin dashboard server needs a SEPARATE Sentry token in SOPS (read-only issues API access).

**SOPS age keys** (per-network, in GitHub environment secrets):
- `AGE_KEY_TESTNET` = (SOPS master key — value in KeeWeb, never store inline)
- `AGE_KEY_STAGENET` = (different key, not yet needed)
- `AGE_KEY_MAINNET` = (different key, mainnet not yet provisioned)

---

## 8. Secret naming convention

**Rule**: `{ROLE}{N?}_NODE_{TYPE}` for node secrets, `ADMIN_DASHBOARD_{KEY}` for dashboard secrets.

| Prefix | Role | Numbered? |
|---|---|---|
| `MAIN_NODE_` | Provider/API node (Newark) | No — singular |
| `GEN0_NODE_`, `GEN1_NODE_` | Generators | Yes — multiple exist |
| `VAL0_NODE_` | Validators | Yes — multiple exist |
| `MATCHER_` | DEX matcher service | No — singular per network |
| `ADMIN_DASHBOARD_` | Admin dashboard app | No — singular per network |

**Why no number on MAIN_NODE**: There is exactly one provider/infrastructure node per network. If redundancy is added later it goes behind a load balancer with the same DNS name, so credentials are shared.

**All env vars are network-safe**: `secrets/testnet.env` has testnet values, `secrets/mainnet.env` will have different values for the same keys. No network prefix in the key name — the file provides the namespace.

---

## 9. Deploy flow

### Admin dashboard
```bash
# In DecentralChain repo:
git add .
git commit -m "feat(admin-dashboard): ..."
git push origin main
git tag admin-dashboard/v1.x.x
git push origin admin-dashboard/v1.x.x
# → GitHub Actions: lint → typecheck → build Docker → Trivy scan → deploy to Newark
# Takes ~10 min

# If Caddy config changed:
gh workflow run update-caddy.yml --repo Decentral-America/infra --field network=testnet
```

### Secrets change
```bash
# 1. Edit SOPS
cd Ecosystem/infra
SOPS_AGE_KEY=<key> sops secrets/testnet.env
# 2. Commit infra
git add secrets/testnet.env && git commit -m "..." && git push origin main
# 3. Push to server
gh workflow run push-secrets.yml \
  --repo Decentral-America/infra \
  --field network=testnet \
  --field server_ip=66.228.55.154
```

### Infra change (Caddy, compose, etc.)
```bash
cd Ecosystem/infra
git add . && git commit -m "..." && git push origin main
gh workflow run update-caddy.yml --repo Decentral-America/infra --field network=testnet
```

---

## 10. Design record — Treasury (already built; kept as historical design rationale)

> Originally written as a forward-looking spec ("next to build"). Both sweep and auto-fund shipped
> 2026-06-21 — see §14. Kept here because it explains the *why* behind the implementation (data
> source, batching strategy, SSE pattern) that the actual code in `routes/api.treasury.*.ts` doesn't
> narrate inline.

### Data source — redesigned 2026-08-16, no external file
> The original design (below, kept as historical record) depended on a static CSV of 2000
> pre-generated wallets that had to be manually encrypted and copied to Newark — its presence was
> never independently confirmed across several prior doc passes, and auto-fund/auto-sweep silently
> failed for however long it was actually missing. Real root cause: the CSV was never generated by
> the tool that consumed it, so it could drift, go missing, or be swept incompletely with no way to
> tell which wallets belonged to which fund call.
>
> Fund and sweep are now fully self-contained: `api.treasury.fund.ts` generates fresh wallets
> in-process (`lib/treasuryWallets.ts`, via `@decentralchain/ts-lib-crypto`), persists each one to
> the `treasury_wallets` Postgres table *before* funding it (so a mid-run crash never loses track of
> a generated wallet), and sweep (`api.treasury.stream.ts`) only ever targets rows with
> `swept_at IS NULL` — wallets this app itself generated and funded, nothing external. No file to
> upload, no drift between what was funded and what gets swept back.
>
> Original design, superseded:
> `Ecosystem/dcc-mass-transfer/real_wallets_2000_details.csv` — 2000 pre-generated wallets with
> seeds, format `address,seed,public_key`, stored on Newark at `/opt/dcc/test-wallets.csv`. The
> `Wallets` scan tab (`api.treasury.scan.ts`) still reads an arbitrary CSV via `DCC_WALLET_CSV_PATH`
> for ad-hoc balance scanning of any address list — that's a genuinely separate, still-valid use
> case, not part of the fund/sweep redesign.

### Wallet balance scanning
- For each address in CSV: `GET /addresses/balance/details/{address}` on the DCC node
- Show `generating` balance (what matters for LPoS) and `available` (spendable)
- Dust threshold: ignore wallets with < 1000 wavelets (0.00001 DCC)
- Scan 2000 wallets in parallel using `Promise.allSettled` with batching (50 at a time to avoid node rate limits)

### Sweep implementation
Each funded wallet signs a Transfer TX sending its entire spendable balance (minus TX fee of 100000 wavelets) back to the sender address.

Use the TypeScript SDK: `@decentralchain/transactions` — `transfer()` function.

Pattern from dcc-mass-transfer `sweep_v3.py`:
```python
# Python reference — translate to TypeScript
tx = transactions.mass_transfer(
    transfers=[{'recipient': sender_address, 'amount': balance - fee}],
    senderPublicKey=wallet_public_key,
    fee=100000,
    chainId='!'
)
signed = transactions.sign(tx, wallet_seed)
broadcast(signed)
```

TypeScript equivalent using `@decentralchain/transactions`:
```typescript
import { transfer, signWithPrivateKey } from '@decentralchain/transactions'

const tx = transfer({
  recipient: senderAddress,
  amount: balance - FEE,
  fee: FEE,
  chainId: '!',
  senderPublicKey: walletPublicKey,
})
const signed = signWithPrivateKey(tx, walletSeed)
await fetch(`${nodeUrl}/transactions/broadcast`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(signed),
})
```

### SSE streaming (same pattern as load-tester)
Sweep is a long-running operation (2000 wallets × ~2s each = potentially minutes). Use the same SSE pattern as the load-tester:
- POST `/api/treasury/sweep/start` → returns `{ sweepId }`
- GET `/api/treasury/sweep/stream?sweepId=...` → SSE stream of progress
- Each event: `{ processed: N, total: 2000, recovered_dcc: X, errors: [], status: 'running' | 'done' }`

### Auto-fund on load test
When "Auto-fund wallets" is checked in Load Test config:
1. Before spawning the Rust binary, distribute DCC from sender to N wallets
2. Use `MassTransfer` TX (type 11) — up to 100 recipients per TX, so 2000 wallets = 20 TXs maximum
3. Wait for all funding TXs to confirm (poll `/transactions/info/{id}` or use websocket)
4. Then spawn the load-tester

```typescript
import { massTransfer, signWithPrivateKey } from '@decentralchain/transactions'

// One MassTransfer per 100 wallets
const batches = chunk(wallets, 100)
for (const batch of batches) {
  const tx = massTransfer({
    transfers: batch.map(w => ({ recipient: w.address, amount: amountPerWallet })),
    senderPublicKey: senderPublicKey,
    fee: 100000 + batch.length * 50000,  // base + per-recipient
    chainId: '!',
  })
  const signed = signWithPrivateKey(tx, senderSeed)
  await broadcast(signed)
}
```

---

## 11. Build specs — E2E Test Runner (REVISED — dispatched, not local)

**Superseded design note:** the original plan below (spawn `pnpm`/vitest locally
against a DecentralChain checkout at `E2E_SUITE_PATH` on the VPS) was never
actually deployable that way and was replaced. Research into embedded vs.
dispatched test execution (control-plane/data-plane separation, ephemeral
credentials, OWASP CICD-SEC-4) showed running tests — and holding the funded
test seed — inside this internet-facing container is the wrong architecture.
The load-test runner had the same problem (see §load-tester below) plus
required operators to paste a seed phrase into the browser on every run.

### Actual design: GitHub Actions dispatch + poll + artifact fetch
`/api/e2e/stream` and `/api/load-test/stream` are thin control-plane routes.
They dispatch `infra/.github/workflows/admin-e2e.yml` /
`infra/.github/workflows/stress-test.yml` via `workflow_dispatch`
(`lib/github-actions-runner.ts`), poll run status with conditional requests
(ETag, so unchanged polls don't cost rate limit), and — once GitHub reports
`completed` — download the run's results artifact (vitest's JSON reporter for
E2E; the load-tester's own JSONL tick/final events for stress test) and parse
it structurally. No child process is ever spawned in this container, and
neither route requires or accepts a seed phrase — both CI workflows source
their own signer from `secrets.GEN_0_SEED_PHRASE`, scoped to that ephemeral
runner only.

Because a `workflow_dispatch` call doesn't return a run id synchronously, both
workflows accept a `correlation_id` input and template it into `run-name:`;
the caller locates the resulting run by matching on that name.

**Known limitation, by design, not a bug:** GitHub's API does not expose live
logs for an in-progress run (confirmed via GitHub community discussion + the
`github/roadmap` streaming-logs item, not shipped as of this writing). So
neither UI shows a live-scrolling log or live-updating TPS chart anymore —
they show coarse status (queued/running/done) plus a link to GitHub's own
Actions UI (which *does* stream logs live to a human looking at it), then
render the full structured results in one shot once the run completes.

### Required config
- `ADMIN_DASHBOARD_GITHUB_PAT` — same token already used by `/api/ci-cd/status`
  (read across 4 repos: DecentralChain/infra/node-scala/matcher). It now also
  carries `Actions: Read and write`, which is what dispatches/polls/cancels
  the E2E + stress-test workflows here. No separate token.
- `E2E_SUITE_PATH` / `DCC_LOAD_TESTER_PATH` env vars are dead — nothing reads
  them anymore. Safe to remove from any secrets file that still sets them.

---

## 12. Build specs — Operations integrations

### Grafana
```typescript
// Simple iframe embed — no API needed
// Add GRAFANA_URL env var
<iframe
  src={`${process.env.GRAFANA_URL}/d/testnet?orgId=1&refresh=30s&kiosk`}
  className="w-full h-screen border-0"
/>
```

### Sentry
```typescript
// Sentry API — needs SENTRY_AUTH_TOKEN (already in GitHub secrets, put in testnet.env)
// GET https://sentry.io/api/0/organizations/{org}/issues/?project=dcc-scanner&limit=10
const res = await fetch('https://sentry.io/api/0/organizations/decentral-america/issues/', {
  headers: { Authorization: `Bearer ${process.env.SENTRY_AUTH_TOKEN}` },
})
```

### NPM (public — no auth needed)
```typescript
const packages = ['@decentralchain/transactions', '@decentralchain/ts-lib-crypto', ...]
const versions = await Promise.all(packages.map(pkg =>
  fetch(`https://registry.npmjs.org/${pkg}/latest`).then(r => r.json())
))
// → { name, version, description, publishedAt }
```

### Codecov (public repos = public API)
```typescript
// https://codecov.io/api/v2/github/Decentral-America/repos/{repo}/
fetch('https://codecov.io/api/v2/github/Decentral-America/repos/DecentralChain/')
// → { coverage, lines, hits }
```

### Maven Central (public)
```typescript
// search.maven.org's own Solr index is stale for io.decentralchain (numFound=0 there despite the
// packages being live on repo1.maven.org) -- a known Sonatype Central Portal migration gap.
// central.sonatype.com hosts its own solrsearch mirror with the identical API shape and real data.
fetch('https://central.sonatype.com/solrsearch/select?q=g:io.decentralchain&rows=20&wt=json')
// → list of artifacts with latest version + publish date
```

---

## 13. Patterns to reuse

### SSE streaming (use for sweep + e2e runner)
```typescript
// File: src/routes/api.{feature}.stream.ts
const runs = new Map<string, ChildProcess>() // module-level, single process

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request)  // getTokenFromRequest + verifyToken
  if (!user) return new Response('Unauthorized', { status: 401 })

  const runId = new URL(request.url).searchParams.get('runId')
  const child = runs.get(runId!)
  if (!child) return new Response('Not found', { status: 404 })

  let cleaned = false
  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder()
      const cleanup = () => {
        if (cleaned) return
        cleaned = true
        child.stdout?.off('data', onData)
        try { controller.close() } catch {}
        runs.delete(runId!)
        logger.info({ runId, user }, 'stream closed')
      }
      const onData = (chunk: Buffer) => {
        for (const line of chunk.toString().split('\n')) {
          const t = line.trim()
          if (t) controller.enqueue(enc.encode(`data: ${t}\n\n`))
        }
      }
      child.stdout?.on('data', onData)
      child.once('close', cleanup)
      child.once('error', (err) => { logger.error({ err, runId }, 'process error'); cleanup() })
      request.signal.addEventListener('abort', () => { child.kill('SIGTERM'); cleanup() })
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',  // prevents Caddy/Nginx buffering
    },
  })
}
```

### Auth check in resource routes (not protected by root loader)
```typescript
async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request)
  if (!token) return null
  const payload = await verifyToken(token)
  return payload?.username ?? null
}
```

### Pino structured logging
```typescript
import { logger } from '@/lib/logger'
logger.info({ user, runId, targetNode }, 'Load test started')
logger.warn({ err }, 'CF Access JWT verification failed')
logger.error({ err, runId }, 'Process error')
// All logs are JSON to stdout → collected by Docker json-file driver
```

---

## 14. What dcc-mass-transfer did (do not delete yet)

`Ecosystem/dcc-mass-transfer/` on local disk only (GitHub archived/read-only).

| Script | What it did | Replaced by |
|---|---|---|
| `turbo_transfer.py` | Stress test: blast transactions from funded wallets | ✅ `apps/load-tester` Rust binary |
| `suite/` (158 tests) | E2E blockchain testing | ✅ `packages/e2e-blockchain` (162 tests) |
| `dashboard_backend.py` | Flask admin UI with real-time metrics | ✅ `apps/admin-dashboard` |
| `sweep_v3.py` / `turbo_sweep.py` | Recover DCC from funded test wallets | ✅ BUILT (2026-06-21) — Treasury "Sweep" tab, `api.treasury.stream.ts` (TypeScript, `@decentralchain/transactions`, not a literal Python port) |
| `refill_wallets.py` | Top up test wallets that ran out | ✅ BUILT (2026-06-21) — Treasury "Auto-fund" (`api.treasury.fund.ts`, MassTransfer) |
| `generate_wallets.py` | Create new test wallet sets | ✅ BUILT (2026-08-16) — `lib/treasuryWallets.ts` generates fresh wallets in-process per fund call, no static set needed |
| `real_wallets_2000_details.csv` | 2000 pre-funded test wallets with seeds | ❌ Superseded (2026-08-16) — fund/sweep no longer read any CSV; see §10 |
| `k6/` | Alternative load testing via k6 | ✅ replaced by Rust binary (better) |

---

## 15. Outstanding issues (all of them)

| Issue | Priority | How to fix |
|---|---|---|
| ~~Wallet CSV not on Newark~~ | RESOLVED (2026-08-16) | Fund/sweep no longer depend on a CSV at all — see §10. The `Wallets` scan tab still reads `DCC_WALLET_CSV_PATH` for ad-hoc scans of an arbitrary address list, which is a separate, optional feature. |
| ~~`GHCR_TOKEN` missing `delete:packages` scope~~ | — | **RESOLVED, confirmed 2026-08-02.** Verified behaviorally (GitHub's API never exposes stored-secret scopes directly): the scheduled `ghcr-cleanup.yml` run (30733948843) actually deleted 20 real images from the `node-scala` package with zero 403/permission errors — a delete only succeeds with `delete:packages`, so the PAT is correctly scoped. |
| `SENTRY_AUTH_TOKEN` not in SOPS | MEDIUM | Get token from Sentry → Settings → Auth Tokens. Add `SENTRY_AUTH_TOKEN=<value>` to `infra/secrets/testnet.env` via SOPS then push. The server-side proxy route (`/api/sentry/issues`) is already wired — will activate once the env var is present. |
| `GRAFANA_URL` not set | LOW | Add `GRAFANA_URL=https://grafana.decentralchain.io` to SOPS |
| E2E suite `.env` not configured on Newark | MEDIUM | Clone DecentralChain repo to `/opt/dcc/DecentralChain` on Newark; configure `.env` to point at testnet node |
| Old secret names on server | LOW | SSH in, edit `/opt/dcc/secrets/testnet.env`, remove stale `NODE_WALLET_SEED` lines |
| mainnet/stagenet SOPS rename | LOW | Rename `NODE_` → `MAIN_NODE_` in mainnet.env and stagenet.env when those age keys are available |

---

## 16. Standards and principles

1. **Testnet = Mainnet quality**. No mainnet deploy until testnet runs clean for one full month.
2. **Never nano on the server**. All secrets go through SOPS → commit → push-secrets.yml.
3. **Every commit passes the hook**: lint (biome), typecheck (tsc), cargo checks. Never skip hooks.
4. **Structured logging only**: pino with JSON output. No `console.log` in server code.
5. **No broad suppressions**: `#[allow(...)]` and `biome-ignore` only with a documented reason.
6. **Seed phrase never in CLI args**: pass via env var (`DCC_PRIVATE_KEY`) — hidden from `ps aux`.
7. **Auth on every resource route**: the root loader only protects layout routes. Resource routes (`/api/*`) must check the JWT themselves.
8. **Trivy gate is hard**: if a CVE is genuinely a false positive, document it thoroughly in `.trivyignore`. Do not disable the gate.
9. **Per-environment isolation**: separate GitHub OAuth apps, separate JWT secrets, separate domains for testnet/mainnet/stagenet.
10. **Absolute latest dependencies whenever possible**: use `pnpm update` regularly, apply security patches immediately.
