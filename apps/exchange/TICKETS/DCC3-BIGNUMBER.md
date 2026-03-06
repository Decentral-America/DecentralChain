# Migrate BigNumber Library to DecentralChain

## Assigned to: _Unassigned_

**Priority:** Critical  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`  
**Sprint:** Current  
**Story Points:** 1

---

## Summary

Migrate the `@waves/bignumber` npm package from the Waves blockchain ecosystem into a clean, standalone DecentralChain library published as `@decentralchain/bignumber` with **zero** Waves references remaining.

---

## Background

### What is this library?

`bignumber` is a **precision arithmetic wrapper** around the popular `bignumber.js` library. JavaScript natively handles numbers as 64-bit floating point, which means large integers (like blockchain token amounts with 8 decimal places) lose precision. This library provides a `BigNumber` class that handles arbitrary-precision math safely.

**Example:** When a user has `100000000` units of DCC (which equals `1.00000000` DCC with 8 decimal places), regular JavaScript would risk rounding errors on operations like addition, subtraction, or comparison. This library ensures those calculations are exact.

### Where did it come from?

This package was created by the Waves blockchain team at `wavesplatform/bignumber`. It wraps `bignumber.js` with a Waves-branded API. The DecentralChain project currently uses this package directly from the `@waves` npm scope.

### Why does this matter?

DecentralChain is establishing itself as an independent blockchain. All official SDK packages must be free of Waves branding, Waves URLs, and Waves-specific data. This package is used by **multiple downstream packages** — `data-entities` (Phase 2), `data-service-client-js` (Phase 3), and `signature-adapter` (Phase 4) — making it a **critical Phase 1 blocker**.

### Why is this important?

This is one of the **simplest leaf-node packages** in the dependency tree. It has:

- **Zero** `@waves/*` npm dependencies (only depends on `bignumber.js`)
- Very small codebase — it's essentially a thin wrapper
- Written in **TypeScript**
- No blockchain-specific logic — it's pure math

It's a quick win that unblocks multiple Phase 2 and Phase 3 packages.

---

## Current State of the Repo

| Field                         | Value                                                         |
| ----------------------------- | ------------------------------------------------------------- |
| **npm package**               | `@waves/bignumber` ^1.2.0                                     |
| **Current GitHub repo**       | https://github.com/wavesplatform/bignumber                    |
| **Fork in Decentral-America** | ❌ **Needs to be forked**                                     |
| **Language**                  | TypeScript                                                    |
| **License**                   | MIT                                                           |
| **`@waves/*` dependencies**   | **None**                                                      |
| **Only dependency**           | `bignumber.js` (arbitrary-precision math, blockchain-generic) |
| **Last published to npm**     | ~5 years ago                                                  |

### Expected File Structure

```
bignumber/
├── src/
│   ├── index.ts              # Main entry — BigNumber class wrapper
│   └── ...                   # Utility/helper files
├── test/
│   └── ...                   # Unit tests for arithmetic operations
├── package.json              # ⚠️ Contains @waves scope
├── README.md                 # ⚠️ Likely references Waves
├── tsconfig.json             # TypeScript configuration
└── ...                       # Build configs, CI, etc.
```

> **Note:** This file structure is estimated. Your first task after cloning is to document the actual structure.

---

## Known Waves Contamination

### 1. package.json

- `name` is `@waves/bignumber` — must be changed to `@decentralchain/bignumber`
- `repository.url` points to `wavesplatform/bignumber` — must point to `Decentral-America/bignumber`
- `description`, `keywords`, `author` — check for Waves references

### 2. README.md

- Install instructions reference `@waves/bignumber` — must reference `@decentralchain/bignumber`
- Usage examples likely import from `@waves/bignumber`
- May contain Waves badges, links, or branding

### 3. Source Code

- Imports, exports, and comments may reference "Waves"
- The core math logic should be blockchain-agnostic, but verify

### 4. CI Configuration

- `.travis.yml`, `.github/workflows/`, or similar — may reference Waves infrastructure
- Build badges may point to wavesplatform repos

### 5. LICENSE / CHANGELOG

- Author or copyright notices may reference Waves

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed (`git --version` to check)
- **Node.js** installed (v16 or higher — `node --version` to check)
- **npm** installed (comes with Node.js — `npm --version` to check)
- A **GitHub account** (your personal one is fine)
- A **code editor** (VS Code recommended)
- Basic familiarity with **TypeScript**

---

### Step 1: Create Your Workspace

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration
```

---

### Step 2: Clone the Original Waves Library (for reference)

```bash
git clone https://github.com/wavesplatform/bignumber.git waves-bignumber-original
```

This gives you the original Waves library. **You will NOT modify this folder.** It's just for reference.

---

### Step 3: Create Your Working Copy

Since there is no existing Decentral-America fork, we start directly from the Waves repo.

```bash
# Copy as your starting point
cp -r waves-bignumber-original dcc-bignumber-migrated

# Go into your new working folder
cd dcc-bignumber-migrated

# Remove the old git history (we're starting fresh)
rm -rf .git

# Initialize a new git repo
git init
```

---

### Step 4: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `bignumber`
   - **Description:** `Arbitrary-precision BigNumber wrapper for DecentralChain SDK`
   - **Visibility:** Public
   - **Initialize:** Do NOT add README, .gitignore, or license (we'll bring those from the source)
3. Click **Create repository**
4. Connect it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/bignumber.git
```

Your folder structure should now look like:

```
~/dcc-migration/
├── waves-bignumber-original/       ← Original Waves (read-only reference)
└── dcc-bignumber-migrated/         ← YOUR working copy (edit this one)
```

---

### Step 5: Install Dependencies and Verify It Builds

```bash
npm install
npm test
npm run build
```

Note any failures — they may have been broken before you started.

---

### Step 6: Run the Waves Audit

Search for every remaining Waves reference:

```bash
# Search all files for "waves" (case-insensitive)
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist

# Search for wavesplatform specifically
grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist

# Search for any @waves imports
grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

# Check package.json
grep -i "waves" package.json
```

Write down every result. Each one needs to be fixed.

---

### Step 7: Fix Every Waves Reference

Go through each result from Step 6 and fix it:

#### 7a. Fix package.json

```json
// BEFORE:
"name": "@waves/bignumber"

// AFTER:
"name": "@decentralchain/bignumber"
```

Also update: `repository.url`, `description`, `keywords`, `author`, `homepage`, `bugs.url` — all should reference `Decentral-America/bignumber` or `DecentralChain`.

#### 7b. Fix README.md

Replace the entire contents with a clean version:

````markdown
# @decentralchain/bignumber

Arbitrary-precision BigNumber wrapper for the DecentralChain SDK.

Provides safe arithmetic for blockchain token amounts that exceed JavaScript's native number precision.

## Installation

```bash
npm install @decentralchain/bignumber
```
````

## Usage

```typescript
import { BigNumber } from '@decentralchain/bignumber';

const amount = new BigNumber('100000000');
const fee = new BigNumber('100000');
const total = amount.add(fee);

console.log(total.toString()); // '100100000'
```

## API

### `new BigNumber(value)`

Creates a new BigNumber instance from a string, number, or another BigNumber.

### Instance Methods

- `.add(other)` — Addition
- `.sub(other)` — Subtraction
- `.mul(other)` — Multiplication
- `.div(other)` — Division
- `.mod(other)` — Modulo
- `.eq(other)` — Equality check
- `.lt(other)` — Less than
- `.gt(other)` — Greater than
- `.lte(other)` — Less than or equal
- `.gte(other)` — Greater than or equal
- `.isNaN()` — Check if NaN
- `.isFinite()` — Check if finite
- `.toString()` — Convert to string
- `.toFixed(dp?)` — Fixed-point string representation
- `.toNumber()` — Convert to JavaScript number (may lose precision!)

## License

MIT

````

#### 7c. Fix Source Files

Open each `.ts` file in `src/` and search for `waves` or `Waves`. Replace any references with `DecentralChain` or `DCC` as appropriate. The core math logic should be blockchain-agnostic.

#### 7d. Fix Test Files

Open each test file and check for Waves-specific references in descriptions, comments, or test data.

#### 7e. Fix CI Configuration

Remove or update `.travis.yml`, `.github/workflows/`, or any other CI files that reference `wavesplatform`.

---

### Step 8: Run the Audit Again

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist
````

**This must return ZERO results.**

```bash
grep -i "waves" package.json
```

**This must also return ZERO results.**

---

### Step 9: Rebuild and Test

```bash
rm -rf node_modules dist
npm install
npm run build
npm test
```

All tests must pass. The build must complete without errors.

---

### Step 10: Compare With the Original

```bash
# Compare core logic files to ensure you didn't break anything
diff ~/dcc-migration/waves-bignumber-original/src/ src/ -r --exclude="*.map"
```

Differences should only be Waves → DecentralChain branding changes, not logic changes.

---

### Step 11: Commit and Push

```bash
git add .
git commit -m "feat: clean migration of bignumber — remove all Waves references

- Renamed package from @waves/bignumber to @decentralchain/bignumber
- Updated repository URLs to Decentral-America/bignumber
- Rewrote README with DecentralChain branding
- Removed Waves CI badges and configuration
- Verified zero @waves/* dependencies
- All tests pass
- grep -rni waves returns zero results"

git push -u origin master
```

---

### Step 12: Open a Pull Request (for review)

1. Go to your repo on GitHub: `https://github.com/YOUR_USERNAME/bignumber`
2. Verify all files look correct in the GitHub UI
3. Notify the team lead that the migration is ready for review
4. The repo will be transferred to the `Decentral-America` org after review and approval

---

### Step 13: Write Your Migration Summary

Post in the Jira ticket:

```
Migration Summary — bignumber

Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
Tests: [pass/fail]
Build: [pass/fail]
New repo: https://github.com/YOUR_USERNAME/bignumber

Remaining concerns: [any issues or questions]
```

---

## Acceptance Criteria

- [ ] New repo exists with clean migration
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `package.json` name is `@decentralchain/bignumber`
- [ ] README is clean and references DecentralChain exclusively
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] Commit history is clean with descriptive message(s)
- [ ] Team lead has been notified for review

---

## AI Prompt for Assistance

If you get stuck, you can use this prompt with an AI assistant:

```
I am migrating the npm package @waves/bignumber from the Waves blockchain
ecosystem to @decentralchain/bignumber for the DecentralChain SDK.

The repo is: https://github.com/wavesplatform/bignumber

This package is a TypeScript wrapper around bignumber.js that provides
arbitrary-precision arithmetic for blockchain token amounts. It has ZERO
@waves/* npm dependencies — its only runtime dependency is bignumber.js.

The package needs a pure rename — no logic changes. All "waves" and
"wavesplatform" references in package.json, README, source code, tests,
and CI config need to be replaced with "decentralchain" or "DecentralChain".

The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.

Please help me audit this file: [paste file contents here]

Tell me every line that needs to change and what to change it to.
```

---

## Estimated Time

**1–2 hours** — this is a straightforward rename with zero dependency complications.

---

## Questions?

Reach out to the team lead or post in the migration Slack channel. This is the simplest type of migration — pure rename, no dependency changes, no logic changes.
