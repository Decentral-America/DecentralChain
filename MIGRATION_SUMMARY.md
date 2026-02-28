# Migration Summary — data-entities (DCC-12)

## Overview
Migrated `@waves/data-entities` → `@decentralchain/data-entities`

## Files Changed (20 total)

### Source Files (6 files — imports updated)
- `src/utils.ts` — `@waves/bignumber` → `@decentralchain/bignumber`
- `src/entities/Asset.ts` — `@waves/bignumber` → `@decentralchain/bignumber`
- `src/entities/Candle.ts` — `@waves/bignumber` → `@decentralchain/bignumber`
- `src/entities/Money.ts` — `@waves/bignumber` → `@decentralchain/bignumber`
- `src/entities/OrderPrice.ts` — `@waves/bignumber` → `@decentralchain/bignumber`
- `src/index.ts` — no changes needed (no Waves references)

### Config Files (1 file)
- `src/config.ts` — no changes needed (no Waves references)

### Package Config (1 file)
- `package.json` — name, description, repository, homepage, bugs, keywords, dependencies, build script all updated

### Test Files (5 files)
- `test/classes/OrderPrice.spec.ts` — import + `fakeWAVES` → `fakeDCC` in comments
- `test/classes/Asset.spec.ts` — no changes needed
- `test/classes/AssetPair.spec.ts` — no changes needed
- `test/classes/Money.spec.ts` — no changes needed
- `test/assetData.ts` — no changes needed

### Documentation (3 files)
- `README.md` — **created new** with DecentralChain branding and API docs
- `.github/ISSUE_TEMPLATE/bug_report.md` — removed `jahsus-waves` assignee
- `.github/ISSUE_TEMPLATE/feature_request.md` — removed `jahsus-waves` assignee

### Removed
- `package-lock.json` — deleted (contained Waves references, will regenerate)

## Statistics
- **Waves references found:** 25+ (across source, tests, package.json, package-lock.json, templates)
- **Waves references remaining:** 0
- **@waves/bignumber → @decentralchain/bignumber:** 6 files updated (5 source + 1 test)
- **Chain ID changes applied:** No (no chain ID defaults found in source)
- **Asset name changes applied:** Yes (fakeWAVES → fakeDCC in test comments)

## Build & Test Results
- **Tests:** ✅ 16 passing (22ms)
- **TSC Build:** ✅ Clean (zero errors)
- **Browserify Build:** ✅ Success
- **Uglify:** ✅ Success

## Blocking Dependency
- **@decentralchain/bignumber** is NOT yet published to npm
- For development/testing, used npm alias: `@decentralchain/bignumber@npm:@waves/bignumber@1.1.1`
- The `package.json` dependencies field is set to the final target: `"@decentralchain/bignumber": "^1.1.1"`
- Once DCC-3 is published to npm, `npm install` will work natively

## New Repository
- **Local path:** `~/Documents/DCC-CODE/DCC-12/dcc-migration/dcc-data-entities-migrated`
- **Target GitHub:** `https://github.com/Decentral-America/data-entities`
- **Note:** Push to GitHub requires creating the repo on GitHub first

## Downstream Consumers to Notify
- **DCC-14** (data-service-client-js) — depends on this package
- **DCC-16** (signature-adapter) — depends on this package
- **dcc-react** — uses `@waves/data-entities` directly in package.json
