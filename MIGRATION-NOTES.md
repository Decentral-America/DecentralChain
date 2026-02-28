# Migration Notes — ts-types

Migrated from `@waves/ts-types` to `@decentralchain/ts-types`.

## Type Renames

No type renames were necessary. The original `@waves/ts-types` package did not use any Waves-prefixed type names. All types (e.g., `Transaction`, `TransferTransaction`, `DataTransactionEntry`, `Long`) were already generically named.

## Chain ID Changes

| Value   | Old (Waves) | New (DCC) |
| ------- | ----------- | --------- |
| Mainnet | 'W' (87)    | 'L' (76)  |
| Testnet | 'T' (84)    | 'T' (84)  |

**Note:** The original `@waves/ts-types` package did **not** contain any hardcoded chain ID constants (`'W'`, byte 87, etc.). Chain IDs are defined at the application layer in downstream packages (e.g., `@decentralchain/waves-transactions`). No chain ID changes were required in this package.

## Changes Made

### package.json
- `name`: `@waves/ts-types` → `@decentralchain/ts-types`
- Added `description`: "Shared TypeScript type definitions for the DecentralChain SDK"
- Added `repository.url`: `https://github.com/Decentral-America/ts-types.git`
- Added `homepage`: `https://github.com/Decentral-America/ts-types`
- Added `bugs.url`: `https://github.com/Decentral-America/ts-types/issues`
- Added `keywords`: `["decentralchain", "blockchain", "typescript", "types"]`
- Added `license`: `MIT`

### README.md
- Created new README with DecentralChain branding, install instructions, exported types documentation, and chain ID table.

### package-lock.json
- Regenerated with new package name `@decentralchain/ts-types`.

### Source Files (src/, transactions/)
- **No changes required.** All TypeScript source files were already free of Waves references. No Waves-prefixed types, no chain ID constants, no Waves URLs or comments.

## Breaking Changes

- **Package scope change:** `@waves/ts-types` → `@decentralchain/ts-types`. Downstream consumers must update their `import` statements and `package.json` dependencies.
- **No API changes.** All exported types, constants, and interfaces are identical.

## Downstream Consumers

The following packages depend on this library and must update their imports:
- `@decentralchain/waves-transactions` (DCC-15, Phase 3)
- `@decentralchain/signature-adapter` (DCC-16, Phase 4)
