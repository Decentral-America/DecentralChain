# Migrate Ledger Integration Library to DecentralChain

## Assigned to: _Unassigned_

**Priority:** High  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`, `hardware-wallet`  
**Sprint:** Current  
**Story Points:** 5

---

## Summary

Migrate the `@waves/ledger` npm package from the Waves blockchain ecosystem into a clean, standalone DecentralChain library published as `@decentralchain/ledger` with **zero** Waves references remaining. This package provides the JavaScript bridge between the wallet application and Ledger hardware wallets. It has a Phase 1 dependency on `@waves/ts-lib-crypto` (DCC-4).

---

## Background

### What is this library?

`@waves/ledger` is a **JavaScript interface for communicating with Ledger Nano S/X hardware wallets**. It:

- Sends APDU commands to the Ledger device via USB/Bluetooth
- Requests the device to **derive public keys** from a HD wallet path
- Requests the device to **sign transactions** with the private key held on the device
- Handles the **serialization format** that the Ledger Waves app expects
- Manages device connection lifecycle (connect, disconnect, error handling)

This is the **JavaScript side** of the Ledger integration. There is also a **C/Assembly Ledger firmware app** (`ledger-app-waves`) that runs on the actual hardware device — that is a separate project entirely and is NOT part of this ticket.

### Where did it come from?

This package was created by the Waves team. The source code lives at `wavesplatform/waves-ledger-js` (not `ledger` or `ledger-app-waves`).

> **⚠ CRITICAL NAME CONFUSION:**
>
> - `wavesplatform/waves-ledger-js` = JavaScript SDK (THIS ticket) — npm: `@waves/ledger`
> - `wavesplatform/ledger-app-waves` = C firmware for Ledger device (NOT this ticket)
>
> Make absolutely sure you are working on `waves-ledger-js`.

### Why does this matter?

Ledger hardware wallet support is a premium feature of the DCC wallet. Users who store their DCC assets on Ledger devices rely on this library to:

1. View their DCC address on the Ledger screen
2. Sign transactions securely on the device
3. Interact with the DEX from hardware wallets

If this library is broken, **all Ledger users are locked out of their funds** in the DCC wallet (they can still use the Ledger with other tools, but not our wallet).

### Why is this HIGH complexity?

1. **Hardware dependency** — Testing requires an actual Ledger Nano S or X device
2. **Crypto-sensitive** — Must not corrupt the signing flow
3. **APDU protocol** — The binary protocol between JS and Ledger firmware must stay compatible
4. **Chain ID in signing** — Transactions signed on the Ledger include the chain ID byte; this must be 'L' (76) for DCC mainnet

### Blocking Dependencies

| Dependency              | Status                     | Notes                                                    |
| ----------------------- | -------------------------- | -------------------------------------------------------- |
| **DCC-4 ts-lib-crypto** | ⚠️ Must be completed first | Ledger uses ts-lib-crypto for key derivation and hashing |

---

## Current State of the Repo

| Field                         | Value                                                             |
| ----------------------------- | ----------------------------------------------------------------- |
| **npm package**               | `@waves/ledger` ^3.6.1                                            |
| **Current GitHub repo**       | `wavesplatform/waves-ledger-js`                                   |
| **Fork in Decentral-America** | ❌ **Needs to be forked**                                         |
| **Language**                  | TypeScript                                                        |
| **License**                   | MIT (expected)                                                    |
| **`@waves/*` dependencies**   | `@waves/ts-lib-crypto` (1 dep)                                    |
| **Runtime dependencies**      | `@waves/ts-lib-crypto`, `@ledgerhq/hw-transport`, possibly others |
| **Used by**                   | `@decentralchain/signature-adapter` (DCC-16, Phase 4)             |
| **Last published to npm**     | Needs research                                                    |

### Expected File Structure

```
waves-ledger-js/
├── src/
│   ├── index.ts              # Main entry
│   ├── Waves.ts              # ⚠️ Main Ledger interface — likely named after Waves
│   ├── WavesLedger.ts        # ⚠️ Class that communicates with the device
│   ├── apdu.ts               # APDU command builder
│   ├── constants.ts          # ⚠️ Chain IDs, transaction types, path constants
│   └── utils.ts              # Utilities
├── dist/
│   └── ...
├── test/
│   └── ...
├── package.json              # ⚠️ Contains @waves scope + @waves/ts-lib-crypto dep
├── tsconfig.json
├── README.md                 # ⚠️ References Waves
└── ...
```

---

## Known Waves Contamination

### 1. package.json

- `name` is `@waves/ledger` — must be `@decentralchain/ledger`
- `dependencies` includes `@waves/ts-lib-crypto` — must be `@decentralchain/ts-lib-crypto`
- `repository.url` — must point to `Decentral-America/ledger`

### 2. Class Names

The main class is likely named `WavesLedger`:

```typescript
// BEFORE:
export class WavesLedger { ... }

// AFTER:
export class DCCLedger { ... }
// OR: export class Ledger { ... }
```

> **⚠ Decision Required:** What to rename `WavesLedger` to? Options:
>
> 1. `DCCLedger` — clearly branded
> 2. `Ledger` — generic, clean
> 3. `DecentralChainLedger` — full name but verbose
>
> Recommendation: `DCCLedger` with a re-export alias `Ledger` for convenience.

### 3. File Names

Source files may be named `Waves.ts` or `WavesLedger.ts`:

```
// BEFORE:
src/WavesLedger.ts
// AFTER:
src/DCCLedger.ts (or Ledger.ts)
```

### 4. Import Statements

```typescript
// BEFORE:
import { base58Encode, publicKey } from '@waves/ts-lib-crypto';

// AFTER:
import { base58Encode, publicKey } from '@decentralchain/ts-lib-crypto';
```

### 5. Chain ID Constants

**CRITICAL:** The Ledger signing flow includes the chain ID byte:

```typescript
// BEFORE:
const CHAIN_ID = 'W'.charCodeAt(0); // 87
const DEFAULT_CHAIN_ID = 87;

// AFTER:
const CHAIN_ID = 'L'.charCodeAt(0); // 76
const DEFAULT_CHAIN_ID = 76;
```

### 6. HD Wallet Derivation Path

Waves uses BIP-44 coin type `5741564` (which is `0x57415645` = ASCII for "WAVE"):

```typescript
const WAVES_PATH = "44'/5741564'/0'/0'/0'";
```

**⚠ Decision Required:** Does DecentralChain use the same derivation path or a different coin type? If the Ledger firmware app is unchanged, the path must remain the same. If a new firmware app is deployed, a new coin type may be registered.

For now, **keep the same path** unless explicitly told otherwise — changing the derivation path means existing Ledger users' addresses would change.

### 7. APDU Commands

The APDU commands sent to the Ledger device may include app identifiers:

```typescript
const CLA = 0x57; // 'W' — Waves app identifier
```

**⚠ WARNING:** If the Ledger firmware app identifier is `0x57` ('W'), and the firmware hasn't been changed, then this value **must stay the same** — it identifies which app on the Ledger to talk to. Changing this would break communication.

**Rule:** APDU CLA bytes and INS codes must match the firmware. Only change these if DecentralChain has its own Ledger firmware app with different identifiers.

### 8. README.md

- Install instructions reference `@waves/ledger`
- May contain Waves badges, links, branding
- Usage examples reference WavesLedger class

### 9. Source Code Comments

```typescript
// Look for:
/** Waves Ledger integration */
// Must become:
/** DecentralChain Ledger integration */
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
- **DCC-4 (ts-lib-crypto) MUST be completed and published first**
- **Ledger Nano S or X device** (for integration testing — can be deferred)

---

### Step 1: Verify DCC-4 (ts-lib-crypto) is Ready

```bash
npm view @decentralchain/ts-lib-crypto version

# If not published, check the repo
curl -s -o /dev/null -w "%{http_code}" https://github.com/Decentral-America/ts-lib-crypto
```

**⚠ DO NOT proceed if ts-lib-crypto is not available.**

---

### Step 2: Create Your Workspace

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration
```

---

### Step 3: Clone the Original Waves Library

```bash
# IMPORTANT: The repo is waves-ledger-js, NOT ledger or ledger-app-waves
git clone https://github.com/wavesplatform/waves-ledger-js.git waves-ledger-js-original
```

---

### Step 4: Create Your Working Copy

```bash
cp -r waves-ledger-js-original dcc-ledger-migrated
cd dcc-ledger-migrated
rm -rf .git
git init
```

---

### Step 5: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `ledger`
   - **Description:** `JavaScript interface for Ledger hardware wallet integration with DecentralChain`
   - **Visibility:** Public
   - **Initialize:** Do NOT add README, .gitignore, or license
3. Click **Create repository**
4. Connect it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ledger.git
```

---

### Step 6: Install Dependencies and Verify It Builds

```bash
npm install
npm run build
npm test || echo "Hardware tests may need a device"
```

---

### Step 7: Run the Waves Audit

```bash
echo "=== Full Waves Audit ==="

echo "--- @waves references ---"
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- WavesLedger class references ---"
grep -rni "WavesLedger" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- waves word references ---"
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- wavesplatform references ---"
grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Chain ID 'W' references ---"
grep -rn "'W'" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Byte 87 references ---"
grep -rn "87" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- CLA byte 0x57 references ---"
grep -rn "0x57" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist

echo "--- Derivation path references ---"
grep -rn "5741564" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist
```

**Save this output.** Categorize each result as:

- **Must change** — Waves branding, chain IDs, imports
- **Must NOT change** — APDU CLA bytes, derivation paths (unless firmware changed)

---

### Step 8: Fix Every Waves Reference

#### 8a. Fix package.json

```json
// BEFORE:
{
  "name": "@waves/ledger",
  "dependencies": {
    "@waves/ts-lib-crypto": "^1.4.3"
  }
}

// AFTER:
{
  "name": "@decentralchain/ledger",
  "dependencies": {
    "@decentralchain/ts-lib-crypto": "^1.4.3"
  }
}
```

#### 8b. Rename Classes

```typescript
// BEFORE:
export class WavesLedger { ... }

// AFTER:
export class DCCLedger { ... }

// Optional backward compat:
export { DCCLedger as Ledger };
```

#### 8c. Rename Source Files (if named after Waves)

```bash
# If files are named WavesLedger.ts, Waves.ts, etc.
mv src/WavesLedger.ts src/DCCLedger.ts
# Update all internal imports accordingly
```

#### 8d. Fix Import Statements

```typescript
// BEFORE:
import { base58Encode } from '@waves/ts-lib-crypto';

// AFTER:
import { base58Encode } from '@decentralchain/ts-lib-crypto';
```

#### 8e. Fix Chain ID Constants

```typescript
// BEFORE:
const CHAIN_ID = 'W'.charCodeAt(0); // 87

// AFTER:
const CHAIN_ID = 'L'.charCodeAt(0); // 76
```

#### 8f. APDU CLA Byte — DO NOT CHANGE (unless instructed)

```typescript
// This may need to STAY as-is if the Ledger firmware app uses it:
const CLA = 0x57; // Identifies the app on the Ledger — matches firmware
```

**Only change APDU constants if DecentralChain has its own registered Ledger app.**

#### 8g. HD Derivation Path — DO NOT CHANGE (unless instructed)

```typescript
// Keep this as-is to preserve address compatibility:
const PATH = "44'/5741564'/0'/0'/0'";
```

**Changing this would mean existing Ledger users get different addresses.**

#### 8h. Fix README.md

````markdown
# @decentralchain/ledger

JavaScript interface for Ledger hardware wallet integration with DecentralChain.

Communicates with Ledger Nano S/X devices to derive public keys and sign transactions securely on the hardware device.

## Installation

```bash
npm install @decentralchain/ledger
```
````

## Usage

```typescript
import { DCCLedger } from '@decentralchain/ledger';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';

const transport = await TransportWebUSB.create();
const ledger = new DCCLedger(transport);

// Get user's public key from the Ledger device
const userData = await ledger.getUserDataById(0);
console.log(userData.publicKey);

// Sign a transaction
const signature = await ledger.signTransaction(userData.id, txBytes);
```

## Requirements

- Ledger Nano S or Ledger Nano X with the Waves/DCC app installed
- Chrome/Edge browser with WebUSB support, or Node.js with USB library

## License

MIT

````

#### 8i. Fix Comments and JSDoc

```typescript
// BEFORE:
/** Creates a connection to the Waves Ledger app */
// AFTER:
/** Creates a connection to the DecentralChain Ledger app */
````

---

### Step 9: Run the Audit Again

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist
```

**This must return ZERO results** (except for intentional APDU/path constants that document the Waves firmware compatibility — those should have comments explaining why they remain).

---

### Step 10: Rebuild and Test

```bash
rm -rf node_modules dist
npm install
npm run build
npm test || echo "Hardware tests need a device"
```

**Unit tests** (mocked transport) should pass without hardware.  
**Integration tests** (real device) should be deferred to a dedicated testing session.

---

### Step 11: Commit and Push

```bash
git add .
git commit -m "feat: clean migration of ledger JS library — remove all Waves references

- Renamed package from @waves/ledger to @decentralchain/ledger
- Updated dependency @waves/ts-lib-crypto to @decentralchain/ts-lib-crypto
- Renamed WavesLedger class to DCCLedger
- Updated chain ID from 'W' (87) to 'L' (76) for DCC mainnet
- Preserved APDU CLA byte and HD derivation path for firmware compat
- Updated repository URLs to Decentral-America/ledger
- Rewrote README with DecentralChain branding
- All unit tests pass
- grep -rni waves returns zero results (excluding firmware compat docs)"

git push -u origin master
```

---

### Step 12: Hardware Testing Plan

Create a testing checklist for when a Ledger device is available:

```
Hardware Testing Checklist:

1. [ ] Install Waves app on Ledger Nano S/X
2. [ ] Connect via WebUSB in Chrome
3. [ ] Derive public key — verify correct DCC address format
4. [ ] Sign a Transfer transaction — verify signature is valid on DCC testnet
5. [ ] Sign a Data transaction — verify signature
6. [ ] Verify chain ID 'T' (84) for testnet / 'L' (76) for mainnet in signed bytes
7. [ ] Disconnect and reconnect — verify session recovery
8. [ ] Test error handling — remove device during signing
```

---

### Step 13: Notify Downstream Consumers

This package is consumed by:

1. **DCC-16** (`@decentralchain/signature-adapter`) — notify that person

---

### Step 14: Write Your Migration Summary

```
Migration Summary — ledger

Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
Class renames: WavesLedger → DCCLedger
@waves/ts-lib-crypto → @decentralchain/ts-lib-crypto: [number of files]
Chain ID: 'W' (87) → 'L' (76)
APDU CLA byte: [unchanged/changed]
HD derivation path: [unchanged/changed]
Unit tests: [pass/fail]
Hardware tests: [deferred/pass/fail]
Build: [pass/fail]
New repo: https://github.com/YOUR_USERNAME/ledger

Remaining concerns: [hardware testing, firmware compatibility]
```

---

## Acceptance Criteria

- [ ] DCC-4 (ts-lib-crypto) migration completed before starting this
- [ ] Source repo cloned from `wavesplatform/waves-ledger-js` (correct repo!)
- [ ] New repo exists with clean migration
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `package.json` name is `@decentralchain/ledger`
- [ ] `WavesLedger` class renamed to `DCCLedger`
- [ ] All `@waves/ts-lib-crypto` imports replaced with `@decentralchain/ts-lib-crypto`
- [ ] Chain ID defaults updated to 'L' (76) for DCC mainnet
- [ ] APDU CLA byte preserved (unless firmware changed)
- [ ] HD derivation path preserved (unless coin type changed)
- [ ] README references DecentralChain exclusively
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] Unit tests pass (mocked transport)
- [ ] Hardware testing plan documented
- [ ] DCC-16 owner notified
- [ ] Team lead notified for review

---

## AI Prompt for Assistance

```
I am migrating the npm package @waves/ledger from the Waves blockchain
ecosystem to @decentralchain/ledger.

This package provides JavaScript communication with Ledger Nano S/X hardware
wallets. It has 1 @waves/* dependency: @waves/ts-lib-crypto, which must be
replaced with @decentralchain/ts-lib-crypto.

CRITICAL considerations:
1. Chain ID must change from 'W' (87) to 'L' (76) for DCC mainnet
2. APDU CLA byte (0x57) must NOT change if firmware is unchanged
3. HD derivation path (44'/5741564'/0'/0'/0') must NOT change unless
   DecentralChain registered a new BIP-44 coin type
4. Class WavesLedger should be renamed to DCCLedger

The source repo is wavesplatform/waves-ledger-js (NOT ledger-app-waves).
The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**3–5 hours** — High complexity due to hardware wallet sensitivity, but the codebase is relatively small. Most time is spent on careful auditing and documenting what can vs. cannot be changed.

---

## Questions?

Reach out to the team lead. Key decisions:

1. **Class name:** `DCCLedger` vs `Ledger` vs `DecentralChainLedger`?
2. **APDU CLA byte:** Has DecentralChain registered its own Ledger app, or does it reuse the Waves firmware?
3. **HD derivation path:** Same coin type `5741564` or new one?
4. **Hardware testing:** Who has a Ledger device available for integration testing?
