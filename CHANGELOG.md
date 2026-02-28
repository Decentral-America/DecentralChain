# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [2.0.0] - 2026-02-28

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced webpack with tsup for building ESM + CJS + UMD bundles.
- Upgraded all dependencies to latest versions.
- Rebranded copyright from `WavesPlatform` to `DecentralChain`.
- Fixed `ChaidId` typo — now exported as `ChainId` (with deprecated `ChaidId` alias).
- Improved `concat()` from O(n²) to O(n) using pre-allocated `Uint8Array`.
- Modernized `Utf8.ts` to use native `TextEncoder`/`TextDecoder`.
- Removed deprecated `Buffer` constructor usage in `random.ts`.

### Added

- TypeScript strict mode with enhanced compiler options.
- ESLint flat config (`eslint.config.mjs`) with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Code coverage with V8 provider and threshold enforcement.
- `tsup.config.ts` producing ESM (`.mjs`), CJS (`.cjs`), and UMD (`.umd.min.js`) bundles.
- Dual entry points: `@decentralchain/ts-lib-crypto` (Base58) and `@decentralchain/ts-lib-crypto/bytes`.
- BLS exports (`blsKeyPair`, `blsPublicKey`, `blsSign`, `blsVerify`) now available from main entry.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md governance docs.
- publint + attw for package validation.
- size-limit for bundle size budgeting.

### Removed

- Legacy build tooling (webpack, ts-node build scripts, ncp, rimraf).
- `build/` directory with custom build scripts.
- Old ESLint CJS config.
- `.npmignore` (replaced by `files` field in `package.json`).
- Jest debug script reference.
- All Waves branding from LICENSE and configuration.
