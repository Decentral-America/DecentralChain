# Replace waves-transactions.min.js Bundled File & Final Integration

## Assigned to: _Unassigned_

**Priority:** Critical  
**Type:** Task  
**Labels:** `tech-debt`, `migration`, `sdk`, `final-integration`  
**Sprint:** Current  
**Story Points:** 5

---

## Summary

Replace the pre-built bundled file `public/waves-transactions.min.js` with a freshly built version from the fully migrated `@decentralchain/waves-transactions` package, rename it appropriately, update all references in the application, and perform a **complete end-to-end integration test** of the entire `dcc-react` wallet with ALL migrated packages. This is the **final ticket** — completing it means the entire Waves-to-DecentralChain SDK migration is done.

---

## Background

### What is this file?

`public/waves-transactions.min.js` is a **pre-built, minified JavaScript bundle** of the `waves-transactions` library. It's loaded as a `<script>` tag in `index.html` and makes the transaction library available as a global variable (likely `window.WavesTransactions` or similar) for use by:

- Legacy code that doesn't use module imports
- Inline scripts in the HTML
- Third-party integrations that need direct access to transaction functions

### Where did it come from?

This file was built from the original Waves `waves-transactions` library and committed directly to the repository. It's a **snapshot** — it doesn't auto-update when the npm package is updated. This means it may contain **older code** with different bugs/features than the npm version.

### Why does this matter?

This file contains **compiled Waves code** with:

1. Hardcoded chain ID `'W'` (87) for Waves mainnet
2. Hardcoded Waves node URLs
3. Waves-specific signing logic
4. The name "waves" in the filename itself

Even if every npm package is migrated, **this file is loaded at runtime** and will override or conflict with the migrated packages if not also updated.

### Why is this Phase 5?

This file must be rebuilt from the **fully migrated** `@decentralchain/waves-transactions` (DCC-15, Phase 3). Until DCC-15 is complete and verified, this file cannot be properly rebuilt.

### What makes this ticket special?

This is the **final integration ticket**. Beyond replacing the file, it requires:

1. Full application build verification
2. End-to-end wallet testing (connect, send, receive, DEX)
3. Verification that **zero** `@waves/*` references remain anywhere in the project
4. Final sign-off on the entire migration

---

## Current State

| Field               | Value                                                    |
| ------------------- | -------------------------------------------------------- |
| **Current file**    | `public/waves-transactions.min.js`                       |
| **File size**       | Needs measurement                                        |
| **Source library**  | `@decentralchain/waves-transactions` (DCC-15)            |
| **Loaded from**     | `<script>` tag in `index.html`                           |
| **Global variable** | Likely `window.WavesTransactions` or similar — VERIFY    |
| **Also check**      | `public/trading-view/charting_library.min.js` — separate |

### File Reference in index.html

```html
<!-- BEFORE (expected): -->
<script src="/waves-transactions.min.js"></script>

<!-- Or possibly: -->
<script src="./waves-transactions.min.js"></script>
<script src="%PUBLIC_URL%/waves-transactions.min.js"></script>
```

### File Reference in Source Code

The global variable exposed by this bundle may be used in source code:

```typescript
// LOOK FOR:
(window as any).WavesTransactions
(window as any).Waves
WavesTransactions.transfer(...)
```

---

## Known Waves Contamination

### 1. The Filename Itself

`waves-transactions.min.js` contains "waves" in the name.

### 2. Compiled Code Inside the Bundle

The minified JS contains compiled Waves code with:

- Chain ID `'W'` / byte `87`
- Node URLs like `nodes.wavesnodes.com`
- `'WAVES'` asset references
- Waves function/variable names (though minified, some strings survive)

### 3. index.html Script Tag

The `<script>` tag references the old filename.

### 4. Source Code Global Variable References

Any source code that uses `window.WavesTransactions` or similar.

### 5. CSP Headers

If Content Security Policy headers reference the filename, they may need updating.

### 6. Service Worker / Cache

If there's a service worker or build cache that references the old filename.

---

## Step-by-Step Instructions

### Prerequisites

Before starting, make sure you have:

- **Git** installed
- **Node.js** v16+ installed
- **npm** installed
- A **code editor** (VS Code recommended)
- **DCC-15 (`@decentralchain/waves-transactions`) MUST be completed and verified**
- All other DCC tickets (DCC-1 through DCC-16) should be complete
- Access to the `dcc-react` repository

---

### Step 1: Verify DCC-15 is Complete

```bash
cd ~/dcc-migration/dcc-waves-transactions  # or wherever DCC-15 was migrated

# Verify the build
npm run build

# Verify no Waves references
grep -rni "waves" dist/ | head -20
```

---

### Step 2: Analyze the Current Bundled File

```bash
cd /path/to/dcc-react

echo "--- File size ---"
ls -la public/waves-transactions.min.js

echo "--- Waves references in the bundle ---"
grep -oc "waves" public/waves-transactions.min.js
grep -oc "wavesnodes" public/waves-transactions.min.js
grep -oc "WAVES" public/waves-transactions.min.js

echo "--- How it's loaded in index.html ---"
grep -i "waves-transactions" index.html

echo "--- How it's used in source code ---"
grep -rni "WavesTransactions\|waves-transactions" src/ --include="*.ts" --include="*.tsx" --include="*.js"

echo "--- Script tags in index.html ---"
grep "<script" index.html
```

---

### Step 3: Build the New Bundle

From the migrated `@decentralchain/waves-transactions` repository:

```bash
cd ~/dcc-migration/dcc-waves-transactions

# Clean build
rm -rf node_modules dist
npm install
npm run build

# Create a browser bundle
# Option A: If the project has a bundle script
npm run bundle || npm run build:browser

# Option B: Use webpack/rollup manually
npx webpack --config webpack.config.js --mode production

# Option C: Use esbuild for quick bundling
npx esbuild dist/index.js --bundle --minify --outfile=dcc-transactions.min.js --format=iife --global-name=DCCTransactions
```

> **⚠ IMPORTANT:** The bundle must expose the same API as the old file. Check what global variable name was used and match it (or update all references).

---

### Step 4: Verify the New Bundle

```bash
echo "--- New bundle size ---"
ls -la dcc-transactions.min.js

echo "--- Waves references in new bundle ---"
grep -oc "waves" dcc-transactions.min.js
# Should be ZERO (or very close to it — some may survive in minified code)

echo "--- Chain ID check ---"
# The minified code should contain 'L' (76) not 'W' (87) for chain defaults
grep -o "'L'" dcc-transactions.min.js | wc -l

echo "--- Quick functional test ---"
node -e "
const fs = require('fs');
const code = fs.readFileSync('dcc-transactions.min.js', 'utf8');
eval(code);
console.log('Global available:', typeof DCCTransactions !== 'undefined');
console.log('transfer function:', typeof DCCTransactions.transfer);
"
```

---

### Step 5: Replace the File in dcc-react

```bash
cd /path/to/dcc-react

# Backup the old file
cp public/waves-transactions.min.js public/waves-transactions.min.js.bak

# Copy the new file
cp ~/dcc-migration/dcc-waves-transactions/dcc-transactions.min.js public/dcc-transactions.min.js

# Remove the old file
rm public/waves-transactions.min.js
```

---

### Step 6: Update index.html

```html
<!-- BEFORE: -->
<script src="/waves-transactions.min.js"></script>

<!-- AFTER: -->
<script src="/dcc-transactions.min.js"></script>
```

---

### Step 7: Update Global Variable References in Source Code

Find all references to the old global variable:

```bash
grep -rni "WavesTransactions" src/ --include="*.ts" --include="*.tsx" --include="*.js"
grep -rni "waves-transactions" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.html"
```

Update each reference:

```typescript
// BEFORE:
const tx = (window as any).WavesTransactions.transfer(...);

// AFTER:
const tx = (window as any).DCCTransactions.transfer(...);
```

> **Note:** If the global variable name must stay the same for backward compatibility, rebuild the bundle with the old global name:
>
> ```bash
> npx esbuild dist/index.js --bundle --minify --outfile=dcc-transactions.min.js --format=iife --global-name=WavesTransactions
> ```
>
> Then only the filename and file contents change, not the API.

---

### Step 8: Update Vite/Build Configuration (if applicable)

Check if any build configuration references the old filename:

```bash
grep -rni "waves-transactions" vite.config.ts webpack.config.js tsconfig*.json package.json
```

Update any references found.

---

### Step 9: Update CSP Headers (if applicable)

Check for Content Security Policy configuration:

```bash
grep -rni "waves-transactions" docker/ nginx/ --include="*.conf"
grep -rni "waves-transactions" src/ --include="*.ts" | grep -i "csp\|content.security\|helmet"
```

---

### Step 10: Update package.json — Replace ALL @waves Dependencies

This is the final package.json cleanup. Ensure **every** `@waves/*` dependency is now `@decentralchain/*`:

```bash
grep "@waves" package.json
```

**This MUST return ZERO results.**

If any remain, update them:

```bash
# For each remaining @waves package:
npm uninstall @waves/package-name
npm install @decentralchain/package-name
```

---

### Step 11: Full Application Build

```bash
# Clean everything
rm -rf node_modules dist .vite

# Fresh install
npm install

# Build
npm run build

# Check for build errors
echo $?
```

---

### Step 12: Run the FINAL Waves Audit on the Entire Project

```bash
echo "=== FINAL PROJECT-WIDE WAVES AUDIT ==="

echo "--- @waves in package.json ---"
grep "@waves" package.json

echo "--- @waves in package-lock.json ---"
grep "@waves" package-lock.json | head -20

echo "--- @waves in source code ---"
grep -rn "@waves" src/ --include="*.ts" --include="*.tsx" --include="*.js" | wc -l

echo "--- waves-transactions filename references ---"
grep -rni "waves-transactions" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.html" --include="*.json" --include="*.conf" | grep -v node_modules | grep -v .git | grep -v .bak

echo "--- waves in public directory ---"
ls public/ | grep -i waves

echo "--- waves word in source ---"
grep -rni "waves" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v .git | wc -l

echo "--- wavesplatform URLs ---"
grep -rni "wavesplatform\|wavesnodes" . | grep -v node_modules | grep -v .git | grep -v .bak

echo "--- Chain ID 'W' in source ---"
grep -rn "'W'" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

**Goal: ZERO Waves references across the entire project** (excluding documentation/migration notes and `node_modules`).

---

### Step 13: End-to-End Wallet Testing

This is the **final integration test**. The wallet must work end-to-end.

#### 13a. Application Startup

```bash
npm run dev
# Open browser to http://localhost:5173 (or configured port)
```

Verify:

- [ ] Application loads without console errors
- [ ] No 404 errors for `waves-transactions.min.js`
- [ ] `dcc-transactions.min.js` loads successfully
- [ ] Global variable is accessible (check browser console)

#### 13b. Wallet Connection

- [ ] Create a new wallet (seed generation works)
- [ ] Import an existing wallet (seed import works)
- [ ] Address displayed correctly (starts with correct DCC prefix)
- [ ] Balance loads from DCC node (not Waves node)

#### 13c. Transaction Sending

- [ ] Transfer DCC to another address
- [ ] Transaction broadcasts to DCC node
- [ ] Transaction appears in history after confirmation
- [ ] Correct chain ID in transaction bytes

#### 13d. DEX Functionality

- [ ] Trading pairs load from DCC data service (not Waves)
- [ ] Order placement works
- [ ] Chart data loads

#### 13e. Asset Browser

- [ ] Asset search works
- [ ] Asset details load correctly
- [ ] Balance for custom assets displays correctly

#### 13f. Console Check

```javascript
// In browser console:
console.log('Global:', typeof DCCTransactions); // or WavesTransactions
console.log(
  'No Waves URLs:',
  !performance.getEntriesByType('resource').some((r) => r.name.includes('wavesnodes'))
);
```

---

### Step 14: Commit Everything

```bash
git add .
git commit -m "feat: replace waves-transactions.min.js with migrated DCC bundle — MIGRATION COMPLETE

Final Phase 5 of the Waves→DecentralChain SDK migration:

- Rebuilt waves-transactions bundle from fully migrated @decentralchain/waves-transactions
- Renamed public/waves-transactions.min.js → public/dcc-transactions.min.js
- Updated index.html script tag to reference new file
- Updated all source code global variable references
- Updated package.json — zero @waves/* dependencies remain
- Full application build passes
- End-to-end wallet testing completed

This completes the entire 17-item SDK migration:
- Phase 1: 7 leaf node packages ✅
- Phase 2: 6 first-dependent packages ✅
- Phase 3: 2 second-dependent packages ✅
- Phase 4: 1 top-level package (signature-adapter) ✅
- Phase 5: Bundled file replacement + final integration ✅

grep -rni waves on the entire project returns ZERO results."

git push origin master
```

---

### Step 15: Write the Final Migration Report

```markdown
# DecentralChain SDK Migration — FINAL REPORT

## Summary

All 17 migration items have been completed. The dcc-react wallet application
has zero remaining @waves/\* references.

## Migration Items Completed

| #      | Package / Item                   | Phase | Assignee | Status |
| ------ | -------------------------------- | ----- | -------- | ------ |
| DCC-1  | assets-pairs-order               | 1     | Dylan    | ✅     |
| DCC-2  | marshall                         | 2     | Fabrizio | ✅     |
| DCC-3  | bignumber                        | 1     | [name]   | ✅     |
| DCC-4  | ts-lib-crypto                    | 1     | [name]   | ✅     |
| DCC-5  | oracle-data                      | 1     | [name]   | ✅     |
| DCC-6  | browser-bus                      | 1     | [name]   | ✅     |
| DCC-7  | parse-json-bignumber             | 1     | [name]   | ✅     |
| DCC-8  | ts-types                         | 1     | [name]   | ✅     |
| DCC-9  | data-entities                    | 2     | [name]   | ✅     |
| DCC-10 | ledger                           | 2     | [name]   | ✅     |
| DCC-11 | node-api-js                      | 2     | [name]   | ✅     |
| DCC-12 | protobuf-serialization           | 2     | [name]   | ✅     |
| DCC-13 | money-like-to-node               | 2     | [name]   | ✅     |
| DCC-14 | data-service-client-js           | 3     | [name]   | ✅     |
| DCC-15 | waves-transactions               | 3     | [name]   | ✅     |
| DCC-16 | signature-adapter                | 4     | [name]   | ✅     |
| DCC-17 | bundled file + final integration | 5     | [name]   | ✅     |

## Chain ID Changes

- Mainnet: 'W' (87) → 'L' (76)
- Testnet: 'T' (84) → 'T' (84) [unchanged]

## Verification

- [ ] `grep -rni "waves" package.json` returns zero results
- [ ] `grep -rni "@waves" src/` returns zero results
- [ ] `ls public/ | grep waves` returns zero results
- [ ] Full application build passes
- [ ] End-to-end wallet testing passes
- [ ] No Waves node/API URLs remain in deployed code

## Remaining Items (Out of Scope)

- [ ] Rename `@decentralchain/waves-transactions` to `@decentralchain/transactions`?
- [ ] Deploy updated Ledger firmware app (if applicable)
- [ ] Deploy DCC Keeper browser extension (if applicable)
- [ ] Update any external documentation/wiki referencing Waves

## Timeline

- Started: [date]
- Completed: [date]
- Total time: [hours/days]
```

---

## Acceptance Criteria

- [ ] DCC-15 (waves-transactions) is fully complete and verified
- [ ] ALL prior tickets (DCC-1 through DCC-16) are complete
- [ ] New bundle `public/dcc-transactions.min.js` built from migrated source
- [ ] Old file `public/waves-transactions.min.js` removed
- [ ] `index.html` updated to reference new filename
- [ ] All source code global variable references updated
- [ ] `grep -rni "@waves" package.json` returns **zero** results
- [ ] `grep -rni "@waves" src/` returns **zero** results
- [ ] `ls public/ | grep -i waves` returns **zero** results
- [ ] No `wavesplatform` or `wavesnodes` URLs remain in ANY file
- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] Application starts and loads successfully
- [ ] Wallet connect (create/import) works
- [ ] Transaction sending works on testnet
- [ ] DEX functionality works
- [ ] Asset browser works
- [ ] No browser console errors related to missing scripts
- [ ] Final migration report written
- [ ] Team lead sign-off received

---

## AI Prompt for Assistance

```
I am completing the final phase (Phase 5) of the Waves→DecentralChain SDK
migration for the dcc-react wallet application.

I need to:
1. Rebuild the bundled file public/waves-transactions.min.js from the
   fully migrated @decentralchain/waves-transactions package
2. Rename it to dcc-transactions.min.js (or appropriate name)
3. Update index.html to reference the new file
4. Update any source code that references the old global variable
5. Verify zero @waves/* references remain in the entire project
6. Perform end-to-end testing

The original file was loaded via <script> tag and exposed a global variable.
I need to ensure the new bundle exposes the same API.

The target filename is: dcc-transactions.min.js
The global variable should be: DCCTransactions (or match old name if needed)

Please help me with: [specific question]
```

---

## Estimated Time

**5–8 hours** — The bundle rebuild itself is quick (1–2 hours), but the comprehensive end-to-end testing of the entire wallet application takes significant time. This is the final quality gate for the whole migration.

---

## Questions?

Reach out to the team lead. Key decisions:

1. **Bundle global name:** `DCCTransactions` (new) or `WavesTransactions` (backward compat)?
2. **Filename:** `dcc-transactions.min.js` or something else?
3. **Testing scope:** How thorough should the end-to-end testing be? Just testnet, or mainnet too?
4. **Rollback plan:** Should we keep the old file as a backup?
5. **Sign-off:** Who needs to approve the final migration before it's merged to production?
