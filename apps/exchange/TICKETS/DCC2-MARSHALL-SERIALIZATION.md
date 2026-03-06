# Migrate Marshall Serialization Library to DecentralChain

## Assigned to: Fabrizio Mattei

**Priority:** High  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`  
**Sprint:** Current  
**Story Points:** 3

---

## Summary

Migrate the `@decentralchain/marshall` npm package from its current state (a shallow fork of the Waves blockchain library `wavesplatform/marshall`) into a clean, standalone DecentralChain library with **zero** Waves references remaining. This includes replacing the one remaining `@waves/*` dependency.

---

## Background

### What is this library?

`marshall` is a **serialization/deserialization library** for blockchain transactions. It converts transaction data between three formats:

1. **JavaScript objects** — how your app works with transactions in code
2. **Binary bytes** — how transactions are transmitted over the network and stored on the blockchain
3. **JSON strings** — how transactions are displayed in APIs and logs

**Example:** When a user sends 100 DCC to another address, the wallet app creates a JavaScript object representing that transfer. Marshall converts it into binary bytes for signing and broadcasting, and into a JSON string for the API.

Think of it like a translator that speaks three languages — JS objects, binary, and JSON — and can convert between any of them.

### Where did it come from?

This package was originally created by the Waves blockchain team at `wavesplatform/marshall`. The Decentral-America team forked it and published it under the `@decentralchain` npm scope. However, the fork was shallow — only the `package.json` name, the webpack output filename, and a few code references were updated. There is still one `@waves/*` npm dependency and there may be other Waves references hiding in the repo.

### Why does this matter?

DecentralChain is establishing itself as an independent blockchain. All official SDK packages must be free of Waves branding, Waves URLs, Waves-specific data, and Waves npm dependencies. This is one of 4 packages that need cleanup before we can call our SDK truly independent.

### Why is this one assigned to you?

This is the **second smallest** of the 4 packages (after `assets-pairs-order`). It has:

- Only **1** `@waves/*` npm dependency to replace (`@waves/parse-json-bignumber`)
- **48 files** total
- Written in **TypeScript** (compiled with `tsc` and bundled with Webpack)
- The contamination is primarily in one import statement and possibly some test data

It's a medium-complexity migration — more involved than `assets-pairs-order` but far simpler than `waves-transactions` or `signature-adapter`. It will give you good hands-on experience with the migration process.

---

## Current State of the Repo

| Field                       | Value                                                  |
| --------------------------- | ------------------------------------------------------ |
| **npm package**             | `@decentralchain/marshall` v0.14.0                     |
| **Current GitHub repo**     | https://github.com/Decentral-America/marshall          |
| **Originally forked from**  | https://github.com/wavesplatform/marshall              |
| **Fork status**             | 1 commit ahead of the original Waves repo              |
| **Language**                | TypeScript 98.2%, JavaScript 1.8%                      |
| **Total size**              | 203 kB unpacked                                        |
| **Total files**             | 48                                                     |
| **License**                 | MIT                                                    |
| **`@waves/*` dependencies** | **1** — `@waves/parse-json-bignumber` ^1.0.1           |
| **Other dependencies**      | `@types/base64-js`, `@types/long`, `base64-js`, `long` |
| **Build system**            | TypeScript compiler (`tsc`) + Webpack                  |
| **Test framework**          | Jest (with `ts-jest`)                                  |
| **Last published to npm**   | ~5 years ago                                           |

### File Structure

```
marshall/
├── src/
│   ├── libs/
│   │   ├── Utf8ArrayToStr.ts     # UTF-8 byte array helper
│   │   ├── base58.ts             # Base58 encoding/decoding
│   │   └── utils.ts              # General utilities
│   ├── index.ts                  # Main entry point — exports binary & json modules
│   ├── jsonMethods.ts            # ⚠️ JSON serialization — imports @waves/parse-json-bignumber
│   ├── parse.ts                  # Binary → JS object parser
│   ├── parsePrimitives.ts        # Low-level binary parsing (bytes, shorts, longs, etc.)
│   ├── schemas.ts                # Transaction type schemas (already uses 'DCC')
│   ├── schemaTypes.ts            # TypeScript types for schemas
│   ├── serialize.ts              # JS object → binary serializer
│   └── serializePrimitives.ts    # Low-level binary serialization primitives
├── test/
│   ├── binary.test.ts            # Binary round-trip tests (already tests 'DCC' assetId)
│   ├── exampleTxs.ts             # ⚠️ Test fixture data — may contain Waves chain IDs
│   ├── json.test.ts              # JSON round-trip tests
│   └── ser-primitives.test.ts    # Primitive serialization tests
├── .gitignore
├── jest.config.js                # Jest configuration
├── LICENSE                       # MIT license
├── package.json                  # ⚠️ Contains @waves/parse-json-bignumber dependency
├── package-lock.json
├── README.md                     # Partially migrated — still has incorrect import example
├── tsconfig.json                 # TypeScript configuration
├── tslint.json                   # TSLint configuration (legacy)
└── webpack.config.js             # Webpack bundler config (already outputs dcc-marshall.min.js)
```

---

## Known Waves Contamination

Here is everything we've already identified. Your audit may find more.

### 1. `@waves/parse-json-bignumber` Dependency (CRITICAL)

**This is the most important item.** The package depends on `@waves/parse-json-bignumber`, which is a Waves-published npm package that provides safe JSON parsing for large numbers (numbers bigger than JavaScript can handle natively).

**Where it's used:** `src/jsonMethods.ts`, line 1:

```typescript
import * as create from '@waves/parse-json-bignumber/dist/parse-json-bignumber';
```

This import pulls in a function that creates a custom `JSON.parse()` and `JSON.stringify()` that handle BigNumber values without losing precision. It's used to safely serialize/deserialize transaction amounts (which can be very large integers).

**How to fix — Option A (Recommended): Fork the dependency**

1. Find the original Waves package: https://github.com/wavesplatform/parse-json-bignumber
2. Fork it to your personal GitHub
3. Update the `package.json` name to `@decentralchain/parse-json-bignumber`
4. Audit it for Waves references (it's a very small utility)
5. Publish it or reference it via git URL temporarily
6. Update the import in `jsonMethods.ts` to use the new package

**How to fix — Option B: Replace with an alternative**

The `@waves/parse-json-bignumber` package is a thin wrapper. You could replace it with an existing open-source alternative like [`json-bigint`](https://www.npmjs.com/package/json-bigint) or [`lossless-json`](https://www.npmjs.com/package/lossless-json). However, this changes behavior and requires more testing.

**How to fix — Option C: Inline it**

The package is very small. You could copy its source code directly into `src/libs/parseJsonBigNumber.ts` and remove the npm dependency entirely. This is the fastest option if the package's license allows it (it's MIT).

**Discuss with the team lead which option to use before proceeding.** Option A is recommended for consistency with the overall migration strategy.

### 2. README.md Import Example

The README currently shows:

```javascript
import { binary, json } from 'parse-serialize';
```

This import path is wrong — it should reference the actual package name:

```javascript
import { binary, json } from '@decentralchain/marshall';
```

**Fix:** Update the import in the README to use the correct `@decentralchain/marshall` package name.

### 3. Test Data Chain IDs (`test/exampleTxs.ts`)

The test fixture file contains transaction examples with `chainId: 87`. The number 87 is the ASCII code for the letter `W`, which is the **Waves mainnet** chain ID.

For reference:

- **Waves mainnet:** chain ID = 87 (letter `W`)
- **DecentralChain mainnet:** chain ID = 76 (letter `L`)
- **DecentralChain testnet:** chain ID = 84 (letter `T`)

Found in these test transactions:

- `issueTx` — `chainId: 87`
- `reissueTx` — `chainId: 87`
- `burnTx` — `chainId: 87`
- `setScriptTx` — `chainId: 87`
- `setAssetScriptTx` — `chainId: 87`

**⚠️ IMPORTANT NUANCE:** These chain IDs are part of test data that verifies binary serialization round-trips. If you change `chainId: 87` to `chainId: 76`, the resulting serialized bytes will be different, which means the expected byte strings (`exchangeV1BytesStr`, `exchangeV2BytesStr`, `aliasV2BytesStr`) will also need to be recalculated.

**Fix — Two valid approaches:**

1. **Leave the test data as-is** and add a comment explaining it's Waves-era test data used for backwards compatibility verification. Add NEW tests with DecentralChain chain IDs alongside the old ones.
2. **Update all chain IDs** to DecentralChain values AND recalculate all expected byte strings. This is more thorough but takes longer. You can generate the correct byte strings by running `binary.serializeTx(updatedTx).toString()` for each transaction.

Either approach is acceptable — discuss with the team lead.

### 4. package.json Metadata

Already partially updated but verify:

- `name` is `@decentralchain/marshall` ✅
- `repository` points to `Decentral-America/marshall` ✅
- `author` is `DCC` ✅
- `description` — check if it mentions Waves
- `keywords` — check for Waves-related keywords
- `@waves/parse-json-bignumber` in `dependencies` ❌ (needs replacement, see item 1)

### 5. webpack.config.js

Already updated:

- Output filename: `dcc-marshall.min.js` ✅
- Library name: `DCCMarshall` ✅

Verify no other Waves references remain in this file.

### 6. schemas.ts — Already Partially Migrated

The `schemas.ts` file already uses `'DCC'` as the null-asset representation:

```typescript
toBytes: (s: string) => s === 'DCC' ? OPTION(BASE58_STRING)(null) : OPTION(BASE58_STRING)(s),
```

And the binary test already verifies this:

```typescript
it('Should accept DCC as assetId', () => {
    const tx = {...exampleTxs[4], assetId: 'DCC', feeAssetId: 'DCC'}
    ...
})
```

This is already correct. Just verify there are no other hardcoded Waves references in `schemas.ts`.

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed (`git --version` to check)
- **Node.js** installed (v16 or higher — `node --version` to check)
- **npm** installed (comes with Node.js — `npm --version` to check)
- A **GitHub account** (your personal one is fine)
- A **code editor** (VS Code recommended)
- Basic familiarity with **TypeScript** (this project uses TypeScript, unlike the `assets-pairs-order` project which is plain JS)

---

### Step 1: Create Your Workspace

Create a parent folder on your computer where you'll work. This folder will contain the original Waves library for reference and your new migrated version.

```bash
# Create a workspace folder and go into it
mkdir ~/dcc-migration
cd ~/dcc-migration
```

---

### Step 2: Clone the Original Waves Library (for reference)

Clone the **original Waves version** so you can compare it with the Decentral-America fork and understand what was already changed.

```bash
git clone https://github.com/wavesplatform/marshall.git waves-marshall-original
```

This gives you the original untouched Waves library in a folder called `waves-marshall-original`. **You will NOT modify this folder.** It's just for reference.

---

### Step 3: Clone the Current Decentral-America Fork

Clone the current fork that's already partially migrated. This is the version published on npm today.

```bash
git clone https://github.com/Decentral-America/marshall.git dcc-marshall-current
```

This gives you the current state in a folder called `dcc-marshall-current`. **You will NOT modify this folder either.** It's your second reference point.

---

### Step 4: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `marshall`
   - **Description:** `Binary/JSON transaction serializer for DecentralChain blockchain`
   - **Visibility:** Public
   - **Initialize:** Do NOT add README, .gitignore, or license (we'll bring those from the source)
3. Click **Create repository**
4. Note your repo URL. It will be something like: `https://github.com/YOUR_USERNAME/marshall.git`

---

### Step 5: Create the Migrated Version Locally

Now create the folder that will become your clean, migrated version. We start by copying the Decentral-America fork (since it's closer to what we want).

```bash
# Copy the current DA fork as your starting point
cp -r dcc-marshall-current dcc-marshall-migrated

# Go into your new working folder
cd dcc-marshall-migrated

# Remove the old git history (we're starting fresh)
rm -rf .git

# Initialize a new git repo
git init

# Connect it to YOUR GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/marshall.git
```

Your folder structure should now look like:

```
~/dcc-migration/
├── waves-marshall-original/    ← Original Waves (read-only reference)
├── dcc-marshall-current/       ← Current DA fork (read-only reference)
└── dcc-marshall-migrated/      ← YOUR working copy (edit this one)
```

---

### Step 6: Install Dependencies and Verify It Builds

Before changing anything, make sure the project works as-is.

```bash
# You should already be in ~/dcc-migration/dcc-marshall-migrated
npm install
```

Now run the tests:

```bash
npm test
```

If tests pass, great — you have a working baseline. If they fail, note the failures (they may have been broken before you started).

Also try building:

```bash
npm run build
```

This runs `tsc` (TypeScript compilation) and then Webpack bundling. Note any warnings or errors.

---

### Step 7: Run the Waves Audit

Now search for every remaining Waves reference. Run these commands one at a time and record the output.

**Search all source files for "waves" (case-insensitive):**

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" | grep -v node_modules | grep -v .git | grep -v dist
```

**Search for wavesplatform specifically:**

```bash
grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist
```

**Search for any @waves imports:**

```bash
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist
```

**Check if any dependency references waves:**

```bash
grep -i "waves" package.json
```

**Search for Waves chain ID (87 = 'W'):**

```bash
grep -rn "chainId.*87\|87.*chainId" . --include="*.ts" --include="*.js" | grep -v node_modules | grep -v .git | grep -v dist
```

Write down every result. Each one needs to be evaluated and fixed.

---

### Step 8: Fix Every Waves Reference

Go through each result from Step 7 and fix it. Here's what we already know needs fixing, but **your audit may find more**:

#### 8a. Replace the `@waves/parse-json-bignumber` Dependency

This is the most important fix. Ask the team lead which approach to use (see "Known Contamination" section above for options). Below are instructions for each approach:

**If using Option A (Fork the dependency):**

```bash
# In a separate location, clone the waves package
cd ~/dcc-migration
git clone https://github.com/wavesplatform/parse-json-bignumber.git

# Review it — it should be a very small package
ls parse-json-bignumber/
```

Then update `src/jsonMethods.ts`:

```typescript
// BEFORE:
import * as create from '@waves/parse-json-bignumber/dist/parse-json-bignumber';

// AFTER (once the forked package is published):
import * as create from '@decentralchain/parse-json-bignumber/dist/parse-json-bignumber';
```

And update `package.json`:

```json
// BEFORE:
"@waves/parse-json-bignumber": "^1.0.1"

// AFTER:
"@decentralchain/parse-json-bignumber": "^1.0.1"
```

**If using Option C (Inline it):**

1. Clone `https://github.com/wavesplatform/parse-json-bignumber`
2. Copy its source into `src/libs/parseJsonBigNumber.ts`
3. Update the import in `src/jsonMethods.ts`:

```typescript
// BEFORE:
import * as create from '@waves/parse-json-bignumber/dist/parse-json-bignumber';

// AFTER:
import * as create from './libs/parseJsonBigNumber';
```

4. Remove `@waves/parse-json-bignumber` from `package.json` dependencies

#### 8b. Fix README.md

Open `README.md` in your editor. Replace the entire contents with a clean version:

````markdown
# @decentralchain/marshall

Marshall can serialize and parse DecentralChain blockchain data structures.

### Includes:

- Serialization primitives
- Parsing primitives
- Binary to JS converters
- JS to binary converters
- JSON to JS converters
- JS to JSON converters

### Installation

```bash
npm install @decentralchain/marshall
```

### Usage

```typescript
import { binary, json } from '@decentralchain/marshall';

const tx = {
  type: 10,
  version: 2,
  fee: 100000,
  senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
  timestamp: 1542539421565,
  id: '1bVuFdMbDAk6dhcQFfJFxpDjmm8DdFnnKesQ3wpxj7P',
  proofs: [
    '5cW1Ej6wFRK1XpMm3daCWjiSXaKGYfL7bmspZjzATXrNYjRVxZJQVJsDU7ZVcxNXcKJ39fhjxv3rSu4ovPT3Fau8',
  ],
  alias: 'MyTestAlias',
};

// Binary converter
const bytes = binary.serializeTx(tx);
const txb = binary.parseTx(bytes);

// JSON converter
const jsonString = json.stringifyTx(tx);
const txj = json.parseTx(jsonString);
```

### API

#### Binary

- `binary.serializeTx(tx)` — Serialize a transaction to binary bytes
- `binary.parseTx(bytes, toLongConverter?)` — Parse binary bytes back to a transaction object
- `binary.serializeOrder(order)` — Serialize a DEX order to binary bytes
- `binary.parseOrder(bytes, toLongConverter?)` — Parse binary bytes back to an order object

#### JSON

- `json.stringifyTx(tx, fromLongConverter?)` — Convert a transaction to a JSON string (safe for large numbers)
- `json.parseTx(str, toLongConverter?)` — Parse a JSON string to a transaction object
- `json.stringifyOrder(order, fromLongConverter?)` — Convert an order to a JSON string
- `json.parseOrder(str, toLongConverter?)` — Parse a JSON string to an order object

### License

MIT
````

#### 8c. Review Test Data (`test/exampleTxs.ts`)

Open `test/exampleTxs.ts` and search for `chainId: 87`. You'll find it in several transaction fixtures.

**If the team decides to leave test data as-is**, add comments explaining why:

```typescript
// chainId: 87 ('W') = Waves-era test data preserved for serialization verification
chainId: 87,
```

**If the team decides to update chain IDs**, change `87` to `76` (DecentralChain mainnet 'L') or `84` (testnet 'T'), and then regenerate the expected byte strings by running the serializer on the new data. See Step 10 for how to do this.

#### 8d. Review All Source Files

Open each file in `src/` and search for `waves`, `Waves`, `WAVES`, or `wavesplatform`:

- `src/index.ts` — Should be clean (exports only)
- `src/jsonMethods.ts` — Has the `@waves` import (fix in 8a)
- `src/parse.ts` — Check for any comments or strings referencing Waves
- `src/parsePrimitives.ts` — Should be clean (math/parsing primitives)
- `src/schemas.ts` — Already uses `'DCC'`, but check for any other Waves refs
- `src/schemaTypes.ts` — Should be clean (TypeScript types only)
- `src/serialize.ts` — Check for comments referencing Waves
- `src/serializePrimitives.ts` — Should be clean (math/serialization primitives)
- `src/libs/*.ts` — Should be clean (generic utility functions)

#### 8e. Review package.json

Verify these fields are clean:

- `name` should be `@decentralchain/marshall` ✅ (already correct)
- `repository` should point to `Decentral-America/marshall` ✅ (already correct)
- `author` should be `DCC` ✅ (already correct)
- `description` should not mention Waves
- `keywords` should not include "waves" or "wavesplatform"
- `contributors` — the contributor `Sergey B` is fine to keep (he wrote the original serialization logic)
- **No `@waves/*`** packages in `dependencies` ❌ (needs fix — see 8a)
- **No `@waves/*`** packages in `devDependencies` (should already be clean)

#### 8f. Review jest.config.js, tsconfig.json, tslint.json

Open each of these config files and search for `waves`. They are likely clean but verify.

#### 8g. Review webpack.config.js

Already updated to use `dcc-marshall.min.js` and `DCCMarshall`. Verify no other Waves references remain.

---

### Step 9: Run the Audit Again

After fixing everything, run the same grep commands from Step 7 again:

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" | grep -v node_modules | grep -v .git | grep -v dist
```

**This must return ZERO results** (unless the team decided to keep Waves-era test data with comments, in which case only those commented lines should appear).

Also verify:

```bash
grep -i "waves" package.json
```

**This must return ZERO results.**

And verify the `@waves` import is gone:

```bash
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist
```

**This must return ZERO results.**

---

### Step 10: Rebuild and Test

This project uses TypeScript, so the build process is more involved than a plain JS project.

```bash
# Clean everything
rm -rf node_modules dist

# Reinstall
npm install

# Run TypeScript compilation + Webpack build
npm run build

# Run tests
npm test
```

**All tests must pass.** If any test fails because:

- You changed the `@waves/parse-json-bignumber` import → make sure the replacement works identically
- You changed `chainId` values in test data → regenerate expected byte strings:

```bash
# To regenerate byte strings for a specific transaction, add this to a test:
import { binary } from '../src'
import { issueTx } from './exampleTxs'

console.log(binary.serializeTx(issueTx).toString())
// Copy the output as the new expected byte string
```

---

### Step 11: Compare With the Original

Use the reference folders to confirm you haven't accidentally broken the serialization logic. The core algorithms should be identical — only branding, the one dependency, and data files should have changed.

```bash
# Compare the main serialization logic
diff ~/dcc-migration/dcc-marshall-current/src/serialize.ts src/serialize.ts

# Compare the parsing logic
diff ~/dcc-migration/dcc-marshall-current/src/parse.ts src/parse.ts

# Compare the schemas (should only differ if DCC was already there)
diff ~/dcc-migration/dcc-marshall-current/src/schemas.ts src/schemas.ts

# Compare the primitives
diff ~/dcc-migration/dcc-marshall-current/src/serializePrimitives.ts src/serializePrimitives.ts
diff ~/dcc-migration/dcc-marshall-current/src/parsePrimitives.ts src/parsePrimitives.ts
```

If there are differences, make sure they're intentional (Waves references you removed) and not accidental (logic you broke).

---

### Step 12: Commit and Push

```bash
# Stage all files
git add .

# Commit with a clear message
git commit -m "feat: clean migration of marshall — remove all Waves references

- Replaced @waves/parse-json-bignumber dependency with [your chosen approach]
- Updated import in src/jsonMethods.ts
- Rewrote README with DecentralChain branding and correct import path
- Verified schemas.ts correctly uses 'DCC' as native token
- Verified webpack outputs dcc-marshall.min.js / DCCMarshall
- [Updated/documented] test data chain IDs
- Zero @waves/* dependencies remain
- All tests pass
- grep -rni waves returns zero results (excluding node_modules/dist)"

# Push to your GitHub repo
git push -u origin master
```

---

### Step 13: Open a Pull Request (for review)

We don't merge directly to the Decentral-America org. Instead:

1. Go to your repo on GitHub: `https://github.com/YOUR_USERNAME/marshall`
2. Verify all files look correct in the GitHub UI
3. Verify the TypeScript compiles: check that the `dist/` folder would be generated correctly
4. Notify the team lead that the migration is ready for review
5. The repo will be transferred to the `Decentral-America` org after review and approval

---

### Step 14: Write Your Migration Summary

In the Jira ticket comments (or wherever we track this), post a summary:

```
Migration Summary — marshall

Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
@waves/* dependencies removed: 1 (@waves/parse-json-bignumber)
Replacement approach used: [Option A / B / C — describe]
Tests: [pass/fail]
Build (tsc): [pass/fail]
Build (webpack): [pass/fail]
New repo: https://github.com/YOUR_USERNAME/marshall

Remaining concerns: [any issues or questions]
```

---

## Acceptance Criteria

All of these must be true before this ticket can be marked as Done:

- [ ] New repo exists under Fabrizio's GitHub account
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results (or only approved commented test data)
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] `grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `@waves/parse-json-bignumber` has been replaced (fork, alternative, or inlined)
- [ ] README is clean, references DecentralChain exclusively, and shows correct import path
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors (TypeScript + Webpack)
- [ ] `npm test` passes
- [ ] Commit history is clean with descriptive message(s)
- [ ] Team lead has been notified for review

---

## AI Prompt for Assistance

If you get stuck, you can use this prompt with an AI assistant (Claude, ChatGPT, Copilot, etc.) to help you:

```
I am migrating the npm package @decentralchain/marshall from a Waves blockchain
fork to a standalone DecentralChain library.

The repo is: https://github.com/Decentral-America/marshall
It was forked from: https://github.com/wavesplatform/marshall

This package is a TypeScript library (48 files, 203 kB) that serializes
and deserializes blockchain transactions between JavaScript objects, binary bytes,
and JSON strings. It supports all transaction types (transfer, issue, burn,
exchange, lease, alias, data, set-script, sponsorship, invoke-script, etc).

It has ONE @waves/* npm dependency that must be replaced:
- @waves/parse-json-bignumber ^1.0.1 (used in src/jsonMethods.ts)
  This package provides safe JSON.parse/stringify for BigNumber values.

The npm scope was already changed to @decentralchain and several things
are already correct:
- schemas.ts uses 'DCC' as the native token (not 'WAVES')
- webpack.config.js outputs dcc-marshall.min.js with library name DCCMarshall
- package.json name is @decentralchain/marshall

What still needs fixing:
1. src/jsonMethods.ts imports @waves/parse-json-bignumber — need to replace
2. README.md has incorrect import example ('parse-serialize' instead of '@decentralchain/marshall')
3. test/exampleTxs.ts has chainId: 87 (Waves mainnet 'W') in several test fixtures
4. package.json still lists @waves/parse-json-bignumber in dependencies

The native token on DecentralChain is called "DCC" (not "WAVES").
The DecentralChain mainnet chain ID is 'L' (byte 76).
The DecentralChain testnet chain ID is 'T' (byte 84).
The Waves mainnet chain ID was 'W' (byte 87).

Please help me audit this file: [paste file contents here]

Tell me every line that needs to change and what to change it to.
```

---

## Key Differences From the `assets-pairs-order` Migration

If you've seen Dylan's ticket for `assets-pairs-order`, here are the key differences for this one:

| Aspect                 | `assets-pairs-order` (Dylan)     | `marshall` (Fabrizio)                          |
| ---------------------- | -------------------------------- | ---------------------------------------------- |
| Language               | Plain JavaScript                 | **TypeScript** (needs `tsc` compilation)       |
| File count             | 13                               | **48**                                         |
| `@waves/*` deps        | 0                                | **1** (`@waves/parse-json-bignumber`)          |
| Build process          | Rollup (optional browser bundle) | **tsc + Webpack** (required for dist/)         |
| Complexity             | Simple config/data library       | **Full serialization engine** for all tx types |
| Already migrated parts | `package.json` name only         | Name + schemas.ts + webpack config             |
| Main challenge         | Just find-and-replace Waves text | **Replace the @waves dependency**              |
| Estimated time         | 1–3 hours                        | **2–4 hours**                                  |

---

## Estimated Time

**2–4 hours** depending on which approach you choose for the `@waves/parse-json-bignumber` replacement and how many hidden references you find.

---

## Questions?

Reach out to the team lead or post in the migration Slack channel. The most important decision to make before you start coding is **which approach to use for replacing `@waves/parse-json-bignumber`** — get alignment on that first, then the rest is straightforward grep-and-fix work.
