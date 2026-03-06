# Migrate Waves Browser Bus Library to DecentralChain

## Assigned to: _Unassigned_

**Priority:** Medium  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`  
**Sprint:** Current  
**Story Points:** 1

---

## Summary

Migrate the `@waves/waves-browser-bus` npm package from the Waves blockchain ecosystem into a clean, standalone DecentralChain library published as `@decentralchain/browser-bus` with **zero** Waves references remaining.

---

## Background

### What is this library?

`waves-browser-bus` is a **cross-window communication library** for browser-based blockchain applications. It enables different browser windows, tabs, or iframes to communicate with each other securely. This is essential for wallet functionality because:

- The wallet may open a popup window for transaction signing
- DApps embedded in iframes need to communicate with the main wallet window
- Multiple tabs of the same wallet need to stay synchronized

**Example:** When a DApp requests a transaction signature, the wallet opens a confirmation popup. `browser-bus` handles the message passing between the DApp iframe and the wallet popup — sending the transaction data to the popup, and sending the signed transaction back.

### Where did it come from?

This package was created by the Waves blockchain team at `wavesplatform/waves-browser-bus`. The DecentralChain project currently uses it directly from the `@waves` npm scope.

### Why does this matter?

DecentralChain is establishing itself as an independent blockchain. All official SDK packages must be free of Waves branding. This is a Phase 1 leaf node with **zero `@waves/*` dependencies**, making it an easy win.

### Naming note

The original package name includes "waves" in the actual library name (`waves-browser-bus`). As part of this migration, consider renaming to simply `@decentralchain/browser-bus` to remove the "waves" from the core name itself, not just the scope.

---

## Current State of the Repo

| Field                         | Value                                              |
| ----------------------------- | -------------------------------------------------- |
| **npm package**               | `@waves/waves-browser-bus` ^0.2.7                  |
| **Current GitHub repo**       | https://github.com/wavesplatform/waves-browser-bus |
| **Fork in Decentral-America** | ❌ **Needs to be forked**                          |
| **Language**                  | TypeScript / JavaScript                            |
| **License**                   | MIT                                                |
| **`@waves/*` dependencies**   | **None**                                           |
| **Only dependency**           | `typed-ts-events` (generic typed event emitter)    |
| **Last published to npm**     | ~5 years ago                                       |

### Expected File Structure

```
waves-browser-bus/
├── src/
│   ├── index.ts              # Main entry — exports bus creation functions
│   ├── Bus.ts                # Core bus implementation (postMessage-based)
│   ├── ...                   # Message handling, serialization, etc.
├── test/
│   └── ...                   # Unit tests
├── package.json              # ⚠️ Contains @waves scope and "waves" in name
├── README.md                 # ⚠️ Likely references Waves
├── tsconfig.json
└── ...
```

> **Note:** This file structure is estimated. Your first task after cloning is to document the actual structure.

---

## Known Waves Contamination

### 1. package.json

- `name` is `@waves/waves-browser-bus` — must be changed to `@decentralchain/browser-bus`
- `repository.url` points to `wavesplatform/waves-browser-bus`
- `description`, `keywords`, `author` — check for Waves references

### 2. The Name Itself

The library name includes "waves" (`waves-browser-bus`). The new name should drop the "waves" prefix entirely: `@decentralchain/browser-bus`. This means:

- GitHub repo: `Decentral-America/browser-bus`
- npm package: `@decentralchain/browser-bus`
- Internal references to the library name must be updated

### 3. README.md

- Install instructions reference `@waves/waves-browser-bus`
- Usage examples likely import from `@waves/waves-browser-bus`
- May contain Waves badges, links, or branding
- Documentation may reference "Waves DApps" or "Waves wallet"

### 4. Source Code

- Variable names, class names, or exports may contain "waves" in their identifiers
- Comments may reference "Waves browser extension" or "Waves DApp"
- The communication protocol (postMessage) is blockchain-agnostic, but naming and message prefixes may reference Waves

### 5. Message Protocol

**⚠️ CHECK THIS:** The library may use "waves" as part of its postMessage origin check or message type prefix. For example:

```typescript
// If the library does something like this:
const MESSAGE_TYPE = 'waves-browser-bus';
```

This needs to be updated, but be aware that changing message types will break backward compatibility with any existing DApps using the old protocol. **Document any such changes**.

### 6. Test Data

- Test fixtures may reference Waves DApp URLs or Waves wallet URLs
- Mock messages may contain Waves-specific content

### 7. CI Configuration

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
git clone https://github.com/wavesplatform/waves-browser-bus.git waves-browser-bus-original
```

**You will NOT modify this folder.**

---

### Step 3: Create Your Working Copy

```bash
cp -r waves-browser-bus-original dcc-browser-bus-migrated
cd dcc-browser-bus-migrated
rm -rf .git
git init
```

---

### Step 4: Create Your New Repository on GitHub

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `browser-bus`
   - **Description:** `Cross-window browser communication library for DecentralChain DApps`
   - **Visibility:** Public
   - **Initialize:** Do NOT add README, .gitignore, or license
3. Click **Create repository**
4. Connect it:

```bash
git remote add origin https://github.com/YOUR_USERNAME/browser-bus.git
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

**Pay special attention to:** message type constants, postMessage identifiers, and any protocol-level strings that include "waves".

---

### Step 7: Fix Every Waves Reference

#### 7a. Fix package.json

```json
// BEFORE:
"name": "@waves/waves-browser-bus"

// AFTER:
"name": "@decentralchain/browser-bus"
```

Also update: `repository.url`, `description`, `keywords`, `author`, `homepage`, `bugs.url`.

#### 7b. Fix README.md

````markdown
# @decentralchain/browser-bus

Cross-window browser communication library for DecentralChain DApps and wallet applications.

Enables secure message passing between browser windows, tabs, and iframes using the postMessage API. Used for DApp-to-wallet communication, transaction signing popups, and multi-tab synchronization.

## Installation

```bash
npm install @decentralchain/browser-bus
```
````

## Usage

```typescript
import { ... } from '@decentralchain/browser-bus';
```

Refer to the source code for detailed API documentation.

## License

MIT

````

#### 7c. Fix Source Files

- Replace all "waves" references in comments, strings, and identifiers
- **Carefully review** any message protocol strings — document any changes
- Update class names or exports if they contain "waves"

#### 7d. Fix Test Files

Update test descriptions and any Waves-specific test data.

#### 7e. Remove/Update CI Configuration

Remove or update CI files referencing `wavesplatform`.

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
diff ~/dcc-migration/waves-browser-bus-original/src/ src/ -r --exclude="*.map"
```

Differences should only be branding changes plus any message protocol constant renames.

---

### Step 11: Commit and Push

```bash
git add .
git commit -m "feat: clean migration of browser-bus — remove all Waves references

- Renamed package from @waves/waves-browser-bus to @decentralchain/browser-bus
- Updated repository URLs to Decentral-America/browser-bus
- Rewrote README with DecentralChain branding
- Updated internal message protocol identifiers (if applicable)
- Verified zero @waves/* dependencies
- All tests pass
- grep -rni waves returns zero results"

git push -u origin master
```

---

### Step 12: Open a Pull Request (for review)

1. Go to your repo on GitHub
2. Verify all files look correct
3. Notify the team lead

---

### Step 13: Write Your Migration Summary

```
Migration Summary — browser-bus (formerly waves-browser-bus)

Files changed: [list them]
Waves references found: [number]
Waves references removed: [number]
Protocol constants changed: [yes/no — list any message type renames]
Tests: [pass/fail]
Build: [pass/fail]
New repo: https://github.com/YOUR_USERNAME/browser-bus

Remaining concerns: [any issues or questions]
```

---

## Acceptance Criteria

- [ ] New repo exists with clean migration
- [ ] `grep -rni "waves" . | grep -v node_modules | grep -v .git | grep -v dist` returns **zero** results
- [ ] `grep -i "waves" package.json` returns **zero** results
- [ ] No `@waves/*` packages in `dependencies` or `devDependencies`
- [ ] `package.json` name is `@decentralchain/browser-bus`
- [ ] README is clean and references DecentralChain exclusively
- [ ] Any protocol-level message type changes are documented
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] `npm test` passes
- [ ] Team lead has been notified for review

---

## AI Prompt for Assistance

```
I am migrating the npm package @waves/waves-browser-bus from the Waves blockchain
ecosystem to @decentralchain/browser-bus for the DecentralChain SDK.

The repo is: https://github.com/wavesplatform/waves-browser-bus

This package is a cross-window browser communication library using postMessage.
It enables DApp-to-wallet communication, popup signing flows, and multi-tab sync.
It has ZERO @waves/* npm dependencies — only depends on typed-ts-events.

The migration involves renaming everything from "waves" to "decentralchain" and
checking if there are protocol-level message strings containing "waves" that
need updating.

The target npm scope is @decentralchain.
The target GitHub org is Decentral-America.

Please help me audit this file: [paste file contents here]
```

---

## Estimated Time

**1–2 hours** — straightforward rename. Only complication is checking for protocol-level string constants.

---

## Questions?

Reach out to the team lead. The main question to confirm is whether any postMessage protocol identifiers containing "waves" need to be renamed (this could affect backward compatibility).
