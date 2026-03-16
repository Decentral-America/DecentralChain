---
name: upstream-sync
description: 'Sync DCC monorepo packages with upstream Waves repositories. USE WHEN: user asks to check for upstream changes, sync from Waves, pull upstream updates, port changes from Waves, check what Waves has done, or asks "what is new upstream". Handles the full workflow: fetch upstream, diff since last sync, evaluate changes, port relevant ones, adapt to DCC conventions, and update the sync tracking table.'
---

# Upstream Sync — Waves → DecentralChain

Sync DCC monorepo packages with their upstream Waves repositories. DCC was manually forked from Waves (not a GitHub fork), so syncing is a review-and-port process.

## Critical Context

- **DCC and Waves share git commit history** — the repos were cloned, not forked via GitHub. This means `git log` and `git diff` work across both trees using shared commit hashes.
- **Upstream clones live at**: `/Users/jourlez/Documents/Code/Blockchain/Waves/<repo-name>/`
- **DCC monorepo lives at**: `/Users/jourlez/Documents/Code/Blockchain/DecentralChain/`
- **Sync tracking table**: `docs/UPSTREAM.md` §19 — contains the last-synced upstream commit for every package
- **23 upstream repos** are cloned locally (swap-client upstream was deleted — no sync possible)

## Package → Directory Mapping

This is the critical mapping between DCC monorepo paths and Waves upstream repo names. The upstream repo name is also the folder name under `Waves/`.

| Monorepo Path | Waves Repo Name | GitHub Org |
|--------------|----------------|------------|
| `packages/ts-types` | `ts-types` | wavesplatform |
| `packages/bignumber` | `bignumber` | wavesplatform |
| `packages/ts-lib-crypto` | `ts-lib-crypto` | wavesplatform |
| `packages/parse-json-bignumber` | `parse-json-bignumber` | wavesplatform |
| `packages/marshall` | `marshall` | wavesplatform |
| `packages/protobuf-serialization` | `protobuf-schemas` | wavesplatform |
| `packages/data-entities` | `waves-data-entities` | wavesplatform |
| `packages/assets-pairs-order` | `assets-pairs-order` | wavesplatform |
| `packages/oracle-data` | `oracle-data` | wavesplatform |
| `packages/node-api-js` | `node-api-js` | wavesplatform |
| `packages/transactions` | `waves-transactions` | wavesplatform |
| `packages/money-like-to-node` | `money-like-to-node` | wavesplatform |
| `packages/data-service-client-js` | `data-service-client-js` | wavesplatform |
| `packages/browser-bus` | `waves-browser-bus` | wavesplatform |
| `packages/ledger` | `waves-ledger-js` | wavesplatform |
| `packages/signature-adapter` | `waves-signature-adapter` | wavesplatform |
| `packages/signer` | `signer` | wavesplatform |
| `packages/ride-js` | `ride-js` | wavesplatform |
| `apps/cubensis-connect` | `Keeper-Wallet-Extension` | Keeper-Wallet |
| `packages/cubensis-connect-types` | `waveskeeper-types` | Keeper-Wallet |
| `packages/cubensis-connect-provider` | `provider-keeper` | Keeper-Wallet |
| `apps/scanner` | `WavesExplorerLite` | wavesplatform |
| `packages/swap-client` | `swap-client` | Keeper-Wallet (DELETED) |
| `packages/crypto` | `waves-crypto` | Keeper-Wallet |

## Priority Watch List

These repos change most frequently and should be checked first:

| Priority | Repo | Why | Frequency |
|----------|------|-----|-----------|
| **Weekly** | `ts-types` | Foundation types — affects entire SDK | High impact |
| **Weekly** | `ts-lib-crypto` | Crypto primitives — security-critical | Security |
| **Weekly** | `ride-js` | RIDE compiler = new language features | Features |
| **Bi-weekly** | `signer` | Signing flow changes | Core functionality |
| **Bi-weekly** | `protobuf-schemas` | Wire format = protocol updates | Protocol |
| **Monthly** | `Keeper-Wallet-Extension` | Wallet features we may want | Feature ideas |
| **Monthly** | `waves-transactions` | New transaction type support | Protocol |
| **Monthly** | `node-api-js` | New API endpoints | API coverage |

## Full Sync Workflow

### Step 1 — Read the Sync Tracking Table

Read `docs/UPSTREAM.md` §19 to get the current **Upstream Commit** for each package. This is the last Waves commit that was incorporated into DCC.

```bash
# Quick view of the sync table
grep -A30 "Monorepo → Upstream Map" docs/UPSTREAM.md
```

### Step 2 — Fetch Latest Upstream

For a specific package:
```bash
cd /Users/jourlez/Documents/Code/Blockchain/Waves/<repo-name>
git fetch origin
git pull origin master  # or main — check which branch
```

For ALL upstream repos at once:
```bash
cd /Users/jourlez/Documents/Code/Blockchain/Waves
for repo in ts-types bignumber ts-lib-crypto parse-json-bignumber marshall protobuf-schemas waves-data-entities assets-pairs-order oracle-data node-api-js waves-transactions money-like-to-node data-service-client-js waves-browser-bus waves-ledger-js waves-signature-adapter signer ride-js Keeper-Wallet-Extension waveskeeper-types provider-keeper WavesExplorerLite waves-crypto; do
  if [ -d "$repo/.git" ]; then
    echo "--- Fetching $repo ---"
    git -C "$repo" fetch origin 2>&1 | tail -1
    git -C "$repo" pull origin $(git -C "$repo" symbolic-ref --short HEAD) 2>&1 | tail -1
  fi
done
```

### Step 3 — Check for New Changes

Compare the upstream HEAD against the last-synced commit from the tracking table:

```bash
# For a specific repo (replace <last-synced> with the commit hash from §19)
cd /Users/jourlez/Documents/Code/Blockchain/Waves/<repo-name>
git log --oneline <last-synced>..HEAD
git log --oneline <last-synced>..HEAD -- src/  # source-only changes
```

For a quick scan of ALL repos:
```bash
cd /Users/jourlez/Documents/Code/Blockchain/Waves
# Read last-synced commits from UPSTREAM.md and check each
declare -A LAST_SYNC=(
  [ts-types]="fc15f0c"
  [bignumber]="ee66601"
  [ts-lib-crypto]="96273e7"
  [parse-json-bignumber]="3ec759a"
  [marshall]="25b3527"
  [protobuf-schemas]="e7cf7fb"
  [waves-data-entities]="c611b1d"
  [assets-pairs-order]="2e16584"
  [oracle-data]="7efebd1"
  [node-api-js]="f992dc9"
  [waves-transactions]="df16cb3"
  [money-like-to-node]="ec4a2a8"
  [data-service-client-js]="ba1cc38"
  [waves-browser-bus]="d6c2b57"
  [waves-ledger-js]="f0d197c"
  [waves-signature-adapter]="6a303b9"
  [signer]="16ea3bc"
  [ride-js]="dafe635"
  [Keeper-Wallet-Extension]="6ef57b32"
  [waveskeeper-types]="b9eafdf"
  [provider-keeper]="24e3bc9"
  [WavesExplorerLite]="daaf628"
  [waves-crypto]="f6e4fbb"
)

for repo in "${!LAST_SYNC[@]}"; do
  if [ -d "$repo/.git" ]; then
    COUNT=$(git -C "$repo" log --oneline "${LAST_SYNC[$repo]}..HEAD" -- src/ 2>/dev/null | wc -l | tr -d ' ')
    if [ "$COUNT" -gt 0 ]; then
      echo "🔄 $repo: $COUNT new source commits"
      git -C "$repo" log --oneline "${LAST_SYNC[$repo]}..HEAD" -- src/ | head -5
      echo ""
    fi
  fi
done
echo "✅ Repos with 0 new source commits are up-to-date"
```

**IMPORTANT**: The `LAST_SYNC` hashes above may be stale. ALWAYS read the actual values from `docs/UPSTREAM.md` §19 before running the scan.

### Step 4 — Evaluate Changes

For each repo with new commits, review them individually:

```bash
cd /Users/jourlez/Documents/Code/Blockchain/Waves/<repo-name>
git log --oneline <last-synced>..HEAD
```

**SKIP these categories** (they don't apply to our stack):
- Renovate/Dependabot dependency bumps
- ESLint/Prettier config changes (we use Biome)
- Jest test changes (we use Vitest — but check the LOGIC of new tests)
- tsup/rollup build config (we use tsdown)
- CJS/dual-emit additions (we're ESM-only)
- CI/CD pipeline changes (we have our own)
- README cosmetic changes

**PORT these categories**:
- Bug fixes in `src/` code
- New features (functions, types, API endpoints)
- Security fixes (CRITICAL — port immediately)
- Protocol changes (new transaction types, new fields)
- New test cases (port the test LOGIC, adapt to Vitest syntax)

### Step 5 — Port Changes to Monorepo

```bash
cd /Users/jourlez/Documents/Code/Blockchain/DecentralChain

# View the specific upstream diff
cd /Users/jourlez/Documents/Code/Blockchain/Waves/<repo-name>
git diff <last-synced>..HEAD -- src/

# Now manually apply relevant changes to the monorepo package
# The monorepo path is: packages/<dcc-name>/src/ or apps/<dcc-name>/src/
```

**Adaptation rules when porting**:
1. Replace `@waves/*` imports with `@decentralchain/*` equivalents
2. Replace `@keeper-wallet/*` imports with `@decentralchain/*` equivalents
3. Use `import type` for type-only imports (verbatimModuleSyntax)
4. Ensure ESM syntax (no `require()`, no `module.exports`)
5. Follow Biome formatting rules (single quotes, semicolons, 2-space indent)
6. Replace Jest assertions with Vitest equivalents (`jest.fn()` → `vi.fn()`, etc.)
7. Replace `waves` branding in user-facing strings with `decentralchain`/`DCC` (but KEEP wire-format constants like `'WAVES'` asset ID)

### Step 6 — Validate

```bash
cd /Users/jourlez/Documents/Code/Blockchain/DecentralChain

# Lint
pnpm nx run @decentralchain/<pkg>:biome-lint

# Type-check
pnpm nx run @decentralchain/<pkg>:typecheck

# Test
pnpm nx run @decentralchain/<pkg>:test

# Build
pnpm nx run @decentralchain/<pkg>:build

# Layer boundaries
node scripts/check-boundaries.mjs
```

### Step 7 — Commit and Update Tracking

```bash
# Commit with conventional format
git add packages/<dcc-name>/
git commit -m "fix(<pkg>): port upstream <short-hash> — <description>"
# or
git commit -m "feat(<pkg>): port upstream <short-hash> — <description>"
```

Then update `docs/UPSTREAM.md` §19:
- Set **Upstream Commit** to the NEW Waves hash (the latest commit you've now incorporated)
- Set **DCC Commit** to your new monorepo commit hash
- Set **Date** to today
- Update **Activity** emoji if applicable

## What NOT to Do

- **Do NOT cherry-pick** — the repos share history but have diverged in structure. Manual application is safer.
- **Do NOT blindly port all changes** — evaluate each commit. Most Renovate bumps and tooling changes are noise.
- **Do NOT rename wire-format constants** — `'WAVES'` asset ID, `waves` protobuf namespace, `'WavesWalletAuthentication'` prefix, `'WAVES'` Ledger secret, BIP-44 path `44'/5741560'` must stay as-is.
- **Do NOT port CJS additions** — DCC is ESM-only.
- **Do NOT port `@keeper-wallet/waves-crypto` imports** — cubensis-connect uses `@decentralchain/crypto` now (DCC-59, DCC-70).

## Wire-Format Constants (Never Rename)

These Waves-branded strings are protocol constants — renaming them breaks the blockchain:

| Constant | Where | Why |
|----------|-------|-----|
| `'WAVES'` | Asset ID everywhere | On-chain protocol identifier |
| `package waves;` | `.proto` files | Binary wire format |
| `'WavesWalletAuthentication'` | Auth signing | Cryptographic domain separator |
| `'WAVES'` | Ledger APDU | Hardware wallet firmware |
| `44'/5741560'` | HD derivation | BIP-44 standard path |

## Quick Reference: DCC Conventions to Apply

When porting upstream code, ensure it matches:
- `import type` for type-only imports
- Single quotes, semicolons, 2-space indent
- No `any` — use `unknown` with type narrowing
- No `@ts-ignore` — use `@ts-expect-error` with explanation if truly needed
- Biome-clean: run `pnpm nx run @decentralchain/<pkg>:biome-fix` after porting
