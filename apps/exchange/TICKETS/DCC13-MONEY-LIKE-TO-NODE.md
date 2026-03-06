# Audit & Migrate Money-Like-to-Node Library to DecentralChain

## Assigned to: _Unassigned_

**Priority:** Medium  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`  
**Sprint:** Current  
**Story Points:** 1

---

## Summary

Audit and migrate the `@waves/money-like-to-node` npm package from the Waves blockchain ecosystem into a clean DecentralChain library published as `@decentralchain/money-like-to-node` with **zero** Waves references remaining. This is a small utility library that converts human-readable "money-like" objects into the format expected by the blockchain node API. It is a transitive dependency used by `@decentralchain/signature-adapter` (DCC-16).

---

## Background

### What is this library?

`money-like-to-node` is a **data conversion utility** that transforms human-friendly money representations into the raw format that blockchain nodes expect.

**Example:**

```typescript
// Human-friendly format (money-like):
{
  asset: { id: 'DCC', precision: 8 },
  amount: '1.5'
}

// Node format (what the API expects):
{
  assetId: '',
  amount: 150000000  // 1.5 × 10^8 = 150000000 wavelets/units
}
```

This conversion handles:

- **Decimal precision** — converting "1.5 DCC" (8 decimals) to `150000000` raw units
- **Asset ID mapping** — converting named assets to their on-chain IDs
- **Null/empty handling** — the native asset (DCC/WAVES) has an empty string or null as its ID

### Where did it come from?

This package was created by the Waves blockchain team as a utility for the signature adapter. The source likely lives at `wavesplatform/money-like-to-node`.

### Why does this matter?

This utility is used by `@decentralchain/signature-adapter` (DCC-16, Phase 4) when preparing transactions for signing. If the conversion logic is incorrect, transactions will have wrong amounts or asset IDs.

### Why is this typically LOW complexity?

- Small utility package — probably a single source file
- Pure JavaScript/TypeScript logic — no crypto, no network calls
- **Needs audit** to check for `@waves/*` dependencies and hardcoded values

### Blocking Dependencies

| Dependency      | Status  | Notes                                                             |
| --------------- | ------- | ----------------------------------------------------------------- |
| **Needs audit** | Unknown | May depend on `@waves/bignumber` for precision arithmetic — check |

---

## Current State of the Repo

| Field                         | Value                                                      |
| ----------------------------- | ---------------------------------------------------------- |
| **npm package**               | `@waves/money-like-to-node`                                |
| **Current GitHub repo**       | Needs research — likely `wavesplatform/money-like-to-node` |
| **Fork in Decentral-America** | ❌ **Needs to be forked**                                  |
| **Language**                  | TypeScript / JavaScript                                    |
| **License**                   | MIT (expected)                                             |
| **`@waves/*` dependencies**   | **Needs audit** — may depend on `@waves/bignumber`         |
| **Runtime dependencies**      | Possibly `@waves/bignumber` for precision math             |
| **Used by**                   | `@decentralchain/signature-adapter` (DCC-16, Phase 4)      |
| **Last published to npm**     | Needs research                                             |

### Expected File Structure

```
money-like-to-node/
├── src/
│   ├── index.ts              # Main entry — conversion functions
│   └── ...                   # Possibly just one file
├── dist/
│   └── ...
├── test/
│   └── ...
├── package.json              # ⚠️ Contains @waves scope, check deps
├── tsconfig.json
├── README.md                 # ⚠️ References Waves
└── ...
```

---

## Known Waves Contamination

### 1. package.json

- `name` is `@waves/money-like-to-node` — must be `@decentralchain/money-like-to-node`
- Check `dependencies` for `@waves/bignumber` or other `@waves/*` packages
- `repository.url` — update to DA org

### 2. Import Statements

If the package depends on `@waves/bignumber`:

```typescript
// BEFORE:
import { BigNumber } from '@waves/bignumber';

// AFTER:
import { BigNumber } from '@decentralchain/bignumber';
```

### 3. Native Asset References

The conversion function likely handles the native asset specially:

```typescript
// LOOK FOR:
if (assetId === 'WAVES' || assetId === '') { ... }
const NATIVE_ASSET = 'WAVES';

// REPLACE WITH:
if (assetId === 'DCC' || assetId === '') { ... }
const NATIVE_ASSET = 'DCC';
```

> **⚠ Note:** On-chain, the native asset ID is typically an empty string or null. The string `'WAVES'` or `'DCC'` is just a display name. Verify how this library uses it — if it only uses empty string `''`, no change is needed for the ID itself.

### 4. Source Code Comments

```typescript
// Look for:
/** Converts money-like objects to Waves node format */
// Must become:
/** Converts money-like objects to DecentralChain node format */
```

### 5. README.md

- Install instructions reference `@waves/money-like-to-node`
- May contain Waves references in usage examples

### 6. Test Fixtures

Tests may use:

- `'WAVES'` as asset name
- Waves-specific asset IDs
- Waves address formats

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed
- **Node.js** v16+ installed
- **npm** installed
- A **GitHub account**
- A **code editor** (VS Code recommended)
- **If this depends on `@waves/bignumber`:** DCC-3 must be completed first

---

### Step 1: Find the Repository

```bash
# Try the obvious URL
curl -s -o /dev/null -w "%{http_code}" https://github.com/wavesplatform/money-like-to-node

# If not found, check npm
npm view @waves/money-like-to-node repository.url

# Search GitHub
# https://github.com/wavesplatform?q=money-like
```

---

### Step 2: Create Your Workspace

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration
```

---

### Step 3: Clone and Create Working Copy

```bash
git clone <REPO_URL> waves-money-like-original
cp -r waves-money-like-original dcc-money-like-migrated
cd dcc-money-like-migrated
rm -rf .git
git init
```

---

### Step 4: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `money-like-to-node`
   - **Description:** `Converts human-readable money objects to blockchain node format for DecentralChain`
   - **Visibility:** Public
3. Connect it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/money-like-to-node.git
```

---

### Step 5: Audit Dependencies

```bash
echo "--- package.json contents ---"
cat package.json

echo "--- @waves deps ---"
grep "@waves" package.json
```

If `@waves/bignumber` is a dependency, verify DCC-3 is complete:

```bash
npm view @decentralchain/bignumber version
```

---

### Step 6: Run the Full Waves Audit

```bash
echo "=== Full Waves Audit ==="

echo "--- @waves references ---"
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- WAVES asset references ---"
grep -rni "WAVES" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- waves word references ---"
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- wavesplatform references ---"
grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist
```

---

### Step 7: Fix Every Waves Reference

#### 7a. Fix package.json

```json
{
  "name": "@decentralchain/money-like-to-node",
  "dependencies": {
    "@decentralchain/bignumber": "^1.2.0" // if applicable
  }
}
```

#### 7b. Fix Imports

```typescript
// BEFORE:
import { BigNumber } from '@waves/bignumber';
// AFTER:
import { BigNumber } from '@decentralchain/bignumber';
```

#### 7c. Fix Native Asset References (if any)

```typescript
// BEFORE:
const NATIVE_ASSET = 'WAVES';
// AFTER:
const NATIVE_ASSET = 'DCC';
```

#### 7d. Fix Comments and JSDoc

```typescript
// BEFORE:
/** Converts money-like to Waves node API format */
// AFTER:
/** Converts money-like to DecentralChain node API format */
```

#### 7e. Fix README.md

````markdown
# @decentralchain/money-like-to-node

Converts human-readable money objects to the format expected by the DecentralChain blockchain node API.

## Installation

```bash
npm install @decentralchain/money-like-to-node
```
````

## Usage

```typescript
import { moneyLikeToNode } from '@decentralchain/money-like-to-node';

const nodeFormat = moneyLikeToNode({
  asset: { id: '', precision: 8 },
  amount: '1.5',
});

// Result: { assetId: '', amount: 150000000 }
```

## License

MIT

````

#### 7f. Fix Test Files

```typescript
// Update test data — replace 'WAVES' references with 'DCC'
````

---

### Step 8: Run the Audit Again

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist
```

**This must return ZERO results.**

---

### Step 9: Rebuild and Test

```bash
rm -rf node_modules dist
npm install
npm run build
npm test
```

---

### Step 10: Commit and Push

```bash
git add .
git commit -m "feat: clean migration of money-like-to-node — remove all Waves references

- Renamed package to @decentralchain/money-like-to-node
- Updated @waves/* dependencies to @decentralchain/*
- Updated native asset references (if applicable)
- Updated repository URLs to Decentral-America
- Cleaned all comments and README
- All tests pass
- grep -rni waves returns zero results"

git push -u origin master
```

---

### Step 11: Notify Downstream Consumers

This package is consumed by:

1. **DCC-16** (`@decentralchain/signature-adapter`) — notify that person

---

### Step 12: Write Your Migration Summary

```
Migration Summary — money-like-to-node

Source repo: [URL]
Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
@waves/* deps updated: [list]
Native asset name changed: [yes/no, WAVES → DCC]
Tests: [pass/fail]
Build: [pass/fail]

Remaining concerns: [any issues]
```

---

## Acceptance Criteria

- [ ] Source repo located
- [ ] Dependencies audited — `@waves/*` deps identified and replaced
- [ ] New repo exists with clean migration
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `package.json` name is `@decentralchain/money-like-to-node`
- [ ] README references DecentralChain exclusively
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] DCC-16 owner notified
- [ ] Team lead notified for review

---

## AI Prompt for Assistance

```
I am migrating the npm package @waves/money-like-to-node from the Waves
blockchain ecosystem to @decentralchain/money-like-to-node.

This is a small utility that converts human-readable money objects into the
format expected by the blockchain node API (e.g., "1.5 DCC" → 150000000 raw units).

Things to check:
1. @waves/* dependencies (likely @waves/bignumber)
2. Native asset name references ('WAVES' → 'DCC')
3. Import paths
4. Comments and documentation

The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**1–2 hours** — Small utility package. Low complexity unless it has unexpected dependencies.

---

## Questions?

Reach out to the team lead. Key decisions:

1. **Does this depend on `@waves/bignumber`?** If so, DCC-3 must be done first.
2. **Native asset name:** Is the display name `'DCC'` or `'DECENTRALCHAIN'`?
