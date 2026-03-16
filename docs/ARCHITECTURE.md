# Monorepo Architecture

> **Purpose**: Documents the architecture, design decisions, toolchain choices, and operational structure of the `DecentralChain` monorepo. This is the technical reference for how the monorepo is built and why.
>
> **Audience**: SDK contributors, DevOps engineers, AI agents interacting with the workspace.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Inclusion Rule](#2-inclusion-rule)
3. [Directory Structure](#3-directory-structure)
4. [Toolchain](#4-toolchain)
5. [AI & Editor Integration](#5-ai--editor-integration)
6. [Package Tiers](#6-package-tiers)
7. [Nx Configuration](#7-nx-configuration)
8. [pnpm Workspace & Catalogs](#8-pnpm-workspace--catalogs)
9. [TypeScript Project References](#9-typescript-project-references)
10. [Biome Monorepo Config](#10-biome-monorepo-config)
11. [Build Pipeline](#11-build-pipeline)
12. [CI/CD Architecture](#12-cicd-architecture)
13. [Publishing Strategy](#13-publishing-strategy)
14. [Developer Workflow](#14-developer-workflow)
15. [Decision Log](#15-decision-log)

---

## 1. Overview

The `DecentralChain` monorepo consolidates all `@decentralchain/*` SDK libraries and TypeScript applications into a single repository managed by **Nx + pnpm**.

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
DecentralChain/
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

## 5. AI & Editor Integration

> **Why AI-first?** This monorepo was designed from day one with AI agents as first-class consumers of its metadata. Nx was chosen over Turborepo specifically because of its native MCP server — the only monorepo tool that exposes the project graph, task pipeline, and workspace structure to AI agents via a standard protocol. Every configuration file, skill, prompt, and VS Code setting documented here serves a dual purpose: human developer productivity *and* AI agent effectiveness. In a 25-project monorepo handling financial transactions, AI agents that understand the architecture produce safer, more consistent code than agents that only see individual files.

### 5.1 — Design Philosophy

Nx provides what Victor Savkin calls the "30,000-foot map" of the codebase. Raw file access is like navigating a city using only street view — you can see individual buildings but can't pick optimal routes. The Nx project graph, tags, task pipeline, and generator metadata give AI agents the architectural map they need to make informed decisions about where to place code, what a change impacts, and which patterns to follow.

The integration operates at three abstraction levels:

| Level | What AI Sees | How It's Provided |
|-------|-------------|-------------------|
| **30,000-ft** (architecture) | Project graph, dependency layers, team ownership, task pipeline | Nx MCP server (`nx_workspace`, `nx_project_details`, `nx_visualize_graph`) |
| **1,000-ft** (conventions) | Coding standards, module boundaries, build/test patterns, domain context | `copilot-instructions.md`, `AGENTS.md`, `docs/*.md` |
| **0-ft** (code) | Individual files, functions, types | VS Code editor context, file reads, semantic search |

### 5.2 — Nx MCP Server

The Nx Model Context Protocol server is the backbone of AI integration. Configured in `.vscode/mcp.json`, it starts automatically when any MCP-compatible client (Copilot, Cursor, Claude) connects:

```jsonc
// .vscode/mcp.json
{
  "servers": {
    "nx": {
      "command": "npx",
      "args": ["nx", "mcp"],
      "type": "stdio"
    }
  }
}
```

The MCP server exposes pre-computed metadata that would otherwise require parsing dozens of `package.json`, `tsconfig.json`, and `nx.json` files:

| MCP Tool | What It Returns | Use Case |
|----------|----------------|----------|
| `nx_workspace` | All 25 projects with names, tags, types, relationships | "What projects exist? What depends on `ts-types`?" |
| `nx_project_details` | Targets, config, dependencies, tags for one project | "What targets can I run for `transactions`?" |
| `nx_visualize_graph` | Interactive dependency graph (opens in browser) | "Show me how packages are connected" |
| `nx_generators` | All available generators (official + custom `sdk-package`) | "What generators can scaffold a new package?" |
| `nx_generator_schema` | Full schema with all options for a specific generator | "What options does `sdk-package` accept?" |
| `nx_docs` | Up-to-date Nx documentation search | "How do I configure task pipelines?" (prevents hallucination) |
| `nx_workspace_path` | Absolute path to the workspace root | Runtime context for file operations |
| `nx_available_plugins` | Installable Nx plugins from the registry | "What plugins exist for Vite/Vitest/etc?" |
| `nx_current_running_tasks_details` | Currently executing tasks with status | "What's building right now?" |
| `nx_current_running_task_output` | Stdout/stderr of a running task | "Show me the build output" |

**Rule: Always prefer Nx MCP tools over manual file parsing.** An agent calling `nx_project_details` gets accurate, pre-computed data in one call. An agent reading `package.json` + `project.json` + `nx.json` manually may miss inferred targets, misinterpret `dependsOn`, or skip tags.

### 5.3 — Context7 MCP Server

A second MCP server provides on-demand access to up-to-date documentation for any npm library:

```jsonc
// .vscode/mcp.json
{
  "servers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"],
      "type": "stdio"
    }
  }
}
```

| Tool | Purpose |
|------|---------|
| `resolve-library-id` | Resolve a library name to its Context7 ID |
| `query-docs` | Fetch current documentation and code examples for any library |

This prevents AI agents from hallucinating outdated APIs for Nx, Vitest, Biome, tsdown, or any dependency in the workspace.

### 5.4 — Chrome DevTools MCP Server

A browser automation MCP server for front-end development and testing of the three apps (exchange, scanner, cubensis-connect):

```jsonc
// .vscode/mcp.json
{
  "servers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["chrome-devtools-mcp@latest"]
    }
  }
}
```

| Tool Category | Examples | Use Case |
|---------------|----------|----------|
| Navigation | `navigate_page`, `new_page`, `close_page`, `list_pages` | Open app URLs, manage tabs |
| Interaction | `click`, `fill`, `hover`, `press_key`, `type_text`, `drag` | Automate UI interactions |
| Inspection | `take_screenshot`, `take_snapshot`, `evaluate_script` | Visual debugging, DOM inspection |
| Forms | `fill_form`, `upload_file`, `select_page` | Test form flows |
| Network | `list_network_requests`, `get_network_request` | Debug API calls from the DEX/explorer |
| Console | `list_console_messages`, `get_console_message` | Catch runtime errors |
| Performance | `performance_start_trace`, `performance_stop_trace`, `lighthouse_audit` | Profile app performance |
| Dialogs | `handle_dialog`, `wait_for` | Handle confirmations, modals |

This is particularly useful for debugging the exchange app's trading interface and the scanner's block explorer UI — agents can take screenshots, inspect network requests to the DecentralChain node, and automate interaction flows.

### 5.5 — GitHub MCP Server

The GitHub Copilot MCP server provides direct access to GitHub's API for repository operations:

```jsonc
// .vscode/mcp.json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

| Tool Category | Examples | Use Case |
|---------------|----------|----------|
| Issues | `list_issues`, `issue_read`, `issue_write`, `add_issue_comment` | Manage issues, add comments |
| Pull Requests | `list_pull_requests`, `create_pull_request`, `merge_pull_request` | PR workflow without leaving editor |
| Code Search | `search_code`, `search_repositories`, `search_issues` | Find patterns across the org |
| Files | `get_file_contents`, `create_or_update_file`, `push_files` | Read/write repo files via API |
| Branches | `create_branch`, `list_branches`, `list_commits` | Branch management |
| Releases | `list_releases`, `get_latest_release` | Track package releases |
| Reviews | `pull_request_review_write`, `request_copilot_review` | Code review automation |

This enables agents to create PRs, comment on issues, search code across the organization, and manage the full GitHub workflow without switching to the browser.

### 5.6 — Agent Configuration Files

Two files at the repository root define how AI agents should interact with the workspace:

| File | Audience | Content |
|------|----------|---------|
| `.github/copilot-instructions.md` | GitHub Copilot (VS Code) | Full project context: architecture overview, layer system, tech stack, conventions, domain context (blockchain, transaction types, crypto primitives), documentation pointers, Nx MCP reference, prompt catalog, VS Code config summary |
| `AGENTS.md` | All AI agents (Copilot, Claude, Cursor, etc.) | Compact rules: project structure, tech stack versions, 7 coding rules, key commands, Nx MCP tools, prompt table, skill catalog, VS Code config table |

Both files reference the same source of truth (the `docs/` folder) and the same MCP tools, ensuring consistency regardless of which AI client reads them.

### 5.7 — Custom AI Skills

Eight domain-specific skills in `.github/skills/` teach AI agents how to perform complex monorepo workflows. Each skill is a Markdown file with YAML frontmatter that declares when to invoke it, followed by step-by-step instructions.

| Skill | File | Trigger |
|-------|------|---------|
| **add-sdk-package** | `.github/skills/add-sdk-package/SKILL.md` | "create a new package", "scaffold a library" |
| **link-workspace-packages** | `.github/skills/link-workspace-packages/SKILL.md` | "add a dependency", "cannot find module", "TS2307" |
| **release-packages** | `.github/skills/release-packages/SKILL.md` | "publish", "release", "version" |
| **validate-architecture** | `.github/skills/validate-architecture/SKILL.md` | "check boundaries", "validate", "audit quality" |
| **monitor-ci** | `.github/skills/monitor-ci/SKILL.md` | "monitor ci", "watch ci", "check ci status" |
| **nx-generate** | `.github/skills/nx-generate/SKILL.md` | "scaffold", "generate", "create a lib" |
| **nx-run-tasks** | `.github/skills/nx-run-tasks/SKILL.md` | "build", "test", "lint", "run" |
| **nx-workspace** | `.github/skills/nx-workspace/SKILL.md` | "what projects exist?", "how is X configured?" |

Skills are composable — for example, `add-sdk-package` invokes the `sdk-package` generator (discovered via `nx_generators` MCP tool), then `link-workspace-packages` wires up dependencies with layer validation.

### 5.8 — Custom Agents

| Agent | File | Purpose |
|-------|------|---------|
| **ci-monitor-subagent** | `.github/agents/ci-monitor-subagent.agent.md` | Lightweight CI helper spawned by `/monitor-ci`. Executes one MCP tool call (fetch CI status, fetch fix details, apply/reject self-healing fix) and returns the result. Stateless by design. |

The subagent pattern keeps the main conversation uncluttered — complex CI monitoring loops delegate individual MCP calls to the subagent.

### 5.9 — Reusable Prompts (Slash Commands)

Seven prompt files in `.github/prompts/` provide one-shot monorepo workflows accessible via `/prompt-name` in VS Code Copilot Chat:

| Prompt | File | What It Does |
|--------|------|--------------|
| `/build-package` | `build-package.prompt.md` | Build a single package + deps via Nx, with post-build validation (publint, attw) |
| `/test-affected` | `test-affected.prompt.md` | Run tests only on changed packages using `nx affected`, with coverage threshold reference |
| `/add-dependency` | `add-dependency.prompt.md` | Add a `workspace:*` dep between packages with layer boundary validation and tsconfig reference update |
| `/debug-build` | `debug-build.prompt.md` | Step-by-step diagnosis for build/typecheck/lint failures, including common causes and nuclear options |
| `/validate-workspace` | `validate-workspace.prompt.md` | Full quality pipeline: boundaries → lint → typecheck → test → build |
| `/explore-workspace` | `explore-workspace.prompt.md` | Understand project relationships via Nx graph and MCP tools |
| `/monitor-ci` | `monitor-ci.prompt.md` | Monitor Nx Cloud CI pipeline with self-healing fix support |

Prompts are designed to integrate seamlessly: `/build-package` references the same Nx commands as `.vscode/tasks.json`, `/add-dependency` references the same layer system as `scripts/check-boundaries.mjs`, and `/debug-build` references the same quality pipeline as `docs/CONVENTIONS.md`.

### 5.10 — VS Code Workspace Configuration

All VS Code configuration is committed to the repo so every team member gets identical, AI-optimized settings on `git pull`:

#### Extensions (`.vscode/extensions.json`)

| Extension | ID | Why |
|-----------|----|-----|
| **Biome** | `biomejs.biome` | Sole formatter + linter. Replaces ESLint + Prettier. |
| **Nx Console** | `nrwl.angular-console` | Project graph visualization, task running UI, generator forms, **Nx MCP server host** |
| **GitHub Copilot** | `github.copilot` | AI code completion with monorepo context via MCP |
| **GitHub Copilot Chat** | `github.copilot-chat` | Agent mode, slash commands, prompt files, skills |
| **Vitest Explorer** | `vitest.explorer` | Run/debug tests per-package from the sidebar |
| **GitLens** | `eamodio.gitlens` | Git blame, history — critical for 25-package monorepo archaeology |

Prettier and ESLint are explicitly listed in `unwantedRecommendations` to prevent conflicts with Biome.

#### Editor Settings (`.vscode/settings.json`)

| Setting | Value | Why |
|---------|-------|-----|
| `editor.defaultFormatter` | `biomejs.biome` | Biome is the sole formatter — enforced per-language for TS, JS, JSON |
| `editor.rulers` | `[100]` | Visual guide matching Biome's `lineWidth: 100` |
| `editor.formatOnSave` | `true` | Auto-format on every save — no manual formatting ever |
| `typescript.preferences.importModuleSpecifier` | `"non-relative"` | Generates `@decentralchain/*` imports instead of `../../packages/...` |
| `typescript.preferences.preferTypeOnlyAutoImports` | `true` | Matches `verbatimModuleSyntax: true` requirement |
| `explorer.fileNesting.enabled` | `true` | Collapses `.d.mts`, `.mjs`, `.map`, `CHANGELOG.md`, etc. under source files |
| `files.exclude` | `.nx`, `dist`, `coverage` | Hides build artifacts from the explorer |
| `search.exclude` | + `pnpm-lock.yaml` | Prevents lockfile noise in search results |

#### Tasks (`.vscode/tasks.json`)

Eight Nx tasks available via Command Palette (`Cmd+Shift+B` / `Ctrl+Shift+B`):

| Task | Command | Shortcut Group |
|------|---------|----------------|
| Build Affected | `pnpm nx affected -t build` | build |
| Build All | `pnpm nx run-many -t build` | build |
| Test Affected | `pnpm nx affected -t test` | test |
| Lint Affected | `pnpm nx affected -t biome-lint` | test |
| Typecheck All | `pnpm nx run-many -t typecheck --exclude=...` | test |
| Validate Boundaries | `node scripts/check-boundaries.mjs` | — |
| Nx Graph | `pnpm nx graph` | — |
| Format (Biome) | `pnpm biome check --write .` | — |

#### Debug Configs (`.vscode/launch.json`)

| Configuration | What It Does |
|---------------|--------------|
| Vitest: Current File | Debug the test file currently open in the editor |
| Vitest: Current File (Watch) | Same but in watch mode for TDD |
| Exchange: Dev Server | Launch the DEX app with Vite |
| Scanner: Dev Server | Launch the block explorer with Vite |

### 5.11 — How Everything Connects

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AI Agent (Copilot/Claude/Cursor)            │
│                                                                     │
│  reads:  copilot-instructions.md + AGENTS.md                       │
│          → learns architecture, layers, conventions, domain        │
│                                                                     │
│  calls:  Nx MCP server (nx_workspace, nx_project_details, ...)     │
│          → gets pre-computed project graph, tags, targets          │
│                                                                     │
│  calls:  Context7 MCP server (query-docs)                          │
│          → gets up-to-date library documentation                   │
│                                                                     │
│  calls:  Chrome DevTools MCP (take_screenshot, evaluate_script)    │
│          → automates browser testing for exchange/scanner apps     │
│                                                                     │
│  calls:  GitHub MCP (create_pull_request, search_code, ...)        │
│          → manages issues, PRs, and code search from the editor   │
│                                                                     │
│  invokes: Skills (.github/skills/*)                                │
│          → follows domain-specific multi-step workflows            │
│                                                                     │
│  uses:   Prompts (.github/prompts/*.prompt.md)                     │
│          → executes common monorepo tasks via slash commands       │
│                                                                     │
│  spawns: Subagents (.github/agents/*)                              │
│          → delegates CI monitoring to stateless helpers            │
├─────────────────────────────────────────────────────────────────────┤
│                        VS Code Editor                              │
│                                                                     │
│  settings.json → enforces same Biome rules, TS preferences         │
│  extensions.json → installs Nx Console (MCP host), Biome, Copilot  │
│  tasks.json → same Nx commands as prompts, accessible via Cmd+B    │
│  launch.json → debug tests and dev servers                         │
│  mcp.json → auto-starts 4 MCP servers on agent connect            │
├─────────────────────────────────────────────────────────────────────┤
│                        Monorepo Infrastructure                     │
│                                                                     │
│  nx.json → task pipeline, caching, affected detection              │
│  biome.json → lint/format rules (shared via "extends": "//")       │
│  tsconfig.base.json → strict TS, project references                │
│  scripts/check-boundaries.mjs → layer enforcement (0–4)            │
│  tools/nx-plugins/biome-inferred/ → auto-generates biome targets   │
│  tools/generators/sdk-package/ → scaffolds new packages            │
│  docs/*.md → deep context for agents and humans alike              │
└─────────────────────────────────────────────────────────────────────┘
```

Every layer references the others: prompts use the same Nx commands as tasks, skills invoke generators discovered via MCP, copilot-instructions point to the same docs that humans read, and the editor settings enforce the same rules as the CI pipeline.

### 5.12 — File Inventory

| File | Purpose | Consumers |
|------|---------|-----------|
| `.vscode/mcp.json` | MCP server configuration (Nx + Context7 + Chrome DevTools + GitHub) | VS Code, Copilot, Cursor |
| `.vscode/settings.json` | Editor settings (Biome, TS, file nesting, rulers) | All team members |
| `.vscode/extensions.json` | Required + unwanted extensions | All team members |
| `.vscode/tasks.json` | 8 Nx tasks for Command Palette | All team members |
| `.vscode/launch.json` | 4 debug configurations (Vitest + Vite) | All team members |
| `.github/copilot-instructions.md` | Full project context for Copilot | GitHub Copilot |
| `AGENTS.md` | Compact agent rules + skill catalog | All AI agents |
| `.github/skills/*/SKILL.md` | 8 domain-specific workflow skills | AI agents |
| `.github/agents/*.agent.md` | 1 subagent (CI monitor) | AI agents |
| `.github/prompts/*.prompt.md` | 7 reusable slash-command prompts | VS Code Copilot Chat |
| `docs/ARCHITECTURE.md` | This file — architecture reference | Humans + AI agents |
| `docs/CONVENTIONS.md` | Coding standards, quality pipeline | Humans + AI agents |
| `docs/STATUS.md` | Per-package health, remediation matrix | Humans + AI agents |
| `docs/SECURITY-AUDIT.md` | 6-phase security audit playbook | Humans + AI agents |
| `docs/UPSTREAM.md` | Waves provenance, wire-format constraints | Humans + AI agents |

---

## 6. Package Tiers

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

## 7. Nx Configuration

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

## 8. pnpm Workspace & Catalogs

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

## 9. TypeScript Project References

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

## 10. Biome Monorepo Config

Biome v2 has native monorepo support via `"extends": "//"` syntax.

- **Root `biome.json`**: Contains all shared rules (formatter, linter, assist).
- **Per-package overrides**: Use `"extends": "//"` then override. Most packages need no `biome.json`.
- **Running**: `biome check .` from root processes the entire monorepo.

---

## 11. Build Pipeline

```
pnpm install
  → nx run-many -t build          (dependency-ordered, cached)
  → nx run-many -t typecheck      (TS project references)
  → nx run-many -t test           (Vitest per-package)
  → nx run-many -t lint           (Biome)
```

Nx caches results in `.nx/cache/`. If inputs haven't changed, tasks replay from cache instantly.

---

## 12. CI/CD Architecture

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

## 13. Publishing Strategy

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

## 14. Developer Workflow

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
