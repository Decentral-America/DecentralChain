# Upstream Provenance — Waves → DecentralChain

> **Purpose**: Documents the relationship between DecentralChain and the Waves blockchain ecosystem it was forked from. Covers provenance, ecosystem mapping, protocol compatibility, dependency gaps, and strategic roadmap for packages not yet migrated.
>
> **Audience**: SDK contributors, security auditors, ecosystem partners, and AI agents needing context on why certain Waves references exist in the codebase.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [What is DecentralChain?](#2-what-is-decentralchain)
3. [Protocol Compatibility](#3-protocol-compatibility)
4. [Network & Infrastructure](#4-network--infrastructure)
5. [SDK Package Map](#5-sdk-package-map)
6. [Dependency Architecture](#6-dependency-architecture)
7. [Wire-Format Constraints](#7-wire-format-constraints)
8. [Remaining Upstream Dependencies](#8-remaining-upstream-dependencies)
9. [Crypto Library Architecture](#9-crypto-library-architecture)
10. [Ecosystem Gap Analysis](#10-ecosystem-gap-analysis)
11. [Strategic Roadmap](#11-strategic-roadmap)
12. [DCC-Original Projects](#12-dcc-original-projects)
13. [Concept Mapping Reference](#13-concept-mapping-reference)
14. [Feature Parity — Cubensis Connect vs Waves Keeper](#14-feature-parity--cubensis-connect-vs-dcc-keeper)
15. [External Services & Dependencies](#15-external-services--dependencies)
16. [Supply-Chain Dependency Chain](#16-supply-chain-dependency-chain)
17. [Crypto Function Name Mapping](#17-crypto-function-name-mapping)
18. [Unfinished Branding Residuals](#18-unfinished-branding-residuals)
19. [Upstream Sync Tracking](#19-upstream-sync-tracking)
20. [Appendix A — Full Waves Inventory](#appendix-a--full-dcc-inventory)

---

## 1. Introduction

DecentralChain (DCC) is an independent blockchain that forked the Waves protocol. The `@decentralchain/*` SDK packages published from this monorepo were migrated from the upstream `@waves/*` npm packages maintained across two GitHub organizations: [`wavesplatform`](https://github.com/wavesplatform) (124 repos) and [`Keeper-Wallet`](https://github.com/Keeper-Wallet) (10 repos).

**Not all of the Waves ecosystem has been migrated.** Of 134 upstream repositories, DCC forked or adopted **35+ repositories** across four dimensions:

- **25 TypeScript SDK packages**, all fully committed — every library needed to build, sign, serialize, and broadcast transactions on a Waves-protocol chain, modernized and published to npm as `@decentralchain/*`
- **`data-service` REST API application** (DCC-221, DCC-233) — Koa.js API at `api.decentralchain.io`
- **5 standalone/monorepo infrastructure repos**: node-scala (`Ecosystem/`), node-go (`Ecosystem/`), matcher (`Ecosystem/`), docs (`Ecosystem/`), blockchain-postgres-sync (Rust block ingestion — imported into monorepo as `apps/blockchain-postgres-sync` via `nx import` 2026-05-20)
- **8 JVM + RIDE Maven packages** — 6 JVM libraries (`packages/jvm/`) and the RIDE lang+repl sbt build (`packages/ride/`), all published to Maven Central as `io.decentralchain:*`

The remaining ~99 repos are multi-language SDKs, mobile wallets, infrastructure services, developer tooling, and experiments. This document maps what was forked, what was skipped, and what may be pursued in the future.

Every forked package has been:

- Rebranded from `@waves/*` and `@keeper-wallet/*` to `@decentralchain/*`
- Modernized beyond upstream (ESM-only, TypeScript 6.0.3 strict, Biome, Vitest, tsdown)
- Audited (3,747+ tests, 0 failures, 0 npm vulnerabilities)
- Published to npm under `@decentralchain/*`

The migration philosophy: **fork the protocol-critical core, modernize beyond upstream, build what Waves never built, selectively adopt high-value repos on demand, skip what doesn't serve the DCC mission.**

---

## 2. What is DecentralChain?

**DecentralChain** is an open blockchain protocol and development toolset for Web 3.0 applications and decentralized solutions. It is maintained by **Blockchain Costa Rica** (the `Decentral-America` GitHub org).

| Property | Value |
|:---------|:------|
| **Consensus** | Leased Proof of Stake (LPoS) |
| **Native Token** | DecentralCoin (DCC) — wire-format ID: `'DCC'` (see [§7](#7-wire-format-constraints)) |
| **Smart Contract Language** | Ride (non-Turing-complete, functional, expression-based) |
| **Block Time** | ~2 seconds (M5 microblocks) |
| **Chain IDs** | `?` (Mainnet, byte 63), `!` (Testnet, byte 33), `S` (Stagenet, byte 83) |
| **Signature Scheme** | Ed25519 / Curve25519 |
| **Hashing** | Blake2b-256, Keccak-256, SHA-256 |
| **Address Format** | Base58Check (1 + chainId + publicKeyHash + checksum) |
| **Transaction Types** | 1–18 (identical to Waves) |
| **Organization** | Blockchain Costa Rica / Decentral-America |

### DCC-Exclusive Features

| Feature | Description |
|:--------|:------------|
| **Inter-Chain Gateway** | Decentralized bridge for cross-chain asset transfers (ERC-20 ↔ DCC) |
| **Proof of Incentivized Sustainability** | Carbon credit generation per transaction; eco-friendly node hosting rewards |
| **Carbon Sequestration** | Tokenized carbon credits via Costa Rica's FONAFIFO program |
| **Native Swap** | AMM-powered on-chain token swap (constant product formula) — **DEFERRED: fully deleted; no files, no branch** |
| **CR Coin** | Social currency for Costa Rica built on DCC |
| **Cubensis Connect** | Browser wallet extension (replaces Keeper Wallet) |

---

## 3. Protocol Compatibility

DCC is byte-compatible with Waves at the protocol level, except for chain IDs.

| Parameter | Waves | DecentralChain | Notes |
|-----------|-------|----------------|-------|
| Mainnet chain ID | `W` (byte 87) | `?` (byte 63) | Hard-coded in all tx signing |
| Testnet chain ID | `T` (byte 84) | `!` (byte 33) | |
| Stagenet chain ID | `S` (byte 83) | `S` (byte 83) | **Shared** |
| Native asset ID | `DCC` | `DCC` | Wire-format string — cannot rename |
| Native asset display name | Waves | DecentralChain | User-facing only |
| Native asset ticker | DCC | DCC | UI display only |
| Transaction types | 1–18 | 1–18 | Identical set |
| Block structure | Identical | Identical | Same protobuf schemas |
| Signature scheme | Ed25519 / Curve25519 | Ed25519 / Curve25519 | Same crypto primitives |
| Address derivation | Same algorithm | Same algorithm | Only chain ID byte differs |
| RIDE language | Supported | Supported | Same compiler/interpreter |

**Key takeaway:** A transaction signed for Waves mainnet (`W`) is invalid on DCC mainnet (`?`) and vice versa. This is by design — independent chains with the same protocol.

---

## 4. Network & Infrastructure

### Endpoints

| Service | Waves | DecentralChain | Status |
|---------|-------|----------------|--------|
| **Mainnet node** | `nodes.wavesnodes.com` | `mainnet-node.decentralchain.io` | ✅ |
| **Testnet node** | `nodes-testnet.wavesnodes.com` | `testnet-node.decentralchain.io` | ✅ |
| **Stagenet node** | `nodes-stagenet.wavesnodes.com` | `stagenet-node.decentralchain.io` | ✅ |
| **Mainnet matcher** | `matcher.waves.exchange` | `mainnet-matcher.decentralchain.io` | ✅ |
| **Testnet matcher** | `matcher-testnet.waves.exchange` | `matcher.decentralchain.io` | ✅ |
| **Stagenet matcher** | `matcher-stagenet.waves.exchange` | `stagenet-matcher.decentralchain.io` | ✅ |
| **Data service API** | `api.wavesplatform.com` | `data-service.decentralchain.io` | ✅ |
| **Swap API** | `swap-api.keeper-wallet.app` | `swap-api.decentralchain.io` | ⏸️ DEFERRED |
| **Identity API** | `id.waves.exchange/api` | `id.decentralchain.io/api` | ❌ REMOVED — Cognito fully removed (DCC-117/DCC-118); zero app consumers |
| **Explorer** | `wavesexplorer.com` | `explorer.decentralchain.io` | ✅ |

### GitHub Organizations

| Ecosystem | GitHub Org | URL |
|:----------|:-----------|:----|
| **DecentralChain** | `Decentral-America` | [github.com/Decentral-America](https://github.com/Decentral-America) |
| **Waves** (upstream) | `wavesplatform` | [github.com/wavesplatform](https://github.com/wavesplatform) |
| **Keeper Wallet** | `Keeper-Wallet` | [github.com/Keeper-Wallet](https://github.com/Keeper-Wallet) |

### npm Scopes

| Ecosystem | npm Org |
|:----------|:--------|
| **DecentralChain** | [`@decentralchain`](https://www.npmjs.com/org/decentralchain) |
| **Waves** (upstream) | [`@waves`](https://www.npmjs.com/org/waves) |

---

## 5. SDK Package Map

Every `@decentralchain/*` package with its upstream Waves equivalent, sync status, and architectural layer.

| # | DCC Package | Waves Source | Org | Layer | Grafted | Published |
|---|------------|-------------|-----|-------|---------|-----------|
| 1 | types | ts-types | wavesplatform | Foundation | 🔗 | 2.0.1 |
| 2 | bignumber | bignumber | wavesplatform | Foundation | — | 1.2.1 |
| 3 | ts-lib-crypto | ts-lib-crypto | wavesplatform | Foundation | 🔗 | 2.0.1 |
| 4 | parse-json-bignumber | parse-json-bignumber | wavesplatform | Foundation | 🔗 | 2.0.1 |
| 5 | marshall | marshall | wavesplatform | Serialization | — | 1.0.1 |
| 6 | protobuf-schemas | protobuf-schemas | wavesplatform | Serialization | — | 3.0.0 |
| 7 | data-entities | waves-data-entities | wavesplatform | Domain Model | — | 3.0.1 |
| 8 | assets-pairs-order | assets-pairs-order | wavesplatform | Domain Model | — | 5.0.2 |
| 9 | oracle-data | oracle-data | wavesplatform | Domain Model | — | 1.0.1 |
| 10 | node-api | node-api-js | wavesplatform | API Client | 🔗 | 2.0.1 |
| 11 | transactions | waves-transactions | wavesplatform | Transaction Building | 🔗 | 5.0.1 |
| 12 | money-like-to-node | money-like-to-node | wavesplatform | Transaction Building | — | 1.0.1 |
| 13 | data-service-client | data-service-client-js | wavesplatform | API Client | 🔗 | 4.2.1 |
| 14 | browser-bus | waves-browser-bus | wavesplatform | Communication | 🔗 | 1.0.1 |
| 15 | ledger | waves-ledger-js | wavesplatform | Hardware Wallet | 🔗 | 5.1.1 |
| 16 | signature-adapter | waves-signature-adapter | wavesplatform | Signing | 🔗 | 7.0.1 |
| 17 | signer | signer | wavesplatform | Signing | — | 2.0.1 |
| 18 | ride | ride-js | wavesplatform | Smart Contracts | — | 2.3.1 |
| 19 | cubensis-connect | Keeper-Wallet-Extension | Keeper-Wallet | Application | 🔗 | — |
| 20 | cubensis-connect-types | waveskeeper-types | Keeper-Wallet | Wallet Types | 🔗 | 1.0.1 |
| 21 | cubensis-connect-provider | provider-keeper | Keeper-Wallet | Signing | 🔗 | 1.0.1 |
| 22 | scanner | WavesExplorerLite | wavesplatform | Application | — | — |
| 23 | swap-client | swap-client | Keeper-Wallet | DEX Integration | — | — | ⚫ Fully deleted — no files on disk, no git history, no `feat/swap` branch |
| 24 | crypto | waves-crypto | Keeper-Wallet | Foundation | 🔗 | 1.0.2 |
| 25 | data-service | data-service | wavesplatform | Application | 🔗 | — |
| 26 | node-api-grpc | node-api-grpc-js | wavesplatform | API Client | — | 1.0.0 | ✅ Committed — built from scratch with `@connectrpc/connect` |

**🔗 Grafted** = full upstream Waves git history preserved via `git filter-repo` or subtree merge.

### Notable Migration Details

- **cubensis-connect-provider**: All 412 upstream commits analyzed individually. ~260 Renovate noise, ~30 CI/tooling, 2 genuine bugs cherry-picked. DCC architecture intentionally diverged (7 modular src files / 126 tests vs Waves' 2 monolithic files / 32 tests).
- **cubensis-connect**: 1,305 upstream commits brought in via full rebase onto `dcc/master`. Branding re-applied: 86 files covering dep renames, network codes, URLs, manifest, i18n (10 locales), global API (KeeperWallet→CubensisConnect).
- **swap-client**: Upstream was private/deleted. Source extracted from `npm pack @keeper-wallet/swap-client@0.3.0`. Protobuf schema reverse-engineered from compiled output and verified wire-compatible. **Fully deleted from the repository — no files on disk, no git history, no `feat/swap` branch.**
- **crypto**: 234-commit Waves history preserved. Rust/WASM + TypeScript hybrid. Timing-safe HMAC comparison added (security fix). 44 tests, 99% coverage.
- **data-service**: 395-commit Waves history preserved via `git subtree add` (DCC-221, DCC-233). Koa.js REST API serving candles, pairs, and trades at `api.decentralchain.io`. DCC identity layer (chain IDs, endpoint branding) applied in **DCC-234**. Toolchain modernization (Biome, strict tsconfig, ESM) in **DCC-219/220/222**. Vitest migration in **DCC-223**.

---

## 6. Dependency Architecture

### Layer Model

| Layer | Packages | Role |
|-------|----------|------|
| **0 — Foundation** | types, bignumber, ts-lib-crypto, parse-json-bignumber, crypto, cubensis-connect-types | Core types, math, crypto, JSON parsing |
| **1 — Serialization** | marshall, protobuf-schemas | Binary/protobuf encode/decode for wire format |
| **2 — Domain Model** | data-entities, assets-pairs-order, oracle-data | Business objects (Money, Asset, OrderPrice, Oracle) |
| **3 — Transaction Building** | transactions, money-like-to-node | Construct, sign, and validate blockchain transactions |
| **4 — API Client** | node-api, data-service-client | HTTP clients for node REST API and data service |
| **5 — Communication** | browser-bus | Cross-window postMessage for browser apps |
| **6 — Hardware Wallet** | ledger | Ledger device integration via WebUSB |
| **7 — Signing** | signature-adapter, signer, cubensis-connect-provider | Multi-provider signing (seed, Ledger, wallet extension) |
| **8 — Smart Contracts** | ride | RIDE language compiler (wraps `@waves/ride-lang`) |
| **9 — Applications** | scanner, exchange, cubensis-connect, data-service | End-user apps |

### Dependency Graph

```
  types  (zero @decentralchain deps — pure types)
    ├── transactions (+ ts-lib-crypto, marshall, protobuf-schemas)
    ├── node-api (+ bignumber, ts-lib-crypto)
    └── signature-adapter (+ bignumber, data-entities, ledger, money-like-to-node, transactions)

  ts-lib-crypto  (zero @decentralchain deps — @noble/curves + @noble/hashes)
    ├── transactions
    ├── node-api
    ├── signer (+ node-api, types)
    └── ride (+ @waves/ride-lang, @waves/ride-repl)

  bignumber  (zero @decentralchain deps — bignumber.js)
    ├── data-entities
    ├── node-api
    └── signature-adapter

  marshall  (zero @decentralchain deps — base64-js, long)
    ├── transactions
    └── cubensis-connect-provider (+ cubensis-connect-types)

  protobuf-schemas  (zero @decentralchain deps — @bufbuild/protobuf)
    └── transactions

  ledger  (zero @decentralchain deps — @ledgerhq/logs)
    └── signature-adapter

  data-entities  (← bignumber)
    └── signature-adapter

  transactions  (← types, ts-lib-crypto, marshall, protobuf-schemas)
    └── signature-adapter

  node-api  (← types, bignumber, ts-lib-crypto)
    └── signer

  signature-adapter  (← types, bignumber, data-entities, ledger, money-like-to-node, transactions)

  signer  (← types, ts-lib-crypto, node-api)

  cubensis-connect-provider  (← cubensis-connect-types, marshall)

  Independent (no @decentralchain deps):
    parse-json-bignumber, assets-pairs-order, browser-bus,
    data-service-client, oracle-data, money-like-to-node,
    cubensis-connect-types, crypto

  Applications (consume SDK packages):
    cubensis-connect, exchange, scanner, data-service
```

---

## 7. Wire-Format Constraints

These values are embedded in the blockchain protocol itself. They **cannot** be renamed without a hard fork or breaking all existing clients, nodes, and signed data. They are **not bugs** — they are protocol constants.

| Value | Used For | Why Immutable |
|-------|----------|---------------|
| `'DCC'` | Native asset sentinel in API responses and transaction data | All nodes, SDKs, and DApps expect this string. Client-side sentinel — node returns `null` for native asset. 60+ references across 20+ files. Display name shows "DCC" in UIs. |
| `package dcc;` | Protobuf namespace in `.proto` files | Wire format for gRPC and `Any` types. Nodes expect `dcc.Transaction` on the wire. Renaming breaks all gRPC clients and serialization. |
| `'DccWalletAuthentication'` | Signing domain separator for message authentication | DCC canonical auth prefix. Unified across cubensis-connect, @decentralchain/transactions, and @decentralchain/signature-adapter in commit 86abbf880 (Mar 24, 2026). |
| `'DCC'` in Ledger APDU | Hardware wallet firmware constant | Burned into Ledger device app. Would require custom Ledger app submission. |
| BIP-44 coin type `5741564` | HD wallet derivation path | Intentional — DCC users keep their existing Waves-derived keys. |

### Intentional Protocol References (Will Not Fix)

| Reference | Reason | Locations |
|-----------|--------|-----------|
| `'DCC'` asset ID | Client sentinel for native asset | All SDK packages |
| `'DccWalletAuthentication'` prefix | Cryptographic domain separator | `cubensis-connect/src/messages/utils.ts`, `packages/sdk/transactions/src/requests/auth.ts`, `packages/sdk/signature-adapter/src/prepareTx/constants.ts` |
| Protobuf `dcc` namespace | Wire-format package name | `protobuf-schemas/proto/dcc/**` |
| `@waves/ride-lang` + `@waves/ride-repl` | Chain-agnostic Scala.js binaries — same bytecode works on any Waves-protocol chain | `ride-js/package.json` |

---

## 8. Remaining Upstream Dependencies

All upstream Waves npm dependencies have been forked. **Zero unresolved upstream deps.**

**All resolved:**
- ~~`@waves/ride-lang` 1.6.1~~ → Forked as `@decentralchain/ride-lang@1.6.2` (DCC-252 ✅). Full git history (1,991 commits) in `packages/ride/lang/js` (workspace:*).
- ~~`@waves/ride-repl` 1.6.1~~ → Forked as `@decentralchain/ride-repl@1.6.2` (DCC-252 ✅). Full git history in `packages/ride/repl/js` (workspace:*).
- ~~`@keeper-wallet/swap-client`~~ → Forked as `@decentralchain/swap-client@1.0.0` (DCC-69); fully deleted — no files on disk, no git history
- ~~`@keeper-wallet/waves-crypto`~~ → Forked as `@decentralchain/crypto@1.0.0` (DCC-70). All 22 cubensis-connect import sites migrated (DCC-59). See [§9](#9-crypto-library-architecture) for the two-library architecture.

---

## 9. Crypto Library Architecture

The ecosystem uses **two** cryptographic libraries — this is intentional, not duplication.

| Library | Paradigm | Used By | Purpose |
|---------|----------|---------|---------|
| `@decentralchain/ts-lib-crypto` | **Sync**, pure JS (`@noble/curves`) | 4 SDK packages + exchange app | General-purpose SDK crypto |
| `@decentralchain/crypto` | **Async**, Rust/WASM + WebCrypto | cubensis-connect | Browser wallet crypto (hardware-accelerated AES) |

### Why Both Exist

The wallet extension needs async WebCrypto (`crypto.subtle`) for hardware-accelerated AES encryption of user seeds. The SDK packages need synchronous crypto for simple sign/verify workflows. Different trust boundaries, different performance requirements.

### Why You Cannot Replace One With the Other

| Dimension | `@decentralchain/ts-lib-crypto` | `@decentralchain/crypto` |
|-----------|--------------------------------|--------------------------|
| `signBytes` | Takes raw bytes | Takes wrapper object |
| `encryptSeed` return | Base64 string | `Uint8Array` |
| Seed encryption | Pure JS AES | WebCrypto AES (hardware-accelerated) |
| Call pattern | Synchronous | All calls `await`-ed |

Naive replacement would require refactoring all 21+ call sites in cubensis-connect, lose hardware-accelerated encryption, and change return types throughout the codebase.

---

## 10. Ecosystem Gap Analysis

Of 134 upstream Waves repositories, DCC's coverage:

| Category | Waves Count | DCC Status |
|----------|-------------|------------|
| **TypeScript SDK core** | 24 | ✅ All forked and modernized |
| **DCC originals** (no Waves equivalent) | — | 9 repos (exchange, configs, gateway, ride templates, etc.) |
| **Archived/deprecated** | 7 | ❌ Skip — dead upstream |
| **Multi-language SDKs** (Java, Python, Go, Rust, C#, etc.) | ~20 | ⏸️ Fork on community demand |
| **Mobile wallets** (iOS/Android) | 4 | ⏸️ Separate initiative |
| **Infrastructure** (Scala node, matcher, Rust microservices) | ~20 | 🔍 Evaluate selectively — `data-service` ✅ imported as `apps/data-service` (DCC-221) |
| **Developer tooling** (IDE, surfboard, ride-vscode) | ~8 | 🟡 High value candidates |
| **Internal/CI/trivial** | ~25 | ❌ Skip |
| **Applications** (GamesUI, DAO, experiments) | ~10 | ❌ Skip — DCC builds its own |

### High-Value Fork Candidates

Ranked by strategic value to DCC:

| Priority | Waves Repo | Why | Effort |
|----------|-----------|-----|--------|
| ✅ **Adopted** | `Waves` node (1171★) | Forked as `Ecosystem/node-scala` — DCC protocol patches (chain IDs, namespace rename `com.wavesplatform→com.decentralchain`, CI pipelines, security hardening). Upstream base: commit `5c347100` (v1.6.1, Feb 2026). | Done |
| ✅ **Adopted** | `gowaves` (255★) | Forked as `Ecosystem/node-go` — upstream base: commit `df50e74c`. DCC module rename, branding, CI overhaul. v0.11.1 evaluated (Mar 2026): adds Features 22–25, all 3 missing proto files, CommitToGeneration field 120. Full upgrade deferred until stable release. | Done |
| ✅ **Adopted** | `dex` / matcher (18★) | Forked as `Ecosystem/matcher` — shares node-scala base `5c347100`. Wired to `io.decentralchain:java-sdk:2.0.0-SNAPSHOT` (DCC-263). | Done |
| ✅ **Adopted** | `blockchain-postgres-sync` (16★) | Forked at `b80b81b` (v1.0.2, Sep 2025); imported into monorepo as `apps/blockchain-postgres-sync` via `nx import` (2026-05-20). DCC branding, full audit (4 rounds), all panics eliminated, 84+ tests added (DCC-213/214). Type-19 (CommitToGeneration) `txs_19` table added (migration `20260628000000`). gRPC dedup+upsert fix and Loader.scala re-seek fix applied. Deployed testnet image `fbece975a`. | Done |
| ✅ **Adopted** | `WavesJ` (47★) | Forked as [`packages/jvm/java-sdk`](https://github.com/Decentral-America/DecentralChain/tree/dev/packages/jvm/java-sdk) — `io.decentralchain:java-sdk:2.0.0-SNAPSHOT` (DCC-251/263). Upstream: `2f78fd3` (v1.6.4-SNAPSHOT, 2026-02-20). Java 25, Maven Central, JaCoCo/SpotBugs/PMD quality gates. | Done |
| ✅ **Adopted** | `curve25519-java` | Forked as `packages/jvm/curve25519` — upstream: `80b0a5de` (Oct 2023, last upstream release). Maven + Java 25 migration (DCC-260). | Done |
| ✅ **Adopted** | `waves-transactions-java` | Forked as `packages/jvm/transactions` — upstream: `e6afed3a` (v1.2.7). Maven + Java 25 (DCC-240). | Done |
| ✅ **Adopted** | `blst-java` | Forked as `packages/jvm/blst` — upstream: `a7d3e39a`. BLS12-381 JNI bindings, Java 25 (DCC-242). | Done |
| ✅ **Adopted** | `zdcc` | Forked as `packages/jvm/groth16` — upstream: `d4546dbb`. ZK-SNARK (Groth16) JNI bindings (DCC-261). | Done |
| ✅ **Adopted** | `Waves/lang` + `Waves/repl` | Forked as `packages/ride/` — RIDE VM (lang/) + REPL (repl/) extracted from node-scala via `git filter-repo`, 1,991 upstream commits preserved. Upstream base: `5c347100` (v1.6.1). DCC-252. | Done |
| ✅ **Done** | `data-service` | Imported as `apps/data-service` — full 395-commit history via `git subtree` (DCC-221, DCC-233) | — |
| 🟢 **Tier 1** | `ride-vscode` (13★) | VS Code Ride extension = instant developer onboarding | Low |
| 🟢 **Tier 1** | `surfboard` (10★) | CLI for Ride development — "Hardhat for Ride" | Medium |
| 🟡 **Tier 2** | `dcc-ide` (22★) | Browser IDE for Ride — good for hackathons | High |
| 🟡 **Tier 2** | `ride-examples` (31★) | Example Ride contracts — documentation value | Very Low |
| ✅ **Done** | `node-api-grpc-js` (0★) | DCC built `@decentralchain/node-api-grpc v1.0.0` from scratch using `@connectrpc/connect` (HTTP/2) in `packages/sdk/node-api-grpc/`. Committed and published. Upstream: `wavesplatform/node-api-grpc-js` at `2a6202f` (v0.0.4, Nov 2024). | — |
| ⚪ **Tier 3** | `waves-python` (10★) | Python SDK — fork when Python devs request | On demand |

### What's Not Worth Forking

| Category | Reason |
|----------|--------|
| Archived repos (7) | Dead upstream — inheriting tech debt with no upstream fixes |
| C#/C++/PHP SDKs | Tiny communities, zero demand signal |
| Mobile wallets (iOS/Android) | $500K+ commitment each; browser extension covers wallet for now |
| WavesGUI (399★) | Legacy Angular wallet; DCC has modern exchange + cubensis-connect |
| Rust microservices cluster (10 repos) | Tightly coupled to wx.network infrastructure |
| ~~ZK cryptography (zdcc)~~ | ✅ Forked as `packages/jvm/groth16` — required as node-scala native dep |
| `groth16verify` | Only relevant if DCC adds new ZK transaction types |

---

## 11. Strategic Roadmap

### Completed

- [x] Fork and modernize entire TypeScript SDK core (24 packages)
- [x] Publish all packages to npm under `@decentralchain/*`
- [x] Consolidate into monorepo with Nx + pnpm
- [x] Fork `@keeper-wallet/swap-client` → `@decentralchain/swap-client` (DCC-69) — subsequently fully deleted
- [x] Fork `@keeper-wallet/waves-crypto` → `@decentralchain/crypto` (DCC-70)
- [x] Import `wavesplatform/data-service` → `apps/data-service` (DCC-221, DCC-233)
- [x] Fork `wavesplatform/Waves` node → `Ecosystem/node-scala` — DCC protocol patches, CI, security hardening (DCC-146/147/148/149/150)
- [x] Fork `wavesplatform/gowaves` → `Ecosystem/node-go` — module rename, branding, CI overhaul (DCC-165)
- [x] Fork `wavesplatform/dex` matcher → `Ecosystem/matcher` — wired to DCC Java SDK (DCC-263)
- [x] Fork `wavesplatform/blockchain-postgres-sync` → `apps/blockchain-postgres-sync` (in monorepo via `nx import` 2026-05-20) — DCC branding, full audit (DCC-213/214), 84+ tests; type-19 (CommitToGeneration) support, gRPC dedup+upsert fix, Loader.scala re-seek fix; testnet image `fbece975a` deployed 2026-06-28
- [x] Extract `wavesplatform/Waves` lang+repl → `packages/ride/` — 1,991-commit history, Maven + npm dual publish (DCC-252)
- [x] Fork `wavesplatform/WavesJ` → `packages/jvm/java-sdk` — Java 25, DCC namespace, Maven Central (DCC-251/263)
- [x] Fork `wavesplatform/curve25519-java` → `packages/jvm/curve25519` — Maven + Java 25 (DCC-260)
- [x] Fork `wavesplatform/waves-transactions-java` → `packages/jvm/transactions` — Maven + Java 25 (DCC-240)
- [x] Fork `wavesplatform/blst-java` → `packages/jvm/blst` — BLS12-381 JNI, Java 25 (DCC-242)
- [x] Fork `wavesplatform/zdcc` → `packages/jvm/groth16` — ZK-SNARK JNI, Java 25 (DCC-261)
- [x] Fork `wavesplatform/waves-crypto-java` → `packages/jvm/crypto` — `io.decentralchain:crypto:2.0.7`, BouncyCastle 1.84, BLS12-381, 33 tests (DCC-264)

### In Progress

- [ ] Promote npm packages from `next` → `latest` dist-tag
- [x] Commit `packages/sdk/node-api-grpc/` — `@decentralchain/node-api-grpc v1.0.0` gRPC client built on `@connectrpc/connect`

### Next

- [ ] Fork & rebrand `ride-vscode` → DCC Ride VS Code extension
- [ ] Fork & rebrand `ride-examples` → `dcc-ride-examples`
- [ ] Fork `surfboard` → `@decentralchain/surfboard` CLI
- [x] ~~Upgrade `node-go` proto submodule to gowaves v0.11.1~~ — CANCELLED (node-go archived; node-scala is production node)

### Future

- [ ] Fork language SDKs (Python, Go, Rust, C#) on community demand
- [ ] Mobile wallet initiative (dedicated team required)

---

## 12. DCC-Original Projects

These exist in the `Decentral-America` org with **no Waves upstream equivalent**:

| Repo | Purpose | Status |
|------|---------|--------|
| **exchange** | DCC trading interface (Vite + React) | Active — in monorepo `apps/` |
| ~~**dcc-configs**~~ | Shared runtime configuration files | **Eliminated** — content inlined into `constants.ts`; repo was 404 |
| **DCC-ERC20-Gateway** | Cross-chain ERC-20 ↔ DCC gateway (Python) | Active |
| **dcc-ride-templates** | Ride smart contract templates | Active |
| ~~**dcc-token-filters**~~ | Token filtering/curation lists | **Eliminated** — scam list and names inlined as static data |
| ~~**dcc-community**~~ | Community repo | **Eliminated** — 404, all references removed |
| ~~**dcc-client-config**~~ | Client configuration service | **Eliminated** — `ConfigService` dead code removed |
| **DecentralScan2.0** | Next-gen block explorer | Active |
| ~~**k8s-manifests**~~ | Kubernetes deployment manifests | **Eliminated** from scope — IPFS deploy requires no server |
| **passport** | Identity/auth service (Python) | Active |

These represent DCC's **differentiation** — features Waves either never built or that DCC is building better.

---

## 13. Concept Mapping Reference

### Ride Language — Quick Reference

Ride is the smart contract language used on both Waves and DecentralChain. It is non-Turing-complete (no loops, no recursion — iteration via `FOLD<N>`), functional, statically typed, and lazy-evaluated.

| Topic | DecentralChain Docs | Waves Docs |
|:------|:-------------------|:-----------|
| Syntax Basics | [dcc/ride/syntax](https://docs.decentralchain.io/en/master/03_ride-language/01_syntax-basics.html) | [dcc/ride/getting-started](https://docs.dcc.tech/en/ride/getting-started) |
| Data Types | [dcc/ride/data-types](https://docs.decentralchain.io/en/master/03_ride-language/02_data-types.html) | [dcc/ride/data-types](https://docs.dcc.tech/en/ride/data-types/) |
| Functions | [dcc/ride/functions](https://docs.decentralchain.io/en/master/03_ride-language/03_functions.html) | [dcc/ride/functions](https://docs.dcc.tech/en/ride/functions/) |
| Script Types | [dcc/ride/scripts](https://docs.decentralchain.io/en/master/03_ride-language/04_script-types.html) | [dcc/ride/script](https://docs.dcc.tech/en/ride/script/) |
| Structures | [dcc/ride/structures](https://docs.decentralchain.io/en/master/03_ride-language/05_structures.html) | [dcc/ride/structures](https://docs.dcc.tech/en/ride/structures/) |
| FOLD iterations | [dcc/ride/fold](https://docs.decentralchain.io/en/master/03_ride-language/06_iterations-with-fold.html) | [dcc/ride/fold](https://docs.dcc.tech/en/ride/functions/built-in-functions/) |
| dApp-to-App | [dcc/ride/dapp-invocation](https://docs.decentralchain.io/en/master/03_ride-language/07_dapp-to-app-invocation.html) | [dcc/ride/dapp-to-dapp](https://docs.dcc.tech/en/ride/advanced/dapp-to-app/) |

### Waves → DecentralChain Concept Map

| Concept | Waves Docs | DecentralChain Docs |
|:--------|:-----------|:--------------------|
| Account | [dcc/account](https://docs.dcc.tech/en/blockchain/account/) | [dcc/account](https://docs.decentralchain.io/en/master/02_decentralchain/01_account.html) |
| Token (Asset) | [dcc/token](https://docs.dcc.tech/en/blockchain/token/) | [dcc/token](https://docs.decentralchain.io/en/master/02_decentralchain/02_token%28asset%29.html) |
| Transaction | [dcc/transaction](https://docs.dcc.tech/en/blockchain/transaction/) | [dcc/transaction](https://docs.decentralchain.io/en/master/02_decentralchain/03_transaction.html) |
| Block | [dcc/block](https://docs.dcc.tech/en/blockchain/block/) | [dcc/block](https://docs.decentralchain.io/en/master/02_decentralchain/04_block.html) |
| Node | [dcc/node](https://docs.dcc.tech/en/blockchain/node/) | [dcc/node](https://docs.decentralchain.io/en/master/02_decentralchain/05_node.html) |
| DEX Order | [dcc/order](https://docs.dcc.tech/en/blockchain/order/) | [dcc/order](https://docs.decentralchain.io/en/master/02_decentralchain/06_order.html) |
| Oracle | [dcc/oracle](https://docs.dcc.tech/en/blockchain/oracle/) | [dcc/oracle](https://docs.decentralchain.io/en/master/02_decentralchain/07_oracle.html) |
| Networks | [dcc/networks](https://docs.dcc.tech/en/blockchain/blockchain-network/) | [dcc/networks](https://docs.decentralchain.io/en/master/02_decentralchain/08_mainnet-testnet-stagenet.html) |
| Binary Format | [dcc/binary-format](https://docs.dcc.tech/en/blockchain/binary-format/) | [dcc/binary-format](https://docs.decentralchain.io/en/master/02_decentralchain/10_binary-format.html) |
| Ride Language | [dcc/ride](https://docs.dcc.tech/en/ride/) | [dcc/ride](https://docs.decentralchain.io/en/master/03_ride-language/index.html) |

### SDK Package Name Mapping

| Waves Package | DecentralChain Package |
|:-------------|:----------------------|
| `@waves/ts-types` | `@decentralchain/types` |
| `@waves/bignumber` | `@decentralchain/bignumber` |
| `@waves/ts-lib-crypto` | `@decentralchain/ts-lib-crypto` |
| `@waves/marshall` | `@decentralchain/marshall` |
| `@waves/waves-transactions` | `@decentralchain/transactions` |
| `@waves/signature-adapter` | `@decentralchain/signature-adapter` |
| `@waves/signer` | `@decentralchain/signer` |
| `@waves/node-api-js` | `@decentralchain/node-api` |
| `@waves/data-service-client-js` | `@decentralchain/data-service-client` |
| `@waves/waves-browser-bus` | `@decentralchain/browser-bus` |
| `@waves/parse-json-bignumber` | `@decentralchain/parse-json-bignumber` |
| `@waves/data-entities` | `@decentralchain/data-entities` |
| `@waves/oracle-data` | `@decentralchain/oracle-data` |
| `@waves/ledger` | `@decentralchain/ledger` |
| `@waves/assets-pairs-order` | `@decentralchain/assets-pairs-order` |
| `@waves/protobuf-schemas` | `@decentralchain/protobuf-schemas` |
| `@waves/money-like-to-node` | `@decentralchain/money-like-to-node` |
| `@waves/ride-js` | `@decentralchain/ride` |
| `@keeper-wallet/waves-crypto` | `@decentralchain/crypto` |
| `@keeper-wallet/swap-client` | `@decentralchain/swap-client` (⚫ fully deleted) |
| `@keeper-wallet/waveskeeper-types` | `@decentralchain/cubensis-connect-types` |
| `@keeper-wallet/provider-keeper` | `@decentralchain/cubensis-connect-provider` |
| Keeper-Wallet-Extension | `cubensis-connect` (app) |
| WavesExplorerLite | `scanner` (app) |

---

## 14. Feature Parity — Cubensis Connect vs Waves Keeper

| Feature | Waves Keeper | Cubensis Connect | Gap |
|---------|-------------|------------------|-----|
| Create wallet (seed phrase) | ✅ | ✅ | — |
| Import seed / keystore / Ledger | ✅ | ✅ | — |
| Import via email (Cognito) | ✅ | ❌ REMOVED | Fully removed (DCC-117, DCC-118) — 1-of-1 seed model, no custodial component |
| Multi-account, multi-network | ✅ | ✅ | — |
| Send/sign all 18 transaction types | ✅ | ✅ | — |
| Sign arbitrary data | ✅ | ✅ | — |
| Transaction history | ✅ | ✅ | — |
| NFT display | ✅ (5 vendors) | ✅ (fallback only) | All upstream Waves vendors removed — hardcoded Waves mainnet addresses, dead on DCC |
| NFT display (DccDomains) | ✅ | ❌ | **Removed** — no DCC domain service |
| `.dcc` address resolution | ✅ | ❌ | **Removed** — requires domain resolution API |
| In-wallet swap | ✅ | ⏸️ DEFERRED | Swap removed from launch scope; preserved in `feat/swap` branch |
| DApp browser permissions | ✅ | ✅ | — |
| Idle auto-lock | ✅ | ✅ | — |
| Leasing | ✅ | ✅ | — |
| dccAuth (message signing) | ✅ (dccAuth) | ✅ | Renamed, functionally identical |
| `CubensisConnect` global API | `DccKeeper` | ✅ | Deprecated `KeeperWallet`/`DccKeeper` aliases maintained |
| Sentry error reporting | ✅ | ⚠️ | No DSN configured — errors are silently dropped |
| Extension store listing | ✅ | ❌ | Not published to Chrome Web Store or Firefox AMO |
| Remote config updates | ✅ | ✅ | Inlined into `constants.ts` — no external CDN dependency |

### NFT Vendor System

The wallet uses a vendor-based plugin pattern where each NFT project has a dedicated renderer. All upstream Waves vendors have been **removed** — they used hardcoded Waves mainnet DApp addresses (`3P...`) that cannot exist on DCC's chain (different chain ID). The `Unknown` fallback renders all NFTs as generic cards.

| Vendor | Status | Reason |
|--------|--------|--------|
| ~~Ducks~~ | ❌ Removed | Waves-only (`dccducks.com`) — hardcoded address `3PDVuU45H7Eh5dmtNbnRNRStGwULA7NY6Hb` |
| ~~Ducklings~~ | ❌ Removed | Waves-only (`dccducks.com`) — hardcoded address `3PKmLiGEfqLWMC1H9xhzqvAZKUXfFm8uoeg` |
| ~~DucksArtefacts~~ | ❌ Removed | Waves-only (`dccducks.com`) — hardcoded address `3P5E9xamcWoymiqLx8ZdmR7o4fJSRMGp1WR` |
| ~~Puzzle~~ | ❌ Removed | Waves-only (`puzzlemarket.org`) — hardcoded address `3PFQjjDMiZKQZdu5JqTHD7HwgSXyp9Rw9By` |
| ~~SignArt~~ | ❌ Removed | Waves-only (`sign-art.app` — defunct) — hardcoded address `3PDBLdsUrcsiPxNbt8g2gQVoefKgzt3kJzV` |
| ~~DccDomains~~ | ❌ Removed | No DCC domain service |
| Unknown (fallback) | ✅ | Renders all NFTs as generic cards |

**All NFTs now render with the "Unknown" fallback** — a generic card showing creator, name, and description. No crash, no data loss. When DCC-native NFT projects launch, new vendors can be implemented with DCC mainnet addresses.

---

## 15. External Services & Dependencies

### DCC-Controlled Services

| Service | URL | Function |
|---------|-----|----------|
| Data Service API | `api.decentralchain.io` | Asset info, ticker data |
| Swap API | `swap-api.decentralchain.io` | Token swap routing & execution — ⏸️ DEFERRED |
| ~~Identity API~~ | ~~`id.decentralchain.io/api`~~ | ~~Email-based account management~~ — **REMOVED** (DCC-117/DCC-118) |
| ~~Cognito Proxy~~ | ~~`decentralchain.io/cognito`~~ | ~~AWS Cognito auth proxy~~ — **REMOVED** (DCC-117/DCC-118) |
| ~~Remote Config CDN~~ | ~~`raw.githubusercontent.com/Decentral-America/dcc-configs/main/main.json`~~ | ~~Runtime config~~ — **REMOVED**; inlined into `constants.ts` |
| ~~Suspicious Token List~~ | ~~`raw.githubusercontent.com/Decentral-America/dcc-community/master/...`~~ | ~~Scam token CSV~~ — **REMOVED**; inlined as static data |

### Third-Party Services (Not DCC-Controlled)

*None.* All upstream Waves third-party service integrations (Ducks/dccducks.com, Puzzle/puzzlemarket.org, SignArt/sign-art.app) have been removed. These were Waves ecosystem projects with hardcoded Waves mainnet addresses — dead code on DCC.

---

## 16. Supply-Chain Dependency Chain

The dependency chains through DCC packages. `crypto` and `ts-lib-crypto` are **independent** libraries (see [§9](#9-crypto-library-architecture)). `@waves/ride-lang` + `@waves/ride-repl` forked as `@decentralchain/ride-lang` + `@decentralchain/ride-repl` (DCC-252 ✅). Zero unforked upstream Waves npm dependencies remain. `swap-client` was forked (DCC-69) but subsequently fully deleted — no files on disk, no git history.

```
@decentralchain/crypto  ← FORKED (DCC-70) ✅  [was @keeper-wallet/waves-crypto]
  └── cubensis-connect (22 import sites migrated — DCC-59) ✅

@decentralchain/ts-lib-crypto  (independent — uses @noble/curves, NOT @decentralchain/crypto)
  └── @decentralchain/transactions
        └── @decentralchain/signature-adapter
              └── @decentralchain/signer
        └── @decentralchain/node-api
  └── @decentralchain/signer
  └── @decentralchain/ride
  └── @decentralchain/node-api

@decentralchain/marshall
  └── @decentralchain/transactions
        └── (see above)
  └── @decentralchain/protobuf-schemas (proto namespace: dcc)
  └── @decentralchain/cubensis-connect-provider

@decentralchain/swap-client  ← FORKED (DCC-69) then DELETED ✅
  └── cubensis-connect (swap feature only — removed)

@decentralchain/ride-lang + @decentralchain/ride-repl  ← FORKED (DCC-252) ✅
  └── @decentralchain/ride
```

---

## 17. Crypto Function Name Mapping

Reference mapping between the upstream `@keeper-wallet/waves-crypto` and the forked `@decentralchain/crypto`. Names look similar but **APIs are NOT drop-in compatible** — different signatures and return types.

| waves-crypto function | ts-lib-crypto equivalent | Compatible? |
|---|---|---|
| `base58Decode` | `base58Decode` | ✅ Exact |
| `base58Encode` | `base58Encode` | ✅ Exact |
| `base64Decode` | `base64Decode` | ✅ Exact |
| `base64Encode` | `base64Encode` | ✅ Exact |
| `base16Decode` | `base16Decode` | ✅ Exact |
| `base16Encode` | `base16Encode` | ✅ Exact |
| `blake2b` | `blake2b` | ✅ Exact |
| `keccak` | `keccak` | ✅ Exact |
| `signBytes` | `signBytes` | ⚠️ Same name, **different signature** |
| `verifyAddress` | `verifyAddress` | ✅ Exact |
| `verifySignature` | `verifySignature` | ✅ Exact |
| `decryptSeed` | `decryptSeed` | ⚠️ Same name, **different return type** |
| `encryptSeed` | `encryptSeed` | ⚠️ Same name, **different return type** |
| `createAddress` | `address` / `buildAddress` | ❌ Rename required |
| `createPrivateKey` | `privateKey` | ❌ Rename required |
| `createPublicKey` | `publicKey` | ❌ Rename required |
| `createSharedKey` | `sharedKey` | ❌ Rename required |
| `decryptMessage` | `messageDecrypt` | ❌ Rename required |
| `encryptMessage` | `messageEncrypt` | ❌ Rename required |
| `generateRandomSeed` | `randomSeed` | ❌ Rename required |
| `utf8Decode` | `bytesToString` | ❌ Rename required |
| `utf8Encode` | `stringToBytes` | ❌ Rename required |

---

## 18. Unfinished Branding Residuals

Actionable items where Waves references remain and should be cleaned up:

*None outstanding.*

### Resolved Branding Items

- ~~`support.waves.exchange` in error message~~ → Cleaned up
- ~~`web.keeper-wallet.app` in whitelist~~ → Removed
- ~~`swap.keeper-wallet.app` in whitelist~~ → Removed
- ~~`dcc-community` repo name in URL (`controllers/assetInfo.ts:34`)~~ → Feature removed entirely (`05d55efd2`): scam-token CSV was never fetchable (repo 404 since fork); all 3 layers removed (fetch/store, `isSuspicious` flag, Settings UI toggle). Moot.

### UX Regressions vs Upstream

| Feature | Impact | Effort to Restore | Priority |
|---------|--------|-------------------|----------|
| ~~DccDomains NFT vendor~~ | ~~NFTs render as "Unknown"~~ | ~~Low (re-add vendor)~~ | ~~Low~~ — **Moot**: all Waves vendors removed; DCC-native vendors TBD |
| `.dcc` address resolution | Cannot type domain names | Medium — needs API | Medium |
| Sentry error reporting | No runtime error visibility | Low (create Sentry project, set DSN) | **High** |
| Extension store listings | Users must side-load | Medium (store review process) | **High** |

---

## 19. Upstream Sync Tracking

> **Purpose**: Map every monorepo package to its Waves upstream repo and track the last shared commit. Updated whenever upstream changes are ported.
>
> **Why manual?** DCC was cloned from Waves without GitHub's fork mechanism. The repos share commit history, so `git log` and `git diff` work across both trees — but syncing is a review-and-port process, not an automated merge.
>
> **AI agents**: The complete sync procedure is documented as a skill at `.github/skills/upstream-sync/SKILL.md`. Use the `/upstream-sync` prompt to invoke it. The skill contains the full workflow: fetch, diff, evaluate, port, validate, commit, and update this table.

> **Commit count notation** — three different methods are used; they are NOT directly comparable across rows:
> - `(#N)` = total commit count in that standalone package's git history (`git rev-list --count HEAD` inside the upstream or DCC standalone repo). Used for TypeScript SDK packages, JVM libs, standalone forks (node-go, node-scala).
> - `(lang↑ N)` / `(repl↑ N)` = per-path commit count: `git log --oneline [commit] -- [path] | wc -l`. Used for packages extracted from a sub-directory of a larger repo.
> - `(squash↑N)` upstream / `(overlay↑N)` DCC = squash-import method: upstream N = total upstream commits collapsed to one squash merge; DCC N = commits added per-path after the squash import.
> - **Delta meaning**: DCC `#` − upstream `#` = DCC-originated commits added on top of the sync point. Valid only when both sides use the same counting method.

### Standalone Ecosystem Repos → Upstream Map

These repos live under `Ecosystem/` (standalone) or `apps/` (imported into monorepo) and track upstream Waves sources independently.

| Repo | DCC Path | Upstream Repo | Upstream Commit | DCC Commit | Date | Activity |
|------|----------|---------------|----------------|------------|------|----------|
| node-scala | `Ecosystem/node-scala` | [wavesplatform/Waves](https://github.com/wavesplatform/Waves) | `c1fcc5e0` (v1.6.3 / Jun 3 2026) | `71bdc31f` | 2026-06-24 | 🟢 Active | ✅ fully synced — upstream HEAD + 4 DCC-original commits: `82b8052e` fix(stateHash) BlockDiffer prevStateHash bug; `71bdc31f` feat(testnet) generation-period-length=100; testnet genesis + CI fixes |
| node-go | ~~`Ecosystem/node-go`~~ | [wavesplatform/gowaves](https://github.com/wavesplatform/gowaves) | — | — | — | ⚫ Archived — directory deleted; node-scala is production node |
| matcher | `Ecosystem/matcher` | [wavesplatform/dex](https://github.com/wavesplatform/dex) | `e57776b0` (Feb 7 2023 — upstream dead) | `be2c4b16` (#12,707) | 2026-06-23 | 💤 Dormant — upstream abandoned since Feb 2023; DCC has all upstream commits |
| blockchain-postgres-sync | `apps/blockchain-postgres-sync` | [wavesplatform/blockchain-postgres-sync](https://github.com/wavesplatform/blockchain-postgres-sync) | `8c0b0c9b` (May 25 2026) | `fbece975a` | 2026-06-28 | 🟢 Active | ✅ fully synced — upstream HEAD + 3 DCC-original commits: type-19 (CommitToGeneration) `txs_19` table (migration `20260628000000`); gRPC duplicate-block dedup+upsert fix (`pg.rs`); Loader.scala re-seek root-cause fix. Deployed to testnet. |
| docs | `Ecosystem/docs` | [wavesplatform/waves-documentation](https://github.com/wavesplatform/waves-documentation) | — (no tracked SHA; initial import was manual) | `79111f9` (#131) | 2026-06-23 | 💤 Dormant |

### TypeScript SDK Packages → Upstream Map

Each row maps a monorepo package to its Waves upstream. **Upstream Commit** is the last Waves commit we've incorporated. **DCC Commit** is where that sync lives in our monorepo history.

| # | Monorepo Path | Upstream Repo | Upstream Commit | DCC Commit | Date | Activity |
|---|--------------|---------------|----------------|------------|------|----------|
| 1 | `packages/sdk/types` | [wavesplatform/ts-types](https://github.com/wavesplatform/ts-types) | `ee4a0145` (v1.3.1 / Mar 10 2026) | `ce09e898` | 2026-06-23 | 🟢 Active | ✅ fully synced — CommitToGeneration types already present; upstream HEAD CI-only |
| 2 | `packages/sdk/bignumber` | [wavesplatform/bignumber](https://github.com/wavesplatform/bignumber) | `ee66601c` (v1.1.1 / Jul 2024) | `ce09e898` (#12 path) | 2026-06-23 | 💤 Dormant | ✅ fully synced — upstream HEAD; dormant since 2024 |
| 3 | `packages/sdk/ts-lib-crypto` | [wavesplatform/ts-lib-crypto](https://github.com/wavesplatform/ts-lib-crypto) | `e2fc2313` (#160) | `ce09e898` (#15 path) | 2026-04-20 | 🟢 Active | ✅ fully synced — upstream HEAD; ↓1 reviewed N/A: node-forge bump irrelevant (DCC uses @noble/curves) |
| 4 | `packages/sdk/parse-json-bignumber` | [wavesplatform/parse-json-bignumber](https://github.com/wavesplatform/parse-json-bignumber) | `3ec759a5` (#34) | `ce09e898` (#12 path) | 2020-06-02 | 💤 Dormant | ✅ fully synced — upstream dormant since 2020 |
| 5 | `packages/sdk/marshall` | [wavesplatform/marshall](https://github.com/wavesplatform/marshall) | `85e43120` (Apr 21 2026) | `ce09e898` | 2026-06-23 | 🟢 Active | ✅ fully synced — order v3 and all dep bumps already present in DCC |
| 6 | `packages/sdk/protobuf-schemas` | [wavesplatform/protobuf-schemas](https://github.com/wavesplatform/protobuf-schemas) | `003f2cef` (Apr 20 2026) | `ce09e898` | 2026-06-23 | 🟢 Active | ✅ fully synced — upstream changes are protobufjs toolchain only; N/A (DCC uses @bufbuild/protobuf) |
| 7 | `packages/sdk/data-entities` | [wavesplatform/waves-data-entities](https://github.com/wavesplatform/waves-data-entities) | `c611b1d2` (v4.0.1 / Aug 2021) | `ce09e898` | 2026-06-23 | 💤 Dormant | ✅ fully synced — rounding fix already present; upstream dormant since 2021 |
| 8 | `packages/sdk/assets-pairs-order` | [wavesplatform/assets-pairs-order](https://github.com/wavesplatform/assets-pairs-order) | `2e165847` (#63) | `ce09e898` (#8 path) | 2018-07-06 | 💤 Dormant | ✅ fully synced — upstream dormant since 2018 |
| 9 | `packages/sdk/oracle-data` | [wavesplatform/oracle-data](https://github.com/wavesplatform/oracle-data) | `7efebd12` (v0.0.6 / Sep 2019) | `ce09e898` (#10 path) | 2026-06-23 | 💤 Dormant | ✅ fully synced — upstream HEAD; dormant since 2019 |
| 10 | `packages/sdk/node-api` | [wavesplatform/node-api-js](https://github.com/wavesplatform/node-api-js) | `fa26bc25` (v1.4.0 / Jun 8 2026) | `a8c55235` | 2026-06-23 | 🟢 Active | ✅ fully synced — finalization endpoints already present; ported `activationHeight?` + `supportingBlocks?` to IFeatures |
| 11 | `packages/sdk/transactions` | [wavesplatform/waves-transactions](https://github.com/wavesplatform/waves-transactions) | `7f16b6ef` (May 18 2026) | `22d3a4f7` | 2026-06-23 | 🟢 Active | ✅ fully synced — 7 missing were dep bumps + docs only; N/A for DCC |
| 12 | `packages/sdk/money-like-to-node` | [wavesplatform/money-like-to-node](https://github.com/wavesplatform/money-like-to-node) | `ec4a2a8c` (#61) | `ce09e898` (#10 path) | 2022-11-17 | 💤 Dormant | ✅ fully synced — upstream dormant since 2022 |
| 13 | `packages/sdk/data-service-client` | [wavesplatform/data-service-client-js](https://github.com/wavesplatform/data-service-client-js) | `ba1cc38d` (v4.1.1 / Apr 2020) | `ce09e898` (#9 path) | 2026-06-23 | 💤 Dormant | ✅ fully synced — upstream HEAD; dormant since 2020 |
| 14 | `packages/sdk/browser-bus` | [wavesplatform/waves-browser-bus](https://github.com/wavesplatform/waves-browser-bus) | `baa2a9ec` (#31) | `dfc419631` | 2026-06-23 | 🟢 Active | ✅ fully synced — upstream HEAD |
| 15 | `packages/sdk/ledger` | [wavesplatform/waves-ledger-js](https://github.com/wavesplatform/waves-ledger-js) | `f0d197c3` (#115) | `ce09e898` (#9 path) | 2022-12-15 | 💤 Dormant | ✅ fully synced — upstream dormant since 2022 |
| 16 | `packages/sdk/signature-adapter` | [wavesplatform/waves-signature-adapter](https://github.com/wavesplatform/waves-signature-adapter) | `6a303b93` (#602) | `ce09e898` (#12 path) | 2023-10-13 | 💤 Dormant | ✅ fully synced — upstream dormant since 2023; DCC diverged ahead at v8.0.0 |
| 17 | `packages/sdk/signer` | [wavesplatform/signer](https://github.com/wavesplatform/signer) | `16ea3bcb` (Feb 25 2026) | `ce09e898` | 2026-06-23 | 🟢 Active | ✅ fully synced — upstream HEAD; missing commit was CI-only merge wrapper |
| 18 | `packages/ride/ts` | [wavesplatform/ride-js](https://github.com/wavesplatform/ride-js) | `a92fe328` (#303) | `4f8bbb40` (#23 path) | 2026-03-11 | 🟢 Active | ✅ fully synced — upstream HEAD |
| 19 | `apps/cubensis-connect` | [Keeper-Wallet/Keeper-Wallet-Extension](https://github.com/Keeper-Wallet/Keeper-Wallet-Extension) | `6ef57b32` (#2,585) | `3d0bfd070` (#2,664 path) | 2025-05-28 | 🟢 Active | ✅ fully synced — upstream HEAD |
| 20 | `packages/sdk/cubensis-connect-types` | [Keeper-Wallet/waveskeeper-types](https://github.com/Keeper-Wallet/waveskeeper-types) | `b9eafdfc` (v0.2.7 / Aug 2022) | `ce09e898` (#8 path) | 2026-06-23 | 💤 Dormant | ✅ fully synced — upstream HEAD; dormant since 2022 |
| 21 | `packages/sdk/cubensis-connect-provider` | [Keeper-Wallet/provider-keeper](https://github.com/Keeper-Wallet/provider-keeper) | `e91b7800` (Sep 4 2023) | `ce09e898` (#10 path) | 2026-06-23 | 🟡 Moderate | ⬜ ↓5 not synced — `e3fa79b3` renovate merge + 4 semantic-release fixes (May 2026) — upstream/DCC fundamentally diverged (CJS vs ESM, @keeper-wallet vs @decentralchain) |
| 22 | `apps/scanner` | [wavesplatform/WavesExplorerLite](https://github.com/wavesplatform/WavesExplorerLite) | — (clean-room reimplementation) | `3d0bfd070` (#120 path) | 2026-06-23 | 🟢 Active | N/A — DCC scanner is a full React Router 8 / Tailwind v4 / TypeScript rewrite with no git ancestry from upstream |
| 23 | `packages/sdk/swap-client` | [Keeper-Wallet/swap-client](https://github.com/Keeper-Wallet/swap-client) | — | `16949ef` | — | ⚫ Deleted |
| 24 | `packages/sdk/crypto` | [Keeper-Wallet/waves-crypto](https://github.com/Keeper-Wallet/waves-crypto) | `f6e4fbb3` (#234) | `ce09e898` (#13 path) | 2025-05-28 | 🟡 Moderate | ✅ fully synced — upstream HEAD |
| 25 | `apps/data-service` | [wavesplatform/data-service](https://github.com/wavesplatform/data-service) | `4820824d` (v0.38.0 / squash↑1,392) | `3d0bfd070` (overlay↑46) | 2026-06-23 | 🟢 Active | ✅ fully synced — upstream HEAD |
| 26 | `packages/sdk/node-api-grpc` | [wavesplatform/node-api-grpc-js](https://github.com/wavesplatform/node-api-grpc-js) | — (fresh rewrite, no cherry-pick sync) | `ce09e898` (#8 path) | 2026-06-23 | 💤 Dormant | upstream HEAD `2a6202fe` (2024-11-15, #10) — DCC is a full TypeScript rewrite using @connectrpc/connect; upstream is dormant |

**Activity:** 🟢 Active (last 6 months) · 🟡 Moderate (last 2 years) · 💤 Dormant (2+ years, frozen) · ⚫ Deleted

> **`apps/data-service` import notes:** Imported via `git subtree add --squash` from the local `Legacy/Waves/data-service` upstream clone (wavesplatform v0.38.0 — commit `4820824d`). The `--squash` flag collapses upstream history into a single merge commit; per-path `git log` shows the squash commit + 46 DCC overlay commits. Import method: `git subtree --squash` (not fork; upstream history is NOT individually traversable per-path). DCC-specific identity layer (endpoint URLs, chain IDs, env var names, branding) is applied separately in **DCC-234**. Toolchain modernization (Biome replacing ESLint/Prettier, strict tsconfig, ESM imports) is tracked in **DCC-219**, **DCC-220**, **DCC-222**. Vitest migration from Jest is **DCC-223**.

### RIDE Packages (packages/ride/) → Upstream Map

`packages/ride/lang/` and `packages/ride/repl/` were extracted from `Ecosystem/node-scala` (itself a fork of `wavesplatform/Waves`) via `git filter-repo`, preserving 1,991 upstream commits from the Waves history that touched `lang/` and `repl/`. `packages/ride/ts/` is the standalone TypeScript wrapper, tracked separately (row 18 above).

| # | Monorepo Path | Upstream Repo | Upstream Commit | DCC Commit | Date | Activity |
|---|--------------|---------------|----------------|------------|------|----------|
| 1 | `packages/ride/lang/` | [wavesplatform/Waves](https://github.com/wavesplatform/Waves) (`lang/` subdir) | `23c40416` (Apr 13 2026) | `db9ada33` | 2026-06-23 | 🟢 Active | ✅ fully synced — only lang/-touching commit in gap was `23c40416` (removed obsolete assembly block); node-scala now at v1.6.3 |
| 2 | `packages/ride/repl/` | [wavesplatform/Waves](https://github.com/wavesplatform/Waves) (`repl/` subdir) | `c26947df` (Dec 18 2025) | `89b96ba8` (repl↑ 46) | 2026-06-23 | 🟢 Active | ✅ fully synced — confirmed no repl/-touching commits in the full gap through v1.6.3 |
| 3 | `packages/ride/ts/` | [wavesplatform/ride-js](https://github.com/wavesplatform/ride-js) | `a92fe328` (#303) | `4f8bbb40` (#23 path) | 2026-03-11 | 🟢 Active | ✅ fully synced — upstream HEAD |

> Import commit `17626cc7` message: "feat(DCC-252): import lang and repl from node-scala with full upstream history — Extracted lang/ and repl/ from Ecosystem/node-scala preserving 1,991 commits from the upstream Waves history plus all 5 DCC patches (namespace rename, chain identity, security hardening, test fixes)."

### JVM Libraries (packages/jvm/) → Upstream Map

Each library was imported into the monorepo via `git subtree add` or `git filter-repo`, preserving full upstream commit history. All are published to Maven Central as `io.decentralchain:*`.

| # | Monorepo Path | Upstream Repo | Upstream Commit | DCC Commit | Date | Activity |
|---|--------------|---------------|----------------|------------|------|----------|
| 1 | `packages/jvm/java-sdk` | [wavesplatform/WavesJ](https://github.com/wavesplatform/WavesJ) | `2f78fd3f` (#245) | `89b96ba8` (#34 path) | 2026-02-20 | 🟢 Active | ✅ fully synced — upstream HEAD |
| 2 | `packages/jvm/curve25519` | [wavesplatform/curve25519-java](https://github.com/wavesplatform/curve25519-java) | `14e439e8` (v0.6.5 / Jul 31 2023) | `56baf1f1` (#6 path) | 2026-06-23 | 💤 Dormant | ⬜ ↓1 not synced — `80b0a5de` JNA Apple ARM fix (Oct 2023) — N/A: DCC already upgraded JNA to 5.18.1 independently |
| 3 | `packages/jvm/transactions` | [wavesplatform/waves-transactions-java](https://github.com/wavesplatform/waves-transactions-java) | `e6afed3a` (v1.2.7 / Feb 11 2026) | `56baf1f1` (#15 path) | 2026-02-11 | 💤 Dormant | ✅ fully synced — upstream HEAD |
| 4 | `packages/jvm/blst` | [wavesplatform/blst-java](https://github.com/wavesplatform/blst-java) | `a7d3e39a` (Apr 15 2026) | `56baf1f1` | 2026-06-23 | 💤 Dormant | ✅ fully synced — DCC already ahead; Mac/x86_64 + Windows binaries present with more portable build |
| 5 | `packages/jvm/groth16` | [wavesplatform/zwaves](https://github.com/wavesplatform/zwaves) | `d4546dbb` (v0.2.1 / Oct 16 2023) | `56baf1f1` (#23 path) | 2023-10-16 | 💤 Dormant | ✅ fully synced — upstream HEAD |
| 6 | `packages/jvm/crypto` | [wavesplatform/waves-crypto-java](https://github.com/wavesplatform/waves-crypto-java) | `0f1fc0c9` (v2.0.7 / Feb 11 2026) | `56baf1f1` (#22 path) | 2026-02-11 | 💤 Dormant | ✅ fully synced — upstream HEAD |

> **Sync strategy for JVM packages:** Port upstream bugfixes manually. Do NOT port Waves endpoint URLs, chain IDs, or branding. Adapt Maven coordinates to `io.decentralchain:*` and group to `io.decentralchain`. Check each upstream repo monthly for security patches.
>
> **java-sdk graft details:** Established proper upstream traceability via commit `390fc9847` — "feat(DCC-263): graft upstream WavesJ history + re-apply DCC fork". Upstream baseline `bb63c0bc` squash commit at `wavesplatform/WavesJ@2f78fd3`. Future cherry-picks: `git subtree pull --prefix packages/jvm/java-sdk upstream-dccj master --squash` (remote has been removed; re-add if needed).

### How to Check for New Upstream Changes

```bash
# Clone an upstream repo (first time only)
git clone https://github.com/wavesplatform/<repo>.git Waves/<repo>

# Pull latest
cd Waves/<repo> && git pull

# See what's new since last sync (use commit from table above)
git log --oneline <last-synced-commit>..HEAD
git diff <last-synced-commit>..HEAD -- src/
```

### How to Port a Change

> For the full detailed procedure including what to skip, what to port, adaptation rules, and validation steps, see `.github/skills/upstream-sync/SKILL.md`.

1. Review `git log <last-synced>..HEAD` in the upstream clone
2. Skip tooling changes (ESLint/Prettier/Jest/tsup), dependency bumps (Renovate), and CJS additions — none apply to our stack
3. Manually apply relevant bugfixes or features to the monorepo package
4. Adapt to DCC conventions (Biome, strict TS, ESM imports, `@decentralchain/*` package names)
5. Validate: `pnpm nx run @decentralchain/<pkg>:biome-lint && pnpm nx run @decentralchain/<pkg>:typecheck && pnpm nx run @decentralchain/<pkg>:test`
6. Commit: `fix(<pkg>): port upstream <short-hash> — <description>`
7. Update this table: set **Upstream Commit** to the new Waves hash, **DCC Commit** to your monorepo commit, and the **Date**

### Priority Watch List

| Upstream Repo | DCC Location | Why | Check |
|--------------|-------------|-----|-------|
| ts-types | `packages/sdk/types` | Foundation types — affects entire SDK | Weekly |
| ts-lib-crypto | `packages/sdk/ts-lib-crypto` | Crypto primitives — security-critical | Weekly |
| wavesplatform/Waves (`lang/`) | `packages/ride/lang/` | RIDE VM — new language features, stdLib versions | Weekly |
| ride-js | `packages/ride/ts/` | RIDE TS wrapper — new compiler output format | Weekly |
| signer | `packages/sdk/signer` | Signing flow changes | Bi-weekly |
| protobuf-schemas | `packages/sdk/protobuf-schemas` | Wire format = protocol updates | Bi-weekly |
| gowaves | ~~`Ecosystem/node-go`~~ | ⚫ Archived — skip | — |
| Keeper-Wallet-Extension | `apps/cubensis-connect` | Wallet features we may want | Monthly |
| data-service | `apps/data-service` | Now in monorepo — watch for upstream bugfixes and new endpoint features | Monthly |
| waves-transactions | `packages/sdk/transactions` | New transaction type support | Monthly |
| node-api-js | `packages/sdk/node-api` | New API endpoints | Monthly |
| WavesJ | `packages/jvm/java-sdk` | Java SDK — watch for bugfixes and new API endpoint support | Monthly |
| wavesplatform/Waves (`node/`) | `Ecosystem/node-scala` | Protocol changes, feature flags, security patches | Monthly |

---

## Appendix A — Full Waves Inventory

### By Category (134 repos total)

**Already Forked to DCC (35+):**
- *TypeScript SDK (24):* ts-types, bignumber, ts-lib-crypto, parse-json-bignumber, marshall, protobuf-schemas, waves-data-entities, assets-pairs-order, oracle-data, node-api-js, waves-transactions, money-like-to-node, data-service-client-js, waves-browser-bus, waves-ledger-js, waves-signature-adapter, signer, ride-js (`packages/ride/ts/`), Keeper-Wallet-Extension, waveskeeper-types, provider-keeper, WavesExplorerLite, swap-client (⚫ fully deleted), waves-crypto
- *Application (1):* **data-service** → `apps/data-service`
- *Standalone infrastructure (4):* **Waves** node → `Ecosystem/node-scala` · **gowaves** → `Ecosystem/node-go` · **dex** matcher → `Ecosystem/matcher` · **blockchain-postgres-sync** → `apps/blockchain-postgres-sync` (in monorepo via `nx import`)
- *JVM libraries (6 in monorepo):* **WavesJ** → `packages/jvm/java-sdk` · **curve25519-java** → `packages/jvm/curve25519` · **waves-transactions-java** → `packages/jvm/transactions` · **blst-java** → `packages/jvm/blst` · **zdcc** → `packages/jvm/groth16` · **waves-crypto-java** → `packages/jvm/crypto`
- *RIDE packages (2 in monorepo, from wavesplatform/Waves):* `packages/ride/lang/` · `packages/ride/repl/` 

**Developer Tooling (~8):** dcc-ide (22★), ride-vscode (13★), surfboard (10★), js-test-env (3★), ride-intellij-plugin (3★), ride-examples (31★), ride-introduction (19★), dcc-repl (4★).

**Infrastructure (~20):** ~~Waves/node (1171★ Scala)~~ ✅ forked as `Ecosystem/node-scala`, ~~gowaves (255★ Go)~~ ✅ forked as `Ecosystem/node-go`, ~~matcher (18★ Scala)~~ ✅ forked as `Ecosystem/matcher`, ~~data-service (31★ TS)~~ ✅ imported as `apps/data-service`, ~~blockchain-postgres-sync (16★ Rust)~~ ✅ imported as `apps/blockchain-postgres-sync` (monorepo, via `nx import`), nodemon (8★ Go), plus Rust microservices cluster (10 repos: user-storage, mailbox-service, push-notifications-rs, balances-history, operations-service, updates-provider, state-service, state-consumer, exchanges, asset-search-rs, wx-websocket-api).

**Multi-Language SDKs (~20):** Java (~~WavesJ 47★~~ ✅ forked as `java-sdk`, ~~waves-transactions-java~~ ✅ forked as `transactions`, ~~waves-crypto-java~~ ✅ forked as `packages/jvm/crypto` (DCC-264)), Python (waves-python 10★, demo-python-trading-bot 64★), Go (go-lib-crypto 5★), Kotlin (kotlin-lib-crypto, kotlin-lib-model), Swift (swift-lib-crypto), C (waves-c 8★, Base58, Blake2, Keccak), Rust (waves-rust 6★), C# (waves-csharp, csharp-lib-crypto, csharp-lib-transactions), PHP (waves-php, protobuf-php).

**Cryptography (4):** curve25519-js (36★), ~~zdcc (4★ ZK)~~ ✅ forked as `packages/jvm/groth16`, ~~groth16verify~~ (only needed if DCC adds ZK tx types), ~~blst-java~~ ✅ forked as `packages/jvm/blst`.

**Mobile (4):** WavesWallet-iOS (47★), WavesWallet-android (52★), WavesSDK-iOS (17★), WavesSDK-android (15★).

**Archived/Deprecated (7):** WavesCS, private-node-docker-image, dcc-signature-generator, node-docker-image, WavesClientLite, dccpp, how-to-connect-keeper-to-mobile-apps.

**Applications (~10):** WavesGUI (399★), waves-games, waves-items-webapp, waves-dao-ui, mpt-staking-ui, wavesdappcom, web3course.

**Internal/CI/Misc (~25):** configs, jira-action, vault-decryptor, provider-seed, provider-metamask, provider-ledger, unified-declarations, blocks-json-parser-js, tx-json-schemas, ts-contract, dcc-rest, dcc-data-oracle, and others.

**Bottom line:** We forked the 18% that represents 90% of the value. The remaining 82% is either archived, language-specific, infrastructure we'll build our own way, or experiments that didn't go anywhere.
