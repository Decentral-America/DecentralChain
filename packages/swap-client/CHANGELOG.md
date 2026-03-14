# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [1.0.0] - 2026-03-10

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- **BREAKING**: Rebranded from `@keeper-wallet/swap-client` to `@decentralchain/swap-client`.
- Minimum Node.js version is now 24.
- Replaced Vite + tsc with tsup.
- Replaced ESLint + Prettier with Biome 2.4.6.
- Upgraded TypeScript from 5.x to 5.9.3.
- Replaced `@waves/bignumber` with `@decentralchain/bignumber`.
- Upgraded `nanoid` from 4.x to 5.x.
- Reconnection now uses exponential backoff (1 s → 2 s → 4 s → ... → 30 s max).
- Malformed protobuf responses are now logged and discarded instead of crashing.
- Binary values use cross-platform encoding (Buffer on Node.js, btoa fallback in browser).

### Added

- TypeScript strict mode with full type checking.
- Vitest test runner with comprehensive WebSocket mock tests.
- Lefthook pre-commit hooks.
- Configurable WebSocket endpoint (defaults to `wss://swap.decentralchain.io/v2`).
- `destroy()` method for deterministic cleanup (closes socket, clears timers).
- `isConnected` / `isDestroyed` read-only properties.
- Connection timeout (`connectTimeoutMs`, default 15 s).
- Maximum reconnection attempts (`maxReconnectAttempts`, default 10).
- Input validation on `setSwapParams()` (empty asset IDs, zero amount).
- Reverse-engineered `.proto` schema source (previously only compiled output existed).
- publint, attw, and size-limit quality gates.
- Bulletproof pipeline (`npm run bulletproof`).
- `convertArg` exported for downstream testing.

### Removed

- `@babel/highlight` dependency (unused).
- `@types/long` dependency (bundled in Long v5).
- Vite build tooling.
- ESLint, Prettier, commitlint, semantic-release tooling.
