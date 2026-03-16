---
description: 'Add a cross-package dependency between @decentralchain/* packages. USE WHEN you need to import from a sibling package, get "cannot find module" errors, or need to wire up a new dependency. Validates layer boundaries automatically.'
---

# Add Dependency

Add a workspace dependency between `@decentralchain/*` packages with automatic layer boundary validation.

## Context

- Packages are organized into dependency layers 0–4 (enforced by `scripts/check-boundaries.mjs`)
- A package may only depend on packages in the **same layer or below**
- Dependencies use pnpm `workspace:*` protocol
- Layer tags are in each package's `package.json` → `nx.tags` (e.g. `"layer:0"`)

### Layer Reference

| Layer | Packages |
|-------|----------|
| **0** | ts-types, bignumber, crypto, ts-lib-crypto, parse-json-bignumber, browser-bus, assets-pairs-order, cubensis-connect-types, ledger, marshall, oracle-data, protobuf-serialization |
| **1** | data-entities, money-like-to-node, ride-js, swap-client |
| **2** | transactions, node-api-js, data-service-client-js |
| **3** | signer |
| **4** | signature-adapter, cubensis-connect-provider |

## Instructions

1. **Check layers first** — verify the consumer's layer is ≥ the dependency's layer:
   ```bash
   # Check the target package's layer tag
   cat packages/<dependency>/package.json | grep -A5 '"tags"'
   cat packages/<consumer>/package.json | grep -A5 '"tags"'
   ```

2. **Add the dependency:**
   ```bash
   pnpm add @decentralchain/<dependency> --filter @decentralchain/<consumer> --workspace
   ```

3. **Add TypeScript project reference** in `packages/<consumer>/tsconfig.json`:
   ```jsonc
   {
     "references": [
       { "path": "../<dependency>" }
     ]
   }
   ```

4. **Validate boundaries:**
   ```bash
   node scripts/check-boundaries.mjs
   ```

5. **Build and verify:**
   ```bash
   pnpm nx run <consumer>:build
   pnpm nx run <consumer>:typecheck
   ```
