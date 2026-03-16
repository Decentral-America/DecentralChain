# Monorepo Architecture

> **Purpose**: Documents the architecture, design decisions, toolchain choices, and operational structure of the `decentralchain-sdk` monorepo. This is the technical reference for how the monorepo is built and why.
>
> **Audience**: SDK contributors, DevOps engineers, AI agents interacting with the workspace.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Inclusion Rule](#2-inclusion-rule)
3. [Directory Structure](#3-directory-structure)
4. [Toolchain](#4-toolchain)
5. [Package Tiers](#5-package-tiers)
6. [Nx Configuration](#6-nx-configuration)
7. [pnpm Workspace & Catalogs](#7-pnpm-workspace--catalogs)
8. [TypeScript Project References](#8-typescript-project-references)
9. [Biome Monorepo Config](#9-biome-monorepo-config)
10. [Build Pipeline](#10-build-pipeline)
11. [CI/CD Architecture](#11-cicd-architecture)
12. [Publishing Strategy](#12-publishing-strategy)
13. [Developer Workflow](#13-developer-workflow)
14. [AI Integration](#14-ai-integration)
15. [Decision Log](#15-decision-log)

---

## 1. Overview

The `decentralchain-sdk` monorepo consolidates all `@decentralchain/*` SDK libraries and TypeScript applications into a single repository managed by **Nx + pnpm**.

### Before (Polyrepo) → After (Monorepo)

| Before | After |
|--------|-------|
| 25 separate `npm ci` runs in CI | 1 `pnpm install` with shared cache |
| Change in `ts-types` → manual bump in 6+ downstream repos | Change in `ts-types` → all consumers automatically use latest |
| 25 identical `biome.json` files to maintain | 1 root `biome.json` + per-package overrides |
| Cross-package refactor = 6+ PRs across repos | Cross-package refactor = 1 atomic PR |
| `fix-cross-deps.mjs` to sync versions | Workspace protocol `"workspace:*"` |
| ~3,800 tests across 20 repos, no unified view | `nx run-many -t test` — single command, cached, parallel |
| AI agents can't see across repo boundaries | Full SDK visible in one context |

---

## 2. Inclusion Rule

> **If it's TypeScript and it imports `@decentralchain/*` — it belongs in the monorepo.**
>
> Libraries go in `packages/`. Apps go in `apps/`. Everything else stays in its own repo.

### What's In

| Category | Location | Count | Examples |
|----------|----------|-------|---------|
| SDK libraries | `packages/*` | 22 | All `@decentralchain/*` npm-published packages |
| Apps consuming SDK | `apps/*` | 3 | cubensis-connect (9 SDK deps), exchange (8), explorer (3) |

### What's Out

| Repository | Reason |
|-----------|--------|
| `node-scala` | Scala/JVM — different toolchain |
| `passport`, `DCC-ERC20-Gateway` | Python — different runtime |
| `k8s-manifests`, `dcc-configs`, `dcc-token-filters` | YAML/JSON config — no npm publishing |
| `dcc-ride-templates` | Ride smart contracts — different toolchain |

---

## 3. Directory Structure

```
decentralchain-sdk/
├── .github/
│   ├── copilot-instructions.md     AI context for Copilot
│   ├── skills/                     8 custom AI skills
│   └── workflows/                  CI/CD pipelines
├── apps/
│   ├── cubensis-connect/           Browser wallet extension
│   ├── exchange/                   Electron DEX trading app
│   └── explorer/                   Block explorer web app
├── packages/
│   ├── ts-types/                   Core TypeScript types
│   ├── bignumber/                  Arbitrary precision math
│   ├── ts-lib-crypto/              Cryptographic primitives
│   ├── marshall/                   Binary serialization
│   ├── transactions/               Transaction builders
│   ├── ...                         (22 packages total)
│   └── cubensis-connect-provider/  Wallet provider
├── docs/
│   ├── ARCHITECTURE.md             This file
│   ├── UPSTREAM.md                 Waves provenance & ecosystem
│   ├── STATUS.md                   Per-package health & timeline
│   ├── SECURITY-AUDIT.md           Security audit checklist
│   └── CONVENTIONS.md              Coding standards & quality pipeline
├── scripts/                        Monorepo automation
├── tools/                          Nx plugins & custom tooling
├── biome.json                      Root Biome config (shared)
├── nx.json                         Nx task pipeline
├── pnpm-workspace.yaml             Workspace packages + catalogs
├── tsconfig.base.json              Shared TypeScript config
├── vitest.base.config.ts           Shared Vitest config
├── lefthook.yml                    Root git hooks
└── knip.json                       Dead code detection
```

---

## 4. Toolchain

| Layer | Tool | Version | Why This Tool |
|-------|------|---------|---------------|
| **Package Manager** | pnpm | 10.x | **Strict isolation** prevents phantom dependencies (unlike npm's flat hoisting). `workspace:*` protocol auto-resolves at publish. `catalog:` centralizes shared versions. 3x faster installs than npm via content-addressable store. |
| **Task Runner** | Nx | 22.x | **Only monorepo tool with native MCP server** — AI agents can query the project graph, run tasks, and monitor builds via 15+ MCP tools. Computation caching replays unchanged tasks in <100ms. `nx affected` detects which packages changed and only rebuilds those, cutting CI from minutes to seconds. See [§15 Decision Log](#15-decision-log) for Nx vs Turborepo. |
| **Bundler** | tsdown | 0.x | **Understands `workspace:*` natively** — no config needed to resolve monorepo deps. Uses Rolldown (Rust) under the hood for speed. ESM-only output with `.mjs` + `.d.mts` matches our ESM-only policy. Successor to tsup with better monorepo support; tsup required workarounds for workspace deps. |
| **Linter/Formatter** | Biome | 2.x | **Replaces both ESLint AND Prettier with one Rust-native binary** — 10-100x faster than ESLint. Single `biome.json` configures both lint and format. Monorepo-aware via `"extends": "//"` (inherits root config). No plugin ecosystem to maintain. Zero-config for 90% of rules. |
| **Test Runner** | Vitest | 4.x | **Native ESM support** — Jest requires `babel-jest` or `ts-jest` transforms for ESM, Vitest runs ESM natively. Same expect/describe/it API as Jest (zero migration friction). Built-in V8 coverage (no `nyc` or `istanbul` needed). `vitest.workspace.ts` for monorepo-native config. |
| **TypeScript** | TypeScript | 5.9.x | **Maximum strictness catches bugs at compile time, not in production.** TS 5.9 adds `--noUncheckedSideEffectImports` and improved `isolatedDeclarations`. Project references enable incremental builds — editor only typechecks the current package + its deps. tsdown handles emit; `tsc` is only for type checking. |
| **Git Hooks** | Lefthook | 1.x | **Parallel execution** runs Biome + typecheck simultaneously (unlike husky which is sequential). Written in Go — fast startup. Supports `stage_fixed: true` to auto-stage Biome's fixes. No Node.js dependency for the hook runner itself. |
| **Node.js** | Node.js | ≥24 | **Native `fetch`, native `crypto.subtle`, native test runner** — eliminates `node-fetch`, `isomorphic-fetch`. Native `Uint8Array` improvements for crypto operations. `--experimental-strip-types` allows running `.ts` files directly in scripts. |

### Build Tool Distribution

| Tool | Used By |
|------|---------|
| tsdown | 17 standard SDK libraries |
| Vite | exchange, explorer, cubensis-connect |
| tsc + wasm-pack | crypto (Rust/WASM hybrid) |
| buf + tsdown | protobuf-serialization, swap-client |

---

## 5. Package Tiers

```
┌─────────────────────────────────────────────────────────────────┐
│ TIER 0 — Foundation (0 internal deps)                          │
│ ts-types · bignumber · marshall · ts-lib-crypto · oracle-data  │
│ browser-bus · parse-json-bignumber · assets-pairs-order         │
│ protobuf-serialization · ledger · crypto · cubensis-connect-types│
├─────────────────────────────────────────────────────────────────┤
│ TIER 1 — Core (depends on Tier 0)                              │
│ data-entities · money-like-to-node · node-api-js · ride-js     │
│ swap-client                                                     │
├─────────────────────────────────────────────────────────────────┤
│ TIER 2 — Integration (depends on Tier 0+1)                     │
│ data-service-client-js · transactions                           │
├─────────────────────────────────────────────────────────────────┤
│ TIER 3 — Adapters (depends on Tier 0+1+2)                      │
│ signature-adapter · signer                                      │
├─────────────────────────────────────────────────────────────────┤
│ TIER 4 — Providers (depends on all tiers)                       │
│ cubensis-connect-provider                                       │
├─────────────────────────────────────────────────────────────────┤
│ APPS — Not published to npm (in monorepo)                       │
│ cubensis-connect · exchange · explorer                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Nx Configuration

Nx operates in **package-based mode** — it infers targets from `package.json` scripts and orchestrates them with caching and dependency awareness.

### `nx.json` Key Concepts

- **`namedInputs`**: Define which files affect which tasks (source code, test files, shared globals).
- **`targetDefaults`**: Set `dependsOn`, `inputs`, `outputs`, and `cache` for each task type.
- **`dependsOn: ["^build"]`**: Build dependencies before building the current package.
- **`affected`**: Only run tasks on packages whose source files changed.

### Task Pipeline

```
build       → dependsOn: [^build]     (build deps first)
typecheck   → dependsOn: [^build]     (need built types)
test        → dependsOn: [build]      (need built output)
lint        → no deps                 (independent)
bulletproof → dependsOn: [lint:fix, typecheck, test]
```

### Special Build Targets

| Package | Custom Target | What It Does |
|---------|--------------|--------------|
| crypto | `build:wasm` | Runs `wasm-pack` for Rust → WASM |
| protobuf-serialization | `generate` | Runs `buf generate` for proto compilation |
| swap-client | `generate` | Runs `buf generate` for proto compilation |

---

## 7. pnpm Workspace & Catalogs

### Workspace Protocol

Internal dependencies use `workspace:*` — pnpm resolves them to local source during development and replaces with real versions at publish time:

```jsonc
// In packages/transactions/package.json
{
  "dependencies": {
    "@decentralchain/ts-types": "workspace:*",    // → ^2.0.1 at publish
    "@decentralchain/marshall": "workspace:*"      // → ^1.0.1 at publish
  }
}
```

This eliminates the need for `fix-cross-deps.mjs` and manual version synchronization.

### Catalogs

Shared external dependency versions defined once in `pnpm-workspace.yaml`:

```yaml
catalog:
  typescript: ^5.9.3
  '@biomejs/biome': ^2.4.6
  vitest: ^4.0.0
```

Packages reference them with `"catalog:"` in their `package.json`:

```jsonc
{
  "devDependencies": {
    "typescript": "catalog:",
    "vitest": "catalog:"
  }
}
```

One place to update a shared dependency version → all packages get it.

---

## 8. TypeScript Project References

Each package's `tsconfig.json` extends the root `tsconfig.base.json` and declares `references` to its `@decentralchain/*` dependencies:

```jsonc
// packages/transactions/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "references": [
    { "path": "../marshall" },
    { "path": "../protobuf-serialization" },
    { "path": "../ts-lib-crypto" },
    { "path": "../ts-types" }
  ]
}
```

Benefits: incremental builds, editor performance, correct type isolation across package boundaries.

---

## 9. Biome Monorepo Config

Biome v2 has native monorepo support via `"extends": "//"` syntax.

- **Root `biome.json`**: Contains all shared rules (formatter, linter, assist).
- **Per-package overrides**: Use `"extends": "//"` then override. Most packages need no `biome.json`.
- **Running**: `biome check .` from root processes the entire monorepo.

---

## 10. Build Pipeline

```
pnpm install
  → nx run-many -t build          (dependency-ordered, cached)
  → nx run-many -t typecheck      (TS project references)
  → nx run-many -t test           (Vitest per-package)
  → nx run-many -t lint           (Biome)
```

Nx caches results in `.nx/cache/`. If inputs haven't changed, tasks replay from cache instantly.

---

## 11. CI/CD Architecture

### Pull Request CI

```yaml
- pnpm install --frozen-lockfile
- nx run-many -t build
- nx run-many -t typecheck
- nx run-many -t lint
- nx run-many -t test
```

### Affected Detection

On PRs, use `nx affected -t test` to only test packages whose source changed — reduces CI time from ~5 minutes to seconds for single-package changes.

---

## 12. Publishing Strategy

### Workspace Protocol Resolution

| In Monorepo | Published to npm |
|-------------|------------------|
| `"@decentralchain/ts-types": "workspace:*"` | `"@decentralchain/ts-types": "^2.0.1"` |

### npm Provenance

All packages publish with signed provenance:
```json
{ "publishConfig": { "provenance": true, "access": "public" } }
```

---

## 13. Developer Workflow

```bash
# Install everything
pnpm install

# Build all packages (dependency-ordered, cached)
pnpm build

# Build one package and its dependencies
npx nx build @decentralchain/transactions

# Run affected tests only
npx nx affected -t test

# Full quality gate
pnpm bulletproof

# Visualize the dependency graph
pnpm graph

# Dev mode for an app
npx nx dev exchange

# Filter by package
pnpm --filter @decentralchain/signer test
```

---

## 14. AI Integration

Nx provides a native MCP server (`nx mcp`) with 15+ tools for AI agents:

| Tool | Purpose |
|------|---------|
| `nx_workspace` | Query workspace structure and project list |
| `nx_project_details` | Get details for a specific project |
| `nx_docs` | Search Nx documentation |
| `nx_visualize_graph` | Render dependency graph |
| `nx_generators` | Discover available code generators |
| `nx_current_running_tasks_details` | Monitor running tasks |

Custom AI skills in `.github/skills/` cover: `nx-generate`, `nx-run-tasks`, `nx-workspace`, `add-sdk-package`, `link-workspace-packages`, `release-packages`, `validate-architecture`, `monitor-ci`.

---

## 15. Decision Log

Every significant architectural choice is documented here with the reasoning that drove it. This log helps future contributors (and AI agents) understand **why** things are the way they are — not just what they are.

| # | Decision | Rationale |
|---|----------|-----------|
| D-1 | **pnpm** over npm/yarn | npm's flat `node_modules` allows phantom dependencies (importing packages you didn't declare). pnpm's content-addressable store + symlinks prevent this. `workspace:*` protocol resolves to local source in dev and real versions at publish — eliminates the entire `fix-cross-deps.mjs` workflow. `catalog:` centralizes 15+ shared devDep versions in one place. Yarn v4 was considered but pnpm's workspace protocol is more mature and Corepack support is better. |
| D-2 | **Nx** over Turborepo | Turborepo is simpler (~35 lines config vs ~60), but Nx wins on three dimensions that matter most for this project: **(1) AI-first**: native MCP server with 15+ tools lets AI agents query workspace structure, run tasks, and monitor builds — Turborepo has no equivalent. **(2) Migration**: `nx import` preserves full git history per package during monorepo consolidation — critical for audit trail. **(3) Project graph**: interactive web UI + dependency-aware task ordering vs Turborepo's static Graphviz. See [full comparison below](#nx-vs-turborepo--why-nx). |
| D-3 | **Nx Release** for publishing | Independent versioning per-package driven by conventional commits. `nx release` handles version bumps, changelog generation, and npm publish with provenance in one command. Works with the project graph to only version packages with actual changes. |
| D-4 | **`packages/` + `apps/`** layout | npm-published SDK libraries live in `packages/`, private applications in `apps/`. This makes the publish boundary explicit — everything in `packages/` ships to npm, nothing in `apps/` does. Nx tags (`scope:sdk` vs `scope:app`) enforce the boundary: SDK packages cannot depend on apps. |
| D-5 | **TypeScript project references** | Without project references, `tsc` typechecks the entire monorepo as one unit — slow and error-prone. With references, each package is a `composite` project that builds independently. The editor only loads types for the current package + its declared dependencies, keeping IntelliSense fast even at 25 projects. Incremental builds skip unchanged packages. |
| D-6 | **Per-package Vitest configs** | Each package has its own `vitest.config.ts` extending a shared base. This allows per-package coverage thresholds (crypto at 95%, new packages at 80%), per-package test include patterns, and proper Nx caching — Nx caches test results per-project, so a shared config would invalidate all caches on any test config change. |
| D-7 | **Root Biome v2** with `extends: "//"` | One `biome.json` at root defines all lint/format rules for the entire monorepo. Packages inherit with `"extends": "//"` (Biome's monorepo resolution syntax). Only packages with genuine overrides need their own `biome.json` (e.g., swap-client disables lint for generated protobuf code). This eliminated 20+ near-identical config files. |
| D-8 | **Exclude node-scala** | Scala/sbt — fundamentally different toolchain |
| D-9 | **Include all TS apps importing `@decentralchain/*`** | The inclusion rule is intentionally simple: "if it's TypeScript and imports `@decentralchain/*`, it belongs here." This ensures that when a library changes, all consumers are tested atomically in the same PR — no publish-install-wait-test-find-bug-fix cycle. Exchange and explorer were initially separate repos; moving them into the monorepo caught 3 integration issues that would have reached production. |
| D-10 | **`workspace:*` protocol** | In the polyrepo era, `fix-cross-deps.mjs` had to manually update 22 cross-dependency versions before every publish. `workspace:*` tells pnpm "use the local source in dev, replace with the real published version at publish time." Zero manual version management, zero version drift, zero publish-order bugs. |
| D-11 | **`nx import`** for history | Every package was imported with full git history preserved. This means `git log packages/transactions/` shows the complete commit history from the original polyrepo. Essential for: security audits ("when was this crypto code last touched?"), blame ("who wrote this signing logic?"), and bisect ("which commit broke serialization?"). The alternative — fresh `git init` — would have destroyed the audit trail for financial infrastructure code. |

### Nx vs Turborepo — Why Nx

The operator's priorities — best-in-class tooling, heavy AI leverage, willingness to invest in configuration — favor Nx decisively:

| Dimension | Turborepo | Nx |
|-----------|-----------|-----|
| AI/MCP | Community only | **Native** (15+ tools) |
| Feature count | 8/19 | **18/19** |
| Self-healing CI | None | **Native** (Nx Cloud) |
| Config complexity | ~35 lines | ~60 lines |
| Project graph | Static Graphviz | **Interactive web UI** |
| Migration tools | Manual | **`nx import`, `nx migrate`** |

Weighted score: **Nx 9.0 vs Turborepo 7.3** with AI-first weighting (25% AI integration, 20% caching, 15% DX, 15% features, 10% migration, 10% graph, 5% portability).

**Revisit triggers**: Nx daemon instability, Nx Cloud free tier restrictions, Turborepo ships native MCP, or team grows and struggles with Nx learning curve.
