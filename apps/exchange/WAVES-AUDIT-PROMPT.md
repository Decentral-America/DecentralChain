# DECENTRALCHAIN SDK AUDIT PROMPT

## Deep Waves Trace Removal — 4 `@decentralchain` Packages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## OBJECTIVE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Perform an exhaustive audit and purge of ALL remaining Waves blockchain references, branding, code dependencies, constants, network defaults, and documentation artifacts from the following 4 packages that are already published under the `@decentralchain` npm scope but were originally forked from `wavesplatform` and still contain significant Waves contamination.

**CRITICAL CONTEXT:** These packages were shallow forks — the npm scope was changed to `@decentralchain` but the internal code was only partially updated. They still contain deep Waves dependencies in their source, build artifacts, type imports, protocol constants, default endpoints, documentation, branding strings, and transitive dependencies.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## TARGET PACKAGES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 1. `@decentralchain/waves-transactions` (v4.2.6)

| Field               | Value                                                                        |
| ------------------- | ---------------------------------------------------------------------------- |
| **GitHub**          | https://github.com/Decentral-America/waves-transactions                      |
| **Forked from**     | https://github.com/wavesplatform/waves-transactions                          |
| **Fork divergence** | 11 commits ahead, 19 commits behind upstream                                 |
| **Language**        | TypeScript 99.8%, JavaScript 0.2%                                            |
| **Unpacked size**   | 783 kB (112 files)                                                           |
| **Last published**  | ~4 years ago                                                                 |
| **Description**     | Build and sign (multi-sign) transactions                                     |
| **Key purpose**     | Transaction creation, signing, serialization, broadcasting, node interaction |

**KNOWN WAVES CONTAMINATION:**

- **Package name itself**: Still called `waves-transactions`
- **Direct `@waves/*` dependencies in package.json:**
  - `@waves/node-api-js` ^1.2.10 — Node API client (REST, WebSocket)
  - `@waves/protobuf-serialization` 1.4.3 — Protobuf TX schemas
  - `@waves/ts-lib-crypto` 1.4.3 — Core crypto (address gen, signing, hashing)
  - `@waves/ts-types` 1.1.0 — Transaction type definitions
- **Source file imports using `@waves/*`:**
  - `src/general.ts` → imports from `@waves/ts-lib-crypto`, `@waves/node-api-js/cjs/tools/request`, `@waves/node-api-js/cjs/tools/stringify`, `@waves/ts-types`
  - `src/nodeInteraction.ts` → imports from `@waves/node-api-js/cjs/api-node/transactions`, `blocks`, `addresses`, `assets`, `rewards`, `debug`; `@waves/ts-types`
  - `src/generic.ts` → imports from `@waves/ts-lib-crypto`, `@waves/ts-types`
  - `src/proto-serialize.ts` → imports from `@waves/protobuf-serialization`, `@waves/ts-lib-crypto`, `@waves/ts-types`
  - `src/index.ts` → `import * as crypto from '@waves/ts-lib-crypto'` exposed as `libs.crypto`
  - `src/transactions/transfer.ts` → `@waves/ts-lib-crypto`, `@waves/ts-types`
  - `src/requests/wavesAuth.ts` → function `wavesAuth()`, `serializeWavesAuthData()`, `IWavesAuthParams`, `IWavesAuth`
- **Waves-branded function names/exports:**
  - `wavesAuth()`, `verifyWavesAuthData()`, `serializeWavesAuthData()`, `IWavesAuthParams`, `IWavesAuth`
- **Hardcoded Waves protocol defaults:**
  - Default chainId `87` (= `'W'` for Waves mainnet) in `IBasicParams` comment
  - `src/nodeInteraction.ts`: Default node URL `'https://mainnet-node.decentralchain.io/'` (partially updated, but comments still reference `https://nodes.wavesplatform.com/`)
  - Comments throughout reference `waves address`, `Waves blockchain`, `nodes.wavesplatform.com`
  - `src/general.ts`: matcher URL `https://matcher.waves.exchange/` in JSDoc comments
  - `cancelSubmittedOrder`: fallback asset IDs use `'DCC'` (correctly renamed) but function references matcher.waves.exchange
- **Protobuf references:**
  - `src/proto-serialize.ts` uses `wavesProto.waves.*` namespace extensively (this comes from `@waves/protobuf-serialization`)
  - `isNullOrWaves` function checks `.toLowerCase() == 'waves'`
- **README still says:**
  - `# waves-transactions`
  - `npm version` badge URL references `@decentralchain/waves-transactions`
  - Code examples use `chainId: 'T'` (Waves testnet) and `alias:W:aliasForMyAddress` (Waves mainnet)
  - Dependencies section says "This library uses `@waves/ts-lib-crypto`" and "`@waves/node-api-js`"
  - GitHub links point to `decentral-america.github.io/waves-transactions`

---

### 2. `@decentralchain/signature-adapter` (v6.1.7)

| Field               | Value                                                                |
| ------------------- | -------------------------------------------------------------------- |
| **GitHub**          | https://github.com/Decentral-America/waves-signature-adapter         |
| **Forked from**     | https://github.com/wavesplatform/waves-signature-adapter             |
| **Fork divergence** | 2 commits ahead, 38 commits behind upstream                          |
| **Language**        | TypeScript 100%                                                      |
| **Unpacked size**   | 695 kB (91 files)                                                    |
| **Last published**  | ~4 years ago                                                         |
| **Description**     | JS library for signing data (Seed, Ledger, CubensisConnect adapters) |

**KNOWN WAVES CONTAMINATION:**

- **Repo name**: `waves-signature-adapter`
- **Direct `@waves/*` dependencies in package.json:**
  - `@waves/bignumber` ^1.0.0
  - `@waves/data-entities` ^2.0.3
  - `@waves/ledger` ^4.0.0
  - `@waves/money-like-to-node` 0.1.3
  - `@waves/ts-types` ^0.2.0
- **Source file imports using `@waves/*`:**
  - `src/Signable.ts` → `@waves/money-like-to-node`, `@waves/bignumber`
  - `src/utils.ts` → `@waves/bignumber`, `@waves/ts-types`
  - `src/prepareTx/constants.ts` → `@waves/money-like-to-node`, `@waves/data-entities`
  - `src/prepareTx/interfaces.ts` → `@waves/data-entities`, `@waves/bignumber`
  - `src/adapters/SeedAdapter.ts` → Uses `@decentralchain/waves-transactions` (which itself has Waves deps)
- **Waves-branded code:**
  - `src/prepareTx/constants.ts`: `LEN(SHORT)(STRING)('WavesWalletAuthentication')` — hardcoded auth prefix string "WavesWalletAuthentication"
  - Browserify script in package.json: references `-u @waves/waves-crypto -u @waves/bignumber -u @waves/data-entities -u @waves/ledger`
  - `wavesSignatureAdapter` — global name in browserify output: `-s wavesSignatureAdapter`
- **README contains:**
  - Install instruction: `npm install --save @waves/signature-adapter` (NOT updated)
  - Usage examples import from `@waves/signature-adapter`, `@waves/data-entities`
  - Network config references `@waves/signature-generator`
  - Asset example has `name: 'Waves'`
  - Links to `wavesplatform/waves-signature-adapter` and `wavesplatform/waves-signature-generator`
- **Signature authentication prefix:**
  - The string `'WavesWalletAuthentication'` is used as a byte prefix for auth signing — this is a **protocol-level constant** that affects signature verification compatibility

---

### 3. `@decentralchain/marshall` (v0.14.0)

| Field               | Value                                                            |
| ------------------- | ---------------------------------------------------------------- |
| **GitHub**          | https://github.com/Decentral-America/marshall                    |
| **Forked from**     | https://github.com/wavesplatform/marshall                        |
| **Fork divergence** | 1 commit ahead of upstream                                       |
| **Language**        | TypeScript 98.2%, JavaScript 1.8%                                |
| **Unpacked size**   | 203 kB (48 files)                                                |
| **Last published**  | ~5 years ago                                                     |
| **Description**     | Binary/JSON serializer-parser for DCC blockchain data structures |

**KNOWN WAVES CONTAMINATION:**

- **Direct `@waves/*` dependencies in package.json:**
  - `@waves/parse-json-bignumber` ^1.0.1
- **Source file references:**
  - `src/jsonMethods.ts` → `change parse-json-bignumber to @waves/parse-json-bignumber` (per commit history)
  - `src/schemas.ts` → Uses `'DCC'` for asset ID serialization (correctly updated: `s === 'DCC' ? OPTION(BASE58_STRING)(null)`)
  - `src/schemaTypes.ts` → Commit message references `wavesplatform#4`
- **Comments in schemas.ts:**
  - `//Todo: import this enums from ts-types package` — refers to `@waves/ts-types`
- **Build artifacts:**
  - Travis CI badge URL in README still references `wavesplatform/assets-pairs-order` (copy-paste residue or similar)
  - `tslint.json` — uses deprecated tslint (not Waves-specific but relevant for modernization)
- **This is the LEAST contaminated** of the 4 packages — only 1 direct `@waves/*` dependency

---

### 4. `@decentralchain/assets-pairs-order` (v4.0.0)

| Field               | Value                                                           |
| ------------------- | --------------------------------------------------------------- |
| **GitHub**          | https://github.com/Decentral-America/assets-pairs-order         |
| **Forked from**     | https://github.com/wavesplatform/assets-pairs-order             |
| **Fork divergence** | 1 commit ahead of upstream                                      |
| **Language**        | JavaScript 100%                                                 |
| **Unpacked size**   | 76.4 kB (13 files)                                              |
| **Last published**  | ~5 years ago                                                    |
| **Description**     | Utility for ordering asset pairs in (amount_asset, price_asset) |

**KNOWN WAVES CONTAMINATION:**

- **No direct `@waves/*` dependencies** — only depends on `bs58` ^4.0.1
- **Source data files:**
  - `src/mainnet.json` → `[{ "ticker": "DCC", "id": "DCC" }]` (correctly updated)
  - `src/testnet.json` → Needs verification
  - `src/arbitrary.json` → Needs verification for any Waves asset IDs
- **README/metadata:**
  - Travis CI badge URL: `api.travis-ci.org/wavesplatform/assets-pairs-order.svg` (Waves reference)
- **This is the CLEANEST** of the 4 packages — no `@waves/*` dependencies, minimal contamination

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## COMPREHENSIVE AUDIT CHECKLIST

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For EACH of the 4 packages, systematically check all of the following:

### A. Package Metadata & Configuration

- [ ] `package.json` → `name` field (rename `waves-transactions` → `dcc-transactions` or `transactions`)
- [ ] `package.json` → `description` field — remove any mention of "Waves"
- [ ] `package.json` → `keywords` array — remove "waves", "wavesplatform"
- [ ] `package.json` → `repository` URL — should point to Decentral-America (already done for some)
- [ ] `package.json` → `homepage` URL — remove any wavesplatform references
- [ ] `package.json` → Dependencies — replace ALL `@waves/*` with `@decentralchain/*` equivalents
- [ ] `package.json` → `scripts` — check browserify, build, and test scripts for Waves references
- [ ] `package-lock.json` / `yarn.lock` — full regeneration after dependency migration
- [ ] `tsconfig.json` — verify no Waves-specific path mappings
- [ ] `.npmignore` / `.gitignore` — check for Waves-specific entries
- [ ] CI/CD configs (`azure-pipelines.yml`, `.travis.yml`) — remove `wavesplatform` references
- [ ] `webpack.config.js` / `rollup.config.js` — check for Waves externals, globals, aliases

### B. Source Code — Imports & Dependencies

Search ALL `.ts`, `.js`, `.tsx`, `.jsx` files in `src/`, `test/`, `usage/` for:

```
@waves/ts-lib-crypto
@waves/ts-types
@waves/node-api-js
@waves/protobuf-serialization
@waves/bignumber
@waves/data-entities
@waves/ledger
@waves/money-like-to-node
@waves/parse-json-bignumber
@waves/signature-generator
@waves/waves-crypto
@waves/oracle-data
```

Each import must be mapped to its `@decentralchain/*` equivalent or inlined/replaced.

### C. Source Code — String Literals & Constants

Search for these exact strings and patterns:

```
"waves"               (case-insensitive, in strings, comments, identifiers)
"Waves"               (branded capitalization)
"WAVES"               (token name / asset ID)
"wavesplatform"       (GitHub org)
"waves.exchange"      (DEX domain)
"WavesWalletAuthentication"  (auth prefix — PROTOCOL-LEVEL, needs special handling)
"wavesSignatureAdapter"      (browserify global name)
"nodes.wavesplatform.com"    (legacy node URL)
"matcher.waves.exchange"     (legacy matcher URL)
chainId: 'W'          (Waves mainnet byte = 87)
chainId: 'T'          (Waves testnet byte = 84)
networkByte === 87     (or any numeric check for 87/84)
isNullOrWaves          (function name)
wavesAuth              (function/module name)
wavesProto             (variable name referencing protobuf)
```

### D. Source Code — Protocol Constants & Defaults

- [ ] **Default chainId / network byte**: Must be changed from `87` (`'W'`) to DecentralChain's mainnet byte (`76` / `'L'`)
- [ ] **Default testnet byte**: Must be changed from `84` (`'T'`) to DecentralChain's testnet equivalent
- [ ] **Default node URLs**: Replace any `nodes.wavesplatform.com`, `testnet1.wavesplatform.com` with `mainnet-node.decentralchain.io`, `testnet-node.decentralchain.io`
- [ ] **Default matcher URLs**: Replace `matcher.waves.exchange` with DecentralChain matcher
- [ ] **Native token name**: Replace `'WAVES'` with `'DCC'` wherever used as identifier (some already done)
- [ ] **Address prefix byte**: Verify address generation uses correct prefix for DecentralChain
- [ ] **Auth signing prefix**: `'WavesWalletAuthentication'` → `'DCCWalletAuthentication'` (⚠️ **BREAKING CHANGE** — this changes signature format)
- [ ] **Fee defaults**: Verify default transaction fees match DecentralChain's fee schedule (currently 100000 wavelets — is this correct for DCC?)
- [ ] **Genesis block hash / timestamp**: Any hardcoded genesis references

### E. Source Code — Function & Variable Names

Rename to remove Waves branding:

- [ ] `wavesAuth()` → `dccAuth()` or `authenticate()`
- [ ] `verifyWavesAuthData()` → `verifyDCCAuthData()` or `verifyAuthData()`
- [ ] `serializeWavesAuthData()` → `serializeDCCAuthData()` or `serializeAuthData()`
- [ ] `IWavesAuthParams` → `IDCCAuthParams` or `IAuthParams`
- [ ] `IWavesAuth` → `IDCCAuth` or `IAuth`
- [ ] `isNullOrWaves()` → `isNullOrDCC()` or `isNullOrNative()`
- [ ] `wavesSignatureAdapter` (browserify global) → `dccSignatureAdapter`
- [ ] `wavesProto` (variable name) → `dccProto` or `proto`
- [ ] Any `waves` prefix in file names: `wavesAuth.ts` → `dccAuth.ts` or `auth.ts`

### F. Documentation

- [ ] `README.md` — complete rewrite with DecentralChain branding
- [ ] `CHANGELOG.MD` — verify no Waves-specific content that could confuse users
- [ ] Code comments — remove all `waves address`, `Waves blockchain`, `wavesplatform` references
- [ ] JSDoc `@param` descriptions — update node URL examples from `wavesplatform.com` to `decentralchain.io`
- [ ] TypeDoc/API docs generation — verify output doesn't reference Waves
- [ ] License file — verify attribution is correct

### G. Build Artifacts & Generated Code

- [ ] `dist/` folder — must be regenerated from clean source (DO NOT ship stale Waves-contaminated builds)
- [ ] `build/` folder — check for any generated files with Waves references
- [ ] `.history/` folder — in waves-transactions repo, contains old file history (should be removed)
- [ ] Protobuf generated code — `@waves/protobuf-serialization` generates `wavesProto.waves.*` types

### H. Test Files

- [ ] All test files use DecentralChain parameters
- [ ] Test fixtures don't contain Waves-specific addresses, asset IDs, or transaction hashes
- [ ] Test node URLs point to DecentralChain or use mocks
- [ ] No test depends on Waves testnet/mainnet connectivity

### I. Transitive Dependencies Audit

The `@waves/*` packages themselves depend on other `@waves/*` packages. Full transitive closure:

```
@decentralchain/waves-transactions
  ├── @decentralchain/marshall
  │   └── @waves/parse-json-bignumber
  ├── @waves/node-api-js
  │   └── (has its own @waves/* deps)
  ├── @waves/protobuf-serialization
  ├── @waves/ts-lib-crypto
  └── @waves/ts-types

@decentralchain/signature-adapter
  ├── @decentralchain/waves-transactions (see above)
  ├── @waves/bignumber
  ├── @waves/data-entities
  │   └── (may depend on @waves/bignumber, etc.)
  ├── @waves/ledger
  ├── @waves/money-like-to-node
  └── @waves/ts-types
```

**Decision required for each `@waves/*` transitive dep:**

1. Fork → rebrand → publish as `@decentralchain/*` (preferred for core libs)
2. Inline the relevant code directly (for small utilities)
3. Replace with standard npm alternative (for generic functionality)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## MIGRATION DECISIONS REQUIRED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The following items require **explicit decisions from maintainers** before proceeding. DO NOT guess or invent answers:

### Protocol-Level Questions

1. **Auth prefix string**: Currently `'WavesWalletAuthentication'`. Changing this to `'DCCWalletAuthentication'` is a **breaking protocol change** that invalidates all existing auth signatures.
   - **Decision needed**: Change prefix (breaking) or keep for backwards compatibility?

2. **Default chainId**: Currently defaults to `87` (`'W'`). DecentralChain mainnet uses `76` (`'L'`).
   - **Decision needed**: Confirm `76`/`'L'` is correct for DCC mainnet.

3. **Default testnet chainId**: Waves uses `84` (`'T'`).
   - **Decision needed**: What is DecentralChain's testnet chain byte?

4. **Fee schedule**: Default transfer fee is `100000` (0.001 in 8-decimal units).
   - **Decision needed**: Does DecentralChain use the same fee amounts?

5. **Protobuf schemas**: The `@waves/protobuf-serialization` package contains compiled `.proto` files defining transaction wire format with `waves` package name.
   - **Decision needed**: Does DecentralChain use the same protobuf schema? If not, provide updated `.proto` definitions.

6. **Address format**: Are DecentralChain addresses generated with the same algorithm as Waves (Blake2b256 → Keccak256 → base58)?
   - **Decision needed**: Confirm address derivation algorithm is identical.

### Package Naming Questions

7. **`@decentralchain/waves-transactions`** → What should the new package name be?
   - Options: `@decentralchain/transactions`, `@decentralchain/dcc-transactions`, `@decentralchain/tx`

8. **`@decentralchain/signature-adapter`** → The repo is still called `waves-signature-adapter`.
   - **Decision needed**: Rename repo to `signature-adapter`?

9. **Ledger app**: `@waves/ledger` connects to the Waves Ledger app.
   - **Decision needed**: Does DecentralChain have its own Ledger app? If not, this needs to be handled.

### Dependency Strategy Questions

10. **`@waves/ts-lib-crypto`** → Core crypto operations. Heavily embedded.
    - Options: Fork as `@decentralchain/ts-lib-crypto` or inline the crypto primitives
11. **`@waves/node-api-js`** → Full node REST API client.
    - Options: Fork as `@decentralchain/node-api-js` or replace with direct axios/fetch calls

12. **`@waves/protobuf-serialization`** → Compiled protobuf schemas.
    - Options: Fork with updated package names, or re-generate from DecentralChain `.proto` files

13. **`@waves/ts-types`** → TypeScript type definitions for transactions.
    - Options: Fork as `@decentralchain/ts-types` or inline types directly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## AUDIT EXECUTION METHODOLOGY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Phase 1: Automated String Search

For each repo, clone and run:

```bash
# Case-insensitive search for ALL Waves references
grep -rni "waves" --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" --include="*.yaml" src/ test/ usage/ *.json *.md *.yml 2>/dev/null | grep -v "node_modules" | grep -v ".git/"

# Search for @waves imports specifically
grep -rn "@waves/" --include="*.ts" --include="*.js" src/ test/ 2>/dev/null

# Search for wavesplatform references
grep -rni "wavesplatform" --include="*.ts" --include="*.js" --include="*.json" --include="*.md" --include="*.yml" . 2>/dev/null | grep -v "node_modules" | grep -v ".git/"

# Search for hardcoded chain IDs
grep -rn "chainId.*87\|chainId.*'W'\|networkByte.*87" --include="*.ts" --include="*.js" src/ 2>/dev/null

# Search for Waves node URLs
grep -rn "wavesplatform.com\|waves.exchange\|wavesnodes.com" --include="*.ts" --include="*.js" --include="*.json" --include="*.md" . 2>/dev/null | grep -v "node_modules"

# Search for protobuf Waves namespace
grep -rn "wavesProto\|waves\.I\|waves\.Transaction\|waves\.Order" --include="*.ts" --include="*.js" src/ 2>/dev/null
```

### Phase 2: Dependency Tree Analysis

```bash
# For each package, generate full dependency tree
npm ls --all 2>/dev/null
npm ls | grep -i waves
```

### Phase 3: Manual Code Review

Focus on:

1. Crypto functions — verify they don't hardcode Waves-specific parameters
2. Address generation — verify network byte is configurable, not hardcoded to 87
3. Transaction fee defaults — verify amounts match DecentralChain's schedule
4. Protobuf serialization — verify wire format compatibility
5. Node API calls — verify endpoint paths match DecentralChain's REST API

### Phase 4: Clean Build Verification

After all changes:

```bash
# For each package
rm -rf node_modules dist build
npm install
npm run build
npm test
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## EXPECTED OUTPUT FORMAT

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For each of the 4 packages, provide:

### 1. Waves Trace Inventory

A complete list of every file, line number, and exact string that contains a Waves reference, categorized as:

- **IMPORT** — `@waves/*` import statement
- **STRING** — Hardcoded string literal containing "waves"/"Waves"/"WAVES"
- **CONSTANT** — Protocol constant (chainId, network byte, fee, URL)
- **FUNCTION** — Function/variable/type name containing "waves"
- **COMMENT** — Comment text referencing Waves
- **CONFIG** — Configuration file (package.json, tsconfig, CI/CD) reference
- **DOC** — Documentation reference

### 2. Severity Classification

For each trace, classify as:

- 🔴 **CRITICAL** — Affects runtime behavior (wrong chain ID, wrong node URL, wrong crypto params)
- 🟡 **IMPORTANT** — Affects package identity (npm name, imports, branding)
- 🟢 **COSMETIC** — Comments, documentation, variable names (no runtime impact)

### 3. Recommended Fix

For each trace, specify exact replacement with DecentralChain equivalent.

### 4. Dependency Migration Map

Table showing each `@waves/*` dependency → its `@decentralchain/*` replacement or alternative.

### 5. Breaking Changes List

Any fixes that change public API, wire format, signature format, or backwards compatibility.

### 6. Questions for Maintainers

List of decisions that cannot be made without protocol specification clarification.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## QUALITY STANDARD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After this audit and migration is complete:

✔️ `grep -rni "waves" src/ test/` returns **ZERO** results (excluding properly renamed code)
✔️ `npm ls | grep "@waves"` returns **ZERO** results
✔️ No `@waves/*` packages appear in any `package.json`
✔️ All default endpoints point to DecentralChain infrastructure
✔️ All default chain IDs match DecentralChain's network bytes
✔️ All documentation references DecentralChain exclusively
✔️ All builds pass with zero Waves dependencies
✔️ All tests pass with DecentralChain parameters
✔️ The packages function as **standalone DecentralChain libraries**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## PRIORITY ORDER

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Audit packages in this order (based on dependency chain and contamination level):

1. **`@decentralchain/marshall`** — Least contaminated, no dependents among the 4, quick win
2. **`@decentralchain/assets-pairs-order`** — Cleanest, standalone, no `@waves/*` deps
3. **`@decentralchain/waves-transactions`** — Most complex, deepest Waves integration, most transitive deps
4. **`@decentralchain/signature-adapter`** — Depends on waves-transactions + multiple `@waves/*` libs

Work iteratively. If critical protocol details are missing, **ASK before inventing behavior**.
