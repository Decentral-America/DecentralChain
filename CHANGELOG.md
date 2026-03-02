# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] — 2026-03-02

### Changed

- **BREAKING**: Restructured internal modules — `transactions/` moved into `src/`.
- **BREAKING**: Circular dependency between `parts.ts` and `index.ts` eliminated.
- Upgraded to ESM-only build with `tsup` (replaces raw `tsc`).
- Target upgraded from ES2020 → ES2024.
- TypeScript strict mode hardened: added `exactOptionalPropertyTypes`,
  `noPropertyAccessFromIndexSignature`, `verbatimModuleSyntax`, `erasableSyntaxOnly`.
- ESLint upgraded to `strictTypeChecked` + `stylisticTypeChecked` flat config.
- Node.js minimum raised to 22 (recommended: 24).
- Added Vitest test suite with 90 % coverage thresholds.
- Added `publint`, `@arethetypeswrong/cli`, and `size-limit` quality gates.
- Added SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md.
- Fixed `WithVersion` constraint from `Record<string, any>` → `Record<string, unknown>`.

### Fixed

- `WithVersion` type now uses `Record<string, unknown>` (no `any`).
- `SignedIExchangeTransactionOrder` constraint tightened from `any` → `unknown`.
- `SignedTransaction` constraint tightened from `any` → `unknown`.

### Removed

- Legacy `transactions/` directory (merged into `src/transactions.ts`).
- `.vscode/settings.json` with typos (`javasctipt`, `javasctiptreact`).

## [1.2.0] — 2026-02-28

### Added

- Initial release as `@decentralchain/ts-types`.
- Full transaction type definitions for all 18 DecentralChain transaction types.
- Exchange order types (V1–V4) with signed order wrappers.
- Data transaction entry types with generic field support.
- State change types for invoke script results.
