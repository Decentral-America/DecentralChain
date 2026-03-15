---
name: release-packages
description: 'Version and publish @decentralchain/* packages. USE WHEN: user asks about releasing, publishing, versioning, changelogs, or npm publishing. Covers the nx release workflow with independent versioning and conventional commits.'
---

# Release Packages

Version and publish `@decentralchain/*` packages using Nx Release with independent versioning.

## How Versioning Works

- **Independent versioning** — each package has its own version, bumped based on conventional commits that touch it.
- **Conventional commits drive versions:**
  - `fix(crypto): ...` → patch bump for `@decentralchain/crypto`
  - `feat(signer): ...` → minor bump for `@decentralchain/signer`
  - `feat(ts-types)!: ...` or `BREAKING CHANGE:` → major bump
- Only packages with relevant commits since their last release get bumped.

## Release Commands

### Dry Run (Preview)

Always dry-run first to see what would change:

```bash
pnpm nx release --dry-run
```

This shows:
- Which packages will be bumped
- What the new versions will be
- Changelog entries that would be generated

### Full Release

```bash
pnpm nx release
```

This runs three stages:
1. **Version** — bumps `package.json` versions based on conventional commits
2. **Changelog** — generates per-project `CHANGELOG.md` + workspace `CHANGELOG.md`
3. **Publish** — publishes to npm with provenance signing

### Release Specific Packages

```bash
pnpm nx release --projects=@decentralchain/crypto,@decentralchain/ts-types
```

### First Release (no previous tags)

```bash
pnpm nx release --first-release
```

Uses `fallbackCurrentVersionResolver: "disk"` to read current versions from `package.json`.

## Configuration

Release config lives in `nx.json` under the `release` key:

```json
{
  "release": {
    "projects": ["packages/*"],
    "projectsRelationship": "independent",
    "version": {
      "conventionalCommits": true,
      "generatorOptions": {
        "fallbackCurrentVersionResolver": "disk"
      }
    },
    "changelog": {
      "projectChangelogs": true,
      "workspaceChangelog": {
        "createRelease": "github",
        "file": "CHANGELOG.md"
      }
    }
  }
}
```

## Commit Message Format

```
type(scope): description

# scope = package name without @decentralchain/ prefix
# Examples:
feat(crypto): add ed25519 key derivation
fix(transactions): correct serialization of invoke-script
chore(bignumber): update dependencies
docs(signer): add usage examples to README
```

Valid types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `ci`, `build`, `style`.

## Pre-Release Checklist

Before releasing:

```bash
# 1. Ensure clean working tree
git status

# 2. Build all packages
pnpm nx run-many -t build

# 3. Run all tests
pnpm nx run-many -t test

# 4. Lint everything
pnpm nx run-many -t biome-lint

# 5. Type-check
pnpm nx run-many -t typecheck

# 6. Validate module boundaries
node scripts/check-boundaries.mjs

# 7. Dry-run release
pnpm nx release --dry-run
```

## Notes

- `workspace:*` dependencies are replaced with exact versions at publish time by pnpm.
- GitHub releases are created automatically for workspace-level changelog.
- npm provenance signing is enabled (requires CI with OIDC support or `--provenance` flag).
