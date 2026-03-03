# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [1.0.0] - 2026-03-02

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced legacy global declarations with proper TypeScript module exports.
- Restructured source into `src/` with `src/types.ts` and `src/index.ts`.
- All exported types now use `readonly` properties for immutability.
- Replaced all Waves branding with DecentralChain equivalents in JSDoc.
- Upgraded all dependencies to latest versions.
- Rebranded from `@decentralchain` v0.x legacy to modernized `@decentralchain` v1.0.

### Added

- TypeScript strict mode with all strict flags enabled.
- Proper `exports` field in package.json with ESM + CJS dual output via tsup.
- ESLint flat config with type-aware strict rules and Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Comprehensive type-level test suite (Vitest + `expectTypeOf`).
- Code coverage with 90% threshold enforcement.
- `ICubensisConnectApi` interface (replaces legacy `TCubensisConnectApi` type).
- Global augmentation via `declare global` for `window.CubensisConnect`.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md governance docs.
- publint + attw package validation.
- size-limit bundle size enforcement.

### Removed

- Legacy `globals.d.ts` at package root (now built to `dist/`).
- `.history/` directory.
- Old npm-publish workflow (replaced by CI).
- All Waves branding and documentation references.
