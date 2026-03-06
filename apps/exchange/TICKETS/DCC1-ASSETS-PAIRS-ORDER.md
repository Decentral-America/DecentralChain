# Migrate Assets Pairs Order Library to DecentralChain

## Assigned to: Dylan

**Priority:** High  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`  
**Sprint:** Current  
**Story Points:** 2

---

## Summary

Migrate the `@decentralchain/assets-pairs-order` npm package from its current state (a shallow fork of the Waves blockchain library `wavesplatform/assets-pairs-order`) into a clean, standalone DecentralChain library with **zero** Waves references remaining.

---

## Background

### What is this library?

`assets-pairs-order` is a small utility library that determines the correct ordering of two assets in a trading pair. On a decentralized exchange (DEX), when you trade Asset A for Asset B, the system needs to decide which one is the "amount asset" and which is the "price asset." This library handles that logic.

**Example:** If someone wants to trade DCC for Bitcoin, this library determines whether the pair should be displayed as `DCC/BTC` or `BTC/DCC` based on a priority list defined in JSON config files.

### Where did it come from?

This package was originally created by the Waves blockchain team at `wavesplatform/assets-pairs-order`. The Decentral-America team forked it and published it under the `@decentralchain` npm scope. However, the fork was shallow — only the `package.json` name and a few data files were updated. There are still Waves references hiding in the repo.

### Why does this matter?

DecentralChain is establishing itself as an independent blockchain. All official SDK packages must be free of Waves branding, Waves URLs, and Waves-specific data. This is one of 4 packages that need cleanup before we can call our SDK truly independent.

### Why is this one assigned to you?

This is the **smallest and cleanest** of all 4 packages. It has:

- **Zero** `@waves/*` npm dependencies (only depends on `bs58`)
- Only **13 files** total
- Written in plain **JavaScript** (no TypeScript compilation needed)
- The contamination is limited to badge URLs, possible leftover asset IDs, and documentation

It's an ideal first migration task — low risk, fast turnaround, and will familiarize you with the process for future, larger migrations.

---

## Current State of the Repo

| Field                       | Value                                                   |
| --------------------------- | ------------------------------------------------------- |
| **npm package**             | `@decentralchain/assets-pairs-order` v4.0.0             |
| **Current GitHub repo**     | https://github.com/Decentral-America/assets-pairs-order |
| **Originally forked from**  | https://github.com/wavesplatform/assets-pairs-order     |
| **Fork status**             | 1 commit ahead of the original Waves repo               |
| **Language**                | JavaScript 100%                                         |
| **Total size**              | 76.4 kB unpacked                                        |
| **Total files**             | 13                                                      |
| **License**                 | MIT                                                     |
| **`@waves/*` dependencies** | **None**                                                |
| **Only dependency**         | `bs58` ^4.0.1 (base58 encoding, blockchain-generic)     |
| **Last published to npm**   | ~5 years ago                                            |

### File Structure

```
assets-pairs-order/
├── src/
│   ├── __tests__/          # Test files
│   ├── index.js            # Main entry point — ordering logic
│   ├── index.d.ts          # TypeScript type declarations
│   ├── utils.js            # Helper functions
│   ├── mainnet.json        # Mainnet asset priority list
│   ├── testnet.json        # Testnet asset priority list
│   └── arbitrary.json      # Additional asset ordering data
├── .babelrc                # Babel config
├── .gitignore
├── .npmignore
├── .travis.yml             # Travis CI config (⚠️ contains Waves reference)
├── README.md               # Documentation (⚠️ contains Waves reference)
├── package.json            # Package metadata (already migrated)
├── package-lock.json
├── rollup.config.js        # Build config for browser bundle
└── yarn.lock
```

---

## Known Waves Contamination

Here is everything we've already identified. Your audit may find more.

### 1. Travis CI Badge (README.md)

The README contains a build status badge that still points to the Waves GitHub org:

```
https://api.travis-ci.org/wavesplatform/assets-pairs-order.svg?branch=master
```

**Fix:** Remove the badge entirely (Travis CI is deprecated and the badge is non-functional) or replace with a DecentralChain CI badge if we have one.

### 2. Travis CI Config (.travis.yml)

This file may reference Waves infrastructure or Waves-specific npm publishing configuration.

**Fix:** Review contents. If it references `wavesplatform`, update or remove the file.

### 3. Asset Data Files (src/mainnet.json, src/testnet.json, src/arbitrary.json)

These JSON files contain lists of asset IDs that determine trading pair ordering. The `mainnet.json` has already been updated to:

```json
[{ "ticker": "DCC", "id": "DCC" }]
```

**However**, `testnet.json` and `arbitrary.json` need to be verified. They may still contain Waves-specific asset IDs (like the original WAVES token ID or Waves ecosystem token IDs like USDN, NSBT, etc.).

**Fix:** Verify all asset IDs are valid DecentralChain assets. Remove any Waves ecosystem-specific tokens.

### 4. README.md Content

The README likely needs a full review to ensure:

- No mentions of "Waves", "wavesplatform", or "Waves blockchain"
- Install instructions reference `@decentralchain/assets-pairs-order`
- Example code uses `@decentralchain/assets-pairs-order`

### 5. package.json Metadata

Already partially updated but verify:

- `name` is `@decentralchain/assets-pairs-order` ✅
- `repository.url` points to `Decentral-America` ✅
- No `@waves/*` dependencies ✅
- No Waves keywords or descriptions

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed (`git --version` to check)
- **Node.js** installed (v16 or higher — `node --version` to check)
- **npm** installed (comes with Node.js — `npm --version` to check)
- A **GitHub account** (your personal one is fine)
- A **code editor** (VS Code recommended)

---

### Step 1: Create Your Workspace

Create a parent folder on your computer where you'll work. This folder will contain two things side by side: the original (Waves) library for reference, and your new migrated version.

```bash
# Create a workspace folder and go into it
mkdir ~/dcc-migration
cd ~/dcc-migration
```

---

### Step 2: Clone the Original Waves Library (for reference)

Clone the **original Waves version** so you can compare it with the Decentral-America fork and understand what was already changed.

```bash
git clone https://github.com/wavesplatform/assets-pairs-order.git waves-assets-pairs-order-original
```

This gives you the original untouched Waves library in a folder called `waves-assets-pairs-order-original`. **You will NOT modify this folder.** It's just for reference.

---

### Step 3: Clone the Current Decentral-America Fork

Clone the current fork that's already partially migrated. This is the version published on npm today.

```bash
git clone https://github.com/Decentral-America/assets-pairs-order.git dcc-assets-pairs-order-current
```

This gives you the current state in a folder called `dcc-assets-pairs-order-current`. **You will NOT modify this folder either.** It's your second reference point.

---

### Step 4: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `assets-pairs-order`
   - **Description:** `Utility for ordering asset pairs for DecentralChain DEX`
   - **Visibility:** Public
   - **Initialize:** Do NOT add README, .gitignore, or license (we'll bring those from the source)
3. Click **Create repository**
4. Note your repo URL. It will be something like: `https://github.com/YOUR_USERNAME/assets-pairs-order.git`

---

### Step 5: Create the Migrated Version Locally

Now create the folder that will become your clean, migrated version. We start by copying the Decentral-America fork (since it's closer to what we want).

```bash
# Copy the current DA fork as your starting point
cp -r dcc-assets-pairs-order-current dcc-assets-pairs-order-migrated

# Go into your new working folder
cd dcc-assets-pairs-order-migrated

# Remove the old git history (we're starting fresh)
rm -rf .git

# Initialize a new git repo
git init

# Connect it to YOUR GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/assets-pairs-order.git
```

Your folder structure should now look like:

```
~/dcc-migration/
├── waves-assets-pairs-order-original/    ← Original Waves (read-only reference)
├── dcc-assets-pairs-order-current/       ← Current DA fork (read-only reference)
└── dcc-assets-pairs-order-migrated/      ← YOUR working copy (edit this one)
```

---

### Step 6: Install Dependencies and Verify It Builds

Before changing anything, make sure the project works as-is.

```bash
# You should already be in ~/dcc-migration/dcc-assets-pairs-order-migrated
npm install
npm test
```

If tests pass, great — you have a working baseline. If they fail, note the failures (they may have been broken before you started).

---

### Step 7: Run the Waves Audit

Now search for every remaining Waves reference. Run these commands one at a time and record the output.

**Search all files for "waves" (case-insensitive):**

```bash
grep -rni "waves" . --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" --include="*.d.ts" | grep -v node_modules | grep -v .git
```

**Search for wavesplatform specifically:**

```bash
grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git
```

**Search for any @waves imports:**

```bash
grep -rn "@waves" . --include="*.js" --include="*.json" --include="*.d.ts" | grep -v node_modules | grep -v .git
```

**Check if any dependency references waves:**

```bash
grep -i "waves" package.json
```

Write down every result. Each one needs to be fixed.

---

### Step 8: Fix Every Waves Reference

Go through each result from Step 7 and fix it. Here is what we already know needs fixing, but **your audit may find more**:

#### 8a. Fix README.md

Open `README.md` in your editor. Replace the entire contents with a clean version. Here's a template:

````markdown
# @decentralchain/assets-pairs-order

Utility for determining the correct ordering of asset pairs on the DecentralChain DEX.

When trading Asset A for Asset B, the DEX needs to know which is the "amount asset" and which is the "price asset." This library resolves that ordering based on a configurable priority list.

## Installation

```bash
npm install @decentralchain/assets-pairs-order
```
````

## Usage

```javascript
import { createOrderPair, MAINNET_DATA } from '@decentralchain/assets-pairs-order';

const orderPair = createOrderPair(MAINNET_DATA);

const [amountAsset, priceAsset] = orderPair(
  'DNhP2zAH5HM1kdUSmxcBqs8RP4vvUgRFc1YgAKkfPmPD',
  'FxSm86qcEw8wGfpX3T7X5fsnuK5XxYA6ZfVYJja29vMA'
);
```

## API

### `createOrderPair(data)`

Creates an ordering function from a priority list.

- **`data`** — Array of `{ ticker, id }` objects defining asset priority (highest priority first).
- **Returns** — A function `(assetId1, assetId2) => [amountAsset, priceAsset]`

### `MAINNET_DATA`

Pre-configured priority list for DecentralChain mainnet.

### `TESTNET_DATA`

Pre-configured priority list for DecentralChain testnet.

## Browser

For browser usage, include `dist/browser.js`.

## License

MIT

````

#### 8b. Fix .travis.yml

Open `.travis.yml`. If it references `wavesplatform`, either:
- Update the reference to `Decentral-America`, or
- Delete the file entirely if the team isn't using Travis CI (check with the team first — most likely we aren't using it)

#### 8c. Review src/testnet.json

Open `src/testnet.json`. Check its contents:
- If it contains `"WAVES"` as an ID, change it to `"DCC"`
- If it contains Waves ecosystem tokens that don't exist on DecentralChain, remove them
- Keep the same JSON structure

#### 8d. Review src/arbitrary.json

Same as above — open `src/arbitrary.json` and check for any Waves-specific asset references.

#### 8e. Review src/index.js, src/utils.js, src/index.d.ts

Open each file and search for `waves` or `Waves`. These files handle the ordering logic and likely don't contain Waves references (the logic is generic), but verify.

#### 8f. Review test files in src/__tests__/

Open the test files. Check if test fixtures contain:
- Waves-specific asset IDs
- References to "Waves" in descriptions or comments
- Hardcoded data that assumes Waves blockchain

#### 8g. Review package.json

Verify these fields are clean:
- `name` should be `@decentralchain/assets-pairs-order`
- `description` should not mention Waves
- `keywords` should not include "waves" or "wavesplatform"
- `repository.url` should point to `Decentral-America/assets-pairs-order`
- No `@waves/*` in `dependencies` or `devDependencies`

---

### Step 9: Run the Audit Again

After fixing everything, run the same grep commands from Step 7 again:

```bash
grep -rni "waves" . --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" --include="*.d.ts" | grep -v node_modules | grep -v .git
````

**This must return ZERO results.** If anything shows up, go back and fix it.

Also verify:

```bash
grep -i "waves" package.json
```

**This must also return ZERO results.**

---

### Step 10: Rebuild and Test

```bash
# Clean everything
rm -rf node_modules dist

# Reinstall
npm install

# Run tests
npm test

# Build the browser bundle (if the build script exists)
npm run build:browser
```

All tests must pass. If any test fails because it was checking for Waves-specific data that you changed, update the test to match the new data.

---

### Step 11: Compare With the Original

Use the reference folders to confirm you haven't accidentally broken the ordering logic. The core algorithm in `src/index.js` should be identical — only branding and data files should have changed.

```bash
# Compare the main logic file
diff ~/dcc-migration/dcc-assets-pairs-order-current/src/index.js src/index.js

# Compare the utils
diff ~/dcc-migration/dcc-assets-pairs-order-current/src/utils.js src/utils.js
```

If there are differences, make sure they're intentional (Waves references you removed) and not accidental (logic you broke).

---

### Step 12: Commit and Push

```bash
# Stage all files
git add .

# Commit with a clear message
git commit -m "feat: clean migration of assets-pairs-order — remove all Waves references

- Removed Waves Travis CI badge from README
- Rewrote README with DecentralChain branding
- Verified mainnet.json, testnet.json, arbitrary.json contain no Waves assets
- Removed/updated .travis.yml
- Verified zero @waves/* dependencies
- All tests pass
- grep -rni waves returns zero results"

# Push to your GitHub repo
git push -u origin master
```

---

### Step 13: Open a Pull Request (for review)

We don't merge directly to the Decentral-America org. Instead:

1. Go to your repo on GitHub: `https://github.com/YOUR_USERNAME/assets-pairs-order`
2. Verify all files look correct in the GitHub UI
3. Notify the team lead that the migration is ready for review
4. The repo will be transferred to the `Decentral-America` org after review and approval

---

### Step 14: Write Your Migration Summary

In the Jira ticket comments (or wherever we track this), post a summary:

```
Migration Summary — assets-pairs-order

Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
Tests: [pass/fail]
Build: [pass/fail]
New repo: https://github.com/YOUR_USERNAME/assets-pairs-order

Remaining concerns: [any issues or questions]
```

---

## Acceptance Criteria

All of these must be true before this ticket can be marked as Done:

- [ ] New repo exists under Dylan's GitHub account
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] README is clean and references DecentralChain exclusively
- [ ] `npm install` completes without errors
- [ ] `npm test` passes
- [ ] Browser build (if applicable) completes without errors
- [ ] Commit history is clean with descriptive message(s)
- [ ] Team lead has been notified for review

---

## AI Prompt for Assistance

If you get stuck, you can use this prompt with an AI assistant (Claude, ChatGPT, Copilot, etc.) to help you:

```
I am migrating the npm package @decentralchain/assets-pairs-order from a Waves
blockchain fork to a standalone DecentralChain library.

The repo is: https://github.com/Decentral-America/assets-pairs-order
It was forked from: https://github.com/wavesplatform/assets-pairs-order

This package is a JavaScript utility (13 files, 76 kB) that determines the
correct ordering of two assets in a DEX trading pair. It has ZERO @waves/*
npm dependencies — its only dependency is bs58 for base58 encoding.

The npm scope was already changed to @decentralchain but the internal code
still contains Waves references in:
- Travis CI badge URL pointing to wavesplatform
- Possibly testnet.json and arbitrary.json asset data files
- README documentation

My task:
1. Find every remaining "waves" or "wavesplatform" reference in the repo
2. Replace or remove each one
3. Ensure all data files reference DecentralChain assets, not Waves assets
4. Rewrite the README for DecentralChain
5. Verify tests still pass
6. Achieve ZERO results from: grep -rni "waves" . | grep -v node_modules

The native token on DecentralChain is called "DCC" (not "WAVES").
The DecentralChain mainnet chain ID is 'L' (byte 76).
The DecentralChain testnet chain ID is 'T'.

Please help me audit this file: [paste file contents here]

Tell me every line that needs to change and what to change it to.
```

---

## Estimated Time

**1–3 hours** depending on how many hidden references you find and your familiarity with the codebase.

---

## Questions?

Reach out to the team lead or post in the migration Slack channel. This is a low-risk task so don't overthink it — the main goal is **zero Waves references** when you're done.
