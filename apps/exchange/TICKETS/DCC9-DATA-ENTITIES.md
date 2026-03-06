# Migrate Data Entities Library to DecentralChain

## Assigned to: _Unassigned_

**Priority:** Critical  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`  
**Sprint:** Current  
**Story Points:** 2

---

## Summary

Migrate the `@waves/data-entities` npm package from the Waves blockchain ecosystem into a clean, standalone DecentralChain library published as `@decentralchain/data-entities` with **zero** Waves references remaining. This package provides core domain models for blockchain entities and has a Phase 1 dependency on `@waves/bignumber` (DCC-3).

---

## Background

### What is this library?

`data-entities` is a **domain model library** that provides typed JavaScript/TypeScript classes for blockchain data structures. It defines rich entity objects for:

- **Assets** — representations of blockchain tokens with metadata (name, decimals, description)
- **Money** — amount + asset pairs with arithmetic operations (add, subtract, multiply, compare)
- **OrderPrice** — DEX order pricing with precision handling
- **Transactions** — structured transaction objects with validation
- **Addresses** — validated blockchain address objects

These are not just type definitions (that's `ts-types`). These are **classes with behavior** — methods for arithmetic, validation, formatting, and conversion.

### Where did it come from?

This package was created by the Waves blockchain team as part of the Waves client SDK. The source code lives at `wavesplatform/waves-data-entities` (note the `waves-` prefix on the GitHub repo, which differs from the npm name).

### Why does this matter?

This package is used **directly** in the `dcc-react` wallet application (`package.json`: `"@waves/data-entities": "^2.0.7"`). It's also a dependency for `@waves/data-service-client-js` (DCC-14, Phase 3) and `@decentralchain/signature-adapter` (DCC-16, Phase 4).

The Money class and Asset class are used throughout the wallet UI for displaying balances, formatting amounts, and performing arithmetic with proper decimal handling. Any bugs here would cause incorrect balance displays or transaction amount calculations.

### Blocking Dependencies

| Dependency          | Status                     | Notes                                                                 |
| ------------------- | -------------------------- | --------------------------------------------------------------------- |
| **DCC-3 bignumber** | ⚠️ Must be completed first | `data-entities` uses `@waves/bignumber` for all arithmetic operations |

---

## Current State of the Repo

| Field                         | Value                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------- |
| **npm package**               | `@waves/data-entities` ^2.0.7                                                   |
| **Current GitHub repo**       | `wavesplatform/waves-data-entities`                                             |
| **Fork in Decentral-America** | ❌ **Needs to be forked**                                                       |
| **Language**                  | TypeScript                                                                      |
| **License**                   | MIT (expected)                                                                  |
| **`@waves/*` dependencies**   | `@waves/bignumber` (1 dep)                                                      |
| **Runtime dependencies**      | `@waves/bignumber`, possibly others                                             |
| **Used by**                   | dcc-react (direct), data-service-client-js (DCC-14), signature-adapter (DCC-16) |
| **Last published to npm**     | Needs research                                                                  |

### Expected File Structure

```
waves-data-entities/
├── src/
│   ├── index.ts              # Main entry — exports all entities
│   ├── Asset.ts              # Asset class — token metadata
│   ├── Money.ts              # Money class — amount + asset arithmetic
│   ├── OrderPrice.ts         # DEX order price calculations
│   ├── config.ts             # ⚠️ May contain chain ID defaults
│   └── ...
├── dist/
│   └── ...
├── test/
│   └── ...
├── package.json              # ⚠️ Contains @waves scope + @waves/bignumber dep
├── tsconfig.json
├── README.md                 # ⚠️ References Waves
└── ...
```

---

## Known Waves Contamination

### 1. package.json

- `name` is `@waves/data-entities` — must be `@decentralchain/data-entities`
- `dependencies` includes `@waves/bignumber` — must be `@decentralchain/bignumber`
- `repository.url` — must point to `Decentral-America/data-entities`
- `description`, `keywords`, `author` — check for Waves references

### 2. Import Statements

Every file that imports bignumber will have:

```typescript
// BEFORE:
import { BigNumber } from '@waves/bignumber';

// AFTER:
import { BigNumber } from '@decentralchain/bignumber';
```

This will appear in multiple source files — Asset.ts, Money.ts, OrderPrice.ts, and tests.

### 3. Chain ID References

Configuration or factory methods may default to Waves chain IDs:

```typescript
// BEFORE:
const DEFAULT_CHAIN_ID = 'W'; // Waves mainnet
const DEFAULT_NETWORK_BYTE = 87;

// AFTER:
const DEFAULT_CHAIN_ID = 'L'; // DCC mainnet
const DEFAULT_NETWORK_BYTE = 76;
```

### 4. Hardcoded Asset IDs

The Waves platform has well-known asset IDs (e.g., WAVES = '' or null). Check for hardcoded references to Waves-specific assets:

```typescript
// Look for:
const WAVES_ASSET_ID = '';
const WAVES = 'WAVES';
// These may need to become:
const DCC_ASSET_ID = '';
const DCC = 'DCC';
```

### 5. Source Code Comments

```typescript
// Look for:
/** Waves blockchain asset representation */
// Must become:
/** DecentralChain asset representation */
```

### 6. README.md

- Install instructions reference `@waves/data-entities`
- May contain Waves badges, links, branding
- Usage examples may reference Waves-specific patterns

### 7. Test Files

- Tests likely import `@waves/bignumber`
- Tests may create mock Waves assets or use Waves-specific test data
- Test fixtures may contain Waves addresses (starting with '3P' for mainnet 'W')

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed
- **Node.js** v16+ installed
- **npm** installed
- A **GitHub account**
- A **code editor** (VS Code recommended)
- **DCC-3 (bignumber) MUST be completed and published first**

---

### Step 1: Verify DCC-3 (bignumber) is Ready

```bash
# Verify that @decentralchain/bignumber is published or available
npm view @decentralchain/bignumber version

# If not published yet, check the GitHub repo
curl -s -o /dev/null -w "%{http_code}" https://github.com/Decentral-America/bignumber
```

**⚠ DO NOT proceed if bignumber is not available.** This package depends on it.

---

### Step 2: Create Your Workspace

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration
```

---

### Step 3: Clone the Original Waves Library

```bash
git clone https://github.com/wavesplatform/waves-data-entities.git waves-data-entities-original
```

> **Note:** The GitHub repo is `waves-data-entities`, not `data-entities`.

---

### Step 4: Create Your Working Copy

```bash
cp -r waves-data-entities-original dcc-data-entities-migrated
cd dcc-data-entities-migrated
rm -rf .git
git init
```

---

### Step 5: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `data-entities`
   - **Description:** `Domain model classes for DecentralChain blockchain entities — Asset, Money, OrderPrice`
   - **Visibility:** Public
   - **Initialize:** Do NOT add README, .gitignore, or license
3. Click **Create repository**
4. Connect it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/data-entities.git
```

---

### Step 6: Install Dependencies and Verify It Builds

```bash
npm install
npm run build
npm test
```

---

### Step 7: Run the Waves Audit

```bash
echo "=== Full Waves Audit ==="

echo "--- @waves references in source ---"
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- waves word references ---"
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- wavesplatform references ---"
grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Chain ID 'W' references ---"
grep -rn "'W'" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Byte 87 references ---"
grep -rn "87" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- WAVES asset references ---"
grep -rni "WAVES" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist
```

**Save this output.** You will need to fix every single result.

---

### Step 8: Fix Every Waves Reference

#### 8a. Fix package.json

```json
// BEFORE:
{
  "name": "@waves/data-entities",
  "dependencies": {
    "@waves/bignumber": "^1.2.0"
  }
}

// AFTER:
{
  "name": "@decentralchain/data-entities",
  "dependencies": {
    "@decentralchain/bignumber": "^1.2.0"
  }
}
```

Also update: `repository.url`, `description`, `keywords`, `author`, `homepage`, `bugs.url`.

#### 8b. Fix All Import Statements

In every source file:

```typescript
// BEFORE:
import { BigNumber } from '@waves/bignumber';

// AFTER:
import { BigNumber } from '@decentralchain/bignumber';
```

Use a global search to find all instances:

```bash
grep -rn "@waves/bignumber" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist
```

#### 8c. Fix Chain ID Defaults (if present)

```typescript
// BEFORE:
const DEFAULT_CHAIN_ID = 'W';
// AFTER:
const DEFAULT_CHAIN_ID = 'L';
```

#### 8d. Fix Asset ID References (if present)

```typescript
// BEFORE:
const WAVES_ID = '';
const NATIVE_ASSET = 'WAVES';
// AFTER:
const DCC_ID = '';
const NATIVE_ASSET = 'DCC';
```

#### 8e. Fix Source Code Comments and JSDoc

```typescript
// BEFORE:
/** Waves blockchain asset */
// AFTER:
/** DecentralChain asset */
```

#### 8f. Fix README.md

````markdown
# @decentralchain/data-entities

Domain model classes for DecentralChain blockchain entities.

Provides rich, typed entity classes including Asset, Money, and OrderPrice with built-in arithmetic, validation, and formatting.

## Installation

```bash
npm install @decentralchain/data-entities
```
````

## Dependencies

- `@decentralchain/bignumber` — precision arithmetic for blockchain amounts

## Usage

```typescript
import { Money, Asset } from '@decentralchain/data-entities';

const dcc = new Asset({
  id: '',
  name: 'DCC',
  precision: 8,
});

const amount = Money.fromTokens(1.5, dcc);
console.log(amount.toFormat()); // "1.50000000 DCC"
```

## License

MIT

````

#### 8g. Fix Test Files

Update all test imports and test data:

```typescript
// BEFORE:
import { BigNumber } from '@waves/bignumber';
// AFTER:
import { BigNumber } from '@decentralchain/bignumber';
````

Also update any test fixtures that reference Waves addresses, Waves asset names, or chain ID 'W'.

---

### Step 9: Run the Audit Again

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist
```

**This must return ZERO results.**

---

### Step 10: Rebuild and Test

```bash
rm -rf node_modules dist
npm install
npm run build
npm test
```

**⚠ If `@decentralchain/bignumber` is not yet on npm**, you may need to:

```bash
# Option A: Use a local link
cd ~/dcc-migration/dcc-bignumber-migrated
npm link
cd ~/dcc-migration/dcc-data-entities-migrated
npm link @decentralchain/bignumber

# Option B: Use a GitHub URL in package.json
"dependencies": {
  "@decentralchain/bignumber": "github:Decentral-America/bignumber"
}
```

---

### Step 11: Commit and Push

```bash
git add .
git commit -m "feat: clean migration of data-entities — remove all Waves references

- Renamed package from @waves/data-entities to @decentralchain/data-entities
- Updated dependency @waves/bignumber to @decentralchain/bignumber
- Updated chain ID defaults from 'W' to 'L' (if applicable)
- Updated asset references from 'WAVES' to 'DCC' (if applicable)
- Updated repository URLs to Decentral-America/data-entities
- Rewrote README with DecentralChain branding
- All imports updated, all comments cleaned
- All tests pass
- grep -rni waves returns zero results"

git push -u origin master
```

---

### Step 12: Open a Pull Request and Notify

1. Go to your repo on GitHub
2. Verify all files look correct
3. **Notify downstream consumers:**
   - DCC-14 (data-service-client-js) — depends on this
   - DCC-16 (signature-adapter) — depends on this

---

### Step 13: Write Your Migration Summary

```
Migration Summary — data-entities

Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
@waves/bignumber → @decentralchain/bignumber: [number of files updated]
Chain ID changes applied: [yes/no, details]
Asset name changes applied: [yes/no, details]
Tests: [pass/fail]
Build: [pass/fail]
New repo: https://github.com/YOUR_USERNAME/data-entities

Remaining concerns: [any issues or questions]
```

---

## Acceptance Criteria

- [ ] DCC-3 (bignumber) migration completed before starting this
- [ ] Source repo cloned from `wavesplatform/waves-data-entities`
- [ ] New repo exists with clean migration
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `package.json` name is `@decentralchain/data-entities`
- [ ] All `@waves/bignumber` imports replaced with `@decentralchain/bignumber`
- [ ] Chain ID defaults updated (if present)
- [ ] Asset references updated (if present)
- [ ] README references DecentralChain exclusively
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] DCC-14 and DCC-16 owners notified
- [ ] Team lead notified for review

---

## AI Prompt for Assistance

```
I am migrating the npm package @waves/data-entities from the Waves blockchain
ecosystem to @decentralchain/data-entities.

This package provides domain model classes (Asset, Money, OrderPrice) for
blockchain entities. It has 1 @waves/* dependency: @waves/bignumber, which
must be replaced with @decentralchain/bignumber.

Things to check:
1. All imports of @waves/bignumber → @decentralchain/bignumber
2. Chain ID defaults: 'W' (87) → 'L' (76) for mainnet
3. Native asset name: 'WAVES' → 'DCC'
4. Hardcoded Waves addresses in tests
5. Comments and JSDoc referencing Waves

The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.
The source repo is wavesplatform/waves-data-entities (note: waves- prefix).

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**2–3 hours** — Medium complexity. Multiple source files with `@waves/bignumber` imports to update, but the logic itself is standard domain modeling.

---

## Questions?

Reach out to the team lead. Key decisions:

1. **Native asset name:** Should the native asset be `'DCC'` or `'DECENTRALCHAIN'`? Check how the wallet references it.
2. **Bignumber availability:** If `@decentralchain/bignumber` isn't on npm yet, use `npm link` or a GitHub dependency URL for development.
