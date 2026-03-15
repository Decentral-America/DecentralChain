# DecentralChain ↔ Waves — Comprehensive Comparison

> Upstream sync status, ecosystem architecture, feature parity, dependency gaps, wire-format constraints, and remediation analysis for all 25 DecentralChain packages against their Waves equivalents.
>
> **Last updated:** 2026-03-09

---

## Quick Links

- [Chronological History](./DOCS_CHRONOLOGICAL.md) — Resolved issues, open issues, and changelog for every repo
- Migration Prompts: [0-MIGRATE](../DecentralChain/0-MIGRATE.md) · [1-BULLETPROOF](../DecentralChain/1-BULLETPROOF.md) · [2-MODERNIZE](../DecentralChain/2-MODERNIZE.md) · [3-AUDIT](../DecentralChain/3-AUDIT.md)
- Optional: [Biome Migration](../DecentralChain/OPT1-MIGRATE-TO-BIOME.md)

---

## Package Map

Every `@decentralchain/*` package with its upstream Waves equivalent, GitHub repos, sync status, and dependency layer.

| # | Package | npm | Version | DecentralChain | Waves Upstream | Commits (DCC / Waves) | Grafted | Synced | Doc | Layer |
|---|---------|-----|---------|----------------|----------------|----------------------|---------|--------|-----|-------|
| 1 | ts-types | `@decentralchain/ts-types` | 2.0.0 | [DCC](https://github.com/Decentral-America/ts-types) | [Waves](https://github.com/wavesplatform/ts-types) | 127 / 111 | 🔗 | ✅ | [doc](./ts-types.md) | Foundation |
| 2 | bignumber | `@decentralchain/bignumber` | 1.1.1 | [DCC](https://github.com/Decentral-America/bignumber) | [Waves](https://github.com/wavesplatform/bignumber) | 56 / 33 | — | ✅ | [doc](./bignumber.md) | Foundation |
| 3 | ts-lib-crypto | `@decentralchain/ts-lib-crypto` | 2.0.0 | [DCC](https://github.com/Decentral-America/ts-lib-crypto) | [Waves](https://github.com/wavesplatform/ts-lib-crypto) | 192 / 158 | 🔗 | ✅ | [doc](./ts-lib-crypto.md) | Foundation |
| 4 | parse-json-bignumber | `@decentralchain/parse-json-bignumber` | 2.0.0 | [DCC](https://github.com/Decentral-America/parse-json-bignumber) | [Waves](https://github.com/wavesplatform/parse-json-bignumber) | 51 / 34 | 🔗 | ✅ | [doc](./parse-json-bignumber.md) | Foundation |
| 5 | marshall | `@decentralchain/marshall` | 1.0.0 | [DCC](https://github.com/Decentral-America/marshall) | [Waves](https://github.com/wavesplatform/marshall) | 127 / 98 | — | ✅ | [doc](./marshall.md) | Serialization |
| 6 | protobuf-serialization | `@decentralchain/protobuf-serialization` | 2.0.0 | [DCC](https://github.com/Decentral-America/protobuf-serialization) | [Waves](https://github.com/wavesplatform/protobuf-schemas) | 171 / 136 | — | ✅ | [doc](./protobuf-serialization.md) | Serialization |
| 7 | data-entities | `@decentralchain/data-entities` | 3.0.0 | [DCC](https://github.com/Decentral-America/data-entities) | [Waves](https://github.com/wavesplatform/waves-data-entities) | 130 / 113 | — | ✅ | [doc](./data-entities.md) | Domain Model |
| 8 | assets-pairs-order | `@decentralchain/assets-pairs-order` | 5.0.1 | [DCC](https://github.com/Decentral-America/assets-pairs-order) | [Waves](https://github.com/wavesplatform/assets-pairs-order) | 85 / 63 | — | ✅ | [doc](./assets-pairs-order.md) | Domain Model |
| 9 | oracle-data | `@decentralchain/oracle-data` | 1.0.0 | [DCC](https://github.com/Decentral-America/oracle-data) | [Waves](https://github.com/wavesplatform/oracle-data) | 38 / 13 | — | ✅ | [doc](./oracle-data.md) | Domain Model |
| 10 | node-api-js | `@decentralchain/node-api-js` | 2.0.0 | [DCC](https://github.com/Decentral-America/node-api-js) | [Waves](https://github.com/wavesplatform/node-api-js) | 182 / 160 | 🔗 | ✅ | [doc](./node-api-js.md) | API Client |
| 11 | transactions | `@decentralchain/transactions` | 5.0.0 | [DCC](https://github.com/Decentral-America/transactions) | [Waves](https://github.com/wavesplatform/waves-transactions) | 549 / 517 | 🔗 | ✅ | [doc](./transactions.md) | Transaction Building |
| 12 | money-like-to-node | `@decentralchain/money-like-to-node` | 1.0.0 | [DCC](https://github.com/Decentral-America/money-like-to-node) | [Waves](https://github.com/wavesplatform/money-like-to-node) | 77 / 61 | — | ✅ | [doc](./money-like-to-node.md) | Transaction Building |
| 13 | data-service-client-js | `@decentralchain/data-service-client-js` | 4.2.0 | [DCC](https://github.com/Decentral-America/data-service-client-js) | [Waves](https://github.com/wavesplatform/data-service-client-js) | 176 / 153 | 🔗 | ✅ | [doc](./data-service-client-js.md) | API Client |
| 14 | browser-bus | `@decentralchain/browser-bus` | 1.0.0 | [DCC](https://github.com/Decentral-America/browser-bus) | [Waves](https://github.com/wavesplatform/waves-browser-bus) | 127 / 109 | 🔗 | ✅ | [doc](./browser-bus.md) | Communication |
| 15 | ledger | `@decentralchain/ledger` | 5.0.0 | [DCC](https://github.com/Decentral-America/ledger) | [Waves](https://github.com/wavesplatform/waves-ledger-js) | 132 / 115 | 🔗 | ✅ | [doc](./ledger.md) | Hardware Wallet |
| 16 | signature-adapter | `@decentralchain/signature-adapter` | 7.0.0 | [DCC](https://github.com/Decentral-America/signature-adapter) | [Waves](https://github.com/wavesplatform/waves-signature-adapter) | 627 / 602 | 🔗 | ✅ | [doc](./signature-adapter.md) | Signing Abstraction |
| 17 | signer | `@decentralchain/signer` | 2.0.0 | [DCC](https://github.com/Decentral-America/signer) | [Waves](https://github.com/wavesplatform/signer) | 136 / 127 | — | ✅ | [doc](./signer.md) | Signing Orchestrator |
| 18 | cubensis-connect | `cubensis-connect` | — | [DCC](https://github.com/Decentral-America/cubensis-connect) | [Waves](https://github.com/Keeper-Wallet/Keeper-Wallet-Extension) | 2586 / 2585 | 🔗 | ✅ ² | [doc](./cubensis-connect.md) | Application |
| 19 | cubensis-connect-types | `@decentralchain/cubensis-connect-types` | 1.0.0 | [DCC](https://github.com/Decentral-America/cubensis-connect-types) | [Waves](https://github.com/Keeper-Wallet/waveskeeper-types) | 64 / 52 | 🔗 | ✅ | [doc](./cubensis-connect-types.md) | Wallet Extension |
| 20 | cubensis-connect-provider | `@decentralchain/cubensis-connect-provider` | 1.0.0 | [DCC](https://github.com/Decentral-America/cubensis-connect-provider) | [Waves](https://github.com/Keeper-Wallet/provider-keeper) | 90 / 477 | 🔗 | ✅ ¹ | [doc](./cubensis-connect-provider.md) | Wallet Extension |
| 21 | ride-js | `@decentralchain/ride-js` | 2.3.0 | [DCC](https://github.com/Decentral-America/ride-js) | [Waves](https://github.com/wavesplatform/ride-js) | 308 / 302 | — | ✅ | [doc](./ride-js.md) | Smart Contracts |
| 22 | explorer | `explorer` | 4.0.0 | [DCC](https://github.com/Decentral-America/explorer) | [Waves](https://github.com/wavesplatform/WavesExplorerLite) | 847 / 845 | — | ✅ | [doc](./explorer.md) | Application |
| 23 | exchange | `exchange` | 0.0.0 | [DCC](https://github.com/Decentral-America/exchange) | — (DCC-native) | 35 / — | — | — | [doc](./exchange.md) | Application |
| 24 | swap-client | `@decentralchain/swap-client` | 1.0.0 | [DCC](https://github.com/Decentral-America/swap-client) | [Waves](https://github.com/Keeper-Wallet/swap-client) ³ | 8 / — | — | ✅ | [doc](./swap-client.md) | DEX Integration |
| 25 | crypto | `@decentralchain/crypto` | 1.0.0 | [DCC](https://github.com/Decentral-America/crypto) | [Waves](https://github.com/Keeper-Wallet/waves-crypto) ⁴ | 235 / 234 | 🔗 | ✅ | [doc](./crypto.md) | Foundation |

¹ **cubensis-connect-provider**: All 412 upstream Waves commits analyzed 1-by-1. ~260 Renovate/dep-bot noise, ~30 CI/tooling, ~12 version bumps — only 2 genuine src bugs found and cherry-picked: (a) `defaultsFactory` now forwards `senderPublicKey` + `timestamp`, (b) duplicate fee spread removed from `transferAdapter`/`invokeScriptAdapter`. DCC architecture intentionally diverged (7 modular src files / 126 tests vs Waves' 2 monolithic files / 32 tests). Rebase rejected — would destroy DCC-only features. Waves history available via `waves` remote.

² **cubensis-connect**: 1,305 upstream Waves commits (1,325 total after fork) brought in via full rebase onto `waves/master`. DCC had only 6 post-fork commits (purely cosmetic branding). Cherry-pick failed (40+ conflicts from massive JS→TS restructure), so branding was re-applied manually onto the Waves codebase: 86 files changed covering @waves/→@decentralchain/ dep renames, network codes (W→?, T→!), decentralchain.io node/matcher URLs, manifest, i18n (10 locales), global API (KeeperWallet→CubensisConnect with backwards compat), config endpoints, build scripts, and SVG assets. `@keeper-wallet/waves-crypto` kept as-is (no DCC fork). `@keeper-wallet/swap-client` has been forked — see ³.

³ **swap-client**: Upstream `@keeper-wallet/swap-client` v0.3.0 was private/deleted. Source extracted from npm tarball (`npm pack @keeper-wallet/swap-client@0.3.0`). Protobuf `.proto` schema reverse-engineered from compiled output and verified wire-compatible. Fully migrated: `@waves/bignumber` → `@decentralchain/bignumber`, WebSocket URL now configurable (default `wss://swap.decentralchain.io/v2`), ESM-only, tsup, Biome, Vitest (50 tests), strict TypeScript 5.9.3. Published as `@decentralchain/swap-client@1.0.0`. Jira: DCC-69.

⁴ **crypto**: Upstream `@keeper-wallet/waves-crypto`. 234-commit Waves history preserved via graft. Rust/WASM + TypeScript hybrid (Ed25519/X25519, AES-ECB/CTR/CBC, HMAC-SHA-256, BLAKE2b, Keccak). Fully migrated: Cargo.toml rebranded (`decentralchain-crypto`), WASM bindings rebuilt, `@noble/hashes` v2 subpath imports fixed, timing-safe HMAC comparison added (security fix), strict TypeScript 5.9.3 with `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`. 44 tests, 99% coverage. Jira: DCC-70.

---

## Remaining Upstream (`@waves`) References

| Repository | Location | Detail |
|-----------|----------|--------|
| `ride-js` | `package.json` dependencies | Hard dep on `@waves/ride-lang` and `@waves/ride-repl` (no fork yet) |
| `ride-js` | `src/index.js` imports | Imports from `@waves/ride-lang`, `@waves/ride-repl` |
| `protobuf-serialization` | `proto/waves/` directory | Protobuf files use `package waves;` namespace (protocol-level) |
| `ts-lib-crypto` | `src/crypto/interface.ts` | Single comment referencing Waves VM semantics |

---

## Dependency Graph

```
                        ┌─────────────┐
                        │  ts-types   │  (zero deps — pure types)
                        └──────┬──────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
       ┌──────▼──────┐  ┌─────▼──────┐  ┌──────▼──────┐
       │  bignumber   │  │ts-lib-crypto│  │  marshall   │
       └──────┬──────┘  └─────┬──────┘  └──────┬──────┘
              │               │                │
              │         ┌─────┼───────┐        │
              │         │     │       │        │
       ┌──────▼──────┐  │  ┌──▼───┐   │  ┌────▼─────────────┐
       │data-entities│  │  │ledger│   │  │protobuf-serializ.│
       └──────┬──────┘  │  └──────┘   │  └────┬─────────────┘
              │         │             │        │
       ┌──────▼──────────▼─────────────▼────────▼──┐
       │             transactions                   │
       └──────┬────────────────────────┬───────────┘
              │                        │
       ┌──────▼──────┐         ┌──────▼──────┐
       │ node-api-js │         │money-like   │
       └──────┬──────┘         │  -to-node   │
              │                └──────┬──────┘
       ┌──────▼──────┐         ┌──────▼──────────┐
       │   signer    │         │signature-adapter│
       └──────┬──────┘         └─────────────────┘
              │
       ┌──────▼──────────────┐
       │cubensis-connect-prov│
       └─────────────────────┘

  Independent:
  ┌─────────────────┐  ┌──────────────┐  ┌──────────┐
  │parse-json-bignum│  │assets-pairs  │  │browser-bus│
  └─────────────────┘  │   -order     │  └──────────┘
                       └──────────────┘
  ┌──────────────┐  ┌───────────┐
  │ oracle-data  │  │data-svc   │
  └──────────────┘  │-client-js │
                    └───────────┘

  Applications (consume SDK packages):
  ┌──────────────┐  ┌──────────┐  ┌──────────────────┐
  │   explorer   │  │ exchange │  │ cubensis-connect  │
  └──────────────┘  └──────────┘  └──────────────────┘
```

---

## Ecosystem Architecture

### Layer Model

| Layer | Packages | Role |
|-------|----------|------|
| **Foundation** | ts-types, bignumber, ts-lib-crypto, parse-json-bignumber | Core types, math, crypto, JSON parsing |
| **Serialization** | marshall, protobuf-serialization | Binary/protobuf encode/decode for wire format |
| **Domain Model** | data-entities, assets-pairs-order, oracle-data | Business objects (Money, Asset, OrderPrice, Oracle) |
| **Transaction Building** | transactions, money-like-to-node | Construct, sign, and validate blockchain transactions |
| **API Client** | node-api-js, data-service-client-js | HTTP clients for node REST API and data service |
| **Communication** | browser-bus | Cross-window postMessage for browser apps |
| **Hardware Wallet** | ledger | Ledger device integration via WebUSB |
| **Signing Abstraction** | signature-adapter, signer, cubensis-connect-provider | Multi-provider signing (seed, Ledger, wallet extension) |
| **Wallet Types** | cubensis-connect-types | Type definitions for wallet extension API |
| **Smart Contracts** | ride-js | RIDE language compiler (wraps `@waves/ride-lang`) |
| **Applications** | explorer, exchange, cubensis-connect | End-user apps consuming the SDK |

### Standard Toolchain (23 of 24 repos)

| Tool | Version | Purpose |
|------|---------|---------|
| TypeScript | 5.9.x | Type safety |
| Biome | 2.4.x | Format + lint (single tool) |
| Lefthook | 1.11+ / 2.1.x | Git hook enforcement |
| Vitest | 4.x | Test runner + coverage |
| tsup | 8.5.x | ESM-only bundler |
| publint | 0.3.x | Package.json correctness |
| attw | 0.18.x | TypeScript export verification |
| size-limit | 12.x | Bundle size budgets |

**Exception:** `cubensis-connect` still uses webpack 5, Babel, ESLint 8, Prettier, Stylelint, Mocha. Phase 2 Bulletproof migration pending.

### Quality Pipeline

```
git commit → lefthook pre-commit →
  parallel: biome check (staged files) + tsc --noEmit
  → bulletproof: lint:fix → typecheck → test
```

---

## Protocol Reference

| Property | Value |
|----------|-------|
| Consensus | Leased Proof of Stake (LPoS) |
| Native Token | DecentralCoin (DCC) — wire-format ID: `'WAVES'` |
| Smart Contract Language | Ride (non-Turing-complete, functional) |
| Block Time | ~2 seconds (M5 microblocks) |
| Chain IDs | `?` (Mainnet), `!` (Testnet), `S` (Stagenet) |
| Signature Scheme | Ed25519 / Curve25519 |
| Hashing | Blake2b-256, Keccak-256, SHA-256 |
| Address Format | Base58Check (1 + chainId + publicKeyHash + checksum) |
| Transaction Types | 1–18 (identical to Waves) |

### Network Endpoints

| Service | Waves | DecentralChain |
|---------|-------|----------------|
| Mainnet node | `nodes.wavesnodes.com` | `mainnet-node.decentralchain.io` |
| Testnet node | `nodes-testnet.wavesnodes.com` | `testnet-node.decentralchain.io` |
| Stagenet node | `nodes-stagenet.wavesnodes.com` | `stagenet-node.decentralchain.io` |
| Mainnet matcher | `matcher.waves.exchange` | `mainnet-matcher.decentralchain.io` |
| Testnet matcher | `matcher-testnet.waves.exchange` | `matcher.decentralchain.io` |
| Stagenet matcher | `matcher-stagenet.waves.exchange` | `stagenet-matcher.decentralchain.io` |
| Data service API | `api.wavesplatform.com` | `api.decentralchain.io` |
| Swap API | `swap-api.keeper-wallet.app` | `swap-api.decentralchain.io` |
| Identity API | `id.waves.exchange/api` | `id.decentralchain.io/api` |
| Explorer | `wavesexplorer.com` | `explorer.decentralchain.io` |

---

## Per-Repo Documentation

Each per-repo document follows this structure:

1. **Overview** — What the package does, one paragraph
2. **Waves Upstream** — Original repo, sync status, delta summary
3. **Tech Stack** — Runtime deps, build tools, test setup
4. **Architecture** — Source structure, key modules, design patterns
5. **Source Map** — Every file with one-line purpose annotation
6. **Public API** — Exported types, functions, classes
7. **Dependency Graph** — What it depends on, what depends on it
8. **Migration Status** — Phase completion (0-MIGRATE through 3-AUDIT)
9. **Known Issues** — Repo-specific issues (linked to DOCS_CHRONOLOGICAL.md)

---

## DecentralChain vs Waves — Comprehensive Parity Analysis

> **Last updated:** 2026-03-10  
> **Scope:** All 24 DCC repos, with deep focus on `cubensis-connect` (the wallet extension)  
> **Purpose:** Community expects 1:1 feature parity with Waves. This section documents every known difference, gap, risk, and decision.

### Table of Contents

1. [Protocol-Level Differences](#1-protocol-level-differences)
2. [Network & Infrastructure](#2-network--infrastructure)
3. [Feature Parity Matrix](#3-feature-parity-matrix)
4. [NFT Vendor System](#4-nft-vendor-system)
5. [Dependency Gaps](#5-dependency-gaps)
6. [External Services & APIs](#6-external-services--apis)
7. [Wire-Format Compatibility](#7-wire-format-compatibility)
8. [Branding Residuals (Intentional)](#8-branding-residuals-intentional)
9. [Branding Residuals (Unfinished)](#9-branding-residuals-unfinished)
10. [UX Regressions vs Upstream](#10-ux-regressions-vs-upstream)
11. [Security & Identity](#11-security--identity)
12. [Cross-Repo Dependency Chain](#12-cross-repo-dependency-chain)
13. [Risks & Recommendations](#13-risks--recommendations)
14. [Remediation Analysis — What Can Be Fixed](#14-remediation-analysis--what-can-be-fixed)

---

### 1. Protocol-Level Differences

DCC is a blockchain fork of Waves. The consensus and transaction models are identical, but the chain is independent with its own genesis block, network codes, and node infrastructure.

| Parameter | Waves | DecentralChain | Notes |
|-----------|-------|----------------|-------|
| Mainnet network code | `W` (byte 87) | `?` (byte 63) | Hard-coded in all tx signing |
| Testnet network code | `T` (byte 84) | `!` (byte 33) | |
| Stagenet network code | `S` (byte 83) | `S` (byte 83) | **Shared** — same code |
| Native asset ID | `WAVES` | `WAVES` | **Shared** — wire-format string, cannot rename |
| Native asset display name | Waves | DecentralChain | User-facing only |
| Native asset ticker | WAVES | DCC | Ticker for UI display |
| Transaction types | 1–18 | 1–18 | Identical set (Issue, Transfer, Reissue, Burn, Exchange, Lease, CancelLease, Alias, MassTransfer, Data, SetScript, SponsorFee, SetAssetScript, InvokeScript, UpdateAssetInfo, InvokeExpression, Ethereum, ContinuationTransaction) |
| Block structure | Identical | Identical | Same protobuf schemas |
| Signature scheme | Ed25519 / Curve25519 | Ed25519 / Curve25519 | Same `@keeper-wallet/waves-crypto` |
| Address derivation | Same algorithm | Same algorithm | Only chain ID byte differs |
| RIDE smart contract language | Supported | Supported | Same compiler/interpreter |

**Key takeaway:** The protocol is byte-compatible except for chain ID. Any transaction signed for Waves mainnet (`W`) is invalid on DCC mainnet (`?`) and vice versa. This is by design.

---

### 2. Network & Infrastructure

| Service | Waves | DecentralChain | Status |
|---------|-------|----------------|--------|
| **Mainnet node** | `nodes.wavesnodes.com` | `mainnet-node.decentralchain.io` | ✅ Migrated |
| **Testnet node** | `nodes-testnet.wavesnodes.com` | `testnet-node.decentralchain.io` | ✅ Migrated |
| **Stagenet node** | `nodes-stagenet.wavesnodes.com` | `stagenet-node.decentralchain.io` | ✅ Migrated |
| **Mainnet matcher** | `matcher.waves.exchange` | `mainnet-matcher.decentralchain.io` | ✅ Migrated |
| **Testnet matcher** | `matcher-testnet.waves.exchange` | `matcher.decentralchain.io` | ✅ Migrated |
| **Stagenet matcher** | `matcher-stagenet.waves.exchange` | `stagenet-matcher.decentralchain.io` | ✅ Migrated |
| **Data service API** | `api.wavesplatform.com` | `api.decentralchain.io` | ✅ Migrated |
| **Swap API** | `swap-api.keeper-wallet.app` | `swap-api.decentralchain.io` | ✅ Migrated |
| **Identity API** | `id.waves.exchange/api` | `id.decentralchain.io/api` | ✅ Migrated |
| **Identity API (testnet)** | `id-testnet.waves.exchange/api` | `id-testnet.decentralchain.io/api` | ✅ Migrated |
| **Cognito endpoint (mainnet)** | `waves.exchange/cognito` | `decentralchain.io/cognito` | ✅ Migrated |
| **Cognito endpoint (testnet)** | `testnet.waves.exchange/cognito` | `testnet.decentralchain.io/cognito` | ✅ Migrated |
| **Remote config** | `Keeper-Wallet/keeper-wallet-configs` | `Decentral-America/dcc-configs` | ✅ Migrated |
| **Sentry error tracking** | Keeper Wallet Sentry project | ⚠️ No DSN configured | Needs DCC Sentry project |
| **Chrome Web Store** | Published as Keeper Wallet | ⚠️ Not published | Requires store listing |
| **Firefox Add-ons** | Published as Keeper Wallet | ⚠️ Not published | Requires AMO listing |
| **Explorer** | `wavesexplorer.com` | `explorer.decentralchain.io` | Exists in whitelist |

#### Cognito User Pools

The email-login identity system uses AWS Cognito. The **pool IDs** appear identical between Waves and DCC configurations:

| Environment | Pool ID | Client ID |
|-------------|---------|-----------|
| Mainnet | `eu-central-1_AXIpDLJQx` | `k63vrrmuav01s6p2d344ppnf4` |
| Testnet | `eu-central-1_6Bo3FEwt5` | `7l8bv0kmvrb4s4n1topofh9d80` |

**⚠️ CRITICAL QUESTION:** Are these DCC's own Cognito pools, or are they the Waves pools with just the proxy endpoint changed? If the latter, DCC email accounts are actually Waves accounts, and Waves could revoke access at any time. **This needs immediate verification.**

---

### 3. Feature Parity Matrix

| Feature | Waves Keeper | Cubensis Connect | Gap |
|---------|-------------|------------------|-----|
| Create wallet (seed phrase) | ✅ | ✅ | — |
| Import seed | ✅ | ✅ | — |
| Import keystore file | ✅ | ✅ | — |
| Import via Ledger | ✅ | ✅ | — |
| Import via email (Cognito) | ✅ | ✅ | See Cognito caveat above |
| Multi-account | ✅ | ✅ | — |
| Multi-network (main/test/stage/custom) | ✅ | ✅ | — |
| Send transactions (all 18 types) | ✅ | ✅ | — |
| Sign transactions (all 18 types) | ✅ | ✅ | — |
| Sign arbitrary data | ✅ | ✅ | — |
| Transaction history | ✅ | ✅ | — |
| Asset balance display | ✅ | ✅ | — |
| NFT display (5 vendors) | ✅ | ✅ | — |
| NFT display (WavesDomains) | ✅ | ❌ | **Removed** — see §4 |
| Domain → address resolution | ✅ | ❌ | **Removed** — see §4 |
| In-wallet swap | ✅ | ✅ | Uses `@decentralchain/swap-client` (forked from Keeper-Wallet — DCC-69) — see §5 |
| DApp browser permissions | ✅ | ✅ | — |
| Content script injection | ✅ | ✅ | — |
| Idle auto-lock | ✅ | ✅ | — |
| Suspicious token list | ✅ | ⚠️ | Still reads from `waves-community` repo — see §9 |
| Sentry error reporting | ✅ | ⚠️ | No DSN configured |
| Remote config updates | ✅ | ✅ | Uses `dcc-configs` repo |
| `WavesKeeper` global API | ✅ | ✅ | Exposed as `CubensisConnect` with deprecated `KeeperWallet`/`WavesKeeper` aliases |
| Extension store listing | ✅ | ❌ | Not published |
| Leasing | ✅ | ✅ | — |
| dccAuth (message signing) | ✅ (wavesAuth) | ✅ | Renamed, functionally identical |

---

### 4. NFT Vendor System

The wallet uses a vendor-based plugin pattern where each NFT project has a dedicated renderer. The upstream Waves system has 6 vendors + Unknown fallback. DCC has 5 + Unknown.

| Vendor | Waves Keeper | Cubensis Connect | External Service |
|--------|-------------|------------------|------------------|
| Ducks | ✅ | ✅ | wavesducks.com |
| Ducklings | ✅ | ✅ | wavesducks.com |
| DucksArtefacts | ✅ | ✅ | wavesducks.com |
| Puzzle | ✅ | ✅ | puzzlemarket.org |
| SignArt | ✅ | ✅ | mainnet.sign-art.app |
| **WavesDomains** | ✅ | ❌ **Removed** | wavesDomains (no DCC equivalent) |
| Unknown (fallback) | ✅ | ✅ | — |

#### Impact of WavesDomains Removal

1. **NFT Display:** Any NFTs issued by the WavesDomains vendor will render with the "Unknown" fallback — a generic card with the asset name. No crash, no data loss. Graceful degradation.
2. **Address Resolution:** The `SuggestInput` component no longer resolves `.waves` domain names to addresses. On Waves, users could type `alice.waves` and it would resolve to `3P...`. This is a **UX regression** — the feature was removed entirely, not replaced with a DCC equivalent.
3. **`@waves-domains/client` dependency removed** from `package.json` — clean removal, no dead imports.

#### Decision Required

- If DCC plans to launch its own domain system (e.g., `.dcc` domains), the vendor + resolution should be re-implemented.
- If not, the current state is acceptable — Unknown fallback works cleanly.
- The 5 remaining NFT vendors all point to **third-party Waves ecosystem services** (wavesducks.com, puzzlemarket.org, sign-art.app). These services are independent projects, not controlled by Waves or DCC. They will continue to work as long as those projects exist and DCC's blockchain hosts the same NFT assets.

---

### 5. Dependency Gaps

#### 5a. Waves-Branded Dependencies Still in Use (No DCC Fork)

These packages are consumed from npm under Waves/Keeper branding. They work correctly but represent a supply-chain risk — Waves could publish a breaking change or yank the package.

| Package | Used By | Usage | Risk |
|---------|---------|-------|------|
| `@keeper-wallet/waves-crypto` | cubensis-connect (10+ files) | Core crypto: key derivation, signing, base58/64, seed generation | **HIGH** — foundational crypto library |
| ~~`@keeper-wallet/swap-client`~~ | ~~cubensis-connect (1 file: `swap/form.tsx`)~~ | ~~In-wallet swap UI integration~~ | ✅ **RESOLVED** — Forked as `@decentralchain/swap-client@1.0.0` (DCC-69). cubensis-connect import still needs updating. |
| `@waves/ride-lang` | ride-js | RIDE language compiler | **LOW** — only used by ride-js package |
| `@waves/ride-repl` | ride-js | RIDE REPL interpreter | **LOW** — only used by ride-js package |

**Mitigation options:**
- **`@keeper-wallet/waves-crypto`**: Fork as `@decentralchain/wallet-crypto`. **Cannot** naively replace with `@decentralchain/ts-lib-crypto` — they serve different roles: waves-crypto is **async** (Rust/WASM + WebCrypto `crypto.subtle` for hardware-accelerated AES), ts-lib-crypto is **sync** (pure JS `@noble/curves`). API signatures differ (`signBytes` takes raw bytes vs wrapper object), return types differ (`encryptSeed` returns `Uint8Array` vs Base64 string), and cubensis-connect uses `await` on every crypto call. See [DOCS_CHRONOLOGICAL.md §4](./DOCS_CHRONOLOGICAL.md#4-crypto-library-architecture) for full architecture. The correct path is to fork waves-crypto with the same async API under DCC-controlled supply chain.
- **~~`@keeper-wallet/swap-client`~~**: ✅ **RESOLVED** (DCC-69) — Forked as `@decentralchain/swap-client@1.0.0`. WebSocket URL now configurable. cubensis-connect `swap/form.tsx` import still needs updating from `@keeper-wallet/swap-client` → `@decentralchain/swap-client`.
- **`@waves/ride-lang` + `@waves/ride-repl`**: These are Scala.js compiled artifacts. Forking requires building from the Waves Ride compiler source (Scala). Low priority unless DCC modifies the RIDE language.

#### 5b. DCC-Forked Dependencies (Fully Controlled)

All 24 repos in the `Decentral-America` GitHub org are forked and maintained. Key packages:

| Package | npm Scope | Status |
|---------|-----------|--------|
| `@decentralchain/protobuf-serialization` | `@decentralchain/` | ✅ Forked, published |
| `@decentralchain/ledger` | `@decentralchain/` | ✅ Forked, published |
| `@decentralchain/ts-types` | `@decentralchain/` | ✅ Forked, published |
| `@decentralchain/ts-lib-crypto` | `@decentralchain/` | ✅ Forked, published |
| `@decentralchain/transactions` | `@decentralchain/` | ✅ Forked, published |
| `@decentralchain/node-api-js` | `@decentralchain/` | ✅ Forked, published |
| `@decentralchain/signature-adapter` | `@decentralchain/` | ✅ Forked, published |
| `@decentralchain/marshall` | `@decentralchain/` | ✅ Forked, published |

---

### 6. External Services & APIs

#### 6a. Services DCC Controls

| Service | URL | Function |
|---------|-----|----------|
| Data Service API | `api.decentralchain.io` | Asset info, ticker data |
| Swap API | `swap-api.decentralchain.io` | Token swap routing & execution |
| Identity API | `id.decentralchain.io/api` | Email-based account management |
| Cognito Proxy | `decentralchain.io/cognito` | AWS Cognito auth proxy |
| Remote Config | `raw.githubusercontent.com/Decentral-America/dcc-configs/main/main.json` | Runtime config (whitelist, error filters, NFT config) |
| Suspicious Token List | `raw.githubusercontent.com/Decentral-America/waves-community/master/...` | Scam token CSV (⚠️ repo still named `waves-community`) |

#### 6b. Third-Party Services (Not DCC-Controlled)

| Service | URL | Function | Risk |
|---------|-----|----------|------|
| Waves Ducks | `wavesducks.com/api/v1/` | Duck NFT images & metadata | May not serve DCC NFT data if assets differ |
| Puzzle Market | `puzzlemarket.org` | Puzzle NFT metadata & creator info | Same caveat |
| SignArt | `mainnet.sign-art.app` | Art NFT metadata & IPFS images | Uses `signart.infura-ipfs.io` for images |
| IPFS (Infura) | `signart.infura-ipfs.io/ipfs/` | SignArt NFT image hosting | Third-party IPFS gateway |
| Keeper Wallet web app | `web.keeper-wallet.app` | Still in whitelist | **Should be reviewed — is this needed?** |
| Keeper Wallet swap | `swap.keeper-wallet.app` | Still in whitelist | **Should be reviewed — is this needed?** |

#### 6c. Services Not Yet Configured

| Service | Status | Impact |
|---------|--------|--------|
| Sentry error tracking | `__SENTRY_DSN__` env var — no value in `.env` | Build succeeds but errors are silently dropped at runtime |
| Chrome Web Store | Not published | Users cannot install from store |
| Firefox Add-ons (AMO) | Not published | Users cannot install from store |
| DCC Block Explorer link | `explorer.decentralchain.io` in whitelist | Needs to be running and functional |

---

### 7. Wire-Format Compatibility

Several protocol-level strings **must remain Waves-branded** for backward compatibility. These are not bugs — they are deliberate decisions.

| Location | Value | Reason |
|----------|-------|--------|
| Native asset ID | `'WAVES'` (60 occurrences in cubensis-connect) | Wire-format identifier for the native token. Renaming would break all API responses, transaction parsing, and balance lookups. Every node returns `'WAVES'` as the native asset ID. |
| Authentication signing prefix | `'WavesWalletAuthentication'` (in `messages/utils.ts`) | Used to construct the canonical byte sequence for message signing. Existing signed messages in the wild use this prefix. Changing it would invalidate all previously signed auth messages. |
| Protobuf namespace | `waves` (in `dccProto.waves.*`) | The `.proto` files define `package waves;` — all generated code accesses types under the `waves` namespace. This is the wire format of the blockchain protocol itself. Renaming would break protobuf encoding/decoding. |
| Ledger import path | `@decentralchain/ledger/lib/Waves` | Export name from the ledger package. Aliased as `DccLedger` in cubensis-connect. The export path is internal, not user-facing. |
| `wavesKeeper` user type | `'wavesKeeper'` in keystore import | Backward compatibility with existing exported keystores. Renaming would prevent importing old backup files. |

---

### 8. Branding Residuals (Intentional)

These "Waves" references exist in the codebase **by design**. They should NOT be renamed.

| Reference | File(s) | Reason |
|-----------|---------|--------|
| `'WAVES'` asset ID | 60+ files | Protocol-level — see §7 |
| `'WavesWalletAuthentication'` | `messages/utils.ts` | Signing prefix — see §7 |
| `dccProto.waves.*` | `transactions/src/proto-serialize.ts` | Protobuf namespace — see §7 |
| `@keeper-wallet/waves-crypto` imports | 10+ files | No DCC fork yet — see §5 |
| `@keeper-wallet/swap-client` imports | `swap/form.tsx` | DCC fork exists (`@decentralchain/swap-client`) — cubensis-connect import needs updating |
| `wavesKeeper` user type string | `importKeystore.tsx` | Backward compat — see §7 |
| `wavesducks.com` URLs | NFT vendor files (3) | Third-party service — not rebranding target |
| `puzzlemarket.org` URLs | NFT vendor file | Third-party service |
| `sign-art.app` URLs | NFT vendor file | Third-party service |

---

### 9. Branding Residuals (Unfinished)

These "Waves" references are **actionable TODO items** that should be cleaned up.

| Reference | File | Action |
|-----------|------|--------|
| `waves-community` repo name in URL | `controllers/assetInfo.ts:34` | Rename GitHub repo to `dcc-community` and update URL |
| Scam token CSV filename contains "Waves Community" | `controllers/assetInfo.ts:34` | Rename file in the repo |
| `support.waves.exchange` in error message | `importEmail/signInForm.tsx:99` | This is a string-matched server error message — check if the DCC Cognito backend returns a different string. If so, update the match. If not, server-side fix needed. |
| `web.keeper-wallet.app` in whitelist | `constants.ts:52` | Review: does DCC use Keeper Wallet web app? If not, remove from whitelist |
| `swap.keeper-wallet.app` in whitelist | `constants.ts:53` | Review: does DCC use Keeper Wallet swap? If not, remove from whitelist |

---

### 10. UX Regressions vs Upstream

Features that Waves Keeper has but Cubensis Connect does not.

| Feature | Impact | Effort to Restore | Priority |
|---------|--------|-------------------|----------|
| **WavesDomains NFT vendor** | NFTs from this vendor show as "Unknown" | Low (re-add vendor file + enum entry) but needs DCC domain service or point to Waves' | Low |
| **`.waves` address resolution** | Users cannot type domain names (e.g., `alice.waves`) and resolve to an address | Medium (need DCC domain resolution API or restore `@waves-domains/client`) | Medium — depends on whether DCC launch domain system |
| **Sentry error reporting** | Development team has no visibility into runtime errors from users | Low (create Sentry project, set DSN in deployment env) | **High** — critical for production ops |
| **Extension store listings** | Users must side-load the extension | Medium (Chrome & Firefox review process) | **High** — blocks user adoption |

---

### 11. Security & Identity

#### Cognito Pool Ownership

The Cognito `userPoolId` values (`eu-central-1_AXIpDLJQx` for mainnet, `eu-central-1_6Bo3FEwt5` for testnet) need verification:

- **If DCC owns these pools:** Email-based accounts are fully DCC-controlled. ✅
- **If these are Waves' pools (proxied through DCC endpoint):** Users' encrypted seeds are stored in Waves-controlled infrastructure. Waves could theoretically deny access. **This is a critical risk.**

#### Crypto Library Supply Chain

`@keeper-wallet/waves-crypto` is published by the Keeper Wallet team. If they publish a compromised version, it would affect DCC users' key derivation, signing, and seed encryption. The package is pinned (`^3.0.0`) but `^` allows minor/patch updates.

**Recommendation:** Either pin exact version (`3.0.0` without `^`) or fork the package.

#### Whitelist Domains

Current whitelist in `DEFAULT_MAIN_CONFIG`:
```
decentralchain.io
explorer.decentralchain.io
web.keeper-wallet.app      ← Waves-controlled domain
swap.keeper-wallet.app     ← Waves-controlled domain
```

The `keeper-wallet.app` entries allow those domains to interact with Cubensis Connect via the content script API. If DCC does not intend for Keeper Wallet web services to access DCC accounts, these should be removed.

---

### 12. Cross-Repo Dependency Chain

The DCC ecosystem's dependency graph. An issue in any upstream package affects all downstream consumers.

```
@keeper-wallet/waves-crypto  ← NOT FORKED (crypto foundation)
  └── cubensis-connect
  └── @decentralchain/ts-lib-crypto
        └── @decentralchain/transactions
              └── @decentralchain/signature-adapter
                    └── @decentralchain/signer
              └── @decentralchain/node-api-js
        └── @decentralchain/marshall
              └── @decentralchain/protobuf-serialization (proto namespace: waves)
        └── @decentralchain/ledger

@decentralchain/swap-client  ← FORKED (DCC-69)
  └── cubensis-connect (swap feature only)

@waves/ride-lang + @waves/ride-repl  ← NOT FORKED (RIDE compiler)
  └── @decentralchain/ride-js
```

---

### 13. Risks & Recommendations

#### Critical

| # | Risk | Recommendation |
|---|------|----------------|
| 1 | **Cognito pool ownership unknown** | Verify immediately whether `eu-central-1_AXIpDLJQx` and `eu-central-1_6Bo3FEwt5` are DCC-owned AWS Cognito pools |
| 2 | **`@keeper-wallet/waves-crypto` supply-chain risk** | Fork as `@decentralchain/crypto` or pin to exact version. This library handles ALL cryptographic operations. |
| 3 | **No Sentry DSN configured** | Create DCC Sentry project and inject DSN via build environment. Without error monitoring, production issues are invisible. |
| 4 | **Not published to extension stores** | Begin Chrome Web Store and Firefox AMO submission process. Side-loading limits adoption. |

#### High

| # | Risk | Recommendation |
|---|------|----------------|
| 5 | **`waves-community` scam token list** | Fork/rename to `dcc-community` and update the CSV URL in `controllers/assetInfo.ts` |
| 6 | **`keeper-wallet.app` in whitelist** | Decide: does DCC use Keeper-Wallet web services? If no, remove from whitelist to reduce attack surface. |
| 7 | **~~`@keeper-wallet/swap-client` dependency~~** | ✅ **RESOLVED** (DCC-69) — Forked as `@decentralchain/swap-client@1.0.0`. WebSocket URL now configurable. cubensis-connect still needs its import updated from `@keeper-wallet/swap-client` → `@decentralchain/swap-client`. |

#### Medium

| # | Risk | Recommendation |
|---|------|----------------|
| 8 | **Address resolution removed** | If DCC plans domain system, build it. If not, document the removal for community. |
| 9 | **`support.waves.exchange` in error string** | Check what string the DCC Cognito endpoint returns for rate-limit errors and update the match. |
| 10 | **NFT vendors point to Waves ecosystem** | These are community projects — monitor for API changes. Consider caching/proxy if they become unreliable. |

#### Low

| # | Risk | Recommendation |
|---|------|----------------|
| 11 | **`@waves/ride-lang` + `@waves/ride-repl`** | Only affects `ride-js` package. Fork only if DCC modifies RIDE language. |
| 12 | **Ledger app naming** | The Ledger hardware wallet app is still called "Waves" on the device. A custom Ledger app submission would be needed for DCC branding. |

---

### Summary Statistics

| Metric | Count |
|--------|-------|
| Total DCC repos | 24 |
| Repos fully synced with Waves upstream | 24 |
| Repos with active DCC branding | 24 |
| Unforked Waves/Keeper dependencies | 3 (`waves-crypto`, `ride-lang`, `ride-repl`) |
| Intentional `waves` wire-format references | 60+ (`WAVES` asset ID) + protobuf namespace + signing prefix |
| Actionable branding TODOs | 5 (see §9) |
| UX regressions vs upstream | 4 (see §10) |
| Critical risks | 4 (see §13) |
| Features at full parity | ~25 of ~29 tracked features |
| Parity percentage (feature count) | **~86%** — remaining gaps are NFT domain vendor, address resolution, Sentry, and store listings |

---

### 14. Remediation Analysis — What Can Be Fixed

> Deep investigation of every Waves-branded residual, dependency, and gap.
> Each item answers: **WHY** is it there? **CAN** it be fixed? Is it **STRICTLY REQUIRED**?

---

#### 14.1 `@keeper-wallet/waves-crypto` — **MUST BE FORKED, NOT NAIVELY REPLACED**

**Why it's there:** The Waves Keeper wallet uses this as its core crypto library (key derivation, signing, encoding, seed encryption). When cubensis-connect was rebased onto the Waves codebase, all 22 import sites came along.

**What it does:** Base58/64/16 encode/decode, Curve25519 key generation, Ed25519 signing, message encrypt/decrypt, seed encrypt/decrypt, address derivation, signature verification.

**Can it be replaced with `@decentralchain/ts-lib-crypto`?** **NO.** Despite similar function names, the two libraries serve fundamentally different roles:

| | `@keeper-wallet/waves-crypto` | `@decentralchain/ts-lib-crypto` |
|---|---|---|
| **Paradigm** | **Async** (Rust/WASM + WebCrypto) | **Sync** (pure JS) |
| **Runtime** | `crypto.subtle` for hardware-accelerated AES | `@noble/curves` in JS |
| **Used by** | cubensis-connect only | 6 SDK packages |
| **API style** | All calls are `await`-ed | Synchronous returns |
| **`signBytes`** | Takes raw bytes | Takes wrapper object |
| **`encryptSeed`** | Returns `Uint8Array` | Returns Base64 string |
| **Seed encryption** | WebCrypto AES (hardware-accelerated) | Pure JS AES (slower, less secure in browser) |

**Why naive replacement breaks things:**
1. API signatures differ — argument types and shapes are not interchangeable
2. Return types differ — consumers expect different types from each function
3. Loss of WebCrypto AES means less secure seed encryption in the browser extension
4. cubensis-connect uses `await` on every crypto call — replacing with sync would require refactoring all call sites

See [DOCS_CHRONOLOGICAL.md §4](./DOCS_CHRONOLOGICAL.md#4-crypto-library-architecture) for the full architecture explanation.

**Function name mapping** (reference for the future fork — names are similar but APIs are NOT drop-in compatible):

| waves-crypto function | ts-lib-crypto equivalent | Name match? |
|---|---|---|
| `base58Decode` | `base58Decode` | Exact |
| `base58Encode` | `base58Encode` | Exact |
| `base64Decode` | `base64Decode` | Exact |
| `base64Encode` | `base64Encode` | Exact |
| `base16Decode` | `base16Decode` | Exact |
| `base16Encode` | `base16Encode` | Exact |
| `blake2b` | `blake2b` | Exact |
| `keccak` | `keccak` | Exact |
| `signBytes` | `signBytes` | Exact name, **different signature** |
| `verifyAddress` | `verifyAddress` | Exact |
| `verifySignature` | `verifySignature` | Exact |
| `decryptSeed` | `decryptSeed` | Exact name, **different return type** |
| `encryptSeed` | `encryptSeed` | Exact name, **different return type** |
| `createAddress` | `address` / `buildAddress` | Rename |
| `createPrivateKey` | `privateKey` | Rename |
| `createPublicKey` | `publicKey` | Rename |
| `createSharedKey` | `sharedKey` | Rename |
| `decryptMessage` | `messageDecrypt` | Rename |
| `encryptMessage` | `messageEncrypt` | Rename |
| `generateRandomSeed` | `randomSeed` | Rename |
| `utf8Decode` | `bytesToString` | Rename |
| `utf8Encode` | `stringToBytes` | Rename |

**Correct path:** Fork `@keeper-wallet/waves-crypto` → `@decentralchain/wallet-crypto`. Keep the same async/WASM/WebCrypto API surface. DCC-controlled supply chain, identical behavior.

**Effort:** Medium. Fork the package, rebrand, publish. cubensis-connect import paths change from `@keeper-wallet/waves-crypto` → `@decentralchain/wallet-crypto` (22 files, same API — no refactoring needed).

**Strictly required?** NO. This is a supply-chain risk mitigation. The Waves package works identically. But it's controlled by the Keeper Wallet team, who could publish a compromised version affecting DCC users' key generation and signing.

Detailed analysis for §14.2–§14.13 has been consolidated into [DOCS_CHRONOLOGICAL.md](./DOCS_CHRONOLOGICAL.md). See:
- Swap client (P0): [§23 Open Issues — Critical](./DOCS_CHRONOLOGICAL.md#23-cubensis-connect)
- Cognito pools (P0): [§23 Open Issues — Critical](./DOCS_CHRONOLOGICAL.md#23-cubensis-connect)
- Wire-format constraints (`'WAVES'`, protobuf, signing prefix): [§1](./DOCS_CHRONOLOGICAL.md#1-wire-format-constraints) and [§2](./DOCS_CHRONOLOGICAL.md#2-intentional-waves-references-will-not-fix)
- Unforked deps (ride-lang): [§3](./DOCS_CHRONOLOGICAL.md#3-unforked-waves-dependencies)
- Branding residuals & remediation: [§29](./DOCS_CHRONOLOGICAL.md#29-remediation-priority-matrix)

---

#### Remediation Priority Matrix

| Priority | Item | Action | Effort | Blocks | Can Do Now? |
|---|---|---|---|---|---|
| ~~**P0**~~ | ~~Swap client → Waves backend~~ | ✅ **RESOLVED** (DCC-69) — Forked as `@decentralchain/swap-client@1.0.0`. WebSocket URL configurable. cubensis-connect import still needs updating. | — | — | ✅ Done |
| **P0** | Cognito pool ownership | Verify if `decentralchain.io/cognito` actually proxies and `id.decentralchain.io/api/v1/sign` works | Zero (research) | Email login may be broken | ✅ |
| **P1** | Fork `@keeper-wallet/waves-crypto` | Fork → `@decentralchain/wallet-crypto`; rename 22 import paths in cubensis-connect (package rename only — same async WASM API, no refactoring) | Medium | Supply chain risk | ✅ |
| **P1** | Remove `keeper-wallet.app` from whitelist | Delete 2 lines in constants.ts | Trivial | Security: auto-trust of Waves domains | ✅ |
| **P2** | Rename `waves-community` repo | Rename GitHub repo + update URL | Trivial | Branding | ✅ |
| **P2** | Fix ledger import path | Update 1 import + 3 type names | Trivial | Stale reference | ✅ |
| **P2** | Set up Sentry DSN | Create project, set env var | Low | No error monitoring | ✅ |
| **P3** | `wavesKeeper` storage migration | Add migration + update type | Low | Internal string | ✅ |
| **P3** | `WavesWalletAuthentication` dual prefix | Add `DccWalletAuthentication` as new default, keep old as fallback | Medium | Needs DApp coordination | Not yet |
| **N/A** | `'WAVES'` asset ID | Do not rename | — | Would break everything | ❌ |
| **N/A** | Protobuf `waves` namespace | Do not rename | — | Would break wire format | ❌ |
| **N/A** | `@waves/ride-lang` + `ride-repl` | No action unless RIDE language is modified | — | No DCC-specific changes | ❌ |
| **N/A** | Third-party NFT URLs | Do not modify | — | External services | ❌ |
