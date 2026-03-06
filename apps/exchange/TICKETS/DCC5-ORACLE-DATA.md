# Migrate Oracle Data Library to DecentralChain

## Assigned to: _Unassigned_

**Priority:** Medium  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`  
**Sprint:** Current  
**Story Points:** 1

---

## Summary

Migrate the `@waves/oracle-data` npm package from the Waves blockchain ecosystem into a clean, standalone DecentralChain library published as `@decentralchain/oracle-data` with **zero** Waves references remaining.

---

## Background

### What is this library?

`oracle-data` is a utility library for **reading and writing oracle data on the blockchain**. On the DecentralChain (and formerly Waves) blockchain, oracles are special accounts that store key-value data on-chain. This library provides a structured way to interpret that data — it defines how oracle data entries are encoded, decoded, and validated.

**Example:** An oracle account might store the current USD/DCC exchange rate on-chain. This library helps applications read that data in a structured, type-safe way rather than parsing raw blockchain data entries manually.

### Where did it come from?

This package was created by the Waves blockchain team at `wavesplatform/oracle-data`. The DecentralChain project currently uses this package directly from the `@waves` npm scope without any fork.

### Why does this matter?

DecentralChain is establishing itself as an independent blockchain. All official SDK packages must be free of Waves branding. This is a Phase 1 leaf node with **zero `@waves/*` dependencies**, making it an easy win.

---

## Current State of the Repo

| Field                         | Value                                        |
| ----------------------------- | -------------------------------------------- |
| **npm package**               | `@waves/oracle-data` ^0.0.6                  |
| **Current GitHub repo**       | https://github.com/wavesplatform/oracle-data |
| **Fork in Decentral-America** | ❌ **Needs to be forked**                    |
| **Language**                  | TypeScript / JavaScript                      |
| **License**                   | MIT                                          |
| **`@waves/*` dependencies**   | **None**                                     |
| **Runtime dependencies**      | Zero (or minimal)                            |
| **Last published to npm**     | ~5 years ago                                 |

### Expected File Structure

```
oracle-data/
├── src/
│   ├── index.ts              # Main entry — exports oracle data utilities
│   ├── ...                   # Oracle data parsing/encoding files
├── test/
│   └── ...                   # Unit tests
├── package.json              # ⚠️ Contains @waves scope
├── README.md                 # ⚠️ Likely references Waves
├── tsconfig.json
└── ...
```

> **Note:** This file structure is estimated. Your first task after cloning is to document the actual structure.

---

## Known Waves Contamination

### 1. package.json

- `name` is `@waves/oracle-data` — must be changed to `@decentralchain/oracle-data`
- `repository.url` points to `wavesplatform/oracle-data`
- `description`, `keywords`, `author` — check for Waves references

### 2. README.md

- Install instructions reference `@waves/oracle-data`
- Usage examples likely import from `@waves/oracle-data`
- May contain Waves badges, links, or branding
- Documentation may reference "Waves oracles" or "Waves data transactions"

### 3. Source Code

- Comments or string literals may reference "Waves blockchain" or "Waves oracle"
- The oracle data format itself is blockchain-generic, but naming may reference Waves

### 4. Test Data

- Test fixtures may contain:
  - Waves-specific addresses
  - References to Waves oracle accounts
  - Waves mainnet data examples

### 5. CI Configuration

- Build badges or CI configs may reference `wavesplatform`

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

```bash
mkdir ~/dcc-migration
cd ~/dcc-migration
```

---

### Step 2: Clone the Original Waves Library (for reference)

```bash
git clone https://github.com/wavesplatform/oracle-data.git waves-oracle-data-original
```

**You will NOT modify this folder.** It's just for reference.

---

### Step 3: Create Your Working Copy

```bash
cp -r waves-oracle-data-original dcc-oracle-data-migrated
cd dcc-oracle-data-migrated
rm -rf .git
git init
```

---

### Step 4: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `oracle-data`
   - **Description:** `Oracle data parsing and encoding utilities for DecentralChain blockchain`
   - **Visibility:** Public
   - **Initialize:** Do NOT add README, .gitignore, or license
3. Click **Create repository**
4. Connect it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/oracle-data.git
```

---

### Step 5: Install Dependencies and Verify It Builds

```bash
npm install
npm test
npm run build
```

---

### Step 6: Run the Waves Audit

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist

grep -rni "wavesplatform" . | grep -v node_modules | grep -v .git | grep -v dist

grep -rn "@waves" . --include="*.ts" --include="*.js" --include="*.json" | grep -v node_modules | grep -v .git | grep -v dist

grep -i "waves" package.json
```

Write down every result.

---

### Step 7: Fix Every Waves Reference

#### 7a. Fix package.json

Update `name` to `@decentralchain/oracle-data`, update `repository.url`, `description`, `keywords`, `author`, `homepage`, `bugs.url`.

#### 7b. Fix README.md

Replace contents with a clean DecentralChain-branded version:

````markdown
# @decentralchain/oracle-data

Oracle data parsing and encoding utilities for the DecentralChain blockchain.

Provides structured access to on-chain oracle data entries — defining how oracle key-value data is encoded, decoded, and validated.

## Installation

```bash
npm install @decentralchain/oracle-data
```
````

## Usage

```typescript
import { ... } from '@decentralchain/oracle-data';
```

Refer to the source code for detailed API documentation.

## License

MIT

````

> **Note:** Update the usage example with the actual API after you've reviewed the source code.

#### 7c. Fix Source Files

Open each source file and replace all Waves references in comments, strings, and documentation.

#### 7d. Fix Test Files

Update test descriptions and any Waves-specific test data.

#### 7e. Remove/Update CI Configuration

Remove or update Travis CI, GitHub Actions, or other CI files referencing `wavesplatform`.

---

### Step 8: Run the Audit Again

```bash
grep -rni "waves" . --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" | grep -v node_modules | grep -v .git | grep -v dist
````

**This must return ZERO results.**

---

### Step 9: Rebuild and Test

```bash
rm -rf node_modules dist
npm install
npm run build
npm test
```

---

### Step 10: Compare With the Original

```bash
diff ~/dcc-migration/waves-oracle-data-original/src/ src/ -r --exclude="*.map"
```

Only branding changes should appear.

---

### Step 11: Commit and Push

```bash
git add .
git commit -m "feat: clean migration of oracle-data — remove all Waves references

- Renamed package from @waves/oracle-data to @decentralchain/oracle-data
- Updated repository URLs to Decentral-America/oracle-data
- Rewrote README with DecentralChain branding
- Removed Waves CI badges and configuration
- Verified zero @waves/* dependencies
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
Migration Summary — oracle-data

Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
Tests: [pass/fail]
Build: [pass/fail]
New repo: https://github.com/YOUR_USERNAME/oracle-data

Remaining concerns: [any issues or questions]
```

---

## Acceptance Criteria

- [ ] New repo exists with clean migration
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `package.json` name is `@decentralchain/oracle-data`
- [ ] README is clean and references DecentralChain exclusively
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors (if build script exists)
- [ ] `npm test` passes
- [ ] Team lead has been notified for review

---

## AI Prompt for Assistance

```
I am migrating the npm package @waves/oracle-data from the Waves blockchain
ecosystem to @decentralchain/oracle-data for the DecentralChain SDK.

The repo is: https://github.com/wavesplatform/oracle-data

This package provides oracle data parsing and encoding utilities. It has ZERO
@waves/* npm dependencies and zero (or minimal) runtime dependencies.

The migration is a pure rename — no logic changes needed.

The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**1–2 hours** — straightforward rename with zero dependency complications.

---

## Questions?

Reach out to the team lead or post in the migration Slack channel. This is a simple leaf-node migration.
