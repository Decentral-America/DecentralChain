# DecentralChain SDK — Agent Instructions

## Project Context

This is the **DecentralChain SDK monorepo** — a unified TypeScript workspace publishing `@decentralchain/*` npm packages. DecentralChain is a Waves-protocol blockchain fork using Liquid Proof-of-Stake (LPoS) consensus and the Ride smart contract language.

## Architecture

- **25 Nx projects**: 22 SDK packages (in `packages/`) + 3 apps (in `apps/`)
- **5 dependency layers** (0–4) enforced by `scripts/check-boundaries.mjs` — packages may only depend on same or lower layers
- **Layer 0 (Primitives)**: ts-types, bignumber, crypto, ts-lib-crypto, parse-json-bignumber, browser-bus, assets-pairs-order, cubensis-connect-types, ledger, marshall, oracle-data, protobuf-serialization
- **Layer 1 (Domain)**: data-entities, money-like-to-node, ride-js, swap-client
- **Layer 2 (Services)**: transactions, node-api-js, data-service-client-js
- **Layer 3 (Integration)**: signer
- **Layer 4 (Adapter)**: signature-adapter, cubensis-connect-provider
- **Apps**: exchange (DEX), scanner (explorer), cubensis-connect (wallet extension)

## Tech Stack

- **Nx 22.5.x** — task orchestration, caching, affected detection, independent versioning
- **pnpm 10.32.x** — `workspace:*` protocol, corepack-managed
- **TypeScript 5.9.x** — maximum strictness, ES2024, bundler moduleResolution, verbatimModuleSyntax
- **Biome 2.4.x** — linting + formatting (replaces ESLint/Prettier). Root config + per-package `"extends": "//"`.
- **tsdown 0.21.x** — build tool for 21/22 packages (ESM-only `.mjs` + `.d.mts`). crypto uses tsc + wasm-pack.
- **Vitest 4.x** — testing with v8 coverage
- **Node.js >= 24** required

## Rules

1. **ESM-only** — no CommonJS. Biome enforces `noCommonJs: error`.
2. **Always use Nx** — never call underlying tools (tsc, vitest, biome) directly. Use `pnpm nx run <project>:<target>`.
3. **Respect layer boundaries** — check `nx.tags` in package.json before adding cross-package deps. Validate with `node scripts/check-boundaries.mjs`.
4. **Conventional commits** — `feat(scope):`, `fix(scope):`, `chore:`, etc. Scope = package name without `@decentralchain/` prefix.
5. **Biome for all formatting/linting** — per-package `biome.json` extends root with `"extends": "//"` and `"root": false`. Biome targets are inferred by custom Nx plugin at `tools/nx-plugins/biome-inferred/`.
6. **Single quotes**, **semicolons always**, **2-space indent**, **LF line endings**, **100-char line width**.
7. Use `import type` for type-only imports (`verbatimModuleSyntax: true`).

## Key Commands

```bash
pnpm nx affected -t build           # Build affected packages
pnpm nx affected -t test            # Test affected packages
pnpm nx affected -t biome-lint      # Lint affected packages
pnpm nx run-many -t typecheck       # Type-check all
node scripts/check-boundaries.mjs   # Validate module boundary layers
pnpm nx graph                       # Visualize dependency graph
```

---

## Available Skills

| Skill | Purpose |
|-------|---------|
| `add-sdk-package` | Scaffold a new `@decentralchain/*` package with all configs |
| `link-workspace-packages` | Add workspace dependencies with layer boundary validation |
| `release-packages` | Version and publish packages via `nx release` |
| `validate-architecture` | Run comprehensive quality and boundary checks |
| `monitor-ci` | Monitor Nx Cloud CI pipeline with self-healing |
| `nx-generate` | Discover and run Nx generators |
| `nx-run-tasks` | Run Nx tasks (build, test, lint) |
| `nx-workspace` | Explore workspace structure, projects, and dependencies |


<!-- nx configuration end-->