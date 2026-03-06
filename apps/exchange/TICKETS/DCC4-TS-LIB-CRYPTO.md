# Migrate TypeScript Crypto Library to DecentralChain

## Assigned to: _Unassigned_

**Priority:** Critical  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`  
**Sprint:** Current  
**Story Points:** 3

---

## Summary

Migrate the `@waves/ts-lib-crypto` npm package from the Waves blockchain ecosystem into a clean, standalone DecentralChain library published as `@decentralchain/ts-lib-crypto` with **zero** Waves references remaining.

---

## Background

### What is this library?

`ts-lib-crypto` is the **core cryptographic library** for the blockchain SDK. It provides all the fundamental cryptographic operations that wallets and applications need:

- **Key generation** — Creating public/private key pairs from seed phrases
- **Address derivation** — Generating blockchain addresses from public keys
- **Signing** — Cryptographically signing transactions and data
- **Verification** — Verifying that signatures are valid
- **Hashing** — SHA-256, Blake2b, Keccak hashing algorithms
- **Encoding** — Base58, Base64, and other format conversions

**Example:** When a user creates a new wallet, this library generates the private key from their seed phrase. When they send a transaction, this library signs it. When the network receives a transaction, this library verifies the signature.

### Where did it come from?

This package was created by the Waves blockchain team at `wavesplatform/ts-lib-crypto`. It wraps standard cryptographic primitives (from `@noble/curves`, `node-forge`, etc.) with a blockchain-specific API. The DecentralChain project currently uses this package directly from the `@waves` npm scope.

### Why does this matter?

DecentralChain is establishing itself as an independent blockchain. All official SDK packages must be free of Waves branding. This library is **especially critical** because:

1. It's used by `@waves/ledger` (Phase 2), `waves-transactions` (Phase 3), and `signature-adapter` (Phase 4)
2. It handles **cryptographic operations** — any changes must be verified extremely carefully to avoid breaking signing/verification
3. It's on the **critical path**: `ts-lib-crypto (P1) → ledger (P2) → signature-adapter (P4)`

### Why does this need extra care?

This is a **medium-complexity** Phase 1 migration. While it has zero `@waves/*` dependencies, it's crypto-sensitive:

- The mathematical operations (curve25519, ed25519) must remain **byte-for-byte identical**
- Address derivation uses chain-specific prefixes — verify that DecentralChain's chain ID byte (`'L'` = 76 for mainnet, `'T'` = 84 for testnet) is correct or configurable
- Any change to the hashing or signing logic would **break every wallet** that depends on it

The migration should be **branding only** — do NOT modify any cryptographic logic.

---

## Current State of the Repo

| Field                         | Value                                                  |
| ----------------------------- | ------------------------------------------------------ |
| **npm package**               | `@waves/ts-lib-crypto` ^1.4.3                          |
| **Current GitHub repo**       | https://github.com/wavesplatform/ts-lib-crypto         |
| **Fork in Decentral-America** | ❌ **Needs to be forked**                              |
| **Language**                  | TypeScript                                             |
| **License**                   | MIT                                                    |
| **`@waves/*` dependencies**   | **None**                                               |
| **Key dependencies**          | `@noble/curves`, `node-forge`, `base-x`, `create-hash` |
| **Last published to npm**     | ~5 years ago                                           |

### Expected File Structure

```
ts-lib-crypto/
├── src/
│   ├── index.ts              # Main entry — exports all crypto functions
│   ├── crypto.ts             # Core crypto operations (sign, verify, hash)
│   ├── seed.ts               # Seed phrase → key pair derivation
│   ├── address.ts            # ⚠️ Address generation — may contain chain ID logic
│   ├── encoding.ts           # Base58, Base64 encoding/decoding
│   ├── hashing.ts            # SHA-256, Blake2b, Keccak
│   ├── signing.ts            # Ed25519/Curve25519 signing
│   └── ...                   # Additional utility files
├── test/
│   ├── crypto.test.ts        # ⚠️ Test vectors — may contain Waves addresses/chain IDs
│   └── ...                   # Additional test files
├── package.json              # ⚠️ Contains @waves scope
├── README.md                 # ⚠️ Likely references Waves extensively
├── tsconfig.json
└── ...
```

> **Note:** This file structure is estimated. Your first task after cloning is to document the actual structure.

---

## Known Waves Contamination

### 1. package.json

- `name` is `@waves/ts-lib-crypto` — must be changed to `@decentralchain/ts-lib-crypto`
- `repository.url` points to `wavesplatform/ts-lib-crypto`
- `description`, `keywords`, `author` — check for Waves references

### 2. README.md

- Install instructions reference `@waves/ts-lib-crypto`
- Usage examples likely import from `@waves/ts-lib-crypto`
- May contain Waves badges, links, or branding
- Function documentation may reference "Waves blockchain" or "Waves addresses"

### 3. Address Generation (CRITICAL — VERIFY, DO NOT BREAK)

The address generation code likely contains a reference to the chain ID byte. In Waves:

- **Mainnet:** chain ID = `'W'` (byte 87)
- **Testnet:** chain ID = `'T'` (byte 84)

In DecentralChain:

- **Mainnet:** chain ID = `'L'` (byte 76)
- **Testnet:** chain ID = `'T'` (byte 84)

**⚠️ CRITICAL:** The library likely accepts chain ID as a **parameter** rather than hardcoding it. If this is the case, NO code changes are needed for this logic — only documentation changes. However, if there are **default values** or **hardcoded constants** for chain ID, they must be updated.

**Verify:** Look for any constant like `MAINNET = 'W'` or `DEFAULT_CHAIN_ID = 87`. If found, update to `MAINNET = 'L'` or `DEFAULT_CHAIN_ID = 76`.

### 4. Test Data

Test files may contain:

- Waves-specific addresses (starting with `3P` for mainnet with chain ID `'W'`)
- Hardcoded chain ID `87` or `'W'`
- Known Waves test vectors from the official Waves documentation
- Comments referencing "Waves blockchain"

**Fix approach:** If test vectors use `chainId: 87`, you have two options:

1. **Preserve them** with comments noting they're Waves-era test vectors for backward compatibility
2. **Add new** DecentralChain test vectors alongside with `chainId: 76`

### 5. CI Configuration

- Travis CI, GitHub Actions, or other CI files may reference `wavesplatform`

### 6. Source Code Comments

- JSDoc comments and inline comments may reference "Waves address format" or "Waves signing algorithm"

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed (`git --version` to check)
- **Node.js** installed (v16 or higher — `node --version` to check)
- **npm** installed (comes with Node.js — `npm --version` to check)
- A **GitHub account** (your personal one is fine)
- A **code editor** (VS Code recommended)
- Familiarity with **TypeScript**
- Basic understanding of **cryptographic concepts** (hashing, signing, key pairs) — you don't need to be an expert, but you need to understand not to change the math

---

### Step 1: Create Your Workspace

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration
```

---

### Step 2: Clone the Original Waves Library (for reference)

```bash
git clone https://github.com/wavesplatform/ts-lib-crypto.git waves-ts-lib-crypto-original
```

**You will NOT modify this folder.** It's just for reference.

---

### Step 3: Create Your Working Copy

```bash
cp -r waves-ts-lib-crypto-original dcc-ts-lib-crypto-migrated
cd dcc-ts-lib-crypto-migrated
rm -rf .git
git init
```

---

### Step 4: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `ts-lib-crypto`
   - **Description:** `Cryptographic library for DecentralChain blockchain — key generation, signing, hashing, encoding`
   - **Visibility:** Public
   - **Initialize:** Do NOT add README, .gitignore, or license
3. Click **Create repository**
4. Connect it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ts-lib-crypto.git
```

---

### Step 5: Install Dependencies and Verify It Builds

```bash
npm install
npm test
npm run build
```

**All tests must pass at this baseline.** If they don't, note the failures before proceeding.

---

### Step 6: Run the Waves Audit

```bash
# Search all files for "waves" (case-insensitive)
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist

# Search for wavesplatform specifically
grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist

# Search for any @waves imports
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

# Check package.json
grep -i "waves" package.json

# IMPORTANT: Search for chain ID constants
grep -rn "87\|'W'" . --include="*.ts" | grep -vi "node_modules\|.git\|dist" | grep -i "chain\|mainnet\|network"
```

Write down every result. Each one needs to be evaluated.

---

### Step 7: Fix Every Waves Reference

#### 7a. Fix package.json

Update `name`, `repository.url`, `description`, `keywords`, `author`, `homepage`, `bugs.url`.

#### 7b. Fix README.md

Rewrite with DecentralChain branding:

````markdown
# @decentralchain/ts-lib-crypto

Cryptographic library for the DecentralChain blockchain. Provides key generation, address derivation, transaction signing, signature verification, hashing, and encoding utilities.

## Installation

```bash
npm install @decentralchain/ts-lib-crypto
```
````

## Usage

```typescript
import {
  seedWithNonce,
  keyPair,
  publicKey,
  privateKey,
  address,
  signBytes,
  verifySignature,
  base58Encode,
  base58Decode,
  sha256,
  blake2b,
  keccak,
} from '@decentralchain/ts-lib-crypto';

// Generate a key pair from a seed phrase
const seed = 'my secret seed phrase here';
const keys = keyPair(seed);
console.log('Public key:', base58Encode(keys.publicKey));
console.log('Private key:', base58Encode(keys.privateKey));

// Derive an address (chain ID 'L' for DecentralChain mainnet)
const addr = address(seed, 'L');
console.log('Address:', addr);

// Sign data
const message = Uint8Array.from([1, 2, 3, 4]);
const signature = signBytes(keys.privateKey, message);

// Verify signature
const isValid = verifySignature(keys.publicKey, message, signature);
console.log('Valid:', isValid); // true
```

## API

### Key Generation

- `keyPair(seed)` — Generate public/private key pair from seed
- `publicKey(seed)` — Get public key from seed
- `privateKey(seed)` — Get private key from seed

### Address

- `address(seedOrPublicKey, chainId?)` — Derive blockchain address

### Signing

- `signBytes(privateKey, bytes)` — Sign arbitrary bytes
- `verifySignature(publicKey, bytes, signature)` — Verify a signature

### Hashing

- `sha256(bytes)` — SHA-256 hash
- `blake2b(bytes)` — Blake2b hash
- `keccak(bytes)` — Keccak-256 hash

### Encoding

- `base58Encode(bytes)` / `base58Decode(string)` — Base58
- `base64Encode(bytes)` / `base64Decode(string)` — Base64
- `stringToBytes(string)` / `bytesToString(bytes)` — UTF-8

## License

MIT

````

#### 7c. Fix Chain ID Defaults (IF FOUND)

If you find hardcoded chain IDs:

```typescript
// BEFORE (if found):
const MAINNET_CHAIN_ID = 'W'; // or 87

// AFTER:
const MAINNET_CHAIN_ID = 'L'; // or 76
````

**⚠️ DO NOT change chain ID logic if the values are passed as parameters.** Only change hardcoded defaults or documentation.

#### 7d. Fix Source Files

Review every `.ts` file in `src/`. Replace Waves references in:

- Comments and JSDoc
- String literals (e.g., `"Waves address"` → `"DecentralChain address"`)
- **Do NOT touch** any mathematical operations, hash functions, or signing algorithms

#### 7e. Fix Test Files

- Update test descriptions from "Waves" to "DecentralChain"
- Add new test vectors with DecentralChain chain ID `'L'` (76)
- Optionally preserve old test vectors with comments for backward compatibility

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

**⚠️ CRITICAL VERIFICATION:** After building, manually verify that:

1. Key generation from a known seed produces the **same key pair** as the original library
2. Address derivation with chain ID `'L'` produces a valid DecentralChain address
3. Signing and verification round-trips work correctly

```typescript
// Quick verification script — output should match between old and new library
const seed = 'test seed phrase for verification only';
console.log('Public key:', publicKey(seed));
console.log('Address (mainnet):', address(seed, 'L'));
console.log('Address (testnet):', address(seed, 'T'));
```

---

### Step 10: Compare With the Original

```bash
diff ~/dcc-migration/waves-ts-lib-crypto-original/src/ src/ -r --exclude="*.map"
```

**Only branding changes should appear.** If you see ANY changes to cryptographic functions, hash implementations, or key derivation logic, **stop and verify**.

---

### Step 11: Commit and Push

```bash
git add .
git commit -m "feat: clean migration of ts-lib-crypto — remove all Waves references

- Renamed package from @waves/ts-lib-crypto to @decentralchain/ts-lib-crypto
- Updated repository URLs to Decentral-America/ts-lib-crypto
- Rewrote README with DecentralChain branding
- Updated chain ID defaults/documentation from 'W' to 'L'
- Verified cryptographic operations produce identical results
- Zero @waves/* dependencies
- All tests pass
- grep -rni waves returns zero results"

git push -u origin master
```

---

### Step 12: Open a Pull Request (for review)

1. Go to your repo on GitHub
2. Verify all files look correct
3. Notify the team lead that the migration is ready for review

---

### Step 13: Write Your Migration Summary

```
Migration Summary — ts-lib-crypto

Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
Chain ID defaults updated: [yes/no, details]
Crypto verification: [confirmed key generation, signing, and verification are identical]
Tests: [pass/fail]
Build: [pass/fail]
New repo: https://github.com/YOUR_USERNAME/ts-lib-crypto

Remaining concerns: [any issues or questions]
```

---

## Acceptance Criteria

- [ ] New repo exists with clean migration
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `package.json` name is `@decentralchain/ts-lib-crypto`
- [ ] README is clean and references DecentralChain exclusively
- [ ] Chain ID defaults reference `'L'` (76) for mainnet (if applicable)
- [ ] **Cryptographic operations produce identical results** to the original library
- [ ] Key generation from the same seed produces the same key pair
- [ ] Address derivation works correctly
- [ ] Signing and verification round-trips pass
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] Team lead has been notified for review

---

## AI Prompt for Assistance

```
I am migrating the npm package @waves/ts-lib-crypto from the Waves blockchain
ecosystem to @decentralchain/ts-lib-crypto for the DecentralChain SDK.

The repo is: https://github.com/wavesplatform/ts-lib-crypto

This package is a TypeScript cryptographic library that provides key generation,
address derivation, signing, verification, hashing, and encoding. It has ZERO
@waves/* npm dependencies — it wraps @noble/curves, node-forge, and other
standard crypto libraries.

CRITICAL: The cryptographic logic must NOT be changed. Only branding/naming.

The migration involves:
1. Renaming @waves/bignumber to @decentralchain/bignumber throughout
2. Updating README with DecentralChain branding
3. Updating any chain ID defaults from 'W' (87) to 'L' (76)
4. Verifying crypto operations remain byte-for-byte identical

The native token on DecentralChain is called "DCC" (not "WAVES").
DecentralChain mainnet chain ID is 'L' (byte 76).
DecentralChain testnet chain ID is 'T' (byte 84).

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**2–4 hours** — straightforward rename but requires careful crypto verification.

---

## Questions?

Reach out to the team lead. The key concern here is **do not break the crypto**. When in doubt, don't change it — only change branding and documentation.
