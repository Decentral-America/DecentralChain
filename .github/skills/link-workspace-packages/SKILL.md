---
name: link-workspace-packages
description: 'Add dependencies between @decentralchain/* packages. USE WHEN: (1) you created a new package and need to wire up its dependencies, (2) user imports from a sibling package, (3) you get resolution errors like "cannot find module", "TS2307", or "cannot resolve". CRITICAL: always validate layer boundaries before adding — packages may only depend on same or lower layers.'
---

# Link Workspace Packages

Add `@decentralchain/*` dependencies between packages in this pnpm monorepo.

## Layer Boundary Rules (MUST CHECK FIRST)

Before adding any workspace dependency, validate the layer constraint:

| Layer | Packages |
|-------|----------|
| **0 — Primitives** | ts-types, bignumber, crypto, ts-lib-crypto, parse-json-bignumber, browser-bus, assets-pairs-order, cubensis-connect-types, ledger, marshall, oracle-data, protobuf-serialization |
| **1 — Domain** | data-entities, money-like-to-node, ride-js, swap-client |
| **2 — Services** | transactions, node-api-js, data-service-client-js |
| **3 — Integration** | signer |
| **4 — Adapter** | signature-adapter, cubensis-connect-provider |

**Rule:** A package at layer N may only depend on packages at layer ≤ N. Apps (`scope:app`) can depend on any SDK package.

### Check Layers

```bash
# Find a package's layer from its nx.tags
cat packages/<consumer>/package.json | grep -A5 '"tags"'
cat packages/<provider>/package.json | grep -A5 '"tags"'
```

If the provider's layer > consumer's layer, **STOP — this dependency violates module boundaries**.

## Adding a Dependency

This workspace uses **pnpm** with `workspace:*` protocol.

```bash
# From workspace root (preferred)
pnpm add @decentralchain/<provider> --filter @decentralchain/<consumer> --workspace

# Or from the consumer directory
cd packages/<consumer>
pnpm add @decentralchain/<provider> --workspace
```

Result in `package.json`:
```json
{ "dependencies": { "@decentralchain/<provider>": "workspace:*" } }
```

After adding, run the boundary check:
```bash
node scripts/check-boundaries.mjs
```

## Troubleshooting

**"Cannot find module @decentralchain/..."**
1. Check if dependency is declared in consumer's `package.json`
2. If not: `pnpm add @decentralchain/<pkg> --filter @decentralchain/<consumer> --workspace`
3. Run `pnpm install`

**"TS2307: Cannot find module"**
1. Verify the provider package is built: `pnpm nx run @decentralchain/<provider>:build`
2. Check the provider's `package.json` has correct `exports` field
3. Check `verbatimModuleSyntax` — use `import type` for type-only imports

## Notes

- All workspace deps use `workspace:*` (resolved to exact version at publish time)
- pnpm uses strict isolation — no phantom deps allowed
- Shared devDependencies use the **pnpm catalog** (defined in `pnpm-workspace.yaml`)
