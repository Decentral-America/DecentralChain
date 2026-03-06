# Migrate Waves Transactions Library to DecentralChain (Full Dependency Update)

## Assigned to: _Unassigned_

**Priority:** Critical  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`, `critical-path`  
**Sprint:** Current  
**Story Points:** 8

---

## Summary

Complete the migration of `@decentralchain/waves-transactions` by updating **all 5 internal `@waves/*` dependencies** to their `@decentralchain/*` equivalents, removing every remaining Waves reference, and ensuring full transaction building, signing, and broadcasting works against DecentralChain nodes. This package is on the **critical path** — it blocks Phase 4 (signature-adapter) and Phase 5 (bundled file).

---

## Background

### What is this library?

`waves-transactions` is the **core transaction builder and signer** for the entire SDK. It provides:

- **Transaction builders** — functions like `transfer()`, `issue()`, `reissue()`, `burn()`, `lease()`, `cancelLease()`, `massTransfer()`, `data()`, `setScript()`, `setAssetScript()`, `invokeScript()`, `exchange()` that create properly structured transaction objects
- **Transaction signing** — signs transactions with a private key or seed phrase
- **Transaction broadcasting** — sends signed transactions to a node
- **Transaction waiting** — waits for a transaction to be confirmed
- **Address utilities** — generate addresses from seeds, validate addresses
- **Alias operations** — create and resolve aliases

This is the **single most important package** in the SDK. Every other package either feeds into it or consumes its output.

### Where did it come from?

Originally from `wavesplatform/waves-transactions`. A fork already exists at `Decentral-America/waves-transactions`, published as `@decentralchain/waves-transactions`.

### Why does this matter?

This package has **5 `@waves/*` dependencies** that must ALL be migrated before this package can be fully cleaned:

| Dependency                      | Ticket | Phase | Status                    |
| ------------------------------- | ------ | ----- | ------------------------- |
| `@decentralchain/marshall`      | DCC-2  | 2     | 🟡 In Progress (Fabrizio) |
| `@waves/ts-lib-crypto`          | DCC-4  | 1     | ⚠️ Must be completed      |
| `@waves/ts-types`               | DCC-8  | 1     | ⚠️ Must be completed      |
| `@waves/node-api-js`            | DCC-11 | 2     | ⚠️ Must be completed      |
| `@waves/protobuf-serialization` | DCC-12 | 2     | ⚠️ Must be completed      |

**ALL 5 must be done before this ticket can be completed.**

### Why is this HIGH complexity?

1. **5 @waves dependencies** — the most of any Phase 3 package
2. **On the critical path** — blocks DCC-16 (signature-adapter) and DCC-17 (bundled file)
3. **Chain IDs throughout** — transaction building embeds the chain ID in every transaction
4. **Node URLs** — broadcasting requires correct node endpoints
5. **Cryptographic signing** — signing with incorrect chain ID produces invalid transactions
6. **Wide API surface** — dozens of transaction types, each with their own builder function

---

## Current State of the Repo

| Field                         | Value                                                                 |
| ----------------------------- | --------------------------------------------------------------------- |
| **npm package**               | `@decentralchain/waves-transactions` ^4.2.6                           |
| **Original GitHub repo**      | `wavesplatform/waves-transactions`                                    |
| **Fork in Decentral-America** | ✅ **Fork exists** — `Decentral-America/waves-transactions`           |
| **Language**                  | TypeScript                                                            |
| **License**                   | MIT (expected)                                                        |
| **`@waves/*` dependencies**   | **5** (see table above)                                               |
| **Runtime dependencies**      | 5 @waves/\* + axios/fetch + others                                    |
| **Used by**                   | dcc-react (direct), signature-adapter (DCC-16), bundled file (DCC-17) |
| **Last published to npm**     | Needs research                                                        |

### Expected File Structure

```
waves-transactions/
├── src/
│   ├── index.ts              # Main entry
│   ├── transactions/         # ⚠️ Transaction builder functions
│   │   ├── transfer.ts
│   │   ├── issue.ts
│   │   ├── reissue.ts
│   │   ├── burn.ts
│   │   ├── lease.ts
│   │   ├── cancel-lease.ts
│   │   ├── mass-transfer.ts
│   │   ├── data.ts
│   │   ├── set-script.ts
│   │   ├── invoke-script.ts
│   │   ├── exchange.ts
│   │   └── ...
│   ├── sign.ts               # ⚠️ Transaction signing
│   ├── broadcast.ts          # ⚠️ Transaction broadcasting (node URLs)
│   ├── wait.ts               # Wait for confirmation
│   ├── address.ts            # ⚠️ Address generation (chain ID)
│   ├── config.ts             # ⚠️ Default node URLs, chain IDs
│   ├── nodeInteraction.ts    # ⚠️ Node API interaction
│   ├── crypto.ts             # Crypto wrappers using ts-lib-crypto
│   └── types.ts              # Type re-exports from ts-types
├── dist/
│   └── ...
├── test/
│   └── ...                   # ⚠️ Extensive test suite
├── package.json              # ⚠️ Contains @waves/* deps
├── tsconfig.json
├── README.md                 # ⚠️ References Waves
└── ...
```

---

## Known Waves Contamination

### 1. package.json — 5 @waves Dependencies

```json
// BEFORE (expected):
{
  "name": "@decentralchain/waves-transactions",
  "dependencies": {
    "@waves/ts-lib-crypto": "...",
    "@waves/ts-types": "...",
    "@waves/node-api-js": "...",
    "@waves/protobuf-serialization": "...",
    "@decentralchain/marshall": "..."
  }
}

// AFTER:
{
  "name": "@decentralchain/waves-transactions",
  "dependencies": {
    "@decentralchain/ts-lib-crypto": "...",
    "@decentralchain/ts-types": "...",
    "@decentralchain/node-api-js": "...",
    "@decentralchain/protobuf-serialization": "...",
    "@decentralchain/marshall": "..."
  }
}
```

> **Note:** The package name is `@decentralchain/waves-transactions` — the "waves" part may or may not need renaming. If it should be `@decentralchain/transactions`, that's a broader decision. Check with team lead.

### 2. Import Statements — MANY files

Every source file that imports from `@waves/*` must be updated. This will be **dozens of files**.

```typescript
// BEFORE:
import { base58Encode, signBytes, publicKey } from '@waves/ts-lib-crypto';
import { TRANSACTION_TYPE } from '@waves/ts-types';
import { create as createNodeApi } from '@waves/node-api-js';
import { serializeTx } from '@waves/protobuf-serialization';

// AFTER:
import { base58Encode, signBytes, publicKey } from '@decentralchain/ts-lib-crypto';
import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { create as createNodeApi } from '@decentralchain/node-api-js';
import { serializeTx } from '@decentralchain/protobuf-serialization';
```

### 3. Chain ID Constants (CRITICAL)

Transaction builders embed the chain ID:

```typescript
// BEFORE:
const DEFAULT_CHAIN_ID = 'W'; // 87
const chainId = 'W'.charCodeAt(0);

// AFTER:
const DEFAULT_CHAIN_ID = 'L'; // 76
const chainId = 'L'.charCodeAt(0);
```

**Every transaction includes a chain ID byte.** If it's wrong, the node will reject it.

### 4. Default Node URLs

Broadcasting and node interaction use default URLs:

```typescript
// BEFORE:
const DEFAULT_NODE_URL = 'https://nodes.wavesnodes.com';
const DEFAULT_TESTNET_URL = 'https://nodes-testnet.wavesnodes.com';

// AFTER:
const DEFAULT_NODE_URL = 'https://nodes.decentralchain.io'; // CONFIRM
const DEFAULT_TESTNET_URL = 'https://testnet.nodes.decentralchain.io'; // CONFIRM
```

### 5. Address Generation

Address generation uses the chain ID byte:

```typescript
// BEFORE:
function address(seed, chainId = 'W') { ... }

// AFTER:
function address(seed, chainId = 'L') { ... }
```

### 6. Native Asset References

```typescript
// BEFORE:
const WAVES_ASSET_ID = null; // or ''
const NATIVE_ASSET = 'WAVES';

// AFTER:
const DCC_ASSET_ID = null; // or ''
const NATIVE_ASSET = 'DCC';
```

### 7. Source Code Comments and JSDoc

Extensive JSDoc documentation will reference Waves:

```typescript
// BEFORE:
/**
 * Creates a signed transfer transaction.
 * @param params - Transfer parameters
 * @param params.chainId - Chain ID byte ('W' for mainnet, 'T' for testnet)
 */

// AFTER:
/**
 * Creates a signed transfer transaction.
 * @param params - Transfer parameters
 * @param params.chainId - Chain ID byte ('L' for DCC mainnet, 'T' for testnet)
 */
```

### 8. README.md

Extensive documentation with Waves-specific examples, URLs, and references.

### 9. Test Suite

The test suite is likely **very large** with:

- Hardcoded chain ID 'W' in test transactions
- Hardcoded Waves node URLs
- Expected address formats starting with chain ID 'W' byte
- Signed transaction fixtures with Waves-specific bytes

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed
- **Node.js** v16+ installed
- **npm** installed
- A **GitHub account**
- A **code editor** (VS Code recommended)
- **ALL 5 dependencies MUST be completed first:**
  - DCC-2 (marshall) — Fabrizio
  - DCC-4 (ts-lib-crypto)
  - DCC-8 (ts-types)
  - DCC-11 (node-api-js)
  - DCC-12 (protobuf-serialization)
- **DCC node URLs** confirmed by team lead

---

### Step 1: Verify ALL Dependencies are Ready

```bash
echo "=== Checking all 5 dependencies ==="

npm view @decentralchain/marshall version
npm view @decentralchain/ts-lib-crypto version
npm view @decentralchain/ts-types version
npm view @decentralchain/node-api-js version
npm view @decentralchain/protobuf-serialization version
```

**⚠ ALL FIVE must be available before proceeding.** This is a Phase 3 package — skipping dependencies will cause cascading build failures.

---

### Step 2: Clone the Existing Fork

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration

# Clone the DA fork (already exists)
git clone https://github.com/Decentral-America/waves-transactions.git dcc-waves-transactions
cd dcc-waves-transactions
```

---

### Step 3: Audit the Existing Fork

Before making changes, understand what's already been done:

```bash
echo "=== Audit existing DA fork ==="

echo "--- package.json name and deps ---"
cat package.json | grep -E '"name"|"@waves"'

echo "--- @waves references in source ---"
grep -rn "@waves" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist | wc -l

echo "--- wavesplatform URL references ---"
grep -rni "wavesplatform\|wavesnodes" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Chain ID 'W' references ---"
grep -rn "'W'" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Full waves word count ---"
grep -rnic "waves" src/ | awk -F: '{s+=$NF} END {print s}'
```

---

### Step 4: Run the Comprehensive Waves Audit

```bash
echo "=== COMPREHENSIVE WAVES AUDIT ==="

echo "--- 1. @waves import references ---"
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 2. wavesplatform domain references ---"
grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 3. wavesnodes URL references ---"
grep -rni "wavesnodes" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 4. Chain ID 'W' references ---"
grep -rn "'W'" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 5. Byte 87 references ---"
grep -rn "\b87\b" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 6. WAVES asset references ---"
grep -rn "WAVES" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 7. waves word in all file types ---"
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 8. Source file count ---"
find src/ -name "*.ts" | wc -l
```

**Save the full output.** This will be a substantial list.

---

### Step 5: Fix package.json Dependencies

Replace all 5 `@waves/*` dependencies:

```bash
# Use sed or manual editing
sed -i 's/@waves\/ts-lib-crypto/@decentralchain\/ts-lib-crypto/g' package.json
sed -i 's/@waves\/ts-types/@decentralchain\/ts-types/g' package.json
sed -i 's/@waves\/node-api-js/@decentralchain\/node-api-js/g' package.json
sed -i 's/@waves\/protobuf-serialization/@decentralchain\/protobuf-serialization/g' package.json
```

Verify:

```bash
grep "@waves" package.json
# Should return ZERO results
```

---

### Step 6: Fix All Import Statements

This is the **largest part** of the migration. Use a systematic approach:

```bash
# Find all files with @waves imports
grep -rln "@waves" src/ --include="*.ts" --include="*.js" | sort

# For each @waves package, do a global replace:
find src/ -name "*.ts" -exec sed -i 's/@waves\/ts-lib-crypto/@decentralchain\/ts-lib-crypto/g' {} +
find src/ -name "*.ts" -exec sed -i 's/@waves\/ts-types/@decentralchain\/ts-types/g' {} +
find src/ -name "*.ts" -exec sed -i 's/@waves\/node-api-js/@decentralchain\/node-api-js/g' {} +
find src/ -name "*.ts" -exec sed -i 's/@waves\/protobuf-serialization/@decentralchain\/protobuf-serialization/g' {} +
find src/ -name "*.ts" -exec sed -i "s/@waves\/marshall/@decentralchain\/marshall/g" {} +
```

Verify:

```bash
grep -rn "@waves" src/ --include="*.ts" --include="*.js"
# Should return ZERO results
```

---

### Step 7: Fix Chain ID Constants

Find and replace all chain ID defaults:

```bash
grep -rn "'W'" src/ --include="*.ts" | grep -i "chain"
```

For each result:

```typescript
// BEFORE:
const DEFAULT_CHAIN_ID = 'W';
chainId = 'W';

// AFTER:
const DEFAULT_CHAIN_ID = 'L';
chainId = 'L';
```

---

### Step 8: Fix Node URLs

```bash
grep -rni "wavesnodes\|wavesplatform" src/ | grep -v node_modules
```

Replace every URL:

```typescript
// BEFORE:
'https://nodes.wavesnodes.com';
// AFTER:
'https://nodes.decentralchain.io'; // CONFIRM
```

---

### Step 9: Fix Native Asset References

```bash
grep -rn "WAVES" src/ --include="*.ts" | grep -v node_modules
```

```typescript
// BEFORE:
const NATIVE_ASSET = 'WAVES';
// AFTER:
const NATIVE_ASSET = 'DCC';
```

---

### Step 10: Fix Comments and JSDoc

```bash
grep -rni "waves" src/ --include="*.ts" | grep -v "@waves\|@decentralchain\|node_modules"
```

Replace all remaining Waves mentions in comments.

---

### Step 11: Fix README.md

````markdown
# @decentralchain/waves-transactions

Transaction builder, signer, and broadcaster for the DecentralChain blockchain.

Provides builder functions for all transaction types, cryptographic signing with seed phrases or private keys, and broadcasting to DecentralChain nodes.

## Installation

```bash
npm install @decentralchain/waves-transactions
```
````

## Quick Start

```typescript
import { transfer, broadcast } from '@decentralchain/waves-transactions';

const seed = 'your twelve word seed phrase here';

const tx = transfer(
  {
    recipient: '3L...',
    amount: 100000000, // 1 DCC (8 decimals)
    chainId: 'L', // DCC mainnet
  },
  seed
);

const result = await broadcast(tx, 'https://nodes.decentralchain.io');
```

## Transaction Types

- `transfer()` — Send DCC or tokens
- `issue()` — Create a new token
- `reissue()` — Reissue additional tokens
- `burn()` — Burn tokens
- `lease()` — Lease DCC
- `cancelLease()` — Cancel a lease
- `massTransfer()` — Send to multiple recipients
- `data()` — Write data to account data storage
- `setScript()` — Set account script (smart account)
- `setAssetScript()` — Set asset script (smart asset)
- `invokeScript()` — Call a dApp function
- `exchange()` — DEX exchange order

## Chain IDs

| Network | Byte | Char |
| ------- | ---- | ---- |
| Mainnet | 76   | L    |
| Testnet | 84   | T    |

## Dependencies

- `@decentralchain/ts-lib-crypto` — cryptographic operations
- `@decentralchain/ts-types` — shared type definitions
- `@decentralchain/node-api-js` — node REST API client
- `@decentralchain/protobuf-serialization` — protobuf encoding
- `@decentralchain/marshall` — binary serialization

## License

MIT

````

---

### Step 12: Fix Test Suite

The test suite will have extensive Waves contamination:

```bash
echo "--- Test file Waves references ---"
grep -rni "waves\|'W'" test/ --include="*.ts" --include="*.js" | wc -l

# Fix imports
find test/ -name "*.ts" -exec sed -i 's/@waves/@decentralchain/g' {} +

# Fix chain IDs in test data
find test/ -name "*.ts" -exec sed -i "s/'W'/'L'/g" {} +
````

**⚠ Be careful with the `'W'` replacement** — only replace chain ID contexts, not random string literals. Review each change.

---

### Step 13: Run the Final Audit

```bash
echo "=== FINAL AUDIT ==="

grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist

echo "Count:"
grep -rnic "waves" src/ test/ | awk -F: '{s+=$NF} END {print s}'
```

**Target: ZERO results.**

---

### Step 14: Rebuild and Test

```bash
rm -rf node_modules dist
npm install
npm run build
npm test
```

Fix any test failures caused by chain ID changes or updated dependencies.

---

### Step 15: Integration Test — Build a Transaction

```bash
node -e "
const wt = require('./dist');
const seed = 'test seed phrase for migration validation only do not use with real funds';
const tx = wt.transfer({
  recipient: '3LkWnGsqMKem4WPr4N5JKgVGsGqWd6eFHxo', // fake address for testing
  amount: 100000000,
  chainId: 'L',
}, seed);
console.log('Transaction built successfully:');
console.log('Chain ID:', tx.chainId);
console.log('Type:', tx.type);
console.log('Sender public key present:', !!tx.senderPublicKey);
console.log('Proofs present:', tx.proofs && tx.proofs.length > 0);
"
```

---

### Step 16: Commit and Push

```bash
git add .
git commit -m "feat: complete migration of waves-transactions — update all 5 @waves deps

- Updated all 5 @waves/* deps to @decentralchain/*:
  - @waves/ts-lib-crypto → @decentralchain/ts-lib-crypto
  - @waves/ts-types → @decentralchain/ts-types
  - @waves/node-api-js → @decentralchain/node-api-js
  - @waves/protobuf-serialization → @decentralchain/protobuf-serialization
  - @waves/marshall → @decentralchain/marshall (if applicable)
- Updated chain ID from 'W' (87) to 'L' (76) for DCC mainnet
- Replaced all Waves node URLs with DCC node URLs
- Updated native asset from 'WAVES' to 'DCC'
- Updated all source, test, and documentation files
- Rewrote README with DCC examples and chain ID table
- All tests pass
- grep -rni waves returns zero results"

git push origin master
```

---

### Step 17: Notify Downstream Consumers

This package is consumed by:

1. **DCC-16** (`@decentralchain/signature-adapter`) — CRITICAL — notify that person
2. **DCC-17** (bundled file rebuild) — notify that person
3. **dcc-react** (direct dependency) — notify the team

---

### Step 18: Write Your Migration Summary

```
Migration Summary — waves-transactions

Fork existed: yes (Decentral-America/waves-transactions)
Fork cleanliness at start: [percentage]
Files changed: [list count]
@waves/* imports updated: [number of files]
Dependency replacements:
  - @waves/ts-lib-crypto → @decentralchain/ts-lib-crypto
  - @waves/ts-types → @decentralchain/ts-types
  - @waves/node-api-js → @decentralchain/node-api-js
  - @waves/protobuf-serialization → @decentralchain/protobuf-serialization
  - @waves/marshall → @decentralchain/marshall
Chain ID: 'W' → 'L' (mainnet)
Node URLs updated: [list old → new]
Native asset: WAVES → DCC
Tests: [pass/fail] ([number] tests)
Build: [pass/fail]
Integration test: [pass/fail — tx built with chain ID 'L']

Remaining concerns: [any issues, especially around signing compatibility]
```

---

## Acceptance Criteria

- [ ] ALL 5 upstream dependencies completed: DCC-2, DCC-4, DCC-8, DCC-11, DCC-12
- [ ] Existing fork at `Decentral-America/waves-transactions` audited and cleaned
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results (except package name if intentionally kept)
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] All 5 `@waves/*` imports replaced with `@decentralchain/*` across all source files
- [ ] Chain ID defaults updated to 'L' (76) for DCC mainnet
- [ ] All Waves node URLs replaced with DCC node URLs (confirmed by team)
- [ ] Native asset references updated from 'WAVES' to 'DCC'
- [ ] README rewritten with DCC examples, chain ID table, and dependency list
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] Transaction can be built and signed with chain ID 'L'
- [ ] DCC-16 and DCC-17 owners notified
- [ ] Team lead notified for review

---

## AI Prompt for Assistance

```
I am completing the migration of @decentralchain/waves-transactions (forked
from @waves/waves-transactions). A fork exists at Decentral-America/waves-transactions.

This package has 5 @waves/* dependencies that must ALL be replaced:
1. @waves/ts-lib-crypto → @decentralchain/ts-lib-crypto
2. @waves/ts-types → @decentralchain/ts-types
3. @waves/node-api-js → @decentralchain/node-api-js
4. @waves/protobuf-serialization → @decentralchain/protobuf-serialization
5. @waves/marshall → @decentralchain/marshall

CRITICAL changes:
- Chain ID: 'W' (87) → 'L' (76) for DCC mainnet
- Node URLs: nodes.wavesnodes.com → nodes.decentralchain.io (CONFIRM)
- Native asset: 'WAVES' → 'DCC'
- All imports across many files
- Test suite chain IDs and fixtures

This is on the CRITICAL PATH — blocks signature-adapter (Phase 4) and
bundled file (Phase 5).

The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**4–8 hours** — High complexity. The largest migration task in Phase 3. Many source files, extensive test suite, 5 dependency replacements, and critical integration testing. This is on the critical path.

---

## Questions?

Reach out to the team lead. Key decisions:

1. **Package name:** Keep `@decentralchain/waves-transactions` or rename to `@decentralchain/transactions`?
2. **DCC node URLs:** Mainnet and testnet URLs must be confirmed before starting
3. **Test signing:** Can we test signing against a DCC testnet node?
4. **Regression risk:** This package touches everything — should we do a staged rollout?
