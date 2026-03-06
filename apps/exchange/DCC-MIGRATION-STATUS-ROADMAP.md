# DecentralChain SDK Migration — Status & Roadmap

> **Project:** Remove all Waves blockchain references from the DecentralChain SDK ecosystem  
> **GitHub Org:** [Decentral-America](https://github.com/Decentral-America)  
> **npm Target Scope:** `@decentralchain/*`  
> **Jira Project:** DCC  
> **Last Updated:** <!-- update this date when editing -->

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Status](#current-status)
3. [Complete Package Inventory](#complete-package-inventory)
4. [Dependency Graph](#dependency-graph)
5. [Transitive Dependencies (Hidden @waves refs)](#transitive-dependencies)
6. [Fork Status](#fork-status)
7. [Phased Roadmap](#phased-roadmap)
8. [Jira Ticket Tracker](#jira-ticket-tracker)
9. [Risk Register](#risk-register)
10. [Appendix: Repo URL Reference](#appendix-repo-url-reference)

---

## Executive Summary

The `dcc-react` wallet application depends on **11 npm packages** with Waves blockchain references (4 under `@decentralchain/*` that are partial forks, 7 under `@waves/*` that are unforked), plus **1 bundled JS file** (`public/waves-transactions.min.js`). These 12 items are the **direct dependencies**.

During dependency research, **5 additional transitive `@waves/*` packages** were discovered that are used internally by our direct dependencies but are NOT in our `package.json`. These must also be migrated to avoid broken dependency chains.

**Total migration scope: 16 npm packages + 1 bundled file = 17 items.**

| Category                | Count | Status                               |
| ----------------------- | ----- | ------------------------------------ |
| Assigned & in progress  | 2     | DCC-1 (Dylan), DCC-2 (Fabrizio)      |
| Unassigned direct deps  | 9     | Needs tickets                        |
| Transitive deps to fork | 5     | Needs tickets                        |
| Bundled JS file         | 1     | Rebuilt last from waves-transactions |

---

## Current Status

### Assigned Work

| Jira                                                       | Assignee        | Package                              | Status         | Est.    |
| ---------------------------------------------------------- | --------------- | ------------------------------------ | -------------- | ------- |
| [DCC-1](https://decentralchain.atlassian.net/browse/DCC-1) | Dylan           | `@decentralchain/assets-pairs-order` | 🟡 In Progress | 1–3 hrs |
| [DCC-2](https://decentralchain.atlassian.net/browse/DCC-2) | Fabrizio Mattei | `@decentralchain/marshall`           | 🟡 In Progress | 2–4 hrs |

### Summary by Phase

| Phase                       | Packages   | Blocked By | Status                      |
| --------------------------- | ---------- | ---------- | --------------------------- |
| Phase 1 — Leaf Nodes        | 7 packages | Nothing    | 🟡 2 assigned, 5 unassigned |
| Phase 2 — First Dependents  | 6 packages | Phase 1    | 🔴 Not started              |
| Phase 3 — Second Dependents | 3 packages | Phase 2    | 🔴 Not started              |
| Phase 4 — Top Level         | 1 package  | Phase 3    | 🔴 Not started              |
| Phase 5 — Bundled File      | 1 file     | Phase 3    | 🔴 Not started              |

---

## Complete Package Inventory

### Direct Dependencies (in `package.json`)

| #   | npm Package                          | Current Version | Scope           | @waves deps | Phase |
| --- | ------------------------------------ | --------------- | --------------- | ----------- | ----- |
| 1   | `@decentralchain/assets-pairs-order` | ^4.0.0          | @decentralchain | 0           | 1     |
| 2   | `@decentralchain/marshall`           | ^0.14.0         | @decentralchain | 1           | 2     |
| 3   | `@decentralchain/signature-adapter`  | ^6.1.7          | @decentralchain | 5           | 4     |
| 4   | `@decentralchain/waves-transactions` | ^4.2.6          | @decentralchain | 4           | 3     |
| 5   | `@waves/bignumber`                   | ^1.2.0          | @waves          | 0           | 1     |
| 6   | `@waves/data-entities`               | ^2.0.7          | @waves          | 1           | 2     |
| 7   | `@waves/data-service-client-js`      | ^4.1.1          | @waves          | 2           | 3     |
| 8   | `@waves/ledger`                      | ^3.6.1          | @waves          | 1           | 2     |
| 9   | `@waves/oracle-data`                 | ^0.0.6          | @waves          | 0           | 1     |
| 10  | `@waves/ts-lib-crypto`               | ^1.4.3          | @waves          | 0           | 1     |
| 11  | `@waves/waves-browser-bus`           | ^0.2.7          | @waves          | 0           | 1     |

### Bundled File

| #   | File                               | Source                        | Phase |
| --- | ---------------------------------- | ----------------------------- | ----- |
| 12  | `public/waves-transactions.min.js` | Built from waves-transactions | 5     |

### Transitive Dependencies (NOT in `package.json`)

These packages are used internally by our direct dependencies. They must be migrated first to avoid broken chains.

| #   | npm Package                     | Used By                               | @waves deps | Phase |
| --- | ------------------------------- | ------------------------------------- | ----------- | ----- |
| 13  | `@waves/parse-json-bignumber`   | marshall                              | 0           | 1     |
| 14  | `@waves/ts-types`               | waves-transactions, signature-adapter | 0           | 1     |
| 15  | `@waves/node-api-js`            | waves-transactions                    | unclear     | 2     |
| 16  | `@waves/protobuf-serialization` | waves-transactions                    | unclear     | 2     |
| 17  | `@waves/money-like-to-node`     | signature-adapter                     | unclear     | 2     |

> **Note:** Items 13–17 need their own dependency audit before finalizing their phase placement. They are provisionally placed based on expected complexity.

---

## Dependency Graph

```
PHASE 1 — LEAF NODES (no @waves/* dependencies, can all run in parallel)
─────────────────────────────────────────────────────────────────────────
  @decentralchain/assets-pairs-order  ← DCC-1 (Dylan)
  @waves/bignumber
  @waves/ts-lib-crypto
  @waves/oracle-data
  @waves/waves-browser-bus
  @waves/parse-json-bignumber          ← transitive (used by marshall)
  @waves/ts-types                      ← transitive (used by waves-transactions, sig-adapter)

         │               │              │                │
         ▼               ▼              ▼                ▼

PHASE 2 — FIRST DEPENDENTS (each depends on exactly 1 leaf node)
────────────────────────────────────────────────────────────────
  @decentralchain/marshall             ← DCC-2 (Fabrizio)
  │  └── depends on: @waves/parse-json-bignumber (Phase 1)
  │
  @waves/data-entities
  │  └── depends on: @waves/bignumber (Phase 1)
  │
  @waves/ledger
  │  └── depends on: @waves/ts-lib-crypto (Phase 1)
  │
  @waves/node-api-js                   ← transitive (used by waves-transactions)
  │  └── needs audit
  │
  @waves/protobuf-serialization        ← transitive (used by waves-transactions)
  │  └── needs audit
  │
  @waves/money-like-to-node            ← transitive (used by signature-adapter)
     └── needs audit

         │               │
         ▼               ▼

PHASE 3 — SECOND DEPENDENTS (depend on Phase 1 + Phase 2)
──────────────────────────────────────────────────────────
  @waves/data-service-client-js
  │  └── depends on: @waves/bignumber (P1) + @waves/data-entities (P2)
  │
  @decentralchain/waves-transactions
     └── depends on: @decentralchain/marshall (P2) + @waves/ts-lib-crypto (P1)
                   + @waves/ts-types (P1) + @waves/node-api-js (P2)
                   + @waves/protobuf-serialization (P2)

         │
         ▼

PHASE 4 — TOP LEVEL (depends on everything above)
──────────────────────────────────────────────────
  @decentralchain/signature-adapter
     └── depends on: @waves/bignumber (P1) + @waves/data-entities (P2)
                   + @waves/ledger (P2) + @waves/ts-types (P1)
                   + @waves/money-like-to-node (P2)
                   + @decentralchain/waves-transactions (P3)

         │
         ▼

PHASE 5 — BUNDLED FILE (rebuild after Phase 3)
───────────────────────────────────────────────
  public/waves-transactions.min.js
     └── Rebuild from migrated @decentralchain/waves-transactions
```

### Critical Path

The **longest dependency chain** (critical path) is:

```
ts-lib-crypto (P1) → marshall (P2) → waves-transactions (P3) → signature-adapter (P4)
```

This chain determines the **minimum calendar time** for the full migration. All other packages can be parallelized around this chain.

---

## Fork Status

### Already Forked into Decentral-America

These repos already exist under `github.com/Decentral-America/`:

| npm Package                          | DA Repo                                                                                 | Status         |
| ------------------------------------ | --------------------------------------------------------------------------------------- | -------------- |
| `@decentralchain/assets-pairs-order` | [assets-pairs-order](https://github.com/Decentral-America/assets-pairs-order)           | ✅ Fork exists |
| `@decentralchain/marshall`           | [marshall](https://github.com/Decentral-America/marshall)                               | ✅ Fork exists |
| `@decentralchain/signature-adapter`  | [waves-signature-adapter](https://github.com/Decentral-America/waves-signature-adapter) | ✅ Fork exists |
| `@decentralchain/waves-transactions` | [waves-transactions](https://github.com/Decentral-America/waves-transactions)           | ✅ Fork exists |
| `@waves/node-api-js` (transitive)    | [node-api-js](https://github.com/Decentral-America/node-api-js)                         | ✅ Fork exists |

### Need to Be Forked

These repos must be forked from `wavesplatform/*` into `Decentral-America/`:

| npm Package                     | Source Repo (wavesplatform)                                                                     | Action Required |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | --------------- |
| `@waves/bignumber`              | [wavesplatform/bignumber](https://github.com/wavesplatform/bignumber)                           | Fork → DA       |
| `@waves/ts-lib-crypto`          | [wavesplatform/ts-lib-crypto](https://github.com/wavesplatform/ts-lib-crypto)                   | Fork → DA       |
| `@waves/oracle-data`            | [wavesplatform/oracle-data](https://github.com/wavesplatform/oracle-data)                       | Fork → DA       |
| `@waves/waves-browser-bus`      | [wavesplatform/waves-browser-bus](https://github.com/wavesplatform/waves-browser-bus)           | Fork → DA       |
| `@waves/data-entities`          | [wavesplatform/waves-data-entities](https://github.com/wavesplatform/waves-data-entities)       | Fork → DA       |
| `@waves/ledger`                 | [wavesplatform/waves-ledger-js](https://github.com/wavesplatform/waves-ledger-js)               | Fork → DA       |
| `@waves/data-service-client-js` | [wavesplatform/data-service-client-js](https://github.com/wavesplatform/data-service-client-js) | Fork → DA       |
| `@waves/parse-json-bignumber`   | Needs research — possibly in wavesplatform org                                                  | Fork → DA       |
| `@waves/ts-types`               | Needs research — possibly `wavesplatform/ts-types`                                              | Fork → DA       |
| `@waves/protobuf-serialization` | Needs research — possibly `wavesplatform/protobuf-serialization`                                | Fork → DA       |
| `@waves/money-like-to-node`     | Needs research — possibly `wavesplatform/money-like-to-node`                                    | Fork → DA       |

**⚠ IMPORTANT:** The npm name does NOT always match the GitHub repo name:

- `@waves/ledger` → repo is `waves-ledger-js` (NOT `ledger-app-waves`, which is the C/Assembly Ledger firmware)
- `@waves/data-entities` → repo is `waves-data-entities` (NOT `data-entities`)
- `@decentralchain/signature-adapter` → repo is `waves-signature-adapter`

---

## Phased Roadmap

### Phase 1 — Leaf Nodes (No @waves dependencies)

**Prerequisite:** None — all can start immediately and run in parallel.  
**Goal:** Migrate all packages that have zero `@waves/*` dependencies.

| Package                | Assignee     | Jira                                                       | Complexity | Est. Hours | Notes                                                               |
| ---------------------- | ------------ | ---------------------------------------------------------- | ---------- | ---------- | ------------------------------------------------------------------- |
| `assets-pairs-order`   | Dylan        | [DCC-1](https://decentralchain.atlassian.net/browse/DCC-1) | Low        | 1–3        | Only dep: `bs58`. Pure rename.                                      |
| `bignumber`            | _Unassigned_ | —                                                          | Low        | 1–2        | Only dep: `bignumber.js`. Tiny package.                             |
| `ts-lib-crypto`        | _Unassigned_ | —                                                          | Medium     | 2–4        | Uses noble/curves, node-forge. No Waves logic but crypto-sensitive. |
| `oracle-data`          | _Unassigned_ | —                                                          | Low        | 1–2        | Zero runtime deps. Straightforward rename.                          |
| `waves-browser-bus`    | _Unassigned_ | —                                                          | Low        | 1–2        | Only dep: `typed-ts-events`. Pure rename.                           |
| `parse-json-bignumber` | _Unassigned_ | —                                                          | Low        | 1–2        | Transitive. Needed by marshall (P2).                                |
| `ts-types`             | _Unassigned_ | —                                                          | Low        | 1–2        | Transitive. Needed by waves-transactions (P3) + sig-adapter (P4).   |

**Phase 1 Deliverables:**

- [ ] Fork missing repos into Decentral-America
- [ ] Rename all `@waves/*` → `@decentralchain/*` in package.json, source, docs
- [ ] Replace Waves branding (names, URLs, chain IDs) with DecentralChain
- [ ] Publish to npm under `@decentralchain/*` scope
- [ ] Update dcc-react `package.json` to point to new packages

**Estimated Total:** 8–17 hours (parallelizable across team)

---

### Phase 2 — First Dependents (Depend on Phase 1 leaf nodes)

**Prerequisite:** Phase 1 packages they depend on must be published first.  
**Goal:** Migrate packages with exactly 1 `@waves/*` dependency.

| Package                  | Depends On (Phase 1)   | Assignee     | Jira                                                       | Complexity | Est. Hours |
| ------------------------ | ---------------------- | ------------ | ---------------------------------------------------------- | ---------- | ---------- |
| `marshall`               | `parse-json-bignumber` | Fabrizio     | [DCC-2](https://decentralchain.atlassian.net/browse/DCC-2) | Medium     | 2–4        |
| `data-entities`          | `bignumber`            | _Unassigned_ | —                                                          | Medium     | 2–3        |
| `ledger`                 | `ts-lib-crypto`        | _Unassigned_ | —                                                          | High       | 3–5        |
| `node-api-js`            | _Needs audit_          | _Unassigned_ | —                                                          | Medium     | 2–4        |
| `protobuf-serialization` | _Needs audit_          | _Unassigned_ | —                                                          | Medium     | 2–4        |
| `money-like-to-node`     | _Needs audit_          | _Unassigned_ | —                                                          | Low        | 1–2        |

**⚠ Blocking Constraints:**

- `marshall` (DCC-2) is **blocked by** `parse-json-bignumber` from Phase 1. Fabrizio can either:
  - (a) Wait for `parse-json-bignumber` to be migrated, or
  - (b) Inline the dependency / replace with an alternative (as documented in DCC-2 ticket)
- `data-entities` cannot start until `bignumber` is published
- `ledger` cannot start until `ts-lib-crypto` is published
- `ledger` involves Ledger hardware wallet integration — needs device testing

**Phase 2 Deliverables:**

- [ ] Update internal `@waves/*` imports to `@decentralchain/*`
- [ ] Verify all Phase 1 deps are correctly resolved
- [ ] Publish to npm under `@decentralchain/*` scope
- [ ] Run integration tests with Phase 1 packages

**Estimated Total:** 12–22 hours (partially parallelizable)

---

### Phase 3 — Second Dependents (Depend on Phase 1 + Phase 2)

**Prerequisite:** All Phase 1 AND Phase 2 packages they depend on must be published.  
**Goal:** Migrate the two multi-dependency packages.

| Package                  | Depends On                                                                                                | Assignee     | Jira | Complexity | Est. Hours |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | ------------ | ---- | ---------- | ---------- |
| `data-service-client-js` | `bignumber` (P1), `data-entities` (P2)                                                                    | _Unassigned_ | —    | Medium     | 3–5        |
| `waves-transactions`     | `marshall` (P2), `ts-lib-crypto` (P1), `ts-types` (P1), `node-api-js` (P2), `protobuf-serialization` (P2) | _Unassigned_ | —    | High       | 4–8        |

**⚠ Blocking Constraints:**

- `waves-transactions` has **5 @waves dependencies** across Phase 1 and Phase 2 — ALL must be completed
- `waves-transactions` is on the **critical path** — it blocks Phase 4 AND Phase 5

**Phase 3 Deliverables:**

- [ ] Update all internal `@waves/*` → `@decentralchain/*`
- [ ] Full integration test suite against migrated dependencies
- [ ] Rebuild `waves-transactions.min.js` bundle (for Phase 5)
- [ ] Publish to npm

**Estimated Total:** 7–13 hours

---

### Phase 4 — Top Level (The "Big One")

**Prerequisite:** ALL packages from Phases 1–3 must be published.  
**Goal:** Migrate the signature adapter — the package with the most dependencies.

| Package             | Depends On                                                                                                                   | Assignee     | Jira | Complexity | Est. Hours |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ------------ | ---- | ---------- | ---------- |
| `signature-adapter` | `bignumber` (P1), `data-entities` (P2), `ledger` (P2), `ts-types` (P1), `money-like-to-node` (P2), `waves-transactions` (P3) | _Unassigned_ | —    | Very High  | 5–10       |

**⚠ This is the riskiest package:**

- **6 @waves dependencies** spanning all 3 prior phases
- Handles cryptographic signing — errors here break the entire wallet
- Must be extensively integration-tested against the running DecentralChain nodes

**Phase 4 Deliverables:**

- [ ] Update all 6 internal `@waves/*` → `@decentralchain/*`
- [ ] End-to-end signing test on testnet (`chain ID 'T'`, byte 84)
- [ ] End-to-end signing test on mainnet (`chain ID 'L'`, byte 76)
- [ ] Publish to npm as `@decentralchain/signature-adapter`

**Estimated Total:** 5–10 hours

---

### Phase 5 — Bundled File & Final Integration

**Prerequisite:** `@decentralchain/waves-transactions` (Phase 3) must be published.  
**Goal:** Replace the pre-built bundled file and verify the full application.

| Item                               | Action                                                                           | Est. Hours |
| ---------------------------------- | -------------------------------------------------------------------------------- | ---------- |
| `public/waves-transactions.min.js` | Rebuild from migrated `@decentralchain/waves-transactions`, minify, replace file | 1–2        |
| Rename file                        | Rename to `dcc-transactions.min.js` or similar                                   | 0.5        |
| Update `index.html`                | Update `<script>` tag to reference new filename                                  | 0.5        |
| Full app integration test          | Run `dcc-react` with ALL migrated packages, verify wallet functionality          | 2–4        |
| Update `package.json`              | Ensure all deps point to `@decentralchain/*` with correct versions               | 1          |

**Phase 5 Deliverables:**

- [ ] Zero `@waves` references in `package.json`
- [ ] Zero `waves-transactions` references in `public/`
- [ ] Full application build succeeds
- [ ] Wallet connect, send, receive tested on testnet
- [ ] DEX functionality verified

**Estimated Total:** 5–8 hours

---

## Jira Ticket Tracker

### Created Tickets

| Jira Key                                                   | Title                                                    | Assignee        | Phase | Status         |
| ---------------------------------------------------------- | -------------------------------------------------------- | --------------- | ----- | -------------- |
| [DCC-1](https://decentralchain.atlassian.net/browse/DCC-1) | Migrate Assets Pairs Order Library to DecentralChain     | Dylan           | 1     | 🟡 In Progress |
| [DCC-2](https://decentralchain.atlassian.net/browse/DCC-2) | Migrate Marshall Serialization Library to DecentralChain | Fabrizio Mattei | 2     | 🟡 In Progress |

### Tickets Needed

| Suggested Key | Title                                                                           | Phase | Blocked By                                  | Priority                        |
| ------------- | ------------------------------------------------------------------------------- | ----- | ------------------------------------------- | ------------------------------- |
| DCC-3         | Migrate `@waves/bignumber` to `@decentralchain/bignumber`                       | 1     | —                                           | 🔴 Critical (blocks P2, P3, P4) |
| DCC-4         | Migrate `@waves/ts-lib-crypto` to `@decentralchain/ts-lib-crypto`               | 1     | —                                           | 🔴 Critical (blocks P2, P3, P4) |
| DCC-5         | Migrate `@waves/oracle-data` to `@decentralchain/oracle-data`                   | 1     | —                                           | 🟡 Medium                       |
| DCC-6         | Migrate `@waves/waves-browser-bus` to `@decentralchain/waves-browser-bus`       | 1     | —                                           | 🟡 Medium                       |
| DCC-7         | Migrate `@waves/parse-json-bignumber` to `@decentralchain/parse-json-bignumber` | 1     | —                                           | 🔴 Critical (blocks DCC-2)      |
| DCC-8         | Migrate `@waves/ts-types` to `@decentralchain/ts-types`                         | 1     | —                                           | 🔴 Critical (blocks P3, P4)     |
| DCC-9         | Migrate `@waves/data-entities` to `@decentralchain/data-entities`               | 2     | DCC-3                                       | 🔴 Critical                     |
| DCC-10        | Migrate `@waves/ledger` to `@decentralchain/ledger`                             | 2     | DCC-4                                       | 🟠 High                         |
| DCC-11        | Audit & migrate `@waves/node-api-js`                                            | 2     | —                                           | 🟠 High                         |
| DCC-12        | Audit & migrate `@waves/protobuf-serialization`                                 | 2     | —                                           | 🟠 High                         |
| DCC-13        | Audit & migrate `@waves/money-like-to-node`                                     | 2     | —                                           | 🟡 Medium                       |
| DCC-14        | Migrate `@waves/data-service-client-js`                                         | 3     | DCC-3, DCC-9                                | 🟠 High                         |
| DCC-15        | Migrate `@decentralchain/waves-transactions` (full dep update)                  | 3     | DCC-2, DCC-4, DCC-8, DCC-11, DCC-12         | 🔴 Critical                     |
| DCC-16        | Migrate `@decentralchain/signature-adapter` (full dep update)                   | 4     | DCC-3, DCC-9, DCC-10, DCC-8, DCC-13, DCC-15 | 🔴 Critical                     |
| DCC-17        | Replace `waves-transactions.min.js` bundled file & final integration            | 5     | DCC-15                                      | 🔴 Critical                     |

---

## Risk Register

| #   | Risk                                                       | Impact                                   | Mitigation                                                              |
| --- | ---------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| R1  | **`parse-json-bignumber` not found / archived**            | Blocks marshall (DCC-2)                  | Fabrizio has 3 options in ticket: fork, alternative lib, or inline      |
| R2  | **Transitive deps have deeper hidden @waves refs**         | Extends scope beyond 17 items            | Audit each transitive dep's `package.json` before starting              |
| R3  | **Ledger hardware testing unavailable**                    | Can't verify `@waves/ledger` migration   | Defer ledger testing to integration phase; mock in unit tests           |
| R4  | **npm publish permissions**                                | Can't publish to `@decentralchain` scope | Verify npm org membership & publish tokens early                        |
| R5  | **Breaking API changes during migration**                  | dcc-react build failures                 | Pin exact versions; migrate one package at a time with app verification |
| R6  | **waves-transactions.min.js has Waves-specific constants** | Runtime errors on DecentralChain         | Must rebuild from source with correct chain IDs (L=76, T=84)            |
| R7  | **Scope creep from 12 → 17+ items**                        | Timeline slips                           | Track transitive deps as separate tickets; strict phase gating          |
| R8  | **`node-api-js` has hardcoded Waves node URLs**            | API calls hit wrong network              | Audit before Phase 2; parameterize all URLs                             |

---

## Timeline Estimate

| Phase     | Packages | Est. Hours | Calendar (2 devs) | Calendar (4 devs) |
| --------- | -------- | ---------- | ----------------- | ----------------- |
| Phase 1   | 7        | 8–17       | 1–2 days          | 0.5–1 day         |
| Phase 2   | 6        | 12–22      | 2–3 days          | 1–2 days          |
| Phase 3   | 2        | 7–13       | 1–2 days          | 1 day             |
| Phase 4   | 1        | 5–10       | 1 day             | 1 day             |
| Phase 5   | 1        | 5–8        | 1 day             | 0.5 day           |
| **Total** | **17**   | **37–70**  | **6–9 days**      | **4–6 days**      |

> **Note:** Phases are sequential (each phase is blocked by the previous). Within each phase, packages can be parallelized across team members.

---

## Appendix: Repo URL Reference

### Source Repos (wavesplatform — upstream originals)

| npm Package                     | GitHub Repo                                              |
| ------------------------------- | -------------------------------------------------------- |
| `@waves/bignumber`              | https://github.com/wavesplatform/bignumber               |
| `@waves/ts-lib-crypto`          | https://github.com/wavesplatform/ts-lib-crypto           |
| `@waves/oracle-data`            | https://github.com/wavesplatform/oracle-data             |
| `@waves/waves-browser-bus`      | https://github.com/wavesplatform/waves-browser-bus       |
| `@waves/data-entities`          | https://github.com/wavesplatform/waves-data-entities     |
| `@waves/ledger`                 | https://github.com/wavesplatform/waves-ledger-js         |
| `@waves/data-service-client-js` | https://github.com/wavesplatform/data-service-client-js  |
| `waves-transactions` (original) | https://github.com/wavesplatform/waves-transactions      |
| `signature-adapter` (original)  | https://github.com/wavesplatform/waves-signature-adapter |
| `marshall` (original)           | https://github.com/wavesplatform/marshall                |
| `assets-pairs-order` (original) | https://github.com/wavesplatform/assets-pairs-order      |

### Decentral-America Forks (already exist)

| DA Repo                                                      | npm Package                          |
| ------------------------------------------------------------ | ------------------------------------ |
| https://github.com/Decentral-America/assets-pairs-order      | `@decentralchain/assets-pairs-order` |
| https://github.com/Decentral-America/marshall                | `@decentralchain/marshall`           |
| https://github.com/Decentral-America/waves-signature-adapter | `@decentralchain/signature-adapter`  |
| https://github.com/Decentral-America/waves-transactions      | `@decentralchain/waves-transactions` |
| https://github.com/Decentral-America/node-api-js             | `@waves/node-api-js` (transitive)    |

### ⚠ Name Mismatch Warnings

| npm Name                            | You Might Expect                      | Actual GitHub Repo                               |
| ----------------------------------- | ------------------------------------- | ------------------------------------------------ |
| `@waves/ledger`                     | `wavesplatform/ledger`                | `wavesplatform/waves-ledger-js`                  |
| `@waves/data-entities`              | `wavesplatform/data-entities`         | `wavesplatform/waves-data-entities`              |
| `@decentralchain/signature-adapter` | `Decentral-America/signature-adapter` | `Decentral-America/waves-signature-adapter`      |
| `wavesplatform/ledger-app-waves`    | npm `@waves/ledger`                   | ❌ This is Ledger C firmware, NOT the JS package |

---

## Migration Principles

1. **No conflicting updates** — Never start a package until ALL its `@waves/*` dependencies are already migrated and published
2. **Phase gating** — A phase cannot begin until the previous phase is complete (verified by npm installs resolving)
3. **One package = one Jira ticket** — Each migration is tracked independently
4. **Fork first, rename second** — Always fork into DA before making changes
5. **Test with dcc-react** — After each package migration, verify `dcc-react` still builds and runs
6. **Chain IDs matter** — DecentralChain uses `'L'` (byte 76) for mainnet and `'T'` (byte 84) for testnet — these must replace any Waves chain ID references (`'W'` byte 87 for mainnet, `'T'` byte 84 for testnet)

---

_End of document._
