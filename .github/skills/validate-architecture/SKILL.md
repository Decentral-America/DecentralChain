---
name: validate-architecture
description: 'Validate workspace architecture and quality. USE WHEN: user asks to check boundaries, validate layers, audit quality, verify package structure, or asks "is everything correct". Runs module boundary enforcement, Biome lint, typecheck, tests, and coverage validation.'
---

# Validate Architecture

Run a comprehensive quality and architecture validation of the DecentralChain SDK monorepo.

## Quick Validation

Run all checks in sequence:

```bash
# 1. Module boundaries (layer enforcement)
node scripts/check-boundaries.mjs

# 2. Biome lint (all projects)
pnpm nx run-many -t biome-lint

# 3. TypeScript type-check
pnpm nx run-many -t typecheck

# 4. Full test suite with coverage
pnpm nx run-many -t test
```

## Module Boundary Rules

The `scripts/check-boundaries.mjs` script enforces:

1. **Layer rule**: Package at layer N can only depend on layer ≤ N
2. **Scope rule**: `scope:sdk` packages must NOT depend on `scope:app`
3. **App rule**: `scope:app` can depend on any SDK package

### Layer Map

| Layer | Packages |
|-------|----------|
| 0 | ts-types, bignumber, crypto, ts-lib-crypto, parse-json-bignumber, browser-bus, assets-pairs-order, cubensis-connect-types, ledger, marshall, oracle-data, protobuf-serialization |
| 1 | data-entities, money-like-to-node, ride-js, swap-client |
| 2 | transactions, node-api-js, data-service-client-js |
| 3 | signer |
| 4 | signature-adapter, cubensis-connect-provider |

### Check a Package's Layer

```bash
cat packages/<name>/package.json | grep -A5 '"tags"'
```

Look for `"layer:N"` in the tags array.

## Coverage Thresholds

Base thresholds in `vitest.base.config.ts`: **90%** for branches, functions, lines, statements.

Packages with justified lower thresholds:

| Package | Threshold | Reason |
|---------|-----------|--------|
| protobuf-serialization | 15% | Generated code, minimal testable surface |
| ride-js | 65/74/85/84 | Legacy compiler, mixed per-metric |
| signer | 70% | Integration-heavy, depends on external wallet |
| transactions | 70% | Integration-heavy, excludes integration tests |
| cubensis-connect-types | 0% | Type-only package, zero executable code |
| oracle-data | 95% | Exceeds base (well-tested) |

## Package Structure Verification

Every SDK package should have:

```
packages/<name>/
  biome.json          # Must have "extends": "//", "root": false
  knip.json           # Dead code detection
  lefthook.yml        # Git hooks
  package.json        # nx.tags with scope: and layer: tags
  tsconfig.json       # extends ../../tsconfig.base.json
  tsdown.config.ts    # ESM build (except crypto which uses tsc + wasm-pack)
  vitest.config.ts    # Merges vitest.base.config
  src/                # Source code
```

### Verify All Packages Have Required Files

```bash
for pkg in packages/*/; do
  name=$(basename "$pkg")
  for f in biome.json package.json tsconfig.json vitest.config.ts src/index.ts; do
    [ ! -f "$pkg$f" ] && echo "MISSING: $name/$f"
  done
done
```

## Dependency Audit

```bash
# Check for unused dependencies
pnpm nx run-many -t knip 2>/dev/null

# Check pnpm catalog usage
cat pnpm-workspace.yaml
```

## Known Exceptions

- **`cubensis-connect`** (app): Tests are pre-existing failures (Playwright e2e tests not configured for unit test runner).
- **`crypto`**: Uses `tsc` + `wasm-pack` instead of tsdown for its build.
- **`protobuf-serialization`**: Contains generated protobuf code with low coverage.
