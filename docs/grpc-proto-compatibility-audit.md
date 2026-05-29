# gRPC Proto Compatibility Audit — DCC-171

**Date**: 2026-05-11  
**Scope**: node-scala ↔ node-go ↔ blockchain-postgres-sync ↔ Legacy PolyRepo  
**Method**: byte-for-byte diff of all proto files across all four codebases  

---

## Summary

**node-go is two protocol generations behind node-scala.**

| Repo | Schema version | Source |
|------|---------------|--------|
| node-scala | `com.wavesplatform:protobuf-schemas:1.6.0` | Maven dep `Dependencies.scala` |
| node-go | ~1.4 (Waves Protocol 1.4) | Vendored submodule `pkg/grpc/protobuf-schemas/` |
| blockchain-postgres-sync | 1.6.x | Vendored in `proto/` directory |
| Legacy PolyRepo | 1.6.x (DCC-branded) | `protobuf-serialization/proto/` |

The 3-way gap is not cosmetic. It produces **silent data loss** on two paths and **blocks the state hash comparison** required by DCC-151 / DCC-170.

---

## File Inventory

### node-scala (17 files)
```
dcc/amount.proto
dcc/block.proto
dcc/events/events.proto
dcc/events/grpc/blockchain_updates.proto
dcc/invoke_script_result.proto
dcc/lang/dapp_meta.proto
dcc/node/grpc/accounts_api.proto
dcc/node/grpc/assets_api.proto
dcc/node/grpc/blockchain_api.proto
dcc/node/grpc/blocks_api.proto
dcc/node/grpc/transactions_api.proto
dcc/order.proto
dcc/recipient.proto
dcc/reward_share.proto          ← node-go MISSING
dcc/state_snapshot.proto        ← node-go MISSING
dcc/transaction.proto
dcc/transaction_state_snapshot.proto  ← node-go MISSING
```

### node-go (14 files)
All 14 are shared with node-scala. The 3 above are absent.

### blockchain-postgres-sync (11 files)
Subset of node-scala 1.6.x. Includes all 3 node-go-missing files.  
Missing: `dapp_meta.proto` and all 5 `node/grpc/*_api.proto` files (not needed — BPS connects to BlockchainUpdates stream only).

---

## Compatibility Matrix

### 🔴 Critical — Silent data loss or consensus gap

| # | File | Divergence | Wire Impact |
|---|------|-----------|------------|
| 1 | `transactions_api.proto` | `ApplicationStatus.ELIDED = 3` missing in node-go | **Two distinct failure modes** — both verified against actual generated code and server logic: **(a) node-go as gRPC server**: `server_common.go` and `transactions_api.go` have a binary `failed bool` path only — they can only emit `SUCCEEDED`, `SCRIPT_EXECUTION_FAILED`, or `UNKNOWN`. Any ELIDED transaction on DCC mainnet (Challenge mechanism, Feature 25) is reported as `UNKNOWN (0)` because the constant and the code path don't exist. **(b) A Go client decoding node-scala responses**: Per the official proto3 spec ([protobuf.dev/programming-guides/enum](https://protobuf.dev/programming-guides/enum/)), Go treats ALL proto3 enums as open — `ApplicationStatus(3)` is stored as raw integer 3 with no named constant. No crash, but the `.String()` call returns a numeric string and any switch on named constants silently falls through. ELIDED was introduced with the Waves 1.5 Challenge mechanism. |
| 2 | `transaction.proto` | `CommitToGenerationTransactionData = 120` missing in node-go | **Unknown tx type**: DCC mainnet blocks containing `commit_to_generation` transactions will have an empty `Transaction.data` oneof in node-go. The transaction is decoded as valid but empty — no error, no rejection, silent data loss. This is the core Deterministic Finality tx type (Waves 1.6 / DCC-183). |
| 3 | `block.proto` | `state_hash` (field 11), `ChallengedHeader` (field 12), `FinalizationVoting` (field 13) in `Block.Header` + `EndorseBlock` + `FinalizationVoting` messages — all missing in node-go | **Blocks DCC-151**: node-go cannot read or verify the `state_hash` field broadcast by node-scala. The state hash comparison required for DCC-151 / DCC-170 cannot be done via node-go's gRPC. `ChallengedHeader` and `FinalizationVoting` are required for the Light Client protocol. |

### 🟠 High — Functional gaps, wrong response type, gRPC contract mismatch

| # | File | Divergence | Wire Impact |
|---|------|-----------|------------|
| 4 | `accounts_api.proto` | `GetScript` returns `ScriptResponse` in node-scala (4 fields: `script_bytes`, `script_text`, `complexity`, **`public_key`**) vs `ScriptData` in node-go (3 fields, no `public_key`) | **Partial wire compatibility — corrected**: at the proto3 binary level, `ScriptData` and `ScriptResponse` share identical field numbers 1–3 with identical types. A client that decodes a `ScriptData` response as `ScriptResponse` receives fields 1–3 correctly; field 4 (`public_key`) decodes as the proto3 default (empty bytes). The gRPC transport call does NOT fail. However, generated Go type names differ (`ScriptData` vs `ScriptResponse`), so generated stubs from node-scala protos and node-go protos are not directly cross-compatible without regenerating. **Practical impact**: any call to node-go's `GetScript` returns `public_key = []` unconditionally, regardless of what key is actually set on-chain. |
| 5 | `transactions_api.proto` | `GetTransactionSnapshots` RPC + `TransactionSnapshotResponse` + `TransactionSnapshotsRequest` messages — missing in node-go | Any call to `GetTransactionSnapshots` on node-go returns gRPC status `UNIMPLEMENTED`. The state snapshot query path is entirely absent. |
| 6 | `events.proto` | `activated_features`, `deactivated_features`, `vrf`, `reward_shares`, `ScriptUpdate`, `deleted_aliases` — all missing in node-go's `events.proto` | BlockchainUpdates stream from node-go lacks feature activation/deactivation events, VRF data, reward shares, script update events, and deleted alias events. BPS connecting to node-go (instead of node-scala) will produce an incomplete sync — feature activation timestamps will be missing in PostgreSQL. |
| 7 | `blocks_api.proto` | `vrf` (field 3) and `reward_shares` (field 4) in `BlockWithTransactions` — missing in node-go | Block metadata from node-go gRPC lacks VRF proof and per-miner reward distribution. |
| 8 | `assets_api.proto` | `sequence_in_block` (field 12) and `issue_height` (field 13) in `AssetInfoResponse` — missing in node-go | Asset info from node-go's `GetAssetInfo` cannot provide issue height or sequence-in-block. These fields are needed for the data-service assets endpoint. |
| 9 | `order.proto` | `attachment` (field 15) missing in node-go | Order V4 attachments are silently dropped when order data passes through node-go. |

### 🟡 Gap — Missing proto files entirely in node-go

| # | File | Status | Impact |
|---|------|--------|--------|
| 10 | `dcc/reward_share.proto` | node-go MISSING | `RewardShare` message not available — `events.proto` and `blocks_api.proto` can't import it |
| 11 | `dcc/state_snapshot.proto` | node-go MISSING | `BlockSnapshot` and `MicroBlockSnapshot` messages not available |
| 12 | `dcc/transaction_state_snapshot.proto` | node-go MISSING | `TransactionStateSnapshot` (15 nested messages, `TransactionStatus` enum) not available. This is the data structure returned by `GetTransactionSnapshots`. |

### ✅ Non-issue — Code-gen artifact only

| # | File | Divergence | Analysis |
|---|------|-----------|---------|
| 13 | `transaction.proto` | `DataEntry` is a **top-level message** in node-scala vs **nested** inside `DataTransactionData` in node-go (as `DataTransactionData.DataEntry`) | **Wire format is identical.** Field numbers are the same (key=1, int_value=10, bool_value=11, binary_value=12, string_value=13). This is a proto namespacing difference only — node-scala refactored `DataEntry` out of the nested position at some point. Generated Go code uses `DataTransactionData_DataEntry` in node-go; Scala code uses top-level `DataEntry`. No binary compatibility issue. |
| 14 | `invoke_script_result.proto`, `accounts_api.proto` | Same `DataEntry` reference difference | Same as #13 — code-gen naming artifact, wire-identical. |
| 15 | `amount.proto`, `blockchain_updates.proto`, `dapp_meta.proto`, `blockchain_api.proto`, `recipient.proto` | IDENTICAL | No divergence. |

---

## Legacy PolyRepo Comparison

The Legacy `DecentralChain-PolyRepo/protobuf-serialization/` protos are a **DCC-branded 1.6.x fork** of upstream (identical structure to node-scala, different Go/Java package namespaces: `io.decentralchain.*` vs `com.wavesplatform.*`).

Two additional DCC-specific safety annotations exist in the Legacy fork that are absent from both node-go and BPS:

**`transaction.proto` — Reserved field 118:**
```protobuf
// Field 118 was removed from the oneof below. The reserved directive
// prevents accidental reuse, which would cause silent wire-format
// incompatibility with existing blockchain nodes.
reserved 118;
```
node-go lacks this reservation. If any historical DCC mainnet block contains a tx with field 118 in the Transaction data oneof, node-go decodes it silently as an empty `data` — no error, no reservation guard. **Historical blockchain state risk if field 118 was ever used in DCC.**

**`events.proto` — Reserved field 6 (sender_address):**
```protobuf
// Field 6 (sender_address) was removed. Reserved to prevent
// wire-format incompatibility from accidental reuse.
reserved 6;
```
BPS uses a comment instead of `reserved`. node-go's older proto doesn't have it at all (pre-dates the removal). BPS and node-scala are aligned; node-go is behind.

---

## gRPC Service Surface Comparison

| Service | RPC | node-scala | node-go | Status |
|---------|-----|-----------|---------|--------|
| `AccountsApi` | `GetBalances` | ✅ | ✅ | Compatible |
| `AccountsApi` | `GetScript` | ✅ `ScriptResponse` | ✅ `ScriptData` | **Type mismatch** — missing `public_key` in node-go |
| `AccountsApi` | `GetActiveLeases` | ✅ | ✅ | Compatible |
| `AccountsApi` | `GetDataEntries` | ✅ | ✅ | Compatible |
| `AccountsApi` | `ResolveAlias` | ✅ | ✅ | Compatible |
| `AssetsApi` | `GetAssetInfo` | ✅ | ✅ | Field gap (fields 12, 13 missing) |
| `AssetsApi` | `GetNFTList` | ✅ | ✅ | Compatible |
| `BlockchainApi` | All RPCs | ✅ | ✅ | Compatible |
| `BlocksApi` | `GetBlock`, `GetBlocks`, etc. | ✅ | ✅ | Field gap (`vrf`, `reward_shares`) |
| `BlockchainUpdatesApi` | `Subscribe` | ✅ | ✅ | Field gap (many event fields) |
| `TransactionsApi` | `GetTransactions` | ✅ | ✅ | Compatible (ELIDED silent gap) |
| `TransactionsApi` | `GetTransactionSnapshots` | ✅ | ❌ MISSING | UNIMPLEMENTED |
| `TransactionsApi` | `GetStateChanges` | ✅ deprecated | ✅ deprecated | Compatible |
| `TransactionsApi` | `GetStatuses` | ✅ | ✅ | ELIDED silent gap |
| `TransactionsApi` | `GetUnconfirmed` | ✅ | ✅ | Compatible |
| `TransactionsApi` | `Sign` | ✅ | ✅ | Compatible |
| `TransactionsApi` | `Broadcast` | ✅ | ✅ | Compatible |

---

## Impact on Open Tickets

| Ticket | Impact |
|--------|--------|
| **DCC-151** (node-scala mainnet sync + state hash) | **Blocked at state hash level**: `state_hash` is `Block.Header` field 11, present only in node-scala protos. Cannot compare state hashes via node-go gRPC. |
| **DCC-170** (node-go mainnet sync + gRPC smoke) | The gRPC smoke test should explicitly verify that ELIDED transactions are received as raw integer 3 (not crash, not UNKNOWN/0 — Go open-enum preserves the integer) and CommitToGeneration txs decode as empty `data` oneof — document as known gaps, not test failures. |
| **DCC-174** (verify tx types 17–19 in node-go) | tx types 17–19 are in the shared surface — no proto gap for those types specifically. |
| **DCC-175** (verify DCC minimum PoS balance) | `reward_shares` is missing in node-go blocks_api — reward distribution verification must go through node-scala gRPC or REST. |
| **DCC-183** (evaluate godcc v0.11.0 pre-release) | **Confirmed**: godcc v0.11.0 ("Feature 25 Tooling Pre-Release", Mar 24) and v0.11.1 ("Tooling Pre-Release 2", Mar 31) both ship CommitToGeneration transaction support. Both carry the explicit caveat "the node itself is still in an early testing phase and is not intended for production use." If the bundled proto submodule covers the missing fields, bumping it closes most of this audit's gaps. Do NOT promote 0.11.x to mainnet before it sheds the pre-release label. **Critical finding**: In v0.11.1's `features.go`, `InvokeExpression` is renumbered from 22 (our fork) to 26 — four new features (LightNode=22, BoostBlockReward=23, ecrecoverFix=24, DeterministicFinality=25) were inserted before it. This feature number must be reconciled in DCC governance before any upgrade. |
| **DCC-215** (BPS block ingestion + aggregations) | BPS protos are at 1.6.x — aligned with node-scala. **BPS must connect to node-scala, not node-go.** |
| **DCC-224** (deploy BPS against DCC mainnet) | Same — route BPS to node-scala's BlockchainUpdates endpoint. |

---

## Recommended Actions

### Immediate (before DCC-170 gRPC smoke sign-off)

1. **Document node-go known limitations** in a `RUNBOOK.md` section:
   - ELIDED transactions: received as raw integer 3 in Go (open-enum semantics); no named constant exists; no crash — but code cannot distinguish ELIDED from a future unknown status without an explicit `== 3` check
   - CommitToGeneration (proto field 120) silently decodes as empty `Transaction.data` oneof — no error, no rejection
   - state_hash not available via gRPC — use REST `/blocks/headers/last` for state hash comparison
   - GetTransactionSnapshots not implemented — returns gRPC UNIMPLEMENTED
   - GetScript returns empty `public_key` always (wire-compatible but field absent)

2. **`reserved 118, 120` added to node-go's `transaction.proto`** — both at the `Transaction` message level (per proto3 formal grammar spec, `reserved` is only valid in `messageBody`, not inside `oneof`). Field 118 was removed upstream; field 120 is CommitToGeneration's number in the 1.6.0 schema, reserved here to prevent collision before implementation lands. **Submodule caveat**: node-go's `pkg/grpc/protobuf-schemas` is a git submodule pointing to `wavesplatform/protobuf-schemas` (upstream); the change lives in the working tree but cannot be committed to the upstream remote. A fork `Decentral-America/protobuf-schemas` is needed to track this change in VCS (see long-term item #6 and follow-up ticket DCC-184). The `reserved` keyword does NOT affect any generated `.pb.go` files — runtime behavior is identical regardless. The safety benefit is compile-time enforcement via `protoc`, which correctly rejects any future attempt to reuse field numbers 118 or 120. Validation: `protoc 34.1` (latest stable as of 2026-03-19) compiles all 14 node-go protos clean; binary descriptor confirms both fields reserved; enforcement test confirmed working.

3. **BPS infra**: confirm BPS connects to node-scala's port 6881 (gRPC), not node-go's — they're incompatible for BlockchainUpdates.

### Short-term (DCC-183 sprint)

4. **Evaluate godcc v0.11.0 / v0.11.1 pre-releases** — confirmed on GitHub: v0.11.0 is labeled "Feature 25 Tooling Pre-Release" and ships CommitToGeneration transaction support; v0.11.1 ("Tooling Pre-Release 2") adds signing/broadcasting. Both carry "not intended for production use." If the bundled proto submodule adds the missing fields, bumping it closes items #1, #2, #3, #10, #11, #12. Do NOT deploy to mainnet before the pre-release label is dropped.

5. **If godcc 0.11.0 doesn't include them**: copy the 3 missing protos (`reward_share.proto`, `state_snapshot.proto`, `transaction_state_snapshot.proto`) into node-go's vendored proto tree and regenerate. This is the same approach node-scala uses via Maven and BPS uses by shipping the files directly.

### Long-term

6. **Fork `wavesplatform/protobuf-schemas` → `Decentral-America/protobuf-schemas`** (DCC-184): This unblocks committing the `reserved 118, 120` change and any future proto patches to VCS. Once the fork exists, update node-go's `.gitmodules` to point to the fork's URL, retag at v1.4.3, apply the `reserved` patch, and update the submodule pointer in node-go. Then **unify the proto source** across all three active repos (node-scala, node-go, BPS) behind this single canonical fork — currently node-scala uses Maven, node-go uses a git submodule, and BPS vendors copies. Without a shared DCC-controlled source, the three repos will drift again.

---

## Appendix: Proto Version Timeline

| Waves version | Key additions |
|---------------|--------------|
| 1.2 | RIDE v4, Ethereum tx |
| 1.4 | Order price mode (godcc v0.10.0 "Zegema Compatibility" — stable baseline) |
| 1.4–1.5 | InvokeExpression (proto field 119) — present in node-go's vendored proto, so submodule was bumped to at least this point |
| 1.5 | ELIDED application status (Challenge mechanism) — **absent in node-go proto**. In Go, proto3 enums are open (per [protobuf.dev/programming-guides/enum](https://protobuf.dev/programming-guides/enum/)), so integer 3 is stored, not coerced to 0 |
| 1.5–1.6 | reward_shares, vrf, ScriptResponse.public_key, activated/deactivated features in events — **absent in node-go** |
| 1.6 / Feature 25 | CommitToGeneration (proto field 120), FinalizationVoting, state_hash, GetTransactionSnapshots — **node-scala + BPS level**. godcc v0.11.0 / v0.11.1 (pre-release, not production-ready) target this feature |

### godcc stable vs pre-release (verified 2026-05-11)

| Tag | Label | Status | Notes |
|-----|-------|--------|-------|
| v0.10.6 | "Features 20 and 21" | **Latest stable** | Block reward distribution; last production release (Jun 2023) |
| v0.11.0 | "Feature 25 Tooling Pre-Release" | **Pre-release** | Introduces `CommitToGeneration`; node "not intended for production use" |
| v0.11.1 | "Tooling Pre-Release 2" | **Pre-release** | Adds signing/broadcasting for CommitToGeneration; same caveat |
