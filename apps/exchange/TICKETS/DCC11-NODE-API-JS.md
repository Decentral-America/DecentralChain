# Audit & Migrate Node API JS Library to DecentralChain

## Assigned to: _Unassigned_

**Priority:** High  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`, `api`  
**Sprint:** Current  
**Story Points:** 3

---

## Summary

Audit and migrate the `@waves/node-api-js` npm package to a fully clean `@decentralchain/node-api-js` library with **zero** Waves references remaining. A fork already exists in the Decentral-America GitHub organization but has **not been audited** for completeness. This library is a transitive dependency used by `@decentralchain/waves-transactions` (DCC-15).

---

## Background

### What is this library?

`node-api-js` is a **JavaScript/TypeScript HTTP client** for communicating with the blockchain node's REST API. It provides typed methods for:

- **Blockchain queries** — get block height, block at height, block headers
- **Transaction queries** — get transaction by ID, get transactions by address, broadcast transaction
- **State queries** — get account balance, get data entries, get asset info
- **Utility endpoints** — compile script, estimate complexity, validate address
- **Node info** — version, status, connected peers

It wraps the node's `/blocks`, `/transactions`, `/addresses`, `/assets`, `/utils`, and other REST endpoints into a typed JavaScript API.

### Where did it come from?

This package was created by the Waves blockchain team. The original source is at `wavesplatform/node-api-js`. A fork **already exists** at `Decentral-America/node-api-js`.

### Why does this matter?

This library is used by `@decentralchain/waves-transactions` (DCC-15, Phase 3) for broadcasting transactions and querying the node. It likely contains **hardcoded Waves node URLs** such as:

```typescript
const DEFAULT_NODE_URL = 'https://nodes.wavesnodes.com';
const DEFAULT_TESTNET_URL = 'https://nodes-testnet.wavesnodes.com';
```

These must be replaced with DecentralChain node URLs. If they're not, the wallet would silently try to communicate with Waves nodes instead of DCC nodes.

### Why does this need an AUDIT first?

The fork at `Decentral-America/node-api-js` already exists, but:

1. **Has the fork been cleaned?** — Unknown. May still contain Waves references.
2. **Is the fork up to date?** — Unknown. May be stale.
3. **Has the package.json been updated?** — Unknown.
4. **Are node URLs correct?** — Unknown. This is the #1 risk.

The audit step determines whether this is a "finish the cleanup" task or a "start from scratch" task.

### Blocking Dependencies

| Dependency      | Status  | Notes                                   |
| --------------- | ------- | --------------------------------------- |
| **Needs audit** | Unknown | May depend on Phase 1 packages — verify |

---

## Current State of the Repo

| Field                         | Value                                                     |
| ----------------------------- | --------------------------------------------------------- |
| **npm package**               | `@waves/node-api-js`                                      |
| **Original GitHub repo**      | `wavesplatform/node-api-js`                               |
| **Fork in Decentral-America** | ✅ **Fork exists** — `Decentral-America/node-api-js`      |
| **Language**                  | TypeScript                                                |
| **License**                   | MIT (expected)                                            |
| **`@waves/*` dependencies**   | **Needs audit** — unclear until package.json is inspected |
| **Runtime dependencies**      | `axios` or `fetch` (HTTP client), possibly others         |
| **Used by**                   | `@decentralchain/waves-transactions` (DCC-15, Phase 3)    |
| **Last published to npm**     | Needs research                                            |

### Expected File Structure

```
node-api-js/
├── src/
│   ├── index.ts              # Main entry
│   ├── api-node/             # ⚠️ Node API endpoint wrappers
│   │   ├── blocks.ts         # /blocks endpoints
│   │   ├── transactions.ts   # /transactions endpoints
│   │   ├── addresses.ts      # /addresses endpoints
│   │   ├── assets.ts         # /assets endpoints
│   │   ├── utils.ts          # /utils endpoints
│   │   └── ...
│   ├── config.ts             # ⚠️ DEFAULT NODE URLs — CRITICAL
│   ├── types.ts              # Type definitions
│   └── http.ts               # HTTP client wrapper
├── dist/
│   └── ...
├── test/
│   └── ...
├── package.json              # ⚠️ Check scope and deps
├── tsconfig.json
├── README.md                 # ⚠️ References Waves
└── ...
```

---

## Known Waves Contamination

### 1. Hardcoded Node URLs (HIGHEST PRIORITY)

This is the **most dangerous** contamination. The library almost certainly has default node URLs:

```typescript
// LOOK FOR:
'https://nodes.wavesnodes.com';
'https://nodes-testnet.wavesnodes.com';
'https://testnet1.wavesnodes.com';
'http://localhost:6869'; // Waves default port
'wss://nodes.wavesnodes.com';

// REPLACE WITH:
'https://nodes.decentralchain.io'; // DCC mainnet (CONFIRM URL)
'https://testnet.nodes.decentralchain.io'; // DCC testnet (CONFIRM URL)
```

> **⚠ CRITICAL:** Get the correct DCC node URLs from the team lead before making changes. Do NOT guess.

### 2. package.json

- `name` — check if already `@decentralchain/node-api-js` or still `@waves/node-api-js`
- `dependencies` — check for any `@waves/*` packages
- `repository.url` — must point to `Decentral-America/node-api-js`

### 3. Default Chain IDs

```typescript
// BEFORE:
const DEFAULT_CHAIN_ID = 'W'; // 87
// AFTER:
const DEFAULT_CHAIN_ID = 'L'; // 76
```

### 4. API Response Parsing

If the library parses blockchain responses, it may check for Waves-specific fields:

```typescript
// Look for:
if (response.chainId === 'W') { ... }
if (response.network === 'mainnet') { ... }
```

### 5. Import Statements

If there are any `@waves/*` dependencies, all imports must be updated.

### 6. Source Code Comments

```typescript
// Look for:
/** Waves node REST API client */
// Must become:
/** DecentralChain node REST API client */
```

### 7. README.md

- Install instructions
- Default node URL examples
- Waves badges, links, branding

### 8. Test Fixtures

Tests likely contain:

- Hardcoded Waves node URLs for integration tests
- Mock responses with Waves-specific data
- Waves addresses in test fixtures

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed
- **Node.js** v16+ installed
- **npm** installed
- A **GitHub account**
- A **code editor** (VS Code recommended)
- **DecentralChain node URLs** confirmed by team lead

---

### Step 1: Audit the Existing Fork

The fork already exists. Start by auditing it:

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration

# Clone the DA fork
git clone https://github.com/Decentral-America/node-api-js.git dcc-node-api-js
cd dcc-node-api-js

# Also clone the original for comparison
cd ..
git clone https://github.com/wavesplatform/node-api-js.git waves-node-api-js-original
```

---

### Step 2: Run the Full Waves Audit on the Fork

```bash
cd ~/dcc-migration/dcc-node-api-js

echo "=== Full Waves Audit on DA Fork ==="

echo "--- @waves references ---"
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- waves word references ---"
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- wavesplatform references ---"
grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- wavesnodes URL references ---"
grep -rni "wavesnodes" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Chain ID 'W' references ---"
grep -rn "'W'" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Port 6869 references (Waves default) ---"
grep -rn "6869" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- package.json name and deps ---"
cat package.json | grep -E '"name"|"@waves"'
```

---

### Step 3: Compare Fork vs Original

```bash
cd ~/dcc-migration

# Count remaining Waves references
echo "--- Fork ---"
grep -rnic "waves" dcc-node-api-js/src/ | tail -1

echo "--- Original ---"
grep -rnic "waves" waves-node-api-js-original/src/ | tail -1

# See what's been changed
diff -rq dcc-node-api-js/src waves-node-api-js-original/src | head -30
```

---

### Step 4: Document the Audit Findings

Create an audit document:

```markdown
# Audit: node-api-js (Decentral-America fork)

## package.json

- name: [current value]
- @waves/\* deps: [list]
- repository.url: [current value]

## Hardcoded URLs

- [list every wavesnodes.com URL found]

## Chain IDs

- [list every 'W' or 87 reference]

## @waves imports

- [list every @waves/* import]

## Remaining "waves" word count

- Source files: [number]
- Test files: [number]
- Config files: [number]
- Documentation: [number]

## Assessment

- Fork cleanliness: [0-100%]
- Estimated remaining work: [hours]
```

---

### Step 5: Fix Every Waves Reference

#### 5a. Fix package.json

```json
{
  "name": "@decentralchain/node-api-js",
  "repository": {
    "url": "https://github.com/Decentral-America/node-api-js"
  }
}
```

Remove all `@waves/*` from dependencies. Replace with `@decentralchain/*` equivalents.

#### 5b. Fix Node URLs (CRITICAL)

```typescript
// BEFORE:
const DEFAULT_NODE_URL = 'https://nodes.wavesnodes.com';

// AFTER:
const DEFAULT_NODE_URL = 'https://nodes.decentralchain.io'; // CONFIRM WITH TEAM
```

**Do this for EVERY URL.** Check config files, test files, README, and source code.

#### 5c. Fix Chain ID Defaults

```typescript
// BEFORE:
const DEFAULT_CHAIN_ID = 'W';
// AFTER:
const DEFAULT_CHAIN_ID = 'L';
```

#### 5d. Fix All @waves/\* Imports

```typescript
// BEFORE:
import { ... } from '@waves/some-package';
// AFTER:
import { ... } from '@decentralchain/some-package';
```

#### 5e. Fix Comments and JSDoc

```typescript
// BEFORE:
/** Client for Waves node REST API */
// AFTER:
/** Client for DecentralChain node REST API */
```

#### 5f. Fix README.md

````markdown
# @decentralchain/node-api-js

TypeScript/JavaScript HTTP client for the DecentralChain node REST API.

## Installation

```bash
npm install @decentralchain/node-api-js
```
````

## Usage

```typescript
import { create } from '@decentralchain/node-api-js';

const api = create('https://nodes.decentralchain.io');

// Get current block height
const height = await api.blocks.fetchHeight();

// Get account balance
const balance = await api.addresses.fetchBalance('3L...');

// Broadcast a signed transaction
const result = await api.transactions.broadcast(signedTx);
```

## License

MIT

````

#### 5g. Fix Test Fixtures

Replace all Waves addresses, node URLs, and mock data with DCC equivalents.

---

### Step 6: Run the Audit Again

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist
````

**This must return ZERO results.**

---

### Step 7: Rebuild and Test

```bash
rm -rf node_modules dist
npm install
npm run build
npm test
```

---

### Step 8: Integration Test Against DCC Node

```bash
# Quick smoke test — verify the library can talk to a real DCC node
node -e "
const { create } = require('./dist');
const api = create('https://nodes.decentralchain.io'); // CONFIRM URL
api.blocks.fetchHeight().then(h => console.log('Block height:', h)).catch(console.error);
"
```

---

### Step 9: Commit and Push

```bash
git add .
git commit -m "feat: complete migration of node-api-js — remove all Waves references

- Updated package name to @decentralchain/node-api-js
- Replaced all hardcoded Waves node URLs with DecentralChain URLs
- Updated chain ID from 'W' to 'L' for DCC mainnet
- Updated all @waves/* imports to @decentralchain/*
- Cleaned all comments, JSDoc, and README
- Updated test fixtures with DCC data
- Integration tested against DCC node
- grep -rni waves returns zero results"

git push origin master
```

---

### Step 10: Notify Downstream Consumers

This package is consumed by:

1. **DCC-15** (`@decentralchain/waves-transactions`) — notify that person

---

### Step 11: Write Your Migration Summary

```
Migration Summary — node-api-js

Fork existed: yes (Decentral-America/node-api-js)
Fork cleanliness at start: [percentage]
Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
Node URLs updated: [list old → new]
Chain ID changes: 'W' → 'L'
@waves/* imports updated: [number]
Tests: [pass/fail]
Build: [pass/fail]
Integration test against DCC node: [pass/fail]

Remaining concerns: [any issues]
```

---

## Acceptance Criteria

- [ ] Existing fork at `Decentral-America/node-api-js` audited
- [ ] Audit findings documented
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `package.json` name is `@decentralchain/node-api-js`
- [ ] **All hardcoded Waves node URLs replaced** with DCC node URLs
- [ ] Chain ID defaults updated to 'L' (76)
- [ ] DCC node URLs confirmed by team lead
- [ ] README references DecentralChain exclusively
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] Integration test against DCC node passes
- [ ] DCC-15 owner notified
- [ ] Team lead notified for review

---

## AI Prompt for Assistance

```
I am auditing and migrating the Decentral-America fork of @waves/node-api-js
to a clean @decentralchain/node-api-js package.

A fork already exists at Decentral-America/node-api-js but has not been
audited for Waves contamination.

This package is a REST API client for the blockchain node. The MOST CRITICAL
changes are:
1. Replace all hardcoded Waves node URLs (nodes.wavesnodes.com) with DCC URLs
2. Update chain ID from 'W' (87) to 'L' (76)
3. Replace all @waves/* imports with @decentralchain/*
4. Update default port if different (Waves uses 6869)

DCC mainnet node URL: [CONFIRM WITH TEAM]
DCC testnet node URL: [CONFIRM WITH TEAM]

The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**2–4 hours** — The fork exists, so this may be a "finish the cleanup" task rather than a fresh migration. Time depends on how clean the existing fork is.

---

## Questions?

Reach out to the team lead. Key decisions:

1. **DecentralChain node URLs** — What are the correct mainnet and testnet node URLs?
2. **Default port** — Does DCC use port 6869 (same as Waves) or a different port?
3. **Fork state** — Has anyone already started cleaning the DA fork?
