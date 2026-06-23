# 2.0.0 (2026-06-23)

### 🚀 Features

- groth16 v2 verifier, blst 0.3.16 rebuild, 2.0 modernization sprint ([23b26ee7d](https://github.com/Decentral-America/DecentralChain/commit/23b26ee7d))
- **DCC-248:** rename packages/ts to packages/sdk ([7cafab4ae](https://github.com/Decentral-America/DecentralChain/commit/7cafab4ae))

### 🩹 Fixes

- **deps:** commit missing package.json version bumps from pnpm update ([3d0bfd070](https://github.com/Decentral-America/DecentralChain/commit/3d0bfd070))
- update all packages/ts → packages/sdk path references ([c75eb492d](https://github.com/Decentral-America/DecentralChain/commit/c75eb492d))

### ❤️ Thank You

- Josue Rojas

# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [1.1.1] - 2026-02-28

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now 22.
- Replaced jest with Vitest.
- Replaced webpack with tsup.
- Upgraded all dependencies to latest versions.
- Rebranded from `@dcc` to `@decentralchain`.

### Added

- TypeScript strict mode with full type definitions.
- ESLint flat config with Prettier integration.
- Husky + lint-staged pre-commit hooks.
- GitHub Actions CI pipeline (Node 22, 24).
- Dependabot for automated dependency updates.
- Code coverage with threshold enforcement (90%+).
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

### Removed

- Legacy build tooling (webpack).
- yarn lockfile.
- All Waves branding and references.
