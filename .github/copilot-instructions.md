# DecentralChain SDK — Copilot Instructions

## Project Overview

This is the **DecentralChain SDK monorepo** — a unified TypeScript workspace for all `@decentralchain/*` npm packages. It consolidates 22 SDK libraries and 3 applications that together form the complete developer toolkit for the DecentralChain blockchain (a Waves-protocol fork using Liquid Proof-of-Stake consensus and the Ride smart contract language).

## Architecture

### Package Layers (enforced by `scripts/check-boundaries.mjs`)

Packages are organized into dependency layers (0–4). A package may only depend on packages in the same layer or below.

| Layer | Packages |
|-------|----------|
| **0 — Primitives** | `ts-types`, `bignumber`, `crypto`, `ts-lib-crypto`, `parse-json-bignumber`, `browser-bus`, `assets-pairs-order`, `cubensis-connect-types`, `ledger`, `marshall`, `oracle-data`, `protobuf-serialization` |
| **1 — Domain** | `data-entities`, `money-like-to-node`, `ride-js`, `swap-client` |
| **2 — Services** | `transactions`, `node-api-js`, `data-service-client-js` |
| **3 — Integration** | `signer` |
| **4 — Adapter** | `signature-adapter`, `cubensis-connect-provider` |

### Applications (`apps/`)

| App | Description |
|-----|-------------|
| `exchange` | DecentralChain DEX trading interface (Vite + React) |
| `scanner` | Blockchain explorer (Vite + React) |
| `cubensis-connect` | Browser extension wallet |

Apps have `scope:app` tags and can depend on any SDK package. SDK packages must never depend on apps.

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| **Nx** | 22.5.x | Workspace orchestration, task caching, affected detection, release |
| **pnpm** | 10.32.x | Package manager with `workspace:*` protocol |
| **TypeScript** | 5.9.x | Maximum strictness (strict + all extra flags), ES2024, bundler moduleResolution |
| **Biome** | 2.4.x | Linting + formatting (replaces ESLint/Prettier entirely) |
| **tsdown** | 0.21.x | Build tool for 21/22 packages (ESM-only `.mjs` + `.d.mts`) |
| **Vitest** | 4.x | Testing with v8 coverage |
| **Node.js** | ≥24 | Required runtime (see `.node-version`) |

## Conventions

### Code Style
- **ESM-only**: No CommonJS anywhere. Biome enforces `noCommonJs: error`.
- **Single quotes**, **semicolons always**, **2-space indent**, **LF line endings**, **100-char line width**.
- **`verbatimModuleSyntax: true`** — use `import type` for type-only imports.

### Package Structure
Every SDK package follows this structure:
```
packages/<name>/
  biome.json          # extends root: "extends": "//", "root": false
  knip.json           # dead code detection config
  lefthook.yml        # git hooks (biome check + typecheck)
  package.json        # with nx.tags for layer enforcement
  tsconfig.json       # extends ../../tsconfig.base.json
  tsdown.config.ts    # ESM build config
  vitest.config.ts    # test config with v8 coverage
  src/                # source code
```

### Build & Test Commands
Always use Nx to run tasks, never underlying tools directly:
```bash
pnpm nx run <project>:build        # Build single package
pnpm nx run-many -t build          # Build all
pnpm nx affected -t test           # Test affected packages
pnpm nx affected -t biome-lint     # Lint affected packages
pnpm nx run-many -t typecheck      # Type-check all (excludes cubensis-connect)
```

### Biome
- Root `biome.json` defines all rules. Per-package configs only override with `"extends": "//"`.
- Biome targets (`biome-lint`, `biome-fix`) are inferred by a custom Nx plugin at `tools/nx-plugins/biome-inferred/`.
- `biome-lint` is cached; `biome-fix` is not.

### Releases
- **Independent versioning** via `nx release` with conventional commits.
- Changelogs are auto-generated per-project and at workspace level.
- npm provenance signing is enabled.

### Git Hooks (Lefthook)
- **pre-commit**: Biome check on staged files + typecheck (parallel).
- **commit-msg**: Conventional commits format required (`feat:`, `fix:`, `chore:`, etc.).

### Module Boundaries
Always respect the layer system. Before adding a dependency:
1. Check the target package's `layer:N` tag in its `package.json` → `nx.tags`.
2. Your package's layer must be ≥ the dependency's layer.
3. Run `node scripts/check-boundaries.mjs` to validate.

## Domain Context

DecentralChain is a **Waves-protocol blockchain fork** with:
- **Liquid Proof-of-Stake (LPoS)** consensus
- **Ride** smart contract language (non-Turing-complete, predictable execution)
- Native **DEX** (decentralized exchange) built into the protocol
- **Data transactions** for on-chain key-value storage
- Transaction types: transfer, issue, reissue, burn, lease, mass-transfer, set-script, invoke-script, exchange, etc.

Key abstractions across packages:
- `Long` / `BigNumber` for blockchain precision arithmetic
- `SignedTransaction<T>` / `TransactionFromNode<T>` for transaction lifecycle
- `Seed` / `KeyPair` for cryptographic identity (curve25519 + blake2b/keccak)

## Internal Documentation

Refer to these docs for deep context:
- **`docs/UPSTREAM.md`** — Waves provenance, ecosystem mapping, gap analysis, wire-format constraints
- **`docs/ARCHITECTURE.md`** — Monorepo design, dependency tiers, Nx config, build pipeline, decision log
- **`docs/STATUS.md`** — Per-package health, timeline, open issues, remediation priority matrix
- **`docs/SECURITY-AUDIT.md`** — 6-phase security audit playbook with severity definitions and checklists
- **`docs/CONVENTIONS.md`** — Coding standards, TypeScript strictness, testing standards, file templates, naming conventions
