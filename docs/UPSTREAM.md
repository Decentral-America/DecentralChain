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
14. [Feature Parity — Cubensis Connect vs Waves Keeper](#14-feature-parity--cubensis-connect-vs-waves-keeper)
15. [External Services & Dependencies](#15-external-services--dependencies)
16. [Supply-Chain Dependency Chain](#16-supply-chain-dependency-chain)
17. [Crypto Function Name Mapping](#17-crypto-function-name-mapping)
18. [Unfinished Branding Residuals](#18-unfinished-branding-residuals)
19. [Upstream Sync Tracking](#19-upstream-sync-tracking)
20. [Appendix A — Full Waves Inventory](#appendix-a--full-waves-inventory)

---

## 1. Introduction

DecentralChain (DCC) is an independent blockchain that forked the Waves protocol. The `@decentralchain/*` SDK packages published from this monorepo were migrated from the upstream `@waves/*` npm packages maintained across two GitHub organizations: [`wavesplatform`](https://github.com/wavesplatform) (124 repos) and [`Keeper-Wallet`](https://github.com/Keeper-Wallet) (10 repos).

**Not all of the Waves ecosystem has been migrated.** Of 134 upstream repositories, DCC forked the **24 TypeScript packages** that compose the complete SDK core — every library needed to build, sign, serialize, and broadcast transactions on a Waves-protocol chain. The remaining ~110 repos are multi-language SDKs, mobile wallets, infrastructure services, developer tooling, and experiments. This document maps what was forked, what was skipped, and what may be pursued in the future.

Every forked package has been:

- Rebranded from `@waves/*` and `@keeper-wallet/*` to `@decentralchain/*`
- Modernized beyond upstream (ESM-only, TypeScript 5.9 strict, Biome, Vitest, tsdown)
- Audited (3,747+ tests, 0 failures, 0 npm vulnerabilities)
- Published to npm under `@decentralchain/*`

The migration philosophy: **fork the protocol-critical core, modernize beyond upstream, build what Waves never built, selectively adopt high-value repos on demand, skip what doesn't serve the DCC mission.**

---

## 2. What is DecentralChain?

**DecentralChain** is an open blockchain protocol and development toolset for Web 3.0 applications and decentralized solutions. It is maintained by **Blockchain Costa Rica** (the `Decentral-America` GitHub org).

| Property | Value |
|:---------|:------|
| **Consensus** | Leased Proof of Stake (LPoS) |
| **Native Token** | DecentralCoin (DCC) — wire-format ID: `'WAVES'` (see [§7](#7-wire-format-constraints)) |
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
| **Native Swap** | AMM-powered on-chain token swap (constant product formula) |
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
| Native asset ID | `WAVES` | `WAVES` | Wire-format string — cannot rename |
| Native asset display name | Waves | DecentralChain | User-facing only |
| Native asset ticker | WAVES | DCC | UI display only |
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
| **Data service API** | `api.wavesplatform.com` | `api.decentralchain.io` | ✅ |
| **Swap API** | `swap-api.keeper-wallet.app` | `swap-api.decentralchain.io` | ✅ |
| **Identity API** | `id.waves.exchange/api` | `id.decentralchain.io/api` | ✅ |
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
| 1 | ts-types | ts-types | wavesplatform | Foundation | 🔗 | 2.0.1 |
| 2 | bignumber | bignumber | wavesplatform | Foundation | — | 1.2.1 |
| 3 | ts-lib-crypto | ts-lib-crypto | wavesplatform | Foundation | 🔗 | 2.0.1 |
| 4 | parse-json-bignumber | parse-json-bignumber | wavesplatform | Foundation | 🔗 | 2.0.1 |
| 5 | marshall | marshall | wavesplatform | Serialization | — | 1.0.1 |
| 6 | protobuf-serialization | protobuf-schemas | wavesplatform | Serialization | — | 3.0.0 |
| 7 | data-entities | waves-data-entities | wavesplatform | Domain Model | — | 3.0.1 |
| 8 | assets-pairs-order | assets-pairs-order | wavesplatform | Domain Model | — | 5.0.2 |
| 9 | oracle-data | oracle-data | wavesplatform | Domain Model | — | 1.0.1 |
| 10 | node-api-js | node-api-js | wavesplatform | API Client | 🔗 | 2.0.1 |
| 11 | transactions | waves-transactions | wavesplatform | Transaction Building | 🔗 | 5.0.1 |
| 12 | money-like-to-node | money-like-to-node | wavesplatform | Transaction Building | — | 1.0.1 |
| 13 | data-service-client-js | data-service-client-js | wavesplatform | API Client | 🔗 | 4.2.1 |
| 14 | browser-bus | waves-browser-bus | wavesplatform | Communication | 🔗 | 1.0.1 |
| 15 | ledger | waves-ledger-js | wavesplatform | Hardware Wallet | 🔗 | 5.1.1 |
| 16 | signature-adapter | waves-signature-adapter | wavesplatform | Signing | 🔗 | 7.0.1 |
| 17 | signer | signer | wavesplatform | Signing | — | 2.0.1 |
| 18 | ride-js | ride-js | wavesplatform | Smart Contracts | — | 2.3.1 |
| 19 | cubensis-connect | Keeper-Wallet-Extension | Keeper-Wallet | Application | 🔗 | — |
| 20 | cubensis-connect-types | waveskeeper-types | Keeper-Wallet | Wallet Types | 🔗 | 1.0.1 |
| 21 | cubensis-connect-provider | provider-keeper | Keeper-Wallet | Signing | 🔗 | 1.0.1 |
| 22 | scanner | WavesExplorerLite | wavesplatform | Application | — | — |
| 23 | swap-client | swap-client | Keeper-Wallet | DEX Integration | — | 2.0.0 |
| 24 | crypto | waves-crypto | Keeper-Wallet | Foundation | 🔗 | 1.0.2 |

**🔗 Grafted** = full upstream Waves git history preserved via `git filter-repo` or subtree merge.

### Notable Migration Details

- **cubensis-connect-provider**: All 412 upstream commits analyzed individually. ~260 Renovate noise, ~30 CI/tooling, 2 genuine bugs cherry-picked. DCC architecture intentionally diverged (7 modular src files / 126 tests vs Waves' 2 monolithic files / 32 tests).
- **cubensis-connect**: 1,305 upstream commits brought in via full rebase onto `waves/master`. Branding re-applied: 86 files covering dep renames, network codes, URLs, manifest, i18n (10 locales), global API (KeeperWallet→CubensisConnect).
- **swap-client**: Upstream was private/deleted. Source extracted from `npm pack @keeper-wallet/swap-client@0.3.0`. Protobuf schema reverse-engineered from compiled output and verified wire-compatible.
- **crypto**: 234-commit Waves history preserved. Rust/WASM + TypeScript hybrid. Timing-safe HMAC comparison added (security fix). 44 tests, 99% coverage.

---

## 6. Dependency Architecture

### Layer Model

| Layer | Packages | Role |
|-------|----------|------|
| **0 — Foundation** | ts-types, bignumber, ts-lib-crypto, parse-json-bignumber, crypto, cubensis-connect-types | Core types, math, crypto, JSON parsing |
| **1 — Serialization** | marshall, protobuf-serialization | Binary/protobuf encode/decode for wire format |
| **2 — Domain Model** | data-entities, assets-pairs-order, oracle-data | Business objects (Money, Asset, OrderPrice, Oracle) |
| **3 — Transaction Building** | transactions, money-like-to-node | Construct, sign, and validate blockchain transactions |
| **4 — API Client** | node-api-js, data-service-client-js | HTTP clients for node REST API and data service |
| **5 — Communication** | browser-bus | Cross-window postMessage for browser apps |
| **6 — Hardware Wallet** | ledger | Ledger device integration via WebUSB |
| **7 — Signing** | signature-adapter, signer, cubensis-connect-provider | Multi-provider signing (seed, Ledger, wallet extension) |
| **8 — Smart Contracts** | ride-js | RIDE language compiler (wraps `@waves/ride-lang`) |
| **9 — Applications** | scanner, exchange, cubensis-connect, swap-client | End-user apps and DeFi clients |

### Dependency Graph

```
  ts-types  (zero @decentralchain deps — pure types)
    ├── transactions (+ ts-lib-crypto, marshall, protobuf-serialization)
    ├── node-api-js (+ bignumber, ts-lib-crypto)
    └── signature-adapter (+ bignumber, data-entities, ledger, money-like-to-node, transactions)

  ts-lib-crypto  (zero @decentralchain deps — @noble/curves + @noble/hashes)
    ├── transactions
    ├── node-api-js
    ├── signer (+ node-api-js, ts-types)
    └── ride-js (+ @waves/ride-lang, @waves/ride-repl)

  bignumber  (zero @decentralchain deps — bignumber.js)
    ├── data-entities
    ├── node-api-js
    └── signature-adapter

  marshall  (zero @decentralchain deps — base64-js, long)
    ├── transactions
    └── cubensis-connect-provider (+ cubensis-connect-types)

  protobuf-serialization  (zero @decentralchain deps — @bufbuild/protobuf)
    └── transactions

  ledger  (zero @decentralchain deps — @ledgerhq/logs)
    └── signature-adapter

  data-entities  (← bignumber)
    └── signature-adapter

  transactions  (← ts-types, ts-lib-crypto, marshall, protobuf-serialization)
    └── signature-adapter

  node-api-js  (← ts-types, bignumber, ts-lib-crypto)
    └── signer

  signature-adapter  (← ts-types, bignumber, data-entities, ledger, money-like-to-node, transactions)

  signer  (← ts-types, ts-lib-crypto, node-api-js)

  cubensis-connect-provider  (← cubensis-connect-types, marshall)

  Independent (no @decentralchain deps):
    parse-json-bignumber, assets-pairs-order, browser-bus,
    data-service-client-js, oracle-data, money-like-to-node,
    cubensis-connect-types, crypto, swap-client

  Applications (consume SDK packages):
    cubensis-connect, exchange, scanner
```

---

## 7. Wire-Format Constraints

These values are embedded in the blockchain protocol itself. They **cannot** be renamed without a hard fork or breaking all existing clients, nodes, and signed data. They are **not bugs** — they are protocol constants that must remain Waves-branded.

| Value | Used For | Why Immutable |
|-------|----------|---------------|
| `'WAVES'` | Native asset sentinel in API responses and transaction data | All nodes, SDKs, and DApps expect this string. Client-side sentinel — node returns `null` for native asset. 60+ references across 20+ files. Display name shows "DCC" in UIs. |
| `package waves;` | Protobuf namespace in `.proto` files | Wire format for gRPC and `Any` types. Nodes expect `waves.Transaction` on the wire. Renaming breaks all gRPC clients and serialization. |
| `'WavesWalletAuthentication'` | Signing domain separator for message authentication | Cryptographic domain separator used in `wavesAuth`/`dccAuth`. Changing invalidates all existing signed auth messages in the wild. |
| `'WAVES'` in Ledger APDU | Hardware wallet firmware constant | Burned into Ledger device app. Would require custom Ledger app submission. |
| BIP-44 coin type `5741564` | HD wallet derivation path | Intentional — DCC users keep their existing Waves-derived keys. |

### Intentional Waves References (Will Not Fix)

| Reference | Reason | Locations |
|-----------|--------|-----------|
| `'WAVES'` asset ID | Client sentinel for native asset | All SDK packages |
| `'WavesWalletAuthentication'` prefix | Cryptographic domain separator | `cubensis-connect/src/messages/utils.ts` |
| Protobuf `waves` namespace | Wire-format package name | `protobuf-serialization/proto/waves/**` |
| `@waves/ride-lang` + `@waves/ride-repl` | Chain-agnostic Scala.js binaries — same bytecode works on any Waves-protocol chain | `ride-js/package.json` |
| Third-party NFT URLs | External services (wavesducks.com, puzzlemarket.org, sign-art.app) — community projects | `cubensis-connect` NFT vendor files |

---

## 8. Remaining Upstream Dependencies

| Package | Used By | Risk | Status |
|---------|---------|------|--------|
| `@waves/ride-lang` 1.6.1 | ride-js | **LOW** — chain-agnostic Scala.js compiler | No action needed |
| `@waves/ride-repl` 1.6.1 | ride-js | **LOW** — chain-agnostic Scala.js REPL | No action needed |

**Resolved upstream dependencies:**
- ~~`@keeper-wallet/swap-client`~~ → Forked as `@decentralchain/swap-client@1.0.0` (DCC-69)
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
| **Infrastructure** (Scala node, matcher, data-service, Rust microservices) | ~20 | 🔍 Evaluate selectively |
| **Developer tooling** (IDE, surfboard, ride-vscode) | ~8 | 🟡 High value candidates |
| **Internal/CI/trivial** | ~25 | ❌ Skip |
| **Applications** (GamesUI, DAO, experiments) | ~10 | ❌ Skip — DCC builds its own |

### High-Value Fork Candidates

Ranked by strategic value to DCC:

| Priority | Waves Repo | Why | Effort |
|----------|-----------|-----|--------|
| 🟢 **Tier 1** | `ride-vscode` (13★) | VS Code Ride extension = instant developer onboarding | Low |
| 🟢 **Tier 1** | `blockchain-postgres-sync` (16★) | Analytics backbone for block explorers and data APIs | Medium |
| 🟢 **Tier 1** | `gowaves` (255★) | Lighter Go node alternative for validators | High |
| 🟢 **Tier 1** | `data-service` (31★) | REST API for indexed data — powers data-service-client-js | Medium |
| 🟢 **Tier 1** | `surfboard` (10★) | CLI for Ride development — "Hardhat for Ride" | Medium |
| 🟡 **Tier 2** | `waves-ide` (22★) | Browser IDE for Ride — good for hackathons | High |
| 🟡 **Tier 2** | `ride-examples` (31★) | Example Ride contracts — documentation value | Very Low |
| 🟡 **Tier 2** | `node-api-grpc-js` (0★) | gRPC client — faster than REST | Low |
| ⚪ **Tier 3** | `WavesJ` (47★) | Java SDK — fork when Java dev community appears | On demand |
| ⚪ **Tier 3** | `waves-python` (10★) | Python SDK — fork when Python devs request | On demand |

### What's Not Worth Forking

| Category | Reason |
|----------|--------|
| Archived repos (7) | Dead upstream — inheriting tech debt with no upstream fixes |
| C#/C++/PHP SDKs | Tiny communities, zero demand signal |
| Mobile wallets (iOS/Android) | $500K+ commitment each; browser extension covers wallet for now |
| WavesGUI (399★) | Legacy Angular wallet; DCC has modern exchange + cubensis-connect |
| Rust microservices cluster (10 repos) | Tightly coupled to wx.network infrastructure |
| ZK cryptography (zwaves, groth16verify) | Only relevant if DCC protocol adds ZK features |

---

## 11. Strategic Roadmap

### Completed

- [x] Fork and modernize entire TypeScript SDK core (24 packages)
- [x] Publish all packages to npm under `@decentralchain/*`
- [x] Consolidate into monorepo with Nx + pnpm
- [x] Fork `@keeper-wallet/swap-client` → `@decentralchain/swap-client` (DCC-69)
- [x] Fork `@keeper-wallet/waves-crypto` → `@decentralchain/crypto` (DCC-70)

### In Progress

- [ ] Promote npm packages from `next` → `latest` dist-tag

### Next

- [ ] Fork & rebrand `ride-vscode` → DCC Ride VS Code extension
- [ ] Fork & rebrand `ride-examples` → `dcc-ride-examples`
- [ ] Fork `surfboard` → `@decentralchain/surfboard` CLI
- [ ] Evaluate `blockchain-postgres-sync` for DecentralScan 2.0

### Future

- [ ] Evaluate `gowaves` Go node for lighter validator infrastructure
- [ ] Evaluate `data-service` REST data API
- [ ] Fork language SDKs (Java, Python, Go, Rust) on community demand
- [ ] Mobile wallet initiative (dedicated team required)

---

## 12. DCC-Original Projects

These exist in the `Decentral-America` org with **no Waves upstream equivalent**:

| Repo | Purpose | Status |
|------|---------|--------|
| **exchange** | DCC trading interface (Vite + Electron) | Active — in monorepo `apps/` |
| **dcc-configs** | Shared runtime configuration files | Active |
| **DCC-ERC20-Gateway** | Cross-chain ERC-20 ↔ DCC gateway (Python) | Active |
| **dcc-ride-templates** | Ride smart contract templates | Active |
| **dcc-token-filters** | Token filtering/curation lists | Active |
| **DecentralScan2.0** | Next-gen block explorer | Active |
| **k8s-manifests** | Kubernetes deployment manifests | Infrastructure |
| **passport** | Identity/auth service (Python) | Active |

These represent DCC's **differentiation** — features Waves either never built or that DCC is building better.

---

## 13. Concept Mapping Reference

### Ride Language — Quick Reference

Ride is the smart contract language used on both Waves and DecentralChain. It is non-Turing-complete (no loops, no recursion — iteration via `FOLD<N>`), functional, statically typed, and lazy-evaluated.

| Topic | DecentralChain Docs | Waves Docs |
|:------|:-------------------|:-----------|
| Syntax Basics | [dcc/ride/syntax](https://docs.decentralchain.io/en/master/03_ride-language/01_syntax-basics.html) | [waves/ride/getting-started](https://docs.waves.tech/en/ride/getting-started) |
| Data Types | [dcc/ride/data-types](https://docs.decentralchain.io/en/master/03_ride-language/02_data-types.html) | [waves/ride/data-types](https://docs.waves.tech/en/ride/data-types/) |
| Functions | [dcc/ride/functions](https://docs.decentralchain.io/en/master/03_ride-language/03_functions.html) | [waves/ride/functions](https://docs.waves.tech/en/ride/functions/) |
| Script Types | [dcc/ride/scripts](https://docs.decentralchain.io/en/master/03_ride-language/04_script-types.html) | [waves/ride/script](https://docs.waves.tech/en/ride/script/) |
| Structures | [dcc/ride/structures](https://docs.decentralchain.io/en/master/03_ride-language/05_structures.html) | [waves/ride/structures](https://docs.waves.tech/en/ride/structures/) |
| FOLD iterations | [dcc/ride/fold](https://docs.decentralchain.io/en/master/03_ride-language/06_iterations-with-fold.html) | [waves/ride/fold](https://docs.waves.tech/en/ride/functions/built-in-functions/) |
| dApp-to-App | [dcc/ride/dapp-invocation](https://docs.decentralchain.io/en/master/03_ride-language/07_dapp-to-app-invocation.html) | [waves/ride/dapp-to-dapp](https://docs.waves.tech/en/ride/advanced/dapp-to-app/) |

### Waves → DecentralChain Concept Map

| Concept | Waves Docs | DecentralChain Docs |
|:--------|:-----------|:--------------------|
| Account | [waves/account](https://docs.waves.tech/en/blockchain/account/) | [dcc/account](https://docs.decentralchain.io/en/master/02_decentralchain/01_account.html) |
| Token (Asset) | [waves/token](https://docs.waves.tech/en/blockchain/token/) | [dcc/token](https://docs.decentralchain.io/en/master/02_decentralchain/02_token%28asset%29.html) |
| Transaction | [waves/transaction](https://docs.waves.tech/en/blockchain/transaction/) | [dcc/transaction](https://docs.decentralchain.io/en/master/02_decentralchain/03_transaction.html) |
| Block | [waves/block](https://docs.waves.tech/en/blockchain/block/) | [dcc/block](https://docs.decentralchain.io/en/master/02_decentralchain/04_block.html) |
| Node | [waves/node](https://docs.waves.tech/en/blockchain/node/) | [dcc/node](https://docs.decentralchain.io/en/master/02_decentralchain/05_node.html) |
| DEX Order | [waves/order](https://docs.waves.tech/en/blockchain/order/) | [dcc/order](https://docs.decentralchain.io/en/master/02_decentralchain/06_order.html) |
| Oracle | [waves/oracle](https://docs.waves.tech/en/blockchain/oracle/) | [dcc/oracle](https://docs.decentralchain.io/en/master/02_decentralchain/07_oracle.html) |
| Networks | [waves/networks](https://docs.waves.tech/en/blockchain/blockchain-network/) | [dcc/networks](https://docs.decentralchain.io/en/master/02_decentralchain/08_mainnet-testnet-stagenet.html) |
| Binary Format | [waves/binary-format](https://docs.waves.tech/en/blockchain/binary-format/) | [dcc/binary-format](https://docs.decentralchain.io/en/master/02_decentralchain/10_binary-format.html) |
| Ride Language | [waves/ride](https://docs.waves.tech/en/ride/) | [dcc/ride](https://docs.decentralchain.io/en/master/03_ride-language/index.html) |

### SDK Package Name Mapping

| Waves Package | DecentralChain Package |
|:-------------|:----------------------|
| `@waves/ts-types` | `@decentralchain/ts-types` |
| `@waves/bignumber` | `@decentralchain/bignumber` |
| `@waves/ts-lib-crypto` | `@decentralchain/ts-lib-crypto` |
| `@waves/marshall` | `@decentralchain/marshall` |
| `@waves/waves-transactions` | `@decentralchain/transactions` |
| `@waves/signature-adapter` | `@decentralchain/signature-adapter` |
| `@waves/signer` | `@decentralchain/signer` |
| `@waves/node-api-js` | `@decentralchain/node-api-js` |
| `@waves/data-service-client-js` | `@decentralchain/data-service-client-js` |
| `@waves/waves-browser-bus` | `@decentralchain/browser-bus` |
| `@waves/parse-json-bignumber` | `@decentralchain/parse-json-bignumber` |
| `@waves/data-entities` | `@decentralchain/data-entities` |
| `@waves/oracle-data` | `@decentralchain/oracle-data` |
| `@waves/ledger` | `@decentralchain/ledger` |
| `@waves/assets-pairs-order` | `@decentralchain/assets-pairs-order` |
| `@waves/protobuf-serialization` | `@decentralchain/protobuf-serialization` |
| `@waves/money-like-to-node` | `@decentralchain/money-like-to-node` |
| `@waves/ride-js` | `@decentralchain/ride-js` |
| `@keeper-wallet/waves-crypto` | `@decentralchain/crypto` |
| `@keeper-wallet/swap-client` | `@decentralchain/swap-client` |
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
| Import via email (Cognito) | ✅ | ✅ | See [Cognito caveat](STATUS.md#7-remediation-priority-matrix) |
| Multi-account, multi-network | ✅ | ✅ | — |
| Send/sign all 18 transaction types | ✅ | ✅ | — |
| Sign arbitrary data | ✅ | ✅ | — |
| Transaction history | ✅ | ✅ | — |
| NFT display (5 vendors) | ✅ | ✅ | — |
| NFT display (WavesDomains) | ✅ | ❌ | **Removed** — no DCC domain service |
| `.waves` address resolution | ✅ | ❌ | **Removed** — requires domain resolution API |
| In-wallet swap | ✅ | ✅ | Uses `@decentralchain/swap-client` (DCC-69) |
| DApp browser permissions | ✅ | ✅ | — |
| Idle auto-lock | ✅ | ✅ | — |
| Leasing | ✅ | ✅ | — |
| dccAuth (message signing) | ✅ (wavesAuth) | ✅ | Renamed, functionally identical |
| `CubensisConnect` global API | `WavesKeeper` | ✅ | Deprecated `KeeperWallet`/`WavesKeeper` aliases maintained |
| Sentry error reporting | ✅ | ⚠️ | No DSN configured — errors are silently dropped |
| Extension store listing | ✅ | ❌ | Not published to Chrome Web Store or Firefox AMO |
| Remote config updates | ✅ | ✅ | Uses `dcc-configs` repo |

### NFT Vendor System

The wallet uses a vendor-based plugin pattern where each NFT project has a dedicated renderer.

| Vendor | Status | External Service |
|--------|--------|------------------|
| Ducks | ✅ | wavesducks.com |
| Ducklings | ✅ | wavesducks.com |
| DucksArtefacts | ✅ | wavesducks.com |
| Puzzle | ✅ | puzzlemarket.org |
| SignArt | ✅ | mainnet.sign-art.app |
| **WavesDomains** | ❌ Removed | No DCC equivalent |
| Unknown (fallback) | ✅ | — |

**Impact of WavesDomains removal:** NFTs from that vendor render with the "Unknown" fallback — a generic card. No crash, no data loss. If DCC launches its own domain system (e.g., `.dcc`), the vendor can be re-implemented.

---

## 15. External Services & Dependencies

### DCC-Controlled Services

| Service | URL | Function |
|---------|-----|----------|
| Data Service API | `api.decentralchain.io` | Asset info, ticker data |
| Swap API | `swap-api.decentralchain.io` | Token swap routing & execution |
| Identity API | `id.decentralchain.io/api` | Email-based account management |
| Cognito Proxy | `decentralchain.io/cognito` | AWS Cognito auth proxy |
| Remote Config | `raw.githubusercontent.com/Decentral-America/dcc-configs/main/main.json` | Runtime config |
| Suspicious Token List | `raw.githubusercontent.com/Decentral-America/waves-community/master/...` | Scam token CSV (⚠️ repo still named `waves-community`) |

### Third-Party Services (Not DCC-Controlled)

| Service | URL | Function | Risk |
|---------|-----|----------|------|
| Waves Ducks | `wavesducks.com/api/v1/` | Duck NFT images & metadata | May not serve DCC NFT data |
| Puzzle Market | `puzzlemarket.org` | Puzzle NFT metadata | Independent project |
| SignArt | `mainnet.sign-art.app` | Art NFT metadata & IPFS images | Uses Infura IPFS gateway |

---

## 16. Supply-Chain Dependency Chain

The dependency chains through DCC packages. Crypto and swap-client are fully forked. `crypto` and `ts-lib-crypto` are **independent** libraries (see [§9](#9-crypto-library-architecture)). Only `@waves/ride-lang` + `@waves/ride-repl` remain unforked (low risk — chain-agnostic).

```
@decentralchain/crypto  ← FORKED (DCC-70) ✅  [was @keeper-wallet/waves-crypto]
  └── cubensis-connect (22 import sites migrated — DCC-59) ✅

@decentralchain/ts-lib-crypto  (independent — uses @noble/curves, NOT @decentralchain/crypto)
  └── @decentralchain/transactions
        └── @decentralchain/signature-adapter
              └── @decentralchain/signer
        └── @decentralchain/node-api-js
  └── @decentralchain/signer
  └── @decentralchain/ride-js
  └── @decentralchain/node-api-js

@decentralchain/marshall
  └── @decentralchain/transactions
        └── (see above)
  └── @decentralchain/protobuf-serialization (proto namespace: waves)
  └── @decentralchain/cubensis-connect-provider

@decentralchain/swap-client  ← FORKED (DCC-69) ✅
  └── cubensis-connect (swap feature only)

@waves/ride-lang + @waves/ride-repl  ← NOT FORKED (RIDE compiler)
  └── @decentralchain/ride-js
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

| Reference | File | Action |
|-----------|------|--------|
| `waves-community` repo name in URL | `controllers/assetInfo.ts:34` | Rename GitHub repo → `dcc-community` |

### Resolved Branding Items

- ~~`support.waves.exchange` in error message~~ → Cleaned up
- ~~`web.keeper-wallet.app` in whitelist~~ → Removed
- ~~`swap.keeper-wallet.app` in whitelist~~ → Removed

### UX Regressions vs Upstream

| Feature | Impact | Effort to Restore | Priority |
|---------|--------|-------------------|----------|
| WavesDomains NFT vendor | NFTs render as "Unknown" | Low (re-add vendor) — needs DCC domain service | Low |
| `.waves` address resolution | Cannot type domain names | Medium — needs API | Medium |
| Sentry error reporting | No runtime error visibility | Low (create Sentry project, set DSN) | **High** |
| Extension store listings | Users must side-load | Medium (store review process) | **High** |

---

## 19. Upstream Sync Tracking

> **Purpose**: Map every monorepo package to its Waves upstream repo and track the last shared commit. Updated whenever upstream changes are ported.
>
> **Why manual?** DCC was cloned from Waves without GitHub's fork mechanism. The repos share commit history, so `git log` and `git diff` work across both trees — but syncing is a review-and-port process, not an automated merge.
>
> **AI agents**: The complete sync procedure is documented as a skill at `.github/skills/upstream-sync/SKILL.md`. Use the `/upstream-sync` prompt to invoke it. The skill contains the full workflow: fetch, diff, evaluate, port, validate, commit, and update this table.

### Monorepo → Upstream Map

Each row maps a monorepo package to its Waves upstream. **Upstream Commit** is the last Waves commit we've incorporated. **DCC Commit** is where that sync lives in our monorepo history.

| # | Monorepo Path | Upstream Repo | Upstream Commit | DCC Commit | Date | Activity |
|---|--------------|---------------|----------------|------------|------|----------|
| 1 | `packages/ts-types` | [wavesplatform/ts-types](https://github.com/wavesplatform/ts-types) | `fc15f0c` | `309a179` | 2026-03-02 | 🟢 Active |
| 2 | `packages/bignumber` | [wavesplatform/bignumber](https://github.com/wavesplatform/bignumber) | `ee66601` | `3c509b0` | 2024-07-05 | 💤 Dormant |
| 3 | `packages/ts-lib-crypto` | [wavesplatform/ts-lib-crypto](https://github.com/wavesplatform/ts-lib-crypto) | `96273e7` | `3c6bd7c` | 2026-03-02 | 🟢 Active |
| 4 | `packages/parse-json-bignumber` | [wavesplatform/parse-json-bignumber](https://github.com/wavesplatform/parse-json-bignumber) | `3ec759a` | `6fa6456` | 2020-06-02 | 💤 Dormant |
| 5 | `packages/marshall` | [wavesplatform/marshall](https://github.com/wavesplatform/marshall) | `25b3527` | `15ebc15` | 2020-09-04 | 💤 Dormant |
| 6 | `packages/protobuf-serialization` | [wavesplatform/protobuf-schemas](https://github.com/wavesplatform/protobuf-schemas) | `e7cf7fb` | `c6ca904` | 2025-12-18 | 🟡 Moderate |
| 7 | `packages/data-entities` | [wavesplatform/waves-data-entities](https://github.com/wavesplatform/waves-data-entities) | `c611b1d` | `417b379` | 2021-08-30 | 💤 Dormant |
| 8 | `packages/assets-pairs-order` | [wavesplatform/assets-pairs-order](https://github.com/wavesplatform/assets-pairs-order) | `2e16584` | `f243c68` | 2018-07-06 | 💤 Dormant |
| 9 | `packages/oracle-data` | [wavesplatform/oracle-data](https://github.com/wavesplatform/oracle-data) | `7efebd1` | `db01908` | 2019-09-05 | 💤 Dormant |
| 10 | `packages/node-api-js` | [wavesplatform/node-api-js](https://github.com/wavesplatform/node-api-js) | `f992dc9` | `0567bba` | 2024-02-06 | 🟡 Moderate |
| 11 | `packages/transactions` | [wavesplatform/waves-transactions](https://github.com/wavesplatform/waves-transactions) | `df16cb3` | `5a5152c` | 2024-02-06 | 🟡 Moderate |
| 12 | `packages/money-like-to-node` | [wavesplatform/money-like-to-node](https://github.com/wavesplatform/money-like-to-node) | `ec4a2a8` | `6e99fae` | 2022-11-17 | 💤 Dormant |
| 13 | `packages/data-service-client-js` | [wavesplatform/data-service-client-js](https://github.com/wavesplatform/data-service-client-js) | `ba1cc38` | `42d83cf` | 2020-04-07 | 💤 Dormant |
| 14 | `packages/browser-bus` | [wavesplatform/waves-browser-bus](https://github.com/wavesplatform/waves-browser-bus) | `d6c2b57` | `f0f40d7` | 2022-03-14 | 💤 Dormant |
| 15 | `packages/ledger` | [wavesplatform/waves-ledger-js](https://github.com/wavesplatform/waves-ledger-js) | `f0d197c` | `9ca16a2` | 2022-12-15 | 💤 Dormant |
| 16 | `packages/signature-adapter` | [wavesplatform/waves-signature-adapter](https://github.com/wavesplatform/waves-signature-adapter) | `6a303b9` | `0d6ff1c` | 2023-10-13 | 💤 Dormant |
| 17 | `packages/signer` | [wavesplatform/signer](https://github.com/wavesplatform/signer) | `16ea3bc` | `1cb57c2` | 2026-02-25 | 🟢 Active |
| 18 | `packages/ride-js` | [wavesplatform/ride-js](https://github.com/wavesplatform/ride-js) | `dafe635` | `b98a091` | 2026-03-02 | 🟢 Active |
| 19 | `apps/cubensis-connect` | [Keeper-Wallet/Keeper-Wallet-Extension](https://github.com/Keeper-Wallet/Keeper-Wallet-Extension) | `6ef57b32` | `a46ae18` | 2025-05-28 | 🟢 Active |
| 20 | `packages/cubensis-connect-types` | [Keeper-Wallet/waveskeeper-types](https://github.com/Keeper-Wallet/waveskeeper-types) | `b9eafdf` | `ca84920` | 2022-08-25 | 💤 Dormant |
| 21 | `packages/cubensis-connect-provider` | [Keeper-Wallet/provider-keeper](https://github.com/Keeper-Wallet/provider-keeper) | `24e3bc9` | `fd5aa58` | 2025-05-29 | 🟡 Moderate |
| 22 | `apps/scanner` | [wavesplatform/WavesExplorerLite](https://github.com/wavesplatform/WavesExplorerLite) | `daaf628` | `b473e02` | 2025-10-24 | 🟡 Moderate |
| 23 | `packages/swap-client` | [Keeper-Wallet/swap-client](https://github.com/Keeper-Wallet/swap-client) | — | `16949ef` | — | ⚫ Deleted |
| 24 | `packages/crypto` | [Keeper-Wallet/waves-crypto](https://github.com/Keeper-Wallet/waves-crypto) | `f6e4fbb` | `bd092dd` | 2025-05-28 | 🟡 Moderate |

**Activity:** 🟢 Active (last 6 months) · 🟡 Moderate (last 2 years) · 💤 Dormant (2+ years, frozen) · ⚫ Deleted

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

| Upstream Repo | Why | Check |
|--------------|-----|-------|
| ts-types | Foundation types — affects entire SDK | Weekly |
| ts-lib-crypto | Crypto primitives — security-critical | Weekly |
| ride-js | RIDE compiler = new language features | Weekly |
| signer | Signing flow changes | Bi-weekly |
| protobuf-schemas | Wire format = protocol updates | Bi-weekly |
| Keeper-Wallet-Extension | Wallet features we may want | Monthly |
| waves-transactions | New transaction type support | Monthly |
| node-api-js | New API endpoints | Monthly |

---

## Appendix A — Full Waves Inventory

### By Category (134 repos total)

**Already Forked to DCC (24):** ts-types, bignumber, ts-lib-crypto, parse-json-bignumber, marshall, protobuf-schemas, waves-data-entities, assets-pairs-order, oracle-data, node-api-js, waves-transactions, money-like-to-node, data-service-client-js, waves-browser-bus, waves-ledger-js, waves-signature-adapter, signer, ride-js, Keeper-Wallet-Extension, waveskeeper-types, provider-keeper, WavesExplorerLite, swap-client, waves-crypto.

**Developer Tooling (~8):** waves-ide (22★), ride-vscode (13★), surfboard (10★), js-test-env (3★), ride-intellij-plugin (3★), ride-examples (31★), ride-introduction (19★), waves-repl (4★).

**Infrastructure (~20):** Waves/node (1171★ Scala), gowaves (255★ Go), matcher (18★ Scala), data-service (31★ TS), blockchain-postgres-sync (16★ Rust), nodemon (8★ Go), plus Rust microservices cluster (10 repos: user-storage, mailbox-service, push-notifications-rs, balances-history, operations-service, updates-provider, state-service, state-consumer, exchanges, asset-search-rs, wx-websocket-api).

**Multi-Language SDKs (~20):** Java (WavesJ 47★, waves-transactions-java, waves-crypto-java), Python (waves-python 10★, demo-python-trading-bot 64★), Go (go-lib-crypto 5★), Kotlin (kotlin-lib-crypto, kotlin-lib-model), Swift (swift-lib-crypto), C (waves-c 8★, Base58, Blake2, Keccak), Rust (waves-rust 6★), C# (waves-csharp, csharp-lib-crypto, csharp-lib-transactions), PHP (waves-php, protobuf-php).

**Mobile (4):** WavesWallet-iOS (47★), WavesWallet-android (52★), WavesSDK-iOS (17★), WavesSDK-android (15★).

**Archived/Deprecated (7):** WavesCS, private-node-docker-image, waves-signature-generator, node-docker-image, WavesClientLite, wavespp, how-to-connect-keeper-to-mobile-apps.

**Applications (~10):** WavesGUI (399★), waves-games, waves-items-webapp, waves-dao-ui, mpt-staking-ui, wavesdappcom, web3course.

**Cryptography (4):** curve25519-js (36★), zwaves (4★ ZK), groth16verify, blst-java.

**Internal/CI/Misc (~25):** configs, jira-action, vault-decryptor, provider-seed, provider-metamask, provider-ledger, unified-declarations, blocks-json-parser-js, tx-json-schemas, ts-contract, waves-rest, waves-data-oracle, and others.

**Bottom line:** We forked the 18% that represents 90% of the value. The remaining 82% is either archived, language-specific, infrastructure we'll build our own way, or experiments that didn't go anywhere.
