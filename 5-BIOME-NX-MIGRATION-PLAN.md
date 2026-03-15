# Biome + Nx Monorepo Migration Plan (Enterprise)

## 1) Scope

This document defines the production lint/format architecture for the `decentralchain-sdk` monorepo and the rollout/operations model for CI and local development.

Objectives:
- Keep one **authoritative root Biome policy**.
- Allow per-project execution through **Nx inferred targets**.
- Ensure repeatable CI behavior with cache-aware lint checks.
- Provide a clear onboarding path for new projects.

---

## 2) Final Architecture

### 2.1 Root Biome policy (single source of truth)

- File: `biome.json` at workspace root.
- Root config is `"root": true`.
- Includes all workspace sources with explicit exclusions for generated/irrelevant content.
- Notable exclusion: `packages/transactions/docs` (generated docs artifacts).

Design rule:
- Global rules and formatting defaults live at root.
- Exceptions are allowed only through narrow `overrides` blocks.

### 2.2 Project-level Biome configs

Each participating app/package keeps a local `biome.json` for project scoping and inheritance from root.

Project config requirements:
- `"root": false`
- `"extends": ["//"]`

This keeps local intent minimal while inheriting enterprise policy from root.

### 2.3 Nx inferred plugin for Biome targets

Local plugin path:
- `tools/nx-plugins/biome-inferred`

Registered in `nx.json` via:
- `plugins: [{ "plugin": "./tools/nx-plugins/biome-inferred" }]`

Inferred targets (for projects with `biome.json`):
- `biome-lint` → `pnpm biome check {projectRoot}`
- `biome-fix` → `pnpm biome check --write {projectRoot}`

Root `biome.json` is intentionally ignored by the plugin so only project targets are inferred.

---

## 3) Execution Model

### 3.1 Local development

Per-project lint:
- `nx run <project>:biome-lint`

Per-project autofix:
- `nx run <project>:biome-fix`

Batch lint (all projects with inferred target):
- `nx run-many -t biome-lint`

Batch autofix:
- `nx run-many -t biome-fix`

### 3.2 Workspace-level guardrail

Root lint check is still valid for full workspace policy verification:
- `pnpm biome check .`

Use this in periodic maintenance or release-hardening stages.

---

## 4) CI Policy (Recommended)

### 4.1 Required CI gate

Use Nx for PR lint checks:
- `nx run-many -t biome-lint`

Why:
- Runs per-project targets with Nx cache semantics.
- Keeps command stable as monorepo grows.
- Aligns with inferred-target architecture.

### 4.2 Optional strict gate

For scheduled/nightly or release branches, add:
- `pnpm biome check .`

This catches edge cases outside project-inferred scope and validates root-level policy end-to-end.

### 4.3 Autofix in CI

Do **not** run `biome-fix` automatically in required PR checks.
- Keep PR checks deterministic and read-only.
- Run fixes locally or in explicit maintainer workflows.

---

## 5) Onboarding New Project (Monorepo Standard)

When adding a new app/package:

1. Create local `biome.json` in project root.
2. Configure:
   - `"root": false`
   - `"extends": ["//"]`
3. Validate inferred targets:
   - `nx show project <project> --json`
4. Run lint:
   - `nx run <project>:biome-lint`

No manual `project.json` target wiring is required for Biome.

---

## 6) Exception Governance

For unavoidable rule exceptions:
- Prefer root `overrides` with **narrow file globs**.
- Document rationale in PR description.
- Revisit periodically and remove once code is refactored.

Avoid:
- Broad repository-wide rule disabling.
- Silent local divergence from root policy.

---

## 7) Dependency and Tooling Contract

Required at workspace root:
- `@biomejs/biome`
- `nx`
- `@nx/devkit` (required by local inferred plugin runtime)

Lockfile should remain committed after tooling changes.

---

## 8) Validation Checklist

Use this checklist after upgrades/migrations:

- `pnpm install` completes.
- `nx show project <known-project> --json` shows `biome-lint` and `biome-fix`.
- `nx run-many -t biome-lint` passes.
- `pnpm biome check .` passes.

If plugin load fails, first confirm `@nx/devkit` version aligns with `nx` major/minor used by the workspace.

---

## 9) Decision Record

Adopted decisions:
- Root-owned Biome policy.
- Nx inferred targets for project-level Biome execution.
- Cache-aware lint checks in `targetDefaults`.
- Generated documentation artifacts excluded from root lint scope.

This is the baseline enterprise operating model for monorepo linting until superseded by a new ADR.