# Migrate Data Service Client JS Library to DecentralChain

## Assigned to: _Unassigned_

**Priority:** High  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`, `api`  
**Sprint:** Current  
**Story Points:** 3

---

## Summary

Migrate the `@waves/data-service-client-js` npm package from the Waves blockchain ecosystem into a clean DecentralChain library published as `@decentralchain/data-service-client-js` with **zero** Waves references remaining. This library is an HTTP client for the blockchain data service API (a separate service from the node API) and depends on two Phase 1/2 packages: `@waves/bignumber` (DCC-3) and `@waves/data-entities` (DCC-9).

---

## Background

### What is this library?

`data-service-client-js` is a **JavaScript/TypeScript HTTP client** for the blockchain **data service** — a specialized API service that provides indexed, queryable blockchain data. While the node API (`node-api-js`, DCC-11) talks directly to the node for raw blockchain operations, the data service provides:

- **Asset search** — search assets by name, ticker, or ID with pagination
- **Pair data** — DEX trading pair information, candle data, volume
- **Transaction history** — enriched, paginated transaction history for addresses
- **Alias resolution** — resolve blockchain aliases to addresses
- **Rate calculations** — asset exchange rates and price data
- **Rich list, balance snapshots** — historical and aggregated data

This service powers the wallet's:

- **Asset browser** (search and discover assets)
- **Transaction history** (paginated tx list)
- **DEX charts** (trading pair candles)
- **Balance displays** (formatted amounts with asset metadata)

### Where did it come from?

This package was created by the Waves blockchain team. The source code lives at `wavesplatform/data-service-client-js`.

### Why does this matter?

This is a **direct dependency** in the `dcc-react` wallet (`package.json`: `"@waves/data-service-client-js": "^4.1.1"`). If the data service client still points to Waves data service URLs, the wallet would query Waves blockchain data instead of DecentralChain data.

### Key Risk: Data Service URLs

The **#1 risk** is hardcoded data service URLs:

```typescript
// Waves data service URLs (MUST BE REPLACED):
'https://api.wavesplatform.com/v0';
'https://api.testnet.wavesplatform.com/v0';
```

These must be replaced with DecentralChain data service URLs.

### Blocking Dependencies

| Dependency              | Ticket  | Status                     | Notes                                |
| ----------------------- | ------- | -------------------------- | ------------------------------------ |
| **DCC-3 bignumber**     | Phase 1 | ⚠️ Must be completed first | Used for amount arithmetic           |
| **DCC-9 data-entities** | Phase 2 | ⚠️ Must be completed first | Provides Asset, Money entity classes |

---

## Current State of the Repo

| Field                         | Value                                                                  |
| ----------------------------- | ---------------------------------------------------------------------- |
| **npm package**               | `@waves/data-service-client-js` ^4.1.1                                 |
| **Current GitHub repo**       | `wavesplatform/data-service-client-js`                                 |
| **Fork in Decentral-America** | ❌ **Needs to be forked**                                              |
| **Language**                  | TypeScript                                                             |
| **License**                   | MIT (expected)                                                         |
| **`@waves/*` dependencies**   | `@waves/bignumber`, `@waves/data-entities` (2 deps)                    |
| **Runtime dependencies**      | `@waves/bignumber`, `@waves/data-entities`, `axios` or `fetch`, others |
| **Used by**                   | dcc-react (direct dependency)                                          |
| **Last published to npm**     | Needs research                                                         |

### Expected File Structure

```
data-service-client-js/
├── src/
│   ├── index.ts              # Main entry
│   ├── config.ts             # ⚠️ Data service URLs — CRITICAL
│   ├── types.ts              # API request/response types
│   ├── api/
│   │   ├── assets.ts         # Asset search/lookup endpoints
│   │   ├── pairs.ts          # DEX pair data endpoints
│   │   ├── transactions.ts   # Transaction history endpoints
│   │   ├── aliases.ts        # Alias resolution endpoints
│   │   ├── candles.ts        # Trading candle data
│   │   └── ...
│   ├── http.ts               # HTTP client wrapper
│   └── utils.ts              # Utility functions
├── dist/
│   └── ...
├── test/
│   └── ...
├── package.json              # ⚠️ Contains @waves scope + @waves/* deps
├── tsconfig.json
├── README.md                 # ⚠️ References Waves
└── ...
```

---

## Known Waves Contamination

### 1. Data Service URLs (HIGHEST PRIORITY)

```typescript
// LOOK FOR:
'https://api.wavesplatform.com/v0';
'https://api.testnet.wavesplatform.com/v0';
'https://data.wavesplatform.com';

// REPLACE WITH:
'https://api.decentralchain.io/v0'; // DCC mainnet (CONFIRM URL)
'https://api.testnet.decentralchain.io/v0'; // DCC testnet (CONFIRM URL)
```

> **⚠ CRITICAL:** Get the correct DCC data service URLs from the team lead. The data service is a separate deployment from the node.

### 2. package.json

- `name` is `@waves/data-service-client-js` — must be `@decentralchain/data-service-client-js`
- `dependencies` includes:
  - `@waves/bignumber` → `@decentralchain/bignumber`
  - `@waves/data-entities` → `@decentralchain/data-entities`
- `repository.url` — update to `Decentral-America/data-service-client-js`

### 3. Import Statements

Multiple files will import from `@waves/*`:

```typescript
// BEFORE:
import { BigNumber } from '@waves/bignumber';
import { Asset, Money } from '@waves/data-entities';

// AFTER:
import { BigNumber } from '@decentralchain/bignumber';
import { Asset, Money } from '@decentralchain/data-entities';
```

### 4. Chain ID References

```typescript
// BEFORE:
const DEFAULT_CHAIN_ID = 'W';
// AFTER:
const DEFAULT_CHAIN_ID = 'L';
```

### 5. Native Asset References

```typescript
// BEFORE:
const WAVES_ASSET_ID = '';
const NATIVE_ASSET = 'WAVES';
// AFTER:
const DCC_ASSET_ID = '';
const NATIVE_ASSET = 'DCC';
```

### 6. Source Code Comments and JSDoc

```typescript
// BEFORE:
/** Client for the Waves data service API */
// AFTER:
/** Client for the DecentralChain data service API */
```

### 7. README.md

- Install instructions and usage examples reference Waves
- API endpoint documentation references wavesplatform URLs

### 8. Test Fixtures

Tests likely contain:

- Hardcoded data service URLs
- Mock API responses with Waves-specific data
- Waves addresses, asset names, chain IDs

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed
- **Node.js** v16+ installed
- **npm** installed
- A **GitHub account**
- A **code editor** (VS Code recommended)
- **DCC-3 (bignumber) MUST be completed first**
- **DCC-9 (data-entities) MUST be completed first**
- **DCC data service URLs** confirmed by team lead

---

### Step 1: Verify Dependencies are Ready

```bash
# Verify both upstream dependencies are available
npm view @decentralchain/bignumber version
npm view @decentralchain/data-entities version

# If not published, check repos
curl -s -o /dev/null -w "%{http_code}" https://github.com/Decentral-America/bignumber
curl -s -o /dev/null -w "%{http_code}" https://github.com/Decentral-America/data-entities
```

**⚠ DO NOT proceed if either dependency is unavailable.**

---

### Step 2: Create Your Workspace

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration
```

---

### Step 3: Clone the Original Waves Library

```bash
git clone https://github.com/wavesplatform/data-service-client-js.git waves-data-service-original
```

---

### Step 4: Create Your Working Copy

```bash
cp -r waves-data-service-original dcc-data-service-migrated
cd dcc-data-service-migrated
rm -rf .git
git init
```

---

### Step 5: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `data-service-client-js`
   - **Description:** `HTTP client for the DecentralChain data service API — asset search, transaction history, DEX data`
   - **Visibility:** Public
3. Connect it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/data-service-client-js.git
```

---

### Step 6: Install Dependencies and Verify It Builds

```bash
npm install
npm run build
npm test
```

---

### Step 7: Run the Full Waves Audit

```bash
echo "=== Full Waves Audit ==="

echo "--- @waves import references ---"
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Data service URL references ---"
grep -rni "wavesplatform.com" . | grep -v node_modules | grep -v .git | grep -v dist
grep -rni "api.waves" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- waves word references ---"
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- wavesplatform references ---"
grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Chain ID 'W' references ---"
grep -rn "'W'" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- WAVES asset references ---"
grep -rni "WAVES" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist
```

**Save this output.** Fix every result.

---

### Step 8: Fix Every Waves Reference

#### 8a. Fix package.json

```json
{
  "name": "@decentralchain/data-service-client-js",
  "dependencies": {
    "@decentralchain/bignumber": "^1.2.0",
    "@decentralchain/data-entities": "^2.0.7"
  }
}
```

#### 8b. Fix Data Service URLs (CRITICAL)

In every config file and source file:

```typescript
// BEFORE:
const BASE_URL = 'https://api.wavesplatform.com/v0';
// AFTER:
const BASE_URL = 'https://api.decentralchain.io/v0'; // CONFIRM URL
```

Use a global search:

```bash
grep -rn "wavesplatform.com" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist
```

#### 8c. Fix All Import Statements

```typescript
// BEFORE:
import { BigNumber } from '@waves/bignumber';
import { Asset, Money } from '@waves/data-entities';

// AFTER:
import { BigNumber } from '@decentralchain/bignumber';
import { Asset, Money } from '@decentralchain/data-entities';
```

#### 8d. Fix Chain ID and Asset References

```typescript
// Chain ID
const DEFAULT_CHAIN_ID = 'L'; // was 'W'

// Native asset
const NATIVE_ASSET = 'DCC'; // was 'WAVES'
```

#### 8e. Fix Comments and JSDoc

#### 8f. Fix README.md

````markdown
# @decentralchain/data-service-client-js

HTTP client for the DecentralChain data service API.

Provides typed methods for querying indexed blockchain data including assets, transactions, DEX pairs, candles, and more.

## Installation

```bash
npm install @decentralchain/data-service-client-js
```
````

## Usage

```typescript
import { create } from '@decentralchain/data-service-client-js';

const client = create('https://api.decentralchain.io/v0');

// Search for assets
const assets = await client.getAssets({ search: 'DCC', limit: 10 });

// Get transaction history
const txs = await client.getTransactions({ sender: '3L...' });

// Get DEX pair data
const pairs = await client.getPairs({ pairs: ['DCC/USDT'] });
```

## Dependencies

- `@decentralchain/bignumber` — precision arithmetic
- `@decentralchain/data-entities` — typed entity classes (Asset, Money)

## License

MIT

````

#### 8g. Fix Test Fixtures

Update all test data with DCC data service URLs, addresses, and asset references.

---

### Step 9: Run the Audit Again

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist
````

**This must return ZERO results.**

---

### Step 10: Rebuild and Test

```bash
rm -rf node_modules dist
npm install
npm run build
npm test
```

**If dependencies aren't on npm yet**, use npm link or GitHub URLs:

```bash
npm link @decentralchain/bignumber @decentralchain/data-entities
```

---

### Step 11: Integration Test Against DCC Data Service

```bash
node -e "
const { create } = require('./dist');
const client = create('https://api.decentralchain.io/v0'); // CONFIRM URL
client.getAssets({ limit: 1 })
  .then(data => console.log('Data service response:', JSON.stringify(data).substring(0, 200)))
  .catch(console.error);
"
```

---

### Step 12: Commit and Push

```bash
git add .
git commit -m "feat: clean migration of data-service-client-js — remove all Waves references

- Renamed package to @decentralchain/data-service-client-js
- Updated deps: @waves/bignumber → @decentralchain/bignumber
- Updated deps: @waves/data-entities → @decentralchain/data-entities
- Replaced all Waves data service URLs with DCC URLs
- Updated chain ID from 'W' to 'L'
- Updated asset references from 'WAVES' to 'DCC'
- Cleaned all comments, JSDoc, and README
- Updated test fixtures
- All tests pass
- Integration tested against DCC data service
- grep -rni waves returns zero results"

git push -u origin master
```

---

### Step 13: Notify Team

No downstream SDK packages depend on this (it's consumed directly by dcc-react), but notify the team lead that it's ready.

---

### Step 14: Write Your Migration Summary

```
Migration Summary — data-service-client-js

Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
Data service URLs updated: [list old → new]
@waves/bignumber → @decentralchain/bignumber: [number of files]
@waves/data-entities → @decentralchain/data-entities: [number of files]
Chain ID: 'W' → 'L'
Asset name: 'WAVES' → 'DCC'
Tests: [pass/fail]
Build: [pass/fail]
Integration test: [pass/fail]

Remaining concerns: [any issues]
```

---

## Acceptance Criteria

- [ ] DCC-3 (bignumber) and DCC-9 (data-entities) completed before starting
- [ ] Source repo cloned from `wavesplatform/data-service-client-js`
- [ ] New repo exists with clean migration
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `package.json` name is `@decentralchain/data-service-client-js`
- [ ] All `@waves/bignumber` imports → `@decentralchain/bignumber`
- [ ] All `@waves/data-entities` imports → `@decentralchain/data-entities`
- [ ] **All data service URLs replaced** with DCC URLs (confirmed by team lead)
- [ ] Chain ID defaults updated from 'W' to 'L'
- [ ] Native asset references updated
- [ ] README references DecentralChain exclusively
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] Integration test against DCC data service passes
- [ ] Team lead notified for review

---

## AI Prompt for Assistance

```
I am migrating the npm package @waves/data-service-client-js from the Waves
blockchain ecosystem to @decentralchain/data-service-client-js.

This package is an HTTP client for the blockchain data service API. It has
2 @waves/* dependencies:
- @waves/bignumber → @decentralchain/bignumber
- @waves/data-entities → @decentralchain/data-entities

CRITICAL: All hardcoded data service URLs must be replaced:
- api.wavesplatform.com → api.decentralchain.io (CONFIRM URL)

Also update:
- Chain ID: 'W' (87) → 'L' (76)
- Native asset: 'WAVES' → 'DCC'

The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**3–5 hours** — Medium complexity. Multiple source files with imports to update, plus data service URLs to replace and verify. Integration testing against the live DCC data service adds time.

---

## Questions?

Reach out to the team lead. Key decisions:

1. **DCC data service URLs** — What are the correct mainnet and testnet data service URLs?
2. **API version** — Does DCC use `/v0` (same as Waves) or a different version path?
3. **Data service deployment** — Is the DCC data service live and accepting requests?
