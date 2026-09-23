# Solana ⇄ DecentralChain Bridge Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the exchange frontend to the already-live Solana ⇄ DecentralChain bridge. The contracts and validators are deployed on mainnet and handle settlement; this app builds two transactions — one Solana deposit, one DecentralChain `burnToken` withdrawal — and reads status. It signs nothing on the user's behalf, holds no keys, and runs no relayer.

**Architecture:** The bridge REST API and Solana chain reads enter as a new `services/bridge/` layer on top of the existing `api/client.ts`, surfaced through TanStack Query hooks. Solana wallet connection lives in its own `SolanaWalletContext`, deliberately separate from `AuthContext` — a user has a DCC identity and, independently, a connected Solana wallet. The deposit path is new code. The withdrawal path is a thin caller of the existing `signInvokeScript` + `TransactionConfirmationFlow` infrastructure. The existing `pages/Bridge` gains Solana as a live network rather than getting a parallel page: `SUPPORTED_NETWORKS` already carries a SOL entry marked `comingSoon`.

**Tech Stack:** React 19, TypeScript, MUI 9 (`sx` styling), TanStack Query 5, Vitest + Testing Library, Biome, Nx, Vite. New: `@solana/web3.js`, `@coral-xyz/anchor`, `@solana/spl-token`, `@solana/wallet-adapter-react` (+ Phantom and Solflare adapters only).

**Source of truth:** `docs/superpowers/specs/2026-08-29-solana-bridge-integration-handoff.md`. Where this plan and the chain disagree, the chain is correct.

## Global Constraints

- **No raw colours outside token files.** `src/theme/__tests__/noRawColours.test.ts` fails the build on any hex, `rgb()`, `hsl()`, `oklch()`, or named CSS colour in `src/` outside its `ALLOWED` list. No file this plan touches is on that list. Solana brand colours belong in `styles/brandMarks.ts` alongside the existing `networkBrandColor` entries.
- **Object literal keys are sorted alphabetically** — Biome enforces this.
- **Never trim trailing zeros from a DCC address.** See Task 4. This is the single most expensive mistake available in this integration.
- **Never hardcode the asset list.** Four assets are disabled on chain because offering them loses user funds. `GET /tokens` reflects that within 30 seconds.
- **Decimals come from `GET /tokens`, per asset.** SOL and JitoSOL are 9 on Solana and 8 on DecentralChain. Everything else is 1:1. Assuming they match is wrong by 10×.
- **Test command:** `pnpm nx test exchange -- --run <path>` (run from repo root).
- **Commits:** conventional, scoped `exchange`, e.g. `feat(exchange): ...`.
- **Branch:** `dev`.

## Known Constraints Accepted For v1

These are real limits, recorded rather than silently worked around:

1. **Withdrawal works only for seed accounts.** `useTransactionSigning.getSeed()` throws for any `user.userType !== 'seed'`. Ledger and Cubensis users cannot call `burnToken`. `VITE_LEDGER_ENABLED=false` in every env file, so no user is currently affected — but this is a boundary, not a completed feature.
2. **Mainnet only.** The bridge contracts exist on mainnet. `.env.development` targets testnet (byte `!`); the bridge needs byte `?`. Task 1 adds a mainnet-pointed local env for verification.
3. **Three registered assets are unusable and must be filtered client-side.** BTC and cbBTC (raw minimum ≈ 0.01 BTC), BONK (raw maximum ≈ 283 tokens). They report as enabled from `GET /tokens`.

## Verified against the IDL — 29 August 2026

The IDL arrived mid-implementation and confirms, rather than contradicts, the
handoff:

- `deposit` — 6 accounts in the stated order; `deposit_spl` — 11, with
  `mint_limits` at index 5
- every PDA seed matches: `bridge_config`, `vault`, `['user_state', sender]`,
  `['deposit', transfer_id]`, `['mint_limits', spl_mint]`, and both ATAs
- `DepositParams` is `recipient_dcc [u8; 32]`, `amount u64`, `transfer_id [u8; 32]`
- `UserState` lays out as discriminator(8) · user(32) · **next_nonce at byte 40**,
  confirming the offset the handoff gives

One thing to note: the program's own docs say transfer ids are a "hash of
sender + nonce + slot". The client does not compute the slot — `transfer_id` is
an argument the client supplies, and `deposit_record` is seeded on it directly.
The handoff's `sha256(sender ++ u64LE(nonce))` is what the program consumes.

---

## Corrections from the live API — 29 August 2026

Captured by calling the mainnet endpoints directly. The handoff says the chain
wins over the document; these are the places it did.

**1. `GET /transfer/:id` never 404s.** For an id it has never seen it answers
`200 {success: true}` with a synthesised record — status `pending_confirmation`,
empty sender and recipient, `amount: "0"`, `sourceTxHash: null`. Nothing in the
response says "unknown". Polled naively, a typo'd or stale id is
indistinguishable from a deposit in flight, so a stranded transfer shows a
progress bar that can never complete. Handled by `isUnknownTransfer` plus a
three-minute grace window in `useTransferStatus` — the grace matters because a
freshly-submitted id *is* legitimately unknown for a while.

**2. The daily cap is one counter shared across every token.** Source
`dcc_contract.max_daily_mint`, 50 SOL raw, accumulated in raw Solana units
across all 17 tokens. A user can be refused a perfectly reasonable deposit
because someone else consumed the budget. "Amount too large" would be a false
explanation; read `limits.daily.remaining` and say so.

**3. The blocklist must match `name`, not a ticker.** The API returns
`"Bitcoin"`, not `"BTC"`. A ticker-shaped blocklist matches nothing and ships
the asset to users. Caught by a test.

**4. `GET /deposit/limits` returns far more than min and max.** It carries
`bridgeStatus`, `estimatedMintTime`, `solanaConfirmations`, `degraded`,
`warnings`, and a `sources` array giving every bound with a `binding` flag and
a plain-English note. The binding limit and its reason should drive the error
message rather than a generic range check.

**5. `divisor` is supplied per token.** No need to derive it from the decimals —
`GET /tokens` gives `solDecimals`, `dccDecimals` and `divisor` (10 for SOL and
JitoSOL, 1 for the rest). Still convert per asset; just do not recompute.

**6. One validator is active, not three.** `/stats` reports
`activeValidators: 1` and a transfer needs `requiredSignatures: 1`. The handoff
describes three validators watching both chains. Not a frontend problem, but it
is a single point of failure behind every settlement this UI will display.

**7. `/stats` exposes `bridgePaused`.** Check it before enabling submit —
currently `false`.

---

## Production readiness — what deploying actually needs

Established by reading `.github/workflows/deploy-exchange.yml` and testing the
live API, not by assumption.

**1. `https://decentral.exchange` is not on the bridge API's allowlist.**
Verified by preflight: `app.decentralswap.com` and `bridge.decentralswap.com`
are allowed, `decentral.exchange` is refused. That is *this* app's production
origin — `origin` in `configs/mainnet.json`. The three currently allowlisted
origins all belong to the other bridge front end. Until this is added, the
bridge page fails in production exactly as it did on localhost. The dev proxy
hides this locally, so nothing will warn you first.

**2. `VITE_SOLANA_RPC_URL` is not set in CI**, and `.env.production` leaves it
empty. It needs to be a repository secret, referenced in the build step's `env`
block alongside `SENTRY_AUTH_TOKEN`. The value must be a domain-restricted
Helius key — the browser bundle publishes it.

**3. The env guard is a Vite plugin, not an npm script.** CI runs
`vite build --mode <mode>` directly and never invokes the `build` script, so a
guard living there would not run on the builds that reach users. As a plugin it
runs on every build regardless of entry point. Verified: `vite build --mode
production` exits 1 while the value is unset, and 0 once supplied.

**4. Production serves no CSP.** Deployment is Cloudflare Pages, whose headers
come from `public/_headers`, and that file sets no `Content-Security-Policy`.
The `connect-src` entries added to `nginx.conf` and `docker/nginx/default.conf`
apply only to the Docker/nginx path, not to the Cloudflare deploy. Nothing is
broken by this — absent CSP blocks nothing — but adding a CSP to `_headers`
later will need the bridge and RPC hosts, or it will break the bridge page.

---

## Prerequisites — external, blocking

- [ ] `http://localhost:5173` added to `ALLOWED_ORIGINS` on the API service. Gate: `GET /stats` returns JSON from the dev origin.
- [ ] Helius key rotated, and the new key domain-restricted in the Helius dashboard.
- [x] `target/idl/sol_bridge_lock.json` supplied and committed to `src/services/bridge/idl/`. Without it, instruction data is hand-encoded — the exact conditions that produce trap 02.

---

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `src/config/bridge.ts` | Create — on-chain constants, plainly public | 1 |
| `src/config/__tests__/bridge.test.ts` | Create — required-env assertions | 1 |
| `.env.mainnet-local` | Create — mainnet-pointed local dev env | 1 |
| `src/services/bridge/api.ts` | Create — the four REST endpoints | 2 |
| `src/services/bridge/types.ts` | Create — token, limits, transfer, stats shapes | 2 |
| `src/hooks/useBridgeTokens.ts` | Create — asset list, filtered | 2 |
| `src/hooks/useDepositLimits.ts` | Create — per-asset min/max | 2 |
| `src/hooks/useTransferStatus.ts` | Create — settlement polling | 2 |
| `src/services/bridge/decimals.ts` | Create — per-asset conversion | 3 |
| `src/services/bridge/__tests__/decimals.test.ts` | Create — the 9→8 cases | 3 |
| `src/pages/Bridge/Bridge.tsx` | Modify — SOL live, assets from API | 3 |
| `src/contexts/SolanaWalletContext.tsx` | Create — Phantom + Solflare | 4 |
| `vite.config.ts` | Modify — Buffer polyfill | 4 |
| `src/services/bridge/address.ts` | Create — `dccAddressToBytes32` | 5 |
| `src/services/bridge/__tests__/address.test.ts` | Create — the 0x00 checksum case | 5 |
| `src/services/bridge/transferId.ts` | Create — nonce read + sha256 | 5 |
| `src/services/bridge/pda.ts` | Create — all PDA seeds | 5 |
| `src/services/bridge/deposit.ts` | Create — native SOL, then SPL | 6, 7 |
| `src/services/bridge/__tests__/deposit.test.ts` | Create — account order and count | 6, 7 |
| `src/features/bridge/SolanaDeposit.tsx` | Create — deposit UI | 6 |
| `src/features/bridge/SolanaWithdraw.tsx` | Create — `burnToken` UI | 8 |
| `src/features/bridge/TransferProgress.tsx` | Create — staged settlement display | 9 |

---

## Task 1: Constants and a mainnet-pointed dev env

- [x] `src/config/bridge.ts` exporting `SOLANA_PROGRAM_ID`, `BRIDGE_CONFIG_PDA`, `NATIVE_VAULT_PDA`, `DCC_BRIDGE_CONTRACT`, `DCC_NODE_URL`, `DCC_CHAIN_ID_CHAR`, `API_BASE` as plain consts. These are on-chain addresses; anyone can read them off the blockchain. A constants file is more honest than env vars that imply secrecy.
- [x] `VITE_SOLANA_RPC_URL` read from env — the one value that is not a constant.
- [x] A required-env guard that **throws at module load** when `VITE_SOLANA_RPC_URL` is absent. Vite inlines `import.meta.env` at build time; a missing value silently falls back to whatever the source default is. On the reference app that default was `http://127.0.0.1:8899`, compiled into the public bundle, and every deposit failed for months. Fail loudly instead.
- [x] `.env.mainnet-local` — mainnet node, byte `?`, so the bridge is reachable in local dev.

**Verification:** `pnpm dev --mode mainnet-local` starts; removing `VITE_SOLANA_RPC_URL` fails the build rather than shipping a fallback.

## Task 2: The REST layer

- [x] `services/bridge/api.ts` over the existing `api/client.ts` (reuse its `HttpError` and logger): `getTokens`, `getDepositLimits(splMint)`, `getTransfer(transferId)`, `getStats`. No authentication on any of them.
- [x] Query hooks with sensible staleness — the token list changes rarely, transfer status needs polling.

**Verification:** `GET /stats` renders in the app from the dev origin. If this fails with an opaque CORS error, the prerequisite above is not done.

## Task 3: The asset picker

- [x] Source assets from `GET /tokens`. Delete the hardcoded list.
- [x] Flip the existing SOL entry in `SUPPORTED_NETWORKS` to `available: true`.
- [x] Filter BTC, cbBTC, BONK client-side — they report enabled but fail on chain.
- [x] `decimals.ts`: convert between Solana and wrapped decimals per asset, taking both from the API. Tests cover SOL and JitoSOL (9→8, divisor of 10) and a 1:1 asset.

**Verification:** the picker shows exactly the ten round-tripped assets, with balances that match a block explorer.

## Task 4: Solana wallet connection

- [x] `@solana/wallet-adapter-react` with Phantom and Solflare adapters only.
- [x] `SolanaWalletContext`, separate from `AuthContext`. DCC auth is untouched.
- [x] Buffer polyfill in `vite.config.ts` — there is none today and the Solana libraries require it.

**Verification:** connect Phantom, read a SOL balance.

## Task 5: The three dangerous helpers — tests before any UI

> **Done.** 45 tests across `address`, `transferId` and `pda`. The PDA suite
> derives `bridge_config` and `vault` from seeds and asserts they equal the
> published addresses — so the seed strings are checked against the live
> program rather than trusted. Both matched, at bumps 255 and 254.

**`dccAddressToBytes32`.** A DecentralChain address is version(1) · chainId(1) · hash(20) · checksum(4) = 26 bytes, right-padded with zeros into a 32-byte field. The obvious implementation trims trailing zeros to recover it, which eats a checksum byte that is legitimately `0x00`. Signature verification still passes, the failure lands inside the contract, the mint reverts, and the deposit is locked with no automatic recovery. Roughly 1 deposit in 256.

- [x] Fixed-width slice: `Buffer.alloc(32)`, copy bytes 0..26. Never trim.
- [x] A test using an address whose final checksum byte is `0x00`.

**`deriveTransferId`.** Read the nonce from the user's `UserState` account at byte offset 40 (little-endian u64). The account may not exist — nonce is then 0. Then `sha256(senderPubkey ++ u64LE(nonce))`.

- [x] Test the missing-account path explicitly.

**`pda.ts`.** All seeds: `bridge_config`, `user_state`, `deposit`, `vault`, `mint_limits`, plus the two ATAs — vault with `allowOwnerOffCurve: true`.

## Task 6: Native SOL deposit

> **Done, unverified on chain.** Instruction data is encoded by Anchor from the
> IDL rather than by hand. The test asserts the built account list against the
> IDL's own declaration — order, signer and writable flags — so an upstream
> reorder fails the suite instead of the mint.

- [x] Six accounts, no token program: `bridge_config`, `user_state`, `deposit_record`, `vault`, `sender` (signer), `system_program`.
- [x] Assert the account count in a test.

**Verification:** one real small deposit on mainnet, watched through to mint. Approximately 30 seconds.

## Task 7: SPL deposit

> **Done, unverified on chain.** Same IDL-derived assertion, plus a case
> pinning `mint_limits` at index 5 and the count at 11.

- [ ] Eleven accounts. **`mint_limits` sits at index 5**, inserted between `spl_mint` and `sender_token_account` — not appended. Omitting it shifts every subsequent account by one and produces `AccountOwnedByWrongProgram (3007)`, which reads like a wrong-address bug.
- [x] A test that pins both the count and `mint_limits`' index, so a future reorder fails loudly rather than at runtime.

**Verification:** one real USDC deposit.

## Task 8: Withdrawal

> **Logic done, UI pending.** `services/bridge/withdraw.ts` + `useBridgeWithdraw`,
> 13 tests. The form that calls it is still to build. Note the v1 boundary:
> `getSeed()` throws for any non-seed account, so Ledger and Cubensis users
> cannot withdraw.

- [x] `burnToken` on `3DhoNpsnwnv4kgnQbjzYxL9MsSo2bQ4qvLH` through the existing `signInvokeScript`, which already injects `chainId` from `networkByte`. Args: base58 Solana recipient, then the SPL mint. Payment: the wrapped `assetId` from `GET /tokens`, raw amount. Fee 900000.
- [x] Route through the existing `TransactionConfirmationFlow`, which already handles the `invokeScript` case.
- [x] Pre-flight: the user needs ≥ 0.009 DCC or the burn will not broadcast. Check and surface it before the wallet prompt.
- [x] Show the 0.25% withdrawal fee, deducted from the amount, before the user commits.
- [x] Solana address validation in the existing `AddressInput`.

**Verification:** a small withdrawal that arrives on Solana.

## Task 9: Settlement status

- [x] Poll `GET /transfer/:transferId`.
- [x] Persist pending transfers to localStorage so a page refresh does not orphan one.
- [x] Withdrawals take minutes — validators gather attestations across several Solana transactions. Show staged progress, not a spinner that looks stuck.

---

## Before going live

A real round trip with a small amount, in both directions, from the finished UI. Every serious bug on this bridge was found by moving actual funds — none by reading code.
