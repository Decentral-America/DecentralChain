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

- **Nx 22.6.x** — task orchestration, caching, affected detection, independent versioning
- **pnpm 10.32.x** — `workspace:*` protocol, corepack-managed
- **TypeScript 6.0.2** — maximum strictness, ES2024, bundler moduleResolution, verbatimModuleSyntax
- **Biome 2.4.x** — linting + formatting (replaces ESLint/Prettier). Root config + per-package `"extends": "//"`.
- **tsdown 0.21.x** — build tool for 21/22 packages (ESM-only `.mjs` + `.d.mts`). crypto uses tsc + wasm-pack.
- **Vite 8.x** — app bundler (exchange, scanner, cubensis-connect). Rolldown built-in.
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

## AI & Editor Integration

### Nx MCP Server

The Nx MCP server (configured in `.vscode/mcp.json`) provides structured access to workspace metadata. **Always prefer Nx MCP tools over manual file parsing** for workspace structure, project relationships, and task configuration:

- `nx_workspace` — full project list, tags, relationships
- `nx_project_details` — targets, config, dependencies for one project
- `nx_visualize_graph` — interactive dependency graph
- `nx_generators` — available generators (including custom `sdk-package`)
- `nx_docs` — up-to-date Nx documentation

### Additional MCP Servers

| Server | Purpose |
|--------|---------|
| **Context7** | Up-to-date library documentation for any npm dependency |
| **Chrome DevTools** | Browser automation — screenshots, network inspection, interaction testing for exchange/scanner/cubensis-connect |
| **GitHub** | GitHub API — issues, PRs, code search, reviews, branch management |

### Reusable Prompts (`.github/prompts/`)

| Prompt | Purpose |
|--------|---------|
| `build-package` | Build a specific package and its dependencies via Nx |
| `test-affected` | Test only what changed using `nx affected` |
| `add-dependency` | Add cross-package deps with automatic layer validation |
| `debug-build` | Diagnose build/typecheck/lint failures |
| `validate-workspace` | Run full quality pipeline (boundaries → lint → typecheck → test → build) |
| `explore-workspace` | Understand project relationships and dependency graph |
| `monitor-ci` | Monitor Nx Cloud CI pipeline with self-healing |
| `upstream-sync` | Check for and port changes from upstream Waves repositories |

### VS Code Workspace Config

Shared team configuration (committed to repo):

| File | Purpose |
|------|---------|
| `.vscode/settings.json` | Biome as sole formatter, TS SDK, monorepo file nesting |
| `.vscode/extensions.json` | Required: Biome, Nx Console, Copilot, Vitest Explorer, GitLens |
| `.vscode/tasks.json` | Build/test/lint/typecheck as Command Palette tasks |
| `.vscode/launch.json` | Debug configs for Vitest tests and Vite dev servers |
| `.vscode/mcp.json` | Nx MCP + Context7 + Chrome DevTools + GitHub |

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
| `upstream-sync` | Sync DCC packages with upstream Waves repos — fetch, diff, evaluate, port, validate |


<!-- nx configuration end-->


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->
