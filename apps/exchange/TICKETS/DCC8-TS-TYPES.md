# Migrate TS-Types Library to DecentralChain

## Assigned to: _Unassigned_

**Priority:** Critical  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`  
**Sprint:** Current  
**Story Points:** 2

---

## Summary

Migrate the `@waves/ts-types` npm package from the Waves blockchain ecosystem into a clean, standalone DecentralChain library published as `@decentralchain/ts-types` with **zero** Waves references remaining. This package provides TypeScript type definitions shared across multiple SDK packages and is a critical dependency for Phase 3 and Phase 4 work.

---

## Background

### What is this library?

`ts-types` is a **TypeScript type definitions** package that provides shared interfaces, enums, and type aliases used across the entire SDK. It defines the canonical type structures for:

- **Transaction types** — Transfer, Issue, Reissue, Burn, Lease, CancelLease, MassTransfer, Data, SetScript, SetAssetScript, Invoke, etc.
- **Blockchain primitives** — Address, PublicKey, AssetId, Alias, DataEntry, etc.
- **Network byte codes** — Chain ID definitions (the byte that identifies which network a transaction belongs to)
- **Enums** — `TRANSACTION_TYPE`, `DATA_ENTRY_TYPE`, etc.

### Where did it come from?

This package was created by the Waves blockchain team as a shared foundation for type safety across all SDK packages. Every package that constructs, validates, or inspects transactions needs these types.

### Why does this matter?

**This is a linchpin dependency.** It's directly consumed by:

- `@decentralchain/waves-transactions` (DCC-15, Phase 3) — the core transaction builder
- `@decentralchain/signature-adapter` (DCC-16, Phase 4) — the signing adapter

If these type definitions still reference Waves, every downstream package that imports them will carry Waves contamination.

### Critical: Chain ID Constants

This package **very likely defines chain ID constants** such as:

```typescript
export const MAINNET_BYTE = 'W'.charCodeAt(0); // 87 — Waves mainnet
export const TESTNET_BYTE = 'T'.charCodeAt(0); // 84 — Waves testnet
```

For DecentralChain:

```typescript
export const MAINNET_BYTE = 'L'.charCodeAt(0); // 76 — DCC mainnet
export const TESTNET_BYTE = 'T'.charCodeAt(0); // 84 — DCC testnet (same)
```

These values **must** be updated. The mainnet byte is different: **'W' (87) → 'L' (76)**.

---

## Current State of the Repo

| Field                         | Value                                                                     |
| ----------------------------- | ------------------------------------------------------------------------- |
| **npm package**               | `@waves/ts-types`                                                         |
| **Current GitHub repo**       | `wavesplatform/ts-types` (expected)                                       |
| **Fork in Decentral-America** | ❌ **Needs to be forked**                                                 |
| **Language**                  | TypeScript                                                                |
| **License**                   | MIT (expected)                                                            |
| **`@waves/*` dependencies**   | **None** (pure type definitions)                                          |
| **Runtime dependencies**      | **None** or minimal — type packages typically have zero runtime deps      |
| **Used by**                   | `@decentralchain/waves-transactions`, `@decentralchain/signature-adapter` |
| **Last published to npm**     | Needs research                                                            |

### Expected File Structure

```
ts-types/
├── src/
│   ├── index.ts              # Main entry — re-exports all types
│   ├── transactions.ts       # ⚠️ Transaction type definitions
│   ├── primitives.ts         # ⚠️ Address, PublicKey, AssetId, etc.
│   ├── chains.ts             # ⚠️ Chain ID constants — CRITICAL
│   └── data-entry.ts         # Data entry types
├── dist/
│   └── ...
├── package.json              # ⚠️ Contains @waves scope
├── tsconfig.json
├── README.md                 # ⚠️ Likely references Waves
└── ...
```

> **Note:** Exact structure needs confirming from the actual repo.

---

## Known Waves Contamination

### 1. package.json

- `name` is `@waves/ts-types` — must be `@decentralchain/ts-types`
- `repository.url` — must point to `Decentral-America/ts-types`
- `description`, `keywords`, `author` — check for Waves references

### 2. Chain ID Constants

**THIS IS THE MOST CRITICAL ITEM.** Look for any of these patterns:

```typescript
// Waves mainnet uses 'W' (byte 87)
// Waves testnet uses 'T' (byte 84)
// Waves stagenet uses 'S' (byte 83)

const MAINNET = 'W';
const MAINNET_BYTE = 87;
const chainId = 'W';
```

Replace with DecentralChain values:

```typescript
// DecentralChain mainnet uses 'L' (byte 76)
// DecentralChain testnet uses 'T' (byte 84)

const MAINNET = 'L';
const MAINNET_BYTE = 76;
const chainId = 'L';
```

### 3. Type Names

Some types might explicitly reference Waves in their names:

```typescript
// BEFORE:
export interface WavesTransaction { ... }
export type WavesAddress = string;

// AFTER:
export interface Transaction { ... }
export type Address = string;
```

**⚠ Warning:** If type names change, every downstream consumer must update their imports. Document every rename carefully.

### 4. Enum Values and Documentation Comments

```typescript
// Look for comments like:
/** Waves blockchain transaction types */
// Must become:
/** DecentralChain transaction types */

// Look for JSDoc with @see links to wavesplatform docs
```

### 5. README.md

- Install instructions reference `@waves/ts-types`
- May contain Waves badges, links, or branding
- May reference `wavesplatform.com` docs

### 6. Default Values

Look for hardcoded default values that reference Waves infrastructure:

```typescript
const DEFAULT_CHAIN_ID = 'W'; // Must be 'L' for DCC
const DEFAULT_NODE_URL = 'https://nodes.wavesnodes.com'; // Must be DCC node
```

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed
- **Node.js** v16+ installed
- **npm** installed
- A **GitHub account**
- A **code editor** (VS Code recommended)

---

### Step 1: Find the Repository

```bash
# Try the obvious URL
curl -s -o /dev/null -w "%{http_code}" https://github.com/wavesplatform/ts-types

# If not found, check npm
npm view @waves/ts-types repository.url

# Fallback: search GitHub
# https://github.com/wavesplatform?q=ts-types
```

---

### Step 2: Create Your Workspace

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration
```

---

### Step 3: Clone the Original Waves Library

```bash
git clone https://github.com/wavesplatform/ts-types.git waves-ts-types-original
```

---

### Step 4: Create Your Working Copy

```bash
cp -r waves-ts-types-original dcc-ts-types-migrated
cd dcc-ts-types-migrated
rm -rf .git
git init
```

---

### Step 5: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `ts-types`
   - **Description:** `Shared TypeScript type definitions for the DecentralChain SDK`
   - **Visibility:** Public
   - **Initialize:** Do NOT add README, .gitignore, or license
3. Click **Create repository**
4. Connect it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ts-types.git
```

---

### Step 6: Install Dependencies and Verify It Builds

```bash
npm install
npm run build

# Run tests if they exist
npm test || echo "No tests configured"
```

---

### Step 7: Run the Waves Audit

```bash
echo "=== Full Waves Audit ==="

echo "--- @waves references ---"
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Chain ID 'W' references ---"
grep -rn "'W'" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Byte 87 references ---"
grep -rn "87" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- waves word references ---"
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- wavesplatform references ---"
grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Default node URL references ---"
grep -rni "nodes.wavesnodes" . | grep -v node_modules | grep -v .git | grep -v dist
```

**Save this output.** You will need to fix every single result.

---

### Step 8: Fix Every Waves Reference

#### 8a. Fix package.json

```json
// BEFORE:
"name": "@waves/ts-types"

// AFTER:
"name": "@decentralchain/ts-types"
```

Also update: `repository.url`, `description`, `keywords`, `author`, `homepage`, `bugs.url`.

#### 8b. Fix Chain ID Constants (CRITICAL)

Find every instance of chain ID 'W' or byte 87 for mainnet:

```typescript
// BEFORE:
const MAINNET = 'W';
// AFTER:
const MAINNET = 'L';

// BEFORE:
const MAINNET_BYTE = 87;
// AFTER:
const MAINNET_BYTE = 76;
```

Testnet 'T' (84) stays the same for both Waves and DecentralChain.

#### 8c. Fix Type Names (if needed)

If any types have "Waves" in their names:

```typescript
// BEFORE:
export interface WavesTransaction { ... }
// AFTER:
export interface Transaction { ... }
```

**Document every renamed type** to help downstream consumers.

#### 8d. Fix Source File Comments

Replace all Waves mentions in comments and JSDoc:

```typescript
// BEFORE:
/** Waves blockchain address format */
// AFTER:
/** DecentralChain address format */
```

#### 8e. Fix README.md

````markdown
# @decentralchain/ts-types

Shared TypeScript type definitions for the DecentralChain SDK.

Provides canonical types for transactions, blockchain primitives, chain IDs, data entries, and more.

## Installation

```bash
npm install @decentralchain/ts-types
```
````

## Chain IDs

| Network | Byte | Char |
| ------- | ---- | ---- |
| Mainnet | 76   | L    |
| Testnet | 84   | T    |

## License

MIT

````

#### 8f. Fix Test Files

If any tests hardcode chain ID 'W' or byte 87, update them to 'L' / 76.

---

### Step 9: Run the Audit Again

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist
````

**This must return ZERO results.**

Also specifically check chain IDs:

```bash
grep -rn "'W'" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist
```

**This should NOT contain any chain ID references to 'W' as mainnet.**

---

### Step 10: Rebuild and Test

```bash
rm -rf node_modules dist
npm install
npm run build
npm test || echo "No tests configured"
```

---

### Step 11: Document All Type Renames

Create a file called `MIGRATION-NOTES.md`:

```markdown
# Migration Notes — ts-types

## Type Renames

If any types were renamed from `Waves*` to `*`, document them here:

| Old Name         | New Name    |
| ---------------- | ----------- |
| WavesTransaction | Transaction |
| WavesAddress     | Address     |
| ...              | ...         |

## Chain ID Changes

| Value   | Old (Waves) | New (DCC) |
| ------- | ----------- | --------- |
| Mainnet | 'W' (87)    | 'L' (76)  |
| Testnet | 'T' (84)    | 'T' (84)  |

## Breaking Changes

List any breaking changes that downstream consumers must handle:

1. ...
```

---

### Step 12: Commit and Push

```bash
git add .
git commit -m "feat: clean migration of ts-types — remove all Waves references

- Renamed package from @waves/ts-types to @decentralchain/ts-types
- Updated chain ID constants from 'W' (87) to 'L' (76) for DCC mainnet
- Updated repository URLs to Decentral-America/ts-types
- Rewrote README with DecentralChain branding and chain ID table
- Cleaned all source file comments and JSDoc
- Created MIGRATION-NOTES.md documenting any type renames
- Zero @waves/* dependencies
- All tests pass
- grep -rni waves returns zero results"

git push -u origin master
```

---

### Step 13: Notify Downstream Consumers

This package is consumed by:

1. **DCC-15** (`@decentralchain/waves-transactions`) — notify that person
2. **DCC-16** (`@decentralchain/signature-adapter`) — notify that person

Send a message: "ts-types is migrated and ready. Here are the chain ID changes and any type renames: [link to MIGRATION-NOTES.md]"

---

### Step 14: Write Your Migration Summary

```
Migration Summary — ts-types

Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
Chain ID changes: 'W' (87) → 'L' (76) for mainnet
Type renames: [list any renamed types]
Tests: [pass/fail]
Build: [pass/fail]
New repo: https://github.com/YOUR_USERNAME/ts-types

Remaining concerns: [any issues or questions]
```

---

## Acceptance Criteria

- [ ] Source repo located and cloned
- [ ] New repo exists with clean migration
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `package.json` name is `@decentralchain/ts-types`
- [ ] Chain ID constants updated: mainnet = 'L' (76), testnet = 'T' (84)
- [ ] No hardcoded chain ID 'W' or byte 87 remains
- [ ] README references DecentralChain exclusively with correct chain ID table
- [ ] MIGRATION-NOTES.md documents any type renames
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] DCC-15 and DCC-16 owners notified
- [ ] Team lead notified for review

---

## AI Prompt for Assistance

```
I am migrating the npm package @waves/ts-types from the Waves blockchain
ecosystem to @decentralchain/ts-types.

This package provides shared TypeScript type definitions used across the
entire DecentralChain SDK. It has ZERO @waves/* dependencies.

CRITICAL: The chain ID constants must change:
- Waves mainnet was 'W' (byte 87)
- DCC mainnet is 'L' (byte 76)
- Testnet stays 'T' (byte 84)

I also need to rename any types that have "Waves" in their names, and
document every rename so downstream consumers can update their imports.

The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**2–4 hours** — small codebase but chain ID changes require careful auditing, and type renames must be thoroughly documented for downstream consumers.

---

## Questions?

Reach out to the team lead. Key decisions:

1. **Should renamed types have backward-compatible aliases?** (e.g., `export type WavesTransaction = Transaction`)
2. **Should we support both chain IDs?** (e.g., export both 'W' and 'L' for a transition period, or hard-cut to 'L' only)
