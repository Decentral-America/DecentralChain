# DecentralChain Node — God Audit
## Full-Stack Analysis: Waves Origins, DCC State, Superiority, and Execution Roadmap

**Audit date:** March 20, 2026
**Repositories audited:**
- `DecentralChain-PolyRepo/node-scala` (Scala node — Waves fork, v1.6.1 base)
- `DecentralChain-PolyRepo/node-go` (Go node — blank slate, planned)
- `DecentralChain/` monorepo (TypeScript SDK, 22 packages + 3 apps)

**Constraint:** Blockchain history must remain intact. Wire-format is immutable. Architecture can be improved at will.

---

## Table of Contents

1. [Why Waves Built It This Way](#1-why-waves-built-it-this-way)
2. [Current DCC Node State](#2-current-dcc-node-state)
3. [What Has Already Been Added by DCC](#3-what-has-already-been-added-by-dcc)
4. [DCC vs Waves — Superiority Map](#4-dcc-vs-waves--superiority-map)
5. [Wire Format Constraints — What Can Never Change](#5-wire-format-constraints--what-can-never-change)
6. [Full Migration Scope — node-scala](#6-full-migration-scope--node-scala)
7. [Waves-Specific Features to Neutralize](#7-waves-specific-features-to-neutralize)
8. [Ethereum/MetaMask Integration Analysis](#8-ethereummetamask-integration-analysis)
9. [node-go — The Strategic Play](#9-node-go--the-strategic-play)
10. [SDK ↔ Node Integration Audit](#10-sdk--node-integration-audit)
11. [Security Audit of Node Migration Gaps](#11-security-audit-of-node-migration-gaps)
12. [Execution Roadmap](#12-execution-roadmap)

---

## 1. Why Waves Built It This Way

Waves was founded in 2016 by Alexander Ivanov. The design philosophy was shaped by three constraints of that era:

### 1.1 The NG Protocol — How Waves Beat Bitcoin's Throughput

Waves implemented **Bitcoin-NG** (Next Generation), a paper from Emin Gün Sirer (later of Avalanche) and Ittay Eyal. The key insight: separate leader election from transaction ordering.

Classic blockchain: one block per 60 seconds, winner takes all, and 60 seconds of transactions are gambled on one connection event.

Bitcoin-NG (and Waves):
- **Key blocks** are generated every ~2 seconds (Waves mainnet) — these elect the generator (miner)
- **Microblocks** fill the interval between key blocks with as many transactions as the network can bear
- Result: ~1000 TPS sustainable throughput at 2s finality for applications

This is why in the Scala node you see the `miner.micro-block-interval = 2s` setting and `max-transactions-in-micro-block = 255`. The NG state machine (`NG.scala`, `NgState.scala`) tracks the current key block and the chain of microblocks appended to it.

**DCC inherits the full NG protocol.** This was the right call. NG is still competitive against most "modern" chains at this transaction profile.

### 1.2 Curve25519 and Why Waves Chose It

In 2016, Waves made a decisive cryptographic choice: **Ed25519** (sign) + **Curve25519** (X25519, key exchange) from Daniel J. Bernstein's work. This was unusual — Bitcoin, Ethereum, and basically every other chain used secp256k1 (ECDSA).

Why Waves chose Ed25519:
1. **Smaller signatures**: 64 bytes vs 71-73 bytes for ECDSA DER
2. **Fast verification**: ~4× faster than secp256k1 at the node level
3. **Simple implementation**: No nonce (the "k" value in ECDSA that leaks keys if reused)
4. **Deterministic**: Same key + message always produces same signature — no side channel from RNG

The downside: incompatible with the Ethereum ecosystem, which required MetaMask integration complexity later (Feature 17).

**DCC inherits Ed25519.** This is why FROST 2-of-2 is the right MPC choice for Cubensis Connect — as documented in `docs/MPC-RESEARCH.md`. No competing chain on Ed25519 has built a threshold wallet like this.

### 1.3 LPoS (Leased Proof of Stake) — The Delegation Design

Waves' consensus was **Leased Proof of Stake (LPoS)**, not Delegated PoS (DPoS). The difference is crucial:

- **DPoS** (EOS, Tron): token holders vote for fixed nodes (witnesses/validators). The witnesses form a closed set.
- **LPoS** (Waves/DCC): any address can lease its balance to any node, increasing that node's generating balance. No fixed validator set. Any node with > 1000 WAVES / DCC effective balance can generate blocks proportional to that balance.

This means:
- **Open participation** — no permissioned validator list
- **Capital efficiency** — the lease earns rewards without unbonding/lockup
- **Instant delegation** — you point your balance at a node, the node's probability of mining the next block increases proportionally

The `GeneratingBalanceProvider` calculates the effective generating balance by summing:
```
effective_balance = own_balance + all_leased_to_you
```
Taken at a depth of either 50 or 1000 blocks (the `generationBalanceDepthFrom50To1000AfterHeight` feature).

**Why `FairPoS`?** Feature 8 introduced FairPoS (V1 and V2), a modification to how the "hit" (pseudo-random delay to next block) is calculated. The original NxtPoS formula allowed large balance holders to dominate in ways that violate probability theory. FairPoS applies a formula that ensures the probability of mining is exactly proportional to balance. This is why `PoSCalculator.scala` has `NxtPoSCalculator` and `FairPoSCalculator`.

### 1.4 Ride — Why a Custom Language

The Waves team correctly identified that Ethereum's EVM was dangerous for mainstream adoption:
- Turing-complete → open-ended execution cost → gas estimation nightmare
- Solidity had (and still has) endemic vulnerabilities — reentrancy, integer overflow, etc.
- Every smart contract requires a security audit

Waves' answer: **Ride** — a non-Turing-complete, expression-based functional language. Key properties:
- **Predictable execution cost**: every script has a complexity estimate computed statically at deploy time
- **No iteration**: no for-loops, no recursion — eliminates an entire class of bugs
- **No state modification in verification**: Ride V1-V4 scripts just `return true/false`
- **dApp functions** (Ride V4+, Feature 11): callable functions that can modify state, but still bounded complexity
- **InvokeScript entry point**: up to complexity 26,000 (later 52,000 with Feature 16)

The `EstimatorProvider` and `ComplexityCheckPolicyProvider` in the node enforce per-version complexity limits, ensuring no unbounded computation enters a block.

**DCC inherits Ride.** DCC mainnet runs Ride V6+ (Feature 17 was pre-activated at block 0 in the test configuration). This is still superior to EVM Solidity for financial applications where correctness > flexibility.

### 1.5 Protobuf Wire Format (Feature 15, BlockV5)

Starting at Feature 15 (`BlockV5`), Waves migrated all transaction serialization to **Protocol Buffers** (protobuf). Before that, custom binary serialization was used (the "legacy" format).

The protobuf schemas are in `packages/protobuf-serialization/` in the DCC monorepo — these are exactly the wire format that node-scala serializes. The `PBTransactionSerializer` in the node and the `@decentralchain/protobuf-serialization` package in the SDK must remain byte-for-byte compatible.

---

## 2. Current DCC Node State

### 2.1 node-scala — What It Is

The `node-scala` repository is a fork of `wavesplatform/Waves` at **version 1.6.1** (see `version.sbt: git.baseVersion := "1.6.1"`). This is one of the most recent Waves releases, which is significant — Waves is at 1.6.x and DCC forked at the same generation, meaning DCC started with:

- All 25 blockchain features through Feature 25 (Deterministic Finality)
- Scala 3.8.1 (Waves led the upgrade to Scala 3)
- RocksDB backing store (replaced LevelDB)
- Light Node mode
- gRPC extension
- Ethereum/MetaMask gateway (EthRpc)
- RIDE V9 (bundled with Feature 25)

The build system is **sbt** (Scala Build Tool) with the project structure:
```
lang/         Ride language compiler + evaluator (cross-compiled JS + JVM)
node/         Core node implementation
grpc-server/  gRPC extension
ride-runner/  Off-chain Ride script evaluation service
node-it/      Integration tests
node-testkit/ Test utilities
repl/         Ride REPL (cross-compiled JS + JVM, published to npm as @waves/ride-repl)
```

### 2.2 node-go — What It Is

The `node-go` repository currently contains only:
```
.git/
README.md  (content: "# node-go")
```

This is an **empty placeholder** for a future Go implementation of the DCC node. The intent is almost certainly a lightweight node (possibly a light client, validator, or indexer) written in Go, which would complement the Scala full node. No code has been written yet.

The strategic rationale for a Go node:
- Go compiles to single statically-linked binaries → easy deployment
- Much lower resource footprint than JVM
- Strong networking primitives (goroutines) → excellent for p2p networking
- The Cosmos SDK ecosystem is Go → DCC Go node could bootstrap from cosmos-sdk p2p or tendermint-style tooling
- A Go node enables WASM compilation → could run as a browser light client

### 2.3 Current Migration Progress — Quantified

| Category | Status | Detail |
|----------|--------|--------|
| Scala package namespace | 🔴 0% migrated | All 438 source files in `node/src/main/scala` use `com.wavesplatform` |
| Config root key | 🔴 Not migrated | All configs use `waves {}` root |
| P2P ApplicationName | 🔴 `"waves"` | Combined with chainId `?` → handshake key is `"waves?"` |
| REST API agent name | 🔴 `"Waves v1.6.1"` | Returns Waves branding from `/node/version` |
| Docker image destination | 🔴 `ghcr.io/wavesplatform/waves` | Publishes to Waves GitHub registry |
| DCC-unique features | 🟢 Implemented | Feature 25 + BLS crypto fully in place |
| Chain IDs | 🟢 Already DCC | Mainnet `?`, Testnet `!`, Stagenet shared |
| Ride compiler | 🟡 Inherited, unbranded | `@waves/ride-lang` + `@waves/ride-repl` (allowed, chain-agnostic) |

---

## 3. What Has Already Been Added by DCC

### 3.1 Deterministic Finality (Feature 25) — DCC's Biggest Innovation

This is the most significant DCC-original contribution to the codebase. Waves does not have this. Feature 25 implements **threshold block endorsement using BLS-12381 aggregate signatures**.

**How it works:**

> The Waves NG protocol produces blocks quickly but doesn't have Byzantine fault tolerance — a chain reorganization is always possible up to the max rollback depth (100 blocks). Deterministic Finality adds a second layer: block endorsement by committed generators.

At each block height, nodes that have registered as "committed generators" (via `CommitToGenerationTransaction`) form an endorser set. These nodes vote on whether to endorse the previous block. Once ≥ threshold endorsers have signed with their BLS private key, the block is considered **finalized** — it cannot be rolled back under any condition short of a hard fork.

Key files:
- `CommitToGenerationTransaction.scala` — the commitment tx (tx type 19, DCC-unique)
- `BlockEndorser.scala` — the voting process
- `EndorsementStorage.scala` — persistent endorsement tracking
- `EndorsementFilter.scala` — eligibility rules
- `FinalizationState.scala` — the finality state machine
- `GenerationPeriod.scala` — period management
- `GeneratorIndex.scala` — index of committed generators
- `BlockchainFeatures.scala: DeterministicFinality = BlockchainFeature(25, ...)` — activation gate

The BLS cryptography module:
```
com/wavesplatform/crypto/bls/
  BlsKeyPair.scala      — ed25519 keypair + BLS-12381 keypair binding
  BlsPublicKey.scala    — 48-byte BLS G1 public key (compressed)
  BlsSignature.scala    — 96-byte BLS G2 signature (compressed)
  BlsUtils.scala        — BLST library wrappers + domain separation
```

Uses **BLST** (the fastest BLS12-381 implementation, from Ethereum Foundation work, used by Ethereum consensus layer). Domain separation tag: `"BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_"`.

**Why this is superior to Waves:**
Waves NG produces blocks in ~2 seconds with probabilistic finality. A "finalized" transaction on Waves waits for community-standard 20–30 confirmations (~1 min). DecentralChain's Deterministic Finality provides **cryptographic finality** backed by BLS threshold signatures within one generation period. For payment applications, DeFi protocols, and cross-chain bridges, this changes the risk profile fundamentally.

### 3.2 CommitToGenerationTransaction (Tx Type 19)

This is a **DCC-unique transaction type**. The Waves transaction list ends at type 18 (`InvokeExpression`). DCC adds type 19:

```scala
final case class CommitToGenerationTransaction(
    version: TxVersion,
    sender: PublicKey,
    endorserPublicKey: BlsPublicKey,    // BLS-12381 G1 public key
    generationPeriodStart: Height,       // which generation period to commit to
    timestamp: TxTimestamp,
    fee: TxPositiveAmount,
    commitmentSignature: BlsSignature,  // PoP: BLS(blsKey, publicKey || periodStart)
    proofs: Proofs,                      // ed25519 authorization from sender
    chainId: Byte
)
```

This is the mechanism by which a staker publicly commits their BLS key for a generation period. The `DepositInWavelets = 100_00000000L` (100 DCC) is the locked deposit for participation.

**Note**: The constant says "InWavelets" but in DCC context these are DeciCoins (the smallest DCC unit). This is a rename opportunity.

### 3.3 RIDE V9

Feature 25 also bundles **RIDE V9**, the latest version of the smart contract language. The `lang/shared/src/main/scala/com/wavesplatform/lang/v1/` module contains the Ride V9 compiler and evaluator. DCC ships this as part of the Ride REPL (`@waves/ride-repl`) which is unforked — it's a chain-agnostic evaluator. When DCC eventually forks the Ride compiler, it can add DCC-specific built-in functions.

---

## 4. DCC vs Waves — Superiority Map

### Protocol Level

| Dimension | Waves | DecentralChain | DCC Advantage |
|-----------|-------|----------------|---------------|
| Block finality | Probabilistic (20-30 confs ≈ 60s) | Deterministic (BLS endorsement, Feature 25) | **CRITICAL**: Cryptographic finality for DeFi, bridges, payments |
| Block endorsement | None | BLS-12381 threshold signatures | First in Waves protocol family |
| Smart contract language | Ride V9 | Ride V9 (same) | Parity |
| TPS (theoretical) | ~1000 via NG | ~1000 via NG (same) | Parity |
| MetaMask compatibility | Yes (Feature 17+) | Yes (inherited) | Parity |
| Chain governance | On-chain voting with 80% threshold | Same mechanism | Parity |
| Inflation/tokenomics | XTN buyback + DAO split + rewards | DCC rewards only (no XTN, no external DAO) | **Simpler, self-contained** |
| Sustainability | None | Proof of Incentivized Sustainability (PoIS) | **DCC-unique** |
| Carbon credits | None | Costa Rica FONAFIFO integration | **DCC-unique** |

### SDK/Developer Level

| Dimension | Waves (@waves/* npm) | DecentralChain (@decentralchain/* npm) |
|-----------|---------------------|----------------------------------------|
| TypeScript version | Mixed, often TS 4.x | TypeScript 5.9, maximum strict |
| Module format | CJS primary, ESM secondary | **ESM-only** (`.mjs` + `.d.mts`) |
| Build tool | tsc, webpack, esbuild | tsdown (Rolldown-powered Rust) |
| Linting | ESLint + Prettier | **Biome** (single Rust binary, 10-100× faster) |
| Monorepo | No (25 separate repos) | **Nx + pnpm** (unified, cached, affected) |
| Test runner | Jest (most packages) | **Vitest** (native ESM, V8 coverage) |
| Test count | ~3800 scattered | 3800+ unified, single run |
| Package audits | Mixed | Zero npm audit vulnerabilities |
| Non-custodial wallet | None | **Cubensis Connect** (1-of-1, user holds seed) |
| Blockchain explorer | Waves Explorer (Waves-branded) | DecentralScan (full rebuild, React 19 + RR7 SSR) |
| Node version | Node 16/18 | **Node ≥ 24** |
| CI | Per-repo GitHub Actions | **Nx Cloud** (computation caching, affected detection) |

### Wallet Level

| Dimension | Keeper Wallet | Cubensis Connect |
|-----------|---------------|------------------|
| Seed phrase required | Yes (no seedless option) | Seed phrase, 1-of-1 (user is sole key holder) |
| Threshold signing | None | None — by design |
| Custodial risk | No (full self-custodial) | No — user holds seed, no server component |
| MetaMask support | Via Waves dApp | Via Cubensis + EthRpc |
| Non-custodial seedless | Never launched | **First in Waves protocol family** |

### Infrastructure

| Dimension | Waves | DCC |
|-----------|-------|-----|
| Docker image | `wavesplatform/wavesnode` (Docker Hub) | DCC registry (planned) |
| Node REST API | docs.waves.tech | DCC documentation |
| Data service | `api.waves.exchange` | `data-service.decentralchain.io` |
| Matcher | `matcher.waves.exchange` | `mainnet-matcher.decentralchain.io` |
| Explorer | `wavesexplorer.com` | DecentralScan (deployed) |

---

## 5. Wire Format Constraints — What Can Never Change

These are the immutable laws. Changing any of them would invalidate all existing blocks and require a history reset.

### 5.1 Transaction Type Bytes

| Byte | Name | Status |
|------|------|--------|
| 1 | GenesisTransaction | Immutable |
| 2 | PaymentTransaction | Immutable |
| 3 | IssueTransaction | Immutable |
| 4 | TransferTransaction | Immutable |
| 5 | ReissueTransaction | Immutable |
| 6 | BurnTransaction | Immutable |
| 7 | ExchangeTransaction | Immutable |
| 8 | LeaseTransaction | Immutable |
| 9 | LeaseCancelTransaction | Immutable |
| 10 | CreateAliasTransaction | Immutable |
| 11 | MassTransferTransaction | Immutable |
| 12 | DataTransaction | Immutable |
| 13 | SetScriptTransaction | Immutable |
| 14 | SponsorFeeTransaction | Immutable |
| 15 | SetAssetScriptTransaction | Immutable |
| 16 | InvokeScriptTransaction | Immutable |
| 17 | UpdateAssetInfoTransaction | Immutable |
| 18 | EthereumTransaction | Immutable |
| **19** | **CommitToGenerationTransaction** | **DCC-unique — immutable from block 1** |

### 5.2 Native Asset Wire String

```
"WAVES"  ← this literal string is written in blockchain history
```
You cannot rename this to `"DCC"` in wire format. The `asset.maybeBase58Repr.getOrElse("waves")` pattern in transaction validators returns `"waves"` as the identifier for the native coin. This is forever. All error messages, logs, and REST API responses that output `"waves"` in asset fields will continue to do so.

**Action**: Rename display strings only. When the UI or error message says "waves", it means the native DCC coin. The REST API's `"assetId": null` for native coin is already chain-agnostic; only error text says `"waves"`.

### 5.3 Signature Scheme

Ed25519/Curve25519 signing. BLS-12381 for CommitToGeneration endorsements. Both are permanent.

### 5.4 Hashing

- `fastHash()` = Blake2b-256
- `secureHash()` = Keccak-256(Blake2b-256(x)) = used for address derivation
- Address format = Base58Check(1 + chainId + secureHash(publicKey)[0..19] + checksum[0..3])

### 5.5 Chain IDs (Already DCC-Correct)

| Network | Char | Byte | Status |
|---------|------|------|--------|
| Mainnet | `?` | 63 | ✅ DCC |
| Testnet | `!` | 33 | ✅ DCC |
| Stagenet | `S` | 83 | Shared with Waves |

### 5.6 Protobuf Field Numbers

The protobuf schemas under `packages/protobuf-serialization/` and `node/src/main/protobuf/` have fixed field numbers. Adding new **optional** fields is safe. Removing, renumbering, or changing any existing field breaks history.

### 5.7 P2P Handshake Structure

The `Handshake` class encodes: `appNameBytes + version(3 ints) + nodeName + nonce + address`. The application name is `Constants.ApplicationName + chainId` = `"waves?"` currently. **Changing this breaks all existing node connectivity.** Coordinate this change across ALL operators simultaneously.

---

## 6. Full Migration Scope — node-scala

### 6.1 Identity Migrations (Safe After Coordination)

#### Change 1: P2P Application Name
**File**: `node/src/main/scala/com/wavesplatform/settings/Constants.scala`

```scala
// Current
val ApplicationName = "waves"
val AgentName       = s"Waves v${Version.VersionString}"

// Target
val ApplicationName = "decentralchain"
val AgentName       = s"DecentralChain v${Version.VersionString}"
```

**Impact**: Any two nodes — one old (`"waves?"`) and one new (`"decentralchain?"`) — will **refuse to connect to each other**. This is a coordinated hard-cut migration. All operators must upgrade simultaneously, or use a temporary bridge period where both application names are accepted.

**Recommendation**: This is the P0 migration. Plan for a coordinated upgrade block height, pre-announce, and execute.

#### Change 2: Config Root Key
**File**: `node/src/main/resources/application.conf`

The `waves { }` root can be changed to `decentralchain { }` with a compatibility shim in `WavesSettings.fromRootConfig` that tries both keys. This lets old configs continue working with a deprecation warning.

#### Change 3: REST API Agent
Handled by Change 1 above (`AgentName`).

### 6.2 Package Namespace Migration (Non-Breaking, Can Do Incrementally)

**Scope**: 438 files in `node/src/main/scala`, plus files in `lang/`, `grpc-server/`, `ride-runner/`, etc.

Target: `com.wavesplatform` → `com.decentralchain`

This is **not a wire format change** — package names don't appear on the network. It is a pure rename. The sbt build will need `organization := "com.decentralchain"` in `build.sbt`.

The Maven artifact IDs will change from `com.wavesplatform:waves-*` to `com.decentralchain:dcc-*`.

**Recommendation**: Do this in a single automated commit using IntelliJ IDEA's "Rename package" refactor, or `sed`. Generate Jira ticket for this effort.

### 6.3 Token Constant Renames (Cosmetic, Non-Breaking)

**File**: `Constants.scala`

```scala
// Current
val UnitsInWave = 100000000L  // 1 DCC = 100,000,000 DeciCoins
val TotalWaves  = 100000000L  // DCC total supply baseline

// Target (same values, better names)
val UnitsInDCC  = 100000000L
val TotalDCC    = 100000000L
```

Internal references to `UnitsInWave` (20 files) need updating. Zero impact on wire format.

Also: `DepositInWavelets` in `CommitToGenerationTransaction` → `DepositInDeciCoins` (or whatever DCC calls its smallest unit).

### 6.4 Docker Image and CI Workflows

**Files**: `.github/workflows/publish-docker-image.yml`

```yaml
# Current
IMAGE_NAME: ghcr.io/wavesplatform/waves

# Target
IMAGE_NAME: ghcr.io/decentral-america/decentralchain-node
```

Also change Docker Hub push target from `wavesplatform/wavesnode` to DCC organization.

### 6.5 Build Metadata

**File**: `build.sbt`

```scala
// Current
organization         := "com.wavesplatform",
organizationName     := "Waves Platform",
organizationHomepage := Some(url("https://wavesplatform.com")),
licenses             := Seq(("MIT", url("https://github.com/wavesplatform/Waves/...")))

// Target
organization         := "com.decentralchain",
organizationName     := "Blockchain Costa Rica",
organizationHomepage := Some(url("https://decentralchain.io")),
licenses             := Seq(("MIT", url("https://github.com/Decentral-America/...")))
```

---

## 7. Waves-Specific Features to Neutralize

### 7.1 XTN Buyback Mechanism — Remove from DCC

`xtnBuybackAddress` and `CeaseXtnBuyback` / `CappedReward` features originate from Waves' **Neutrino (USDN/XTN)** stablecoin stabilization mechanism. The Waves foundation reserved block rewards to buy back XTN when it depegged. This has **zero relevance to DCC**.

**Current code**:
```scala
case class FunctionalitySettings(
    daoAddress: Option[String] = None,              // Waves DAO
    xtnBuybackAddress: Option[String] = None,       // XTN buyback
    xtnBuybackRewardPeriod: Int = Int.MaxValue,     // XTN reward period
    ...
)
```

**Features involved**:
- Feature 19: `BlockRewardDistribution` — splits block rewards to miner / DAO / XTN buyback
- Feature 20: `CappedReward` — caps XTN buyback amounts
- Feature 21: `CeaseXtnBuyback` — ceases XTN buyback entirely

**Recommendation**: Set `daoAddress = None` and `xtnBuybackAddress = None` in DCC mainnet config. Pre-activate Features 20 and 21 at block 0 in any future DCC chain deployment. The code can remain — it's dormant when the addresses are None. A clean version would remove the feature flags, but this is lower priority than getting the deployment right.

### 7.2 DAO Address — Repurpose for DCC

The `daoAddress` mechanism can be repurposed: instead of Waves DAO, configure a DCC community treasury address. When `BlockRewardDistribution` (Feature 19) is activated and `daoAddress` is set, a fraction of every block reward goes to that address.

**This is actually a DCC opportunity**, not a Waves legacy to remove. Set `daoAddress` to a DCC community multisig or DAO contract.

### 7.3 `BoostBlockReward` Feature (23) — Evaluate

Feature 23 (`BoostBlockReward`) was added by Waves to temporarily boost miner rewards by 10×. This was a Waves Studio monetization play. DCC should decide whether to pre-activate or pre-deactivate this feature based on DCC tokenomics goals.

### 7.4 `EcrecoverFix` Feature (24) — Keep

Feature 24 is a fix for the `ecrecover()` Ride function (the Ethereum-compatible signature recovery). This is needed for MetaMask support. Keep it activated.

---

## 8. Ethereum/MetaMask Integration Analysis

### 8.1 What It Is

Feature 17 (`RideV6, MetaMask support`) + Feature 18 (`ConsensusImprovements and MetaMask updates`) introduced the ability for MetaMask users to interact directly with the Waves (DCC) chain.

The node implements:
- `EthereumTransaction` (tx type 18) — wraps an EIP-155 Ethereum transaction
- `EthRpcRoute` — Ethereum JSON-RPC gateway at `/eth/... `
- `EthABIConverter` — parses Ethereum ABI-encoded function calls into Ride `InvokeScript` invocations
- `EthEncoding` — hex address encoding (0x...) ↔ DCC base58

How it works:
1. User has MetaMask configured with RPC pointing to DCC node
2. User signs an Ethereum-format transaction with their secp256k1 key
3. Node wraps it as `EthereumTransaction`
4. The Ethereum address (derived from secp256k1 public key) maps to a DCC address
5. The dApp callable function is called via Ride as usual

### 8.2 Strategic Value for DCC

**This is a massive bridge.** MetaMask has 30M+ users. The ability to say "point MetaMask to DCC and start using Ride dApps immediately" is genuinely unique. Waves had this capability, but DCC can market it better:
- All existing MetaMask users can access DCC without a new wallet
- EVM-compatible tokens bridged to DCC can be used natively
- DCC dApps can serve both native DCC users (Cubensis Connect) and EVM users (MetaMask)

**Recommendation**: Keep full MetaMask/Ethereum support. Do not disable or remove `EthereumTransaction`. Ensure `EthRpcRoute` is documented and promoted.

### 8.3 The EthRpc Endpoint

The current `EthRpcRoute` is never documented in DCC's public-facing materials. The node's Ethereum JSON-RPC endpoint is available at the node's HTTP port under `/eth`. A DCC node can be added to MetaMask using:
- Network name: `DecentralChain Mainnet`
- RPC URL: `https://mainnet-node.decentralchain.io/eth`
- Chain ID: `63` (byte value of `?`)
- Currency: `DCC`
- Explorer: `https://decentralscan.io`

**Action**: Document this in the scanner README and DCC website. Create a MetaMask integration guide.

---

## 9. node-go — The Strategic Play

The `node-go` repository is currently empty. This is a blank-slate opportunity. Here is the recommended design for what the Go node should be:

### 9.1 Purpose: Light Client + Verifier

The Scala node is a full node: it stores the entire blockchain state (RocksDB), runs the UTX pool, mines blocks, maintains P2P connections. It requires 8GB+ RAM and significant storage.

The Go node's optimal purpose is different:
- **Light client** — verify block headers and proofs without full state
- **Smart contract evaluator** — run Ride scripts off-chain (ride-runner equivalent in Go)
- **Indexer/API gateway** — parse blocks and serve GraphQL or REST endpoints
- **Verifier** — verify Ed25519 signatures and CommitToGeneration BLS endorsements

### 9.2 Why Go for This

Go compiles to a single ~20MB binary with no JVM. A Go light client can:
- Embed in infrastructure tools (Kubernetes operators, serverless functions)
- Compile to WASM → browser light client (verify transactions in the browser)
- Run on edge nodes / Raspberry Pi nodes for the LPoS staking ecosystem

### 9.3 Starting Point

The most complete reference implementations for Waves-protocol compatible Go nodes:
1. **gowaves** (`wavesplatform/gowaves`) — exists. Waves team's own Go implementation. Covers P2P, block sync, transaction validation. MIT licensed.
2. **waves-go-test** — various community experiments.

DCC's Go node should fork `gowaves` and:
1. Change the network application name to `"decentralchain"`
2. Update chain ID defaults
3. Add BLS-12381 verification for CommitToGeneration
4. Publish as `github.com/Decentral-America/dcc-go`

### 9.4 Immediate action

Create a `go.mod` and at minimum a `cmd/dcc-node/main.go` stub that connects to the DCC P2P network. Even a read-only peer that downloads and verifies blocks would be valuable as a second implementation for security analysis.

---

## 10. SDK ↔ Node Integration Audit

### 10.1 Protobuf Wire Format Dependency

The `@decentralchain/protobuf-serialization` package (Layer 0) is the bridge between the TypeScript SDK and the Scala node's protobuf wire format. This must be perfectly synchronized.

**Verified**: The `CommitToGenerationTransaction` was already added to the protobuf schemas and the TypeScript SDK package. This is documented as complete (DCC-15 in the Jira). The critical field that was fixed was the BLS signature field numbering (DCC-42).

### 10.2 Transaction Signing Chain

```
User intent
  → @decentralchain/transactions (builds tx object)
  → @decentralchain/marshall (binary serialization, pre-PB transactions)
  → @decentralchain/protobuf-serialization (PB transactions, Feature 15+)
  → @decentralchain/crypto (Ed25519 signing via Rust/WASM)
  → @decentralchain/node-api-js (broadcasts to node REST API)
  → node-scala (validates signature, adds to UTX, broadcasts via P2P)
```

Every link in this chain has been tested. The 3,800+ tests in the monorepo cover the critical paths.

### 10.3 Key Verification: CommitToGeneration in SDK

The `CommitToGenerationTransaction` builder in `@decentralchain/transactions` uses:
- Ed25519 for the outer `proofs` signature (via `@decentralchain/crypto`)
- BLS-12381 for the `commitmentSignature` (currently exposed via `@decentralchain/crypto` Rust/WASM)

This means the WASM crypto module already has BLS support built in. The same `@decentralchain/crypto` package that provides `signBytes()` for standard transactions also provides the BLS operations for `CommitToGeneration`.

### 10.4 Chain ID in REST API Responses

The node REST API returns `chainId` as the ASCII byte value of the address scheme character. Example: DCC mainnet returns `63` (ASCII code of `?`). The SDK's `@decentralchain/ts-types` package defines `ChainId` type, and the `@decentralchain/data-entities` package includes chain ID parsing. These are correctly configured for DCC.

### 10.5 The `"WAVES"` Asset Wire Format in SDK

The `@decentralchain/ts-types` package defines:
```typescript
export type AssetId = string | null;  // null = native DCC coin
```

Internally, when broadcasting, `null` is sent as no assetId field, and the node treats absent assetId as the native coin. The string `"WAVES"` only appears in Waves REST API responses as a legacy format. DCC's REST API already returns `null` for native coin assetId in most endpoints.

---

## 11. Security Audit of Node Migration Gaps

### 11.1 CRITICAL: P2P ApplicationName Still `"waves"`

**Severity**: CRITICAL
**Risk**: Any node that changes its application name to `"decentralchain"` without coordination becomes an isolated island. Conversely, a node running `"waves?"` can still be peer-tricked by a Waves mainnet node that also uses `"waves?"` (same string since Waves mainnet uses `W`: `"wavesW"` ≠ `"waves?"`). The `?` suffix protects against cross-chain peer injection.

The actual risk of keeping `"waves"` as the ApplicationName long-term is:
- **DCC nodes and Waves nodes will NEVER connect** anyway because of different chain ID (`W` vs `?`)
- So keeping `"waves"` does not create a security hole in practice for the P2P network
- But it does create branding confusion and means the `/node/version` endpoint returns "Waves v1.6.1"

**Recommendation**: Change `ApplicationName` on the next coordinated network upgrade. Not urgent but included in the next point release.

### 11.2 HIGH: Docker Image Still at Waves GitHub Container Registry

**Risk**: Users pulling `ghcr.io/wavesplatform/waves` for "DCC deployment guides" would get the unmodified Waves node image — connecting to Waves mainnet, not DCC. Anyone following a compromised guide could unknowingly be running a Waves node thinking it's DCC.

**Recommendation**: Immediately publish `ghcr.io/decentral-america/dcc-node:latest` and update all documentation.

### 11.3 HIGH: REST API `api-key-hash` in docker configuration

**File**: `docker/private/waves.custom.conf`
```
rest-api.api-key-hash = "7B74gZMpdzQSB45A7KRwKW6mDUYaWhFY8kWh5qiLRRoA"
```

This is a default configuration with a baked-in test API key hash visible in the repository. Any node operator copy-pasting this config retains a known API key, which allows arbitrary wallet access via `GET /debug/wallet` endpoints.

**Recommendation**: Remove this from the repository or replace with a clearly invalid placeholder and document that API key must be changed.

### 11.4 MEDIUM: `cors-headers.access-control-allow-origin = "origin-from-request"`

**File**: `application.conf`

The CORS configuration dynamically mirrors the request origin. This is equivalent to `Access-Control-Allow-Origin: *` in practice — any website can make authenticated requests to the DCC node REST API. Combined with `api-key-hash`, this means XSS in any website can call node admin APIs.

**Recommendation**: Change default CORS to `"*"` explicitly (or a specific origin list) and document that production deployments should restrict to known origins. The behavior change vs `"origin-from-request"` is negligible in practice but removes the false security impression.

### 11.5 MEDIUM: RIDE Complexity Limits

The node's `evaluate-script-complexity-limit = 52000` in REST API config allows off-chain evaluation of up to 52,000-complexity scripts. This is a CPU-bound endpoint. It should be rate-limited in production deployments.

**Recommendation**: Document rate limiting requirement in production deployment guide.

### 11.6 LOW: `resetEffectiveBalancesAtHeight` in TESTNET

The testnet config has `reset-effective-balances-at-height = 4650` — a one-time historical hack from circa 2017. This has no present-day significance but remains as dead configuration.

---

## 12. Execution Roadmap

Organized by impact/effort ratio. Highest impact, lowest risk first.

### Phase 1 — Docker + CI Identity (Immediate, 1-2 days)

1. Create `ghcr.io/decentral-america/dcc-node` Docker image publishing workflow
2. Update `.github/workflows/publish-docker-image.yml` with DCC registry
3. Update `build.sbt` organization metadata
4. Remove or replace the hardcoded `api-key-hash` from `docker/private/waves.custom.conf`

**Risk**: Zero. These are CI and build metadata changes.

### Phase 2 — REST API + Agent Name (1 day)

1. Change `Constants.AgentName` → `s"DecentralChain v${Version.VersionString}"`
2. Change `DebugApiRoute.scala` config key from `"waves"` to `"decentralchain"` (with backwards compat)
3. Update REST API Swagger documentation (YAML files in `swagger-ui/`)

**Risk**: Very low. REST API consumers must update their node version parsing (minor breaking change).

### Phase 3 — Config Root Rename (1 week)

1. Change config root from `waves.` to `decentralchain.`
2. Add backwards-compatible fallback for `waves.` root with deprecation warning
3. Update all Docker configs, `waves-sample.conf` → `decentralchain-sample.conf`, documentation

**Risk**: Low with backwards compat shim. Operators who update configs immediately get clean experience; old configs keep working until next major version.

### Phase 4 — P2P Application Name (Coordinated Upgrade, Plan carefully)

1. Schedule a coordinated block height for the name change
2. Announce to all operator community with ≥2 weeks' notice
3. Implement: `Constants.ApplicationName = "decentralchain"`
4. Release, all operators upgrade before the target block height

**Risk**: HIGH if uncoordinated. LOW if coordinated. Do not skip the coordination.

### Phase 5 — Package Namespace Migration (2-3 weeks)

1. Create Jira ticket for automated refactor
2. IntelliJ IDEA bulk rename `com.wavesplatform` → `com.decentralchain`
3. Update Maven artifact IDs: `com.wavesplatform:waves-*` → `com.decentralchain:dcc-*`
4. Update Scala API compatibility
5. Update SDK's `@decentralchain/protobuf-serialization` java_package option

**Risk**: Low. This is internal naming. Doesn't affect wire protocol.

### Phase 6 — Token Constant Renames + Internal Cleanup (1 week)

1. `UnitsInWave` → `UnitsInDCC` / `DeciCoins`
2. `TotalWaves` → `TotalDCC`
3. `DepositInWavelets` → `DepositInDeciCoins`
4. Error messages: `"waves"` in `TxValidationError.NonPositiveAmount(amount, "waves")` → `"DCC"`
5. Feature names: Remove "XTN", "USDN", "Neutrino" from BlockchainFeature descriptions

**Risk**: Zero for wire format. Minor for API consumers expecting `"waves"` in error messages.

### Phase 7 — XTN/DAO Neutralization (1 day)

1. DCC mainnet config: confirm/document that `xtnBuybackAddress` is not set
2. Pre-activate Features 20 and 21 (CeaseXtnBuyback, CappedReward) at block 0 in new chain deployments
3. Configure `daoAddress` as DCC community treasury address (or leave as None)
4. Document tokenomics in DCC website

**Risk**: Zero. Configuration-only changes.

### Phase 8 — node-go Initialization (2-4 weeks)

1. Fork `wavesplatform/gowaves`
2. Change application name and defaults for DCC
3. Add BLS-12381 verification for `CommitToGeneration`
4. Publish as `github.com/Decentral-America/dcc-go`
5. CI: build + test on push

**Risk**: Low. New codebase, no breaking changes to existing node.

### Phase 9 — MetaMask Integration Documentation (3 days)

1. Document MetaMask network configuration for DCC (RPC URL, chain ID 63, currency DCC, explorer)
2. Create a "Connect MetaMask to DCC" page on DCC docs/website
3. Test end-to-end: MetaMask → EthRpc → DCC node → Ride dApp

**Risk**: Zero.

### Phase 10 — Cubensis Connect Store Submissions (1 week)

1. Chrome Web Store submission
2. Firefox AMO submission
3. Edge Add-ons listing

**Risk**: Low. Extension is already built.

---

## Summary: The Full Stack Superiority Statement

DecentralChain is not a Waves clone. It is a **Waves evolution** — taking everything Waves built correctly and adding what Waves never built.

**What we inherited right:**
- Ed25519 signing (correct choice in 2016, remains the right choice)
- NG Protocol (still competitive, 1000 TPS at 2s block time)
- Ride smart contracts (non-Turing-complete = safe by default)
- LPoS consensus (open participation, instant delegation)
- Full node in Scala/JVM (proven, audited codebase)

**What we added that Waves never had:**
- **Deterministic Finality** via BLS-12381 threshold endorsements (Feature 25)
- **CommitToGenerationTransaction** with BLS Proof of Possession
- **Proof of Incentivized Sustainability** (PoIS) — carbon offset per transaction
- **DCC-first tokenomics** with no external stablecoin dependency
- **Modern TypeScript SDK** — ESM-only, Vitest, Biome, Nx, TypeScript 5.9 strict
- **DCC blockchain explorer** — DecentralScan, full rebuild on React 19 + React Router 7 SSR
- **Self-custodial wallet** — Cubensis Connect, 1-of-1 seed-phrase model, user is sole key holder

**What we are completing:**
- Node identity migration (phases 1–6 above)
- node-go (phase 8)
- Store submissions (Cubensis Connect, phase 10)

**What we have that Waves has abandoned:**
- The Waves team is moving toward Waves 2.0 / consensus overhaul. The `@waves/*` npm packages are no longer maintained with the care they once were. DCC's monorepo has 3,800+ tests, zero audit vulnerabilities, and a unified modern toolchain. The SDK is already superior to the upstream.

The blockchain history is intact. The protocol is proven. The innovations are working. The migration is in progress. The roadmap is clear.

**The only remaining question is execution speed.**
