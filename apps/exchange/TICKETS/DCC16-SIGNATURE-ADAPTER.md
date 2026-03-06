# Migrate Signature Adapter Library to DecentralChain (Full Dependency Update)

## Assigned to: _Unassigned_

**Priority:** Critical  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`, `critical-path`, `security`  
**Sprint:** Current  
**Story Points:** 8

---

## Summary

Complete the migration of `@decentralchain/signature-adapter` by updating **all 6 internal `@waves/*` dependencies** to their `@decentralchain/*` equivalents, removing every remaining Waves reference, and ensuring all signing adapters (Seed, Ledger, Keeper, WavesAuth, Private Key) work correctly against DecentralChain. This is the **"big one"** — the package with the most dependencies, the most critical security surface, and the highest complexity in the entire migration.

---

## Background

### What is this library?

`signature-adapter` is a **unified signing abstraction layer** that allows the wallet to request transaction signatures from multiple sources through a single API:

| Adapter               | Source                                      | How It Signs                    |
| --------------------- | ------------------------------------------- | ------------------------------- |
| **SeedAdapter**       | 12-word seed phrase stored in wallet        | JS library signs in memory      |
| **LedgerAdapter**     | Ledger Nano S/X hardware wallet             | Device signs via USB/Bluetooth  |
| **KeeperAdapter**     | Browser extension (Waves Keeper/DCC Keeper) | Extension signs via postMessage |
| **PrivateKeyAdapter** | Raw private key                             | JS library signs in memory      |
| **WavesAuthAdapter**  | External authentication                     | External service signs          |

Each adapter implements the same interface:

```typescript
interface ISignatureAdapter {
  getPublicKey(): Promise<string>;
  getAddress(): Promise<string>;
  sign(bytes: Uint8Array): Promise<string>;
  signTransaction(tx: ITransaction): Promise<ITransaction>;
  getSeed(): Promise<string>; // Only SeedAdapter
}
```

### Where did it come from?

Originally from `wavesplatform/waves-signature-adapter`. A fork exists at `Decentral-America/waves-signature-adapter`.

> **⚠ NAME MISMATCH:** GitHub repo is `waves-signature-adapter`, but the npm package is `@decentralchain/signature-adapter` (no `waves-` prefix in npm).

### Why does this matter?

**This is the security heart of the wallet.** Every transaction signature flows through this library. If it's broken:

- Users could sign transactions for the wrong chain (sending DCC funds to a Waves address)
- Ledger signing could fail silently
- Private key handling could be compromised
- The wallet becomes completely non-functional for any write operation

### Why is this VERY HIGH complexity?

1. **6 @waves/\*dependencies** — the most of ANY package in the entire migration
2. **Security-critical** — handles private keys, seeds, signing operations
3. **Multiple adapters** — each adapter type has different integration points
4. **Ledger integration** — talks to hardware, APDU protocols, firmware compat
5. **Keeper/extension integration** — browser postMessage protocol with external software
6. **Chain ID embedded in signing** — wrong chain ID = invalid signatures = lost funds
7. **On the critical path** — this is Phase 4, blocks nothing but IS the final SDK piece

### Blocking Dependencies — ALL 6 MUST BE DONE

| Dependency                           | Ticket | Phase | Status               |
| ------------------------------------ | ------ | ----- | -------------------- |
| `@waves/bignumber`                   | DCC-3  | 1     | ⚠️ Must be completed |
| `@waves/ts-types`                    | DCC-8  | 1     | ⚠️ Must be completed |
| `@waves/data-entities`               | DCC-9  | 2     | ⚠️ Must be completed |
| `@waves/ledger`                      | DCC-10 | 2     | ⚠️ Must be completed |
| `@waves/money-like-to-node`          | DCC-13 | 2     | ⚠️ Must be completed |
| `@decentralchain/waves-transactions` | DCC-15 | 3     | ⚠️ Must be completed |

---

## Current State of the Repo

| Field                         | Value                                                            |
| ----------------------------- | ---------------------------------------------------------------- |
| **npm package**               | `@decentralchain/signature-adapter` ^6.1.7                       |
| **Original GitHub repo**      | `wavesplatform/waves-signature-adapter`                          |
| **Fork in Decentral-America** | ✅ **Fork exists** — `Decentral-America/waves-signature-adapter` |
| **Language**                  | TypeScript                                                       |
| **License**                   | MIT (expected)                                                   |
| **`@waves/*` dependencies**   | **6** (see table above) — highest in the entire migration        |
| **Runtime dependencies**      | 6 @waves/\* + @ledgerhq/hw-transport + others                    |
| **Used by**                   | dcc-react (direct dependency — signing layer)                    |
| **Last published to npm**     | Needs research                                                   |

### Expected File Structure

```
waves-signature-adapter/
├── src/
│   ├── index.ts              # Main entry — exports all adapters
│   ├── SeedAdapter.ts        # ⚠️ Seed-based signing
│   ├── LedgerAdapter.ts      # ⚠️ Ledger hardware wallet signing
│   ├── KeeperAdapter.ts      # ⚠️ Browser extension signing
│   ├── PrivateKeyAdapter.ts  # ⚠️ Private key signing
│   ├── WavesAuthAdapter.ts   # ⚠️ External auth — NAME HAS "Waves"
│   ├── types.ts              # ⚠️ Adapter interface definitions
│   ├── config.ts             # ⚠️ Chain IDs, node URLs
│   ├── utils.ts              # Utility functions
│   └── prepareTx.ts          # ⚠️ Transaction preparation (money-like-to-node)
├── dist/
│   └── ...
├── test/
│   └── ...
├── package.json              # ⚠️ Contains @waves/* deps
├── tsconfig.json
├── README.md                 # ⚠️ References Waves
└── ...
```

---

## Known Waves Contamination

### 1. package.json — 6 @waves Dependencies

```json
// BEFORE (expected):
{
  "name": "@decentralchain/signature-adapter",
  "dependencies": {
    "@waves/bignumber": "...",
    "@waves/ts-types": "...",
    "@waves/data-entities": "...",
    "@waves/ledger": "...",
    "@waves/money-like-to-node": "...",
    "@decentralchain/waves-transactions": "..."
  }
}

// AFTER:
{
  "name": "@decentralchain/signature-adapter",
  "dependencies": {
    "@decentralchain/bignumber": "...",
    "@decentralchain/ts-types": "...",
    "@decentralchain/data-entities": "...",
    "@decentralchain/ledger": "...",
    "@decentralchain/money-like-to-node": "...",
    "@decentralchain/waves-transactions": "..."
  }
}
```

### 2. Class Names — WavesAuthAdapter

```typescript
// BEFORE:
export class WavesAuthAdapter implements ISignatureAdapter { ... }

// AFTER:
export class DCCAuthAdapter implements ISignatureAdapter { ... }
// OR: export class AuthAdapter implements ISignatureAdapter { ... }
```

### 3. File Names

```
// BEFORE:
src/WavesAuthAdapter.ts
// AFTER:
src/DCCAuthAdapter.ts (or AuthAdapter.ts)
```

### 4. Import Statements — MANY Files

Every source file importing from `@waves/*`:

```typescript
// BEFORE:
import { BigNumber } from '@waves/bignumber';
import { TRANSACTION_TYPE } from '@waves/ts-types';
import { Asset, Money } from '@waves/data-entities';
import { WavesLedger } from '@waves/ledger';
import { moneyLikeToNode } from '@waves/money-like-to-node';

// AFTER:
import { BigNumber } from '@decentralchain/bignumber';
import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { Asset, Money } from '@decentralchain/data-entities';
import { DCCLedger } from '@decentralchain/ledger';
import { moneyLikeToNode } from '@decentralchain/money-like-to-node';
```

> **Note:** `WavesLedger` class was renamed to `DCCLedger` in DCC-10.

### 5. Chain ID Constants (CRITICAL — SECURITY)

```typescript
// BEFORE:
const DEFAULT_CHAIN_ID = 'W'; // 87
const MAINNET_CHAIN_ID = 'W';

// AFTER:
const DEFAULT_CHAIN_ID = 'L'; // 76
const MAINNET_CHAIN_ID = 'L';
```

**⚠ SECURITY WARNING:** If the chain ID is wrong, transactions signed by this adapter will be:

- Rejected by DCC nodes (best case)
- Valid on the wrong chain (worst case — fund loss)

### 6. Default Node URLs

```typescript
// BEFORE:
const DEFAULT_NODE = 'https://nodes.wavesnodes.com';
// AFTER:
const DEFAULT_NODE = 'https://nodes.decentralchain.io'; // CONFIRM
```

### 7. Keeper/Extension Protocol

The KeeperAdapter communicates with a browser extension via `window.postMessage()`. The protocol may include:

```typescript
// LOOK FOR:
window.WavesKeeper;
window.Waves;
postMessage({ type: 'wavesKeeper_...' });
```

These must be updated to match the DCC Keeper extension's protocol (if it exists). If DCC uses the same Keeper extension, the protocol names may need to stay the same.

### 8. WavesLedger Class Reference

```typescript
// BEFORE:
import { WavesLedger } from '@waves/ledger';
const ledger = new WavesLedger(transport);

// AFTER:
import { DCCLedger } from '@decentralchain/ledger';
const ledger = new DCCLedger(transport);
```

### 9. Source Code Comments and JSDoc

Extensive documentation with Waves references throughout.

### 10. README.md

Detailed usage examples with Waves-specific code.

### 11. Test Suite

Comprehensive tests with Waves chain IDs, addresses, and fixtures.

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed
- **Node.js** v16+ installed
- **npm** installed
- A **GitHub account**
- A **code editor** (VS Code recommended)
- **ALL 6 dependencies MUST be completed first:**
  - DCC-3 (bignumber)
  - DCC-8 (ts-types)
  - DCC-9 (data-entities)
  - DCC-10 (ledger)
  - DCC-13 (money-like-to-node)
  - DCC-15 (waves-transactions)
- **DCC node URLs** confirmed by team lead
- **DCC Keeper extension** protocol confirmed (if applicable)

---

### Step 1: Verify ALL 6 Dependencies are Ready

```bash
echo "=== Checking all 6 dependencies ==="

npm view @decentralchain/bignumber version
npm view @decentralchain/ts-types version
npm view @decentralchain/data-entities version
npm view @decentralchain/ledger version
npm view @decentralchain/money-like-to-node version
npm view @decentralchain/waves-transactions version
```

**⚠ ALL SIX must be available.** This is Phase 4 — every prior phase must be done.

---

### Step 2: Clone the Existing Fork

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration

# Clone the DA fork
git clone https://github.com/Decentral-America/waves-signature-adapter.git dcc-signature-adapter
cd dcc-signature-adapter
```

---

### Step 3: Audit the Existing Fork

```bash
echo "=== Audit existing DA fork ==="

echo "--- package.json ---"
cat package.json | grep -E '"name"|"@waves"'

echo "--- @waves references in source ---"
grep -rn "@waves" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist | wc -l

echo "--- WavesLedger references ---"
grep -rni "WavesLedger" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- WavesAuth references ---"
grep -rni "WavesAuth" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- WavesKeeper references ---"
grep -rni "WavesKeeper\|wavesKeeper\|window.Waves" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- wavesplatform/wavesnodes URLs ---"
grep -rni "wavesplatform\|wavesnodes" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Chain ID 'W' references ---"
grep -rn "'W'" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Full waves word count ---"
grep -rnic "waves" src/ | awk -F: '{s+=$NF} END {print s}'
```

---

### Step 4: Run the Comprehensive Audit

```bash
echo "=== COMPREHENSIVE AUDIT ==="

echo "--- 1. All @waves imports ---"
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 2. Class/variable name Waves references ---"
grep -rni "Waves[A-Z]" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 3. window.Waves or window.WavesKeeper ---"
grep -rn "window\.\(Waves\|wavesKeeper\)" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 4. postMessage protocol ---"
grep -rn "postMessage\|wavesKeeper_" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 5. Chain IDs ---"
grep -rn "'W'" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 6. URLs ---"
grep -rni "wavesnodes\|wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 7. All 'waves' in all files ---"
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- 8. Source file count ---"
find src/ -name "*.ts" | wc -l
```

---

### Step 5: Fix package.json Dependencies

```bash
# Replace all 6 @waves/* dependencies
sed -i 's/@waves\/bignumber/@decentralchain\/bignumber/g' package.json
sed -i 's/@waves\/ts-types/@decentralchain\/ts-types/g' package.json
sed -i 's/@waves\/data-entities/@decentralchain\/data-entities/g' package.json
sed -i 's/@waves\/ledger/@decentralchain\/ledger/g' package.json
sed -i 's/@waves\/money-like-to-node/@decentralchain\/money-like-to-node/g' package.json

# Verify
grep "@waves" package.json
# Must return ZERO
```

---

### Step 6: Fix All Import Statements

```bash
# Systematic replacement across all source files
find src/ -name "*.ts" -exec sed -i 's/@waves\/bignumber/@decentralchain\/bignumber/g' {} +
find src/ -name "*.ts" -exec sed -i 's/@waves\/ts-types/@decentralchain\/ts-types/g' {} +
find src/ -name "*.ts" -exec sed -i 's/@waves\/data-entities/@decentralchain\/data-entities/g' {} +
find src/ -name "*.ts" -exec sed -i 's/@waves\/ledger/@decentralchain\/ledger/g' {} +
find src/ -name "*.ts" -exec sed -i 's/@waves\/money-like-to-node/@decentralchain\/money-like-to-node/g' {} +

# Verify
grep -rn "@waves" src/ --include="*.ts"
# Must return ZERO
```

---

### Step 7: Rename WavesAuthAdapter

```bash
# Rename the file
mv src/WavesAuthAdapter.ts src/DCCAuthAdapter.ts 2>/dev/null || echo "File name may differ"

# Inside the file:
# BEFORE: export class WavesAuthAdapter
# AFTER: export class DCCAuthAdapter

# Update all references
find src/ -name "*.ts" -exec sed -i 's/WavesAuthAdapter/DCCAuthAdapter/g' {} +
```

> **⚠ If DCC doesn't have an auth adapter, this class can be removed entirely or renamed generically.**

---

### Step 8: Update WavesLedger to DCCLedger References

```bash
# DCC-10 renamed WavesLedger to DCCLedger
find src/ -name "*.ts" -exec sed -i 's/WavesLedger/DCCLedger/g' {} +
```

---

### Step 9: Update Keeper/Extension Protocol

Investigate the Keeper adapter:

```bash
grep -rn "WavesKeeper\|wavesKeeper\|window\.Waves" src/ --include="*.ts"
```

**Decision required from team lead:**

- If DCC has its own browser extension: Update protocol names (`wavesKeeper_*` → `dccKeeper_*`)
- If DCC uses the same Keeper extension: Keep protocol names as-is
- If there's no DCC Keeper extension yet: Keep the code but update comments to note this

---

### Step 10: Fix Chain ID Constants (SECURITY CRITICAL)

```bash
grep -rn "'W'" src/ --include="*.ts"
```

Replace every chain ID default:

```typescript
// BEFORE:
const DEFAULT_CHAIN_ID = 'W';
// AFTER:
const DEFAULT_CHAIN_ID = 'L';
```

**⚠ TRIPLE-CHECK this step.** Wrong chain IDs in the signature adapter are the highest-risk bug in the entire migration.

---

### Step 11: Fix Node URLs

```bash
grep -rni "wavesnodes\|wavesplatform" src/ --include="*.ts"
```

Replace all URLs with confirmed DCC URLs.

---

### Step 12: Fix Comments, JSDoc, and README

Clean ALL remaining "waves" mentions from comments and documentation.

Write a comprehensive README:

````markdown
# @decentralchain/signature-adapter

Unified signing abstraction layer for the DecentralChain wallet.

Provides a common interface for signing transactions using different methods:

- **SeedAdapter** — Sign with a 12-word seed phrase
- **LedgerAdapter** — Sign on a Ledger Nano S/X hardware wallet
- **KeeperAdapter** — Sign via a browser extension
- **PrivateKeyAdapter** — Sign with a raw private key
- **DCCAuthAdapter** — Sign via external authentication

## Installation

```bash
npm install @decentralchain/signature-adapter
```
````

## Usage

```typescript
import { SeedAdapter } from '@decentralchain/signature-adapter';

const adapter = new SeedAdapter('your twelve word seed phrase...', 'L');

// Get public key and address
const pubKey = await adapter.getPublicKey();
const address = await adapter.getAddress();

// Sign transaction bytes
const signature = await adapter.sign(txBytes);
```

## Chain IDs

| Network | Byte | Char |
| ------- | ---- | ---- |
| Mainnet | 76   | L    |
| Testnet | 84   | T    |

## Dependencies

- `@decentralchain/bignumber`
- `@decentralchain/ts-types`
- `@decentralchain/data-entities`
- `@decentralchain/ledger`
- `@decentralchain/money-like-to-node`
- `@decentralchain/waves-transactions`

## License

MIT

````

---

### Step 13: Fix Test Suite

```bash
# Count test contamination
grep -rnic "waves" test/ | awk -F: '{s+=$NF} END {print s}'

# Fix imports
find test/ -name "*.ts" -exec sed -i 's/@waves/@decentralchain/g' {} +

# Fix class names
find test/ -name "*.ts" -exec sed -i 's/WavesAuthAdapter/DCCAuthAdapter/g' {} +
find test/ -name "*.ts" -exec sed -i 's/WavesLedger/DCCLedger/g' {} +

# Fix chain IDs (be careful — review each change)
grep -rn "'W'" test/ --include="*.ts"
````

---

### Step 14: Run the Final Audit

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist

echo "Total remaining:"
grep -rnic "waves" src/ test/ | awk -F: '{s+=$NF} END {print s}'
```

**Target: ZERO.**

---

### Step 15: Rebuild and Test

```bash
rm -rf node_modules dist
npm install
npm run build
npm test
```

---

### Step 16: Integration Test — Sign a Transaction

```bash
node -e "
const { SeedAdapter } = require('./dist');
const adapter = new SeedAdapter('test seed phrase for migration validation only', 'L');

adapter.getAddress().then(addr => {
  console.log('Address (chain L):', addr);
  console.log('Starts with 3L:', addr.startsWith('3L'));
}).catch(console.error);

adapter.getPublicKey().then(pk => {
  console.log('Public key:', pk);
}).catch(console.error);
"
```

Verify:

- [ ] Address starts with a valid DCC prefix (chain ID 'L')
- [ ] Public key is a valid base58 string
- [ ] No errors thrown

---

### Step 17: Commit and Push

```bash
git add .
git commit -m "feat: complete migration of signature-adapter — update all 6 @waves deps

- Updated all 6 @waves/* deps to @decentralchain/*
- Renamed WavesAuthAdapter → DCCAuthAdapter
- Updated WavesLedger references → DCCLedger
- Updated chain ID from 'W' (87) to 'L' (76) for DCC mainnet
- Updated all node URLs to DCC endpoints
- Updated Keeper protocol references (if applicable)
- Rewrote README with all adapter types and chain ID table
- All tests pass
- Integration test: address generation with chain ID 'L' verified
- grep -rni waves returns zero results"

git push origin master
```

---

### Step 18: Security Review

**Before this package is used in production, request a security review:**

1. Verify chain ID is correctly embedded in all signed transactions
2. Verify Ledger adapter communicates correctly with hardware
3. Verify seed/private key handling has no regressions
4. Verify address generation produces valid DCC addresses
5. Test on DCC testnet with real transactions

---

### Step 19: Write Your Migration Summary

```
Migration Summary — signature-adapter

Fork existed: yes (Decentral-America/waves-signature-adapter)
Fork cleanliness at start: [percentage]
Files changed: [list count]
@waves/* imports updated: [number of files]
Dependency replacements:
  - @waves/bignumber → @decentralchain/bignumber
  - @waves/ts-types → @decentralchain/ts-types
  - @waves/data-entities → @decentralchain/data-entities
  - @waves/ledger → @decentralchain/ledger
  - @waves/money-like-to-node → @decentralchain/money-like-to-node
  - @decentralchain/waves-transactions (already @decentralchain)
Class renames:
  - WavesAuthAdapter → DCCAuthAdapter
  - WavesLedger → DCCLedger
Chain ID: 'W' → 'L' (mainnet)
Node URLs: [old → new]
Keeper protocol: [updated/unchanged/N/A]
Tests: [pass/fail] ([number] tests)
Build: [pass/fail]
Integration test: [address with chain L verified]
Security review: [requested/completed]

Remaining concerns: [Keeper compat, Ledger firmware, security review]
```

---

## Acceptance Criteria

- [ ] ALL 6 upstream dependencies completed: DCC-3, DCC-8, DCC-9, DCC-10, DCC-13, DCC-15
- [ ] Existing fork at `Decentral-America/waves-signature-adapter` audited and fully cleaned
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] All 6 `@waves/*` imports replaced with `@decentralchain/*`
- [ ] `WavesAuthAdapter` renamed to `DCCAuthAdapter`
- [ ] `WavesLedger` references updated to `DCCLedger`
- [ ] Chain ID defaults updated to 'L' (76) for DCC mainnet — **triple-checked**
- [ ] All node URLs replaced with DCC URLs
- [ ] Keeper protocol references updated (if applicable)
- [ ] README rewritten with all adapter types and chain ID table
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] Integration test: address generated with chain ID 'L' is valid
- [ ] Security review requested
- [ ] Team lead notified for review

---

## AI Prompt for Assistance

```
I am completing the migration of @decentralchain/signature-adapter (forked
from wavesplatform/waves-signature-adapter).

This is the unified signing layer with 6 @waves/* dependencies — the most
of any package in the migration:
1. @waves/bignumber → @decentralchain/bignumber
2. @waves/ts-types → @decentralchain/ts-types
3. @waves/data-entities → @decentralchain/data-entities
4. @waves/ledger → @decentralchain/ledger
5. @waves/money-like-to-node → @decentralchain/money-like-to-node
6. @decentralchain/waves-transactions (already @decentralchain)

Class renames needed:
- WavesAuthAdapter → DCCAuthAdapter
- WavesLedger → DCCLedger (done in DCC-10)

SECURITY CRITICAL:
- Chain ID: 'W' (87) → 'L' (76) for DCC mainnet
- Wrong chain ID = invalid signatures = potential fund loss

Also check Keeper extension protocol (window.WavesKeeper, wavesKeeper_*).

The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**5–10 hours** — Very high complexity. 6 dependency replacements, class renames, security-critical chain ID changes, multiple adapter types to audit, and extensive integration testing required. This is the largest single migration task.

---

## Questions?

Reach out to the team lead. Key decisions:

1. **DCC Keeper extension:** Does it exist? What protocol names does it use?
2. **WavesAuthAdapter:** Should it be renamed to `DCCAuthAdapter` or removed entirely?
3. **Security review:** Who should review the chain ID changes before production use?
4. **Address format:** What prefix do DCC addresses start with? (Depends on chain ID 'L')
5. **Ledger firmware:** Is the Ledger app the same as Waves or has DCC deployed its own?
