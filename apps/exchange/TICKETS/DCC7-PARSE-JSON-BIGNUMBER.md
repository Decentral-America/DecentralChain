# Migrate Parse JSON BigNumber Library to DecentralChain

## Assigned to: _Unassigned_

**Priority:** Critical  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`  
**Sprint:** Current  
**Story Points:** 1

---

## Summary

Migrate the `@waves/parse-json-bignumber` npm package from the Waves blockchain ecosystem into a clean, standalone DecentralChain library published as `@decentralchain/parse-json-bignumber` with **zero** Waves references remaining.

---

## Background

### What is this library?

`parse-json-bignumber` is a **safe JSON parser** that handles large numbers without losing precision. Standard JavaScript `JSON.parse()` converts all numbers to 64-bit floating point, which means numbers larger than `Number.MAX_SAFE_INTEGER` (9,007,199,254,740,991) silently lose precision. Blockchain transaction amounts frequently exceed this limit.

**Example:** A transaction with `amount: 10000000000000000` would be silently corrupted by `JSON.parse()` into `10000000000000000` (which may look the same but internally loses precision for edge cases). This library provides a custom `JSON.parse()` and `JSON.stringify()` that preserve large integers as strings or BigNumber objects.

### Where did it come from?

This package was created by the Waves blockchain team. It is a **transitive dependency** — it's not in the `dcc-react` `package.json` directly, but it's used internally by `@decentralchain/marshall` (the transaction serialization library).

### Why does this matter?

This package is a **Phase 1 blocker** for `@decentralchain/marshall` (DCC-2, assigned to Fabrizio). Until this package is migrated, marshall cannot fully remove its `@waves/*` dependency. Fabrizio has three options for handling this (fork, replace with `json-bigint`, or inline) — completing this ticket gives him Option A (fork) as a clean solution.

### Why is this a quick task?

This is an extremely small utility package:

- **Zero** `@waves/*` npm dependencies
- Very small codebase — likely just one or two source files
- The logic is generic JSON parsing — nothing blockchain-specific
- Pure rename migration

---

## Current State of the Repo

| Field                         | Value                                                        |
| ----------------------------- | ------------------------------------------------------------ |
| **npm package**               | `@waves/parse-json-bignumber` ^1.0.1                         |
| **Current GitHub repo**       | Needs research — likely `wavesplatform/parse-json-bignumber` |
| **Fork in Decentral-America** | ❌ **Needs to be forked**                                    |
| **Language**                  | JavaScript / TypeScript                                      |
| **License**                   | MIT (expected)                                               |
| **`@waves/*` dependencies**   | **None**                                                     |
| **Runtime dependencies**      | Possibly `bignumber.js` or similar BigNumber library         |
| **Used by**                   | `@decentralchain/marshall` (via `src/jsonMethods.ts`)        |
| **Last published to npm**     | ~5 years ago                                                 |

> **⚠ Research Required:** The exact GitHub repo URL needs to be confirmed. Try these in order:
>
> 1. https://github.com/wavesplatform/parse-json-bignumber
> 2. Search npm registry: `npm view @waves/parse-json-bignumber repository.url`
> 3. Search GitHub: https://github.com/wavesplatform?q=parse-json

### Expected File Structure

```
parse-json-bignumber/
├── src/
│   └── parse-json-bignumber.ts   # Main entry — custom JSON.parse/stringify
├── dist/
│   └── parse-json-bignumber.js   # Compiled output
├── test/
│   └── ...                       # Unit tests
├── package.json                  # ⚠️ Contains @waves scope
├── README.md                     # ⚠️ Likely references Waves
└── ...
```

---

## Known Waves Contamination

### 1. package.json

- `name` is `@waves/parse-json-bignumber` — must be changed to `@decentralchain/parse-json-bignumber`
- `repository.url` — must point to `Decentral-America/parse-json-bignumber`
- `description`, `keywords`, `author` — check for Waves references

### 2. README.md

- Install instructions reference `@waves/parse-json-bignumber`
- May contain Waves badges, links, or branding

### 3. Source Code

- The JSON parsing logic is completely generic — unlikely to contain Waves references
- Check for comments mentioning "Waves"

### 4. Import Path in Marshall

Marshall imports this package via a specific dist path:

```typescript
import * as create from '@waves/parse-json-bignumber/dist/parse-json-bignumber';
```

When migrating, ensure the **same dist structure** is maintained so that updating the import path in marshall is a straightforward rename.

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed
- **Node.js** v16+ installed
- **npm** installed
- A **GitHub account**
- A **code editor** (VS Code recommended)

---

### Step 1: Find the Repository

First, locate the actual GitHub repo:

```bash
# Try the obvious URL
curl -s -o /dev/null -w "%{http_code}" https://github.com/wavesplatform/parse-json-bignumber

# If 404, check npm for the repo URL
npm view @waves/parse-json-bignumber repository.url
```

---

### Step 2: Create Your Workspace

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration
```

---

### Step 3: Clone the Original Waves Library

```bash
# Replace URL if Step 1 found a different location
git clone https://github.com/wavesplatform/parse-json-bignumber.git waves-parse-json-bignumber-original
```

---

### Step 4: Create Your Working Copy

```bash
cp -r waves-parse-json-bignumber-original dcc-parse-json-bignumber-migrated
cd dcc-parse-json-bignumber-migrated
rm -rf .git
git init
```

---

### Step 5: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `parse-json-bignumber`
   - **Description:** `Safe JSON parser for large numbers — preserves precision for DecentralChain SDK`
   - **Visibility:** Public
   - **Initialize:** Do NOT add README, .gitignore, or license
3. Click **Create repository**
4. Connect it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/parse-json-bignumber.git
```

---

### Step 6: Install Dependencies and Verify It Builds

```bash
npm install
npm test
npm run build
```

---

### Step 7: Run the Waves Audit

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist

grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist

grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

grep -i "waves" package.json
```

---

### Step 8: Fix Every Waves Reference

#### 8a. Fix package.json

```json
// BEFORE:
"name": "@waves/parse-json-bignumber"

// AFTER:
"name": "@decentralchain/parse-json-bignumber"
```

Also update: `repository.url`, `description`, `keywords`, `author`.

#### 8b. Fix README.md

````markdown
# @decentralchain/parse-json-bignumber

Safe JSON parser that preserves precision for large numbers. Used by the DecentralChain SDK to prevent precision loss when parsing blockchain transaction data.

Standard `JSON.parse()` silently corrupts large integers. This library provides custom `JSON.parse()` and `JSON.stringify()` that handle BigNumber values safely.

## Installation

```bash
npm install @decentralchain/parse-json-bignumber
```
````

## Usage

```javascript
import * as create from '@decentralchain/parse-json-bignumber/dist/parse-json-bignumber';

const { parse, stringify } = create();

// Safe parsing — large numbers are preserved
const data = parse('{"amount": 10000000000000000}');

// Safe stringification
const json = stringify(data);
```

## License

MIT

````

#### 8c. Fix Source Files

Review all source files for Waves references in comments.

#### 8d. Verify dist/ Structure

**CRITICAL:** The output `dist/parse-json-bignumber.js` must exist at the same relative path, because marshall imports it via:

```typescript
import * as create from '@decentralchain/parse-json-bignumber/dist/parse-json-bignumber';
````

Verify the build produces this file.

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

# Verify the critical dist path exists
ls dist/parse-json-bignumber.js
```

---

### Step 11: Commit and Push

```bash
git add .
git commit -m "feat: clean migration of parse-json-bignumber — remove all Waves references

- Renamed package from @waves/parse-json-bignumber to @decentralchain/parse-json-bignumber
- Updated repository URLs to Decentral-America/parse-json-bignumber
- Rewrote README with DecentralChain branding
- Verified dist/parse-json-bignumber.js output path is preserved
- Zero @waves/* dependencies
- All tests pass
- grep -rni waves returns zero results"

git push -u origin master
```

---

### Step 12: Open a Pull Request and Notify

1. Go to your repo on GitHub
2. Verify all files look correct
3. **Notify Fabrizio** (DCC-2 assignee) that this package is ready — he's waiting on this to complete the marshall migration

---

### Step 13: Write Your Migration Summary

```
Migration Summary — parse-json-bignumber

Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
dist/parse-json-bignumber.js path preserved: [yes/no]
Tests: [pass/fail]
Build: [pass/fail]
New repo: https://github.com/YOUR_USERNAME/parse-json-bignumber

Remaining concerns: [any issues or questions]
```

---

## Acceptance Criteria

- [ ] GitHub repo for source confirmed (wavesplatform org or elsewhere)
- [ ] New repo exists with clean migration
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `package.json` name is `@decentralchain/parse-json-bignumber`
- [ ] `dist/parse-json-bignumber.js` output file exists at the correct path
- [ ] README is clean and references DecentralChain exclusively
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] Fabrizio (DCC-2) has been notified
- [ ] Team lead has been notified for review

---

## AI Prompt for Assistance

```
I am migrating the npm package @waves/parse-json-bignumber from the Waves
blockchain ecosystem to @decentralchain/parse-json-bignumber.

This package provides safe JSON.parse() and JSON.stringify() that handle
BigNumber values without losing precision. It has ZERO @waves/* dependencies.

It's used by @decentralchain/marshall via this import:
import * as create from '@waves/parse-json-bignumber/dist/parse-json-bignumber';

The migration is a pure rename. The dist/ output structure must be preserved
so that marshall can simply update its import path.

The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**1–2 hours** — very small package, pure rename.

---

## Questions?

Reach out to the team lead. The main risk is confirming the source repo location (it may not be an obvious URL). If the repo can't be found, check npm registry metadata or ask the team.
