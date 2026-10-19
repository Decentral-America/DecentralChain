#!/usr/bin/env node
/**
 * Release step 1 of 2 — run LOCALLY by a maintainer with admin rights on main.
 *
 * Versions every packages/sdk/* project from conventional commits, copies the
 * protobuf-schemas version into its Maven/Cargo/NuGet manifests, writes the
 * per-project changelogs, then commits, tags and pushes. Step 2 is the Release
 * workflow (.github/workflows/release.yml), which only publishes what is on main.
 *
 * Why not in CI: main is branch-protected, so the workflow bot cannot push the
 * release commit; and `nx release` without --yes silently skipped publishing on
 * 2026-06-23 (the non-TTY confirmation prompt was cancelled and nx exited 0 after
 * "Skipped publishing packages.").
 *
 *   node tools/release/version.mjs --dry-run   # preview only, writes nothing
 *   node tools/release/version.mjs             # version, commit, tag, push
 */
import { execFileSync } from 'node:child_process';
import { releaseChangelog, releaseVersion } from 'nx/release';

const dryRun = process.argv.includes('--dry-run');
const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'inherit' });

const { projectsVersionData, releaseGraph, workspaceVersion } = await releaseVersion({
  dryRun,
  gitCommit: false,
  gitTag: false,
  stageChanges: !dryRun,
  verbose: true,
});

if (!dryRun) {
  run('node', ['scripts/sync-proto-versions.mjs']);
  run('git', [
    'add',
    'packages/sdk/protobuf-schemas/pom.xml',
    'packages/sdk/protobuf-schemas/Cargo.toml',
    'packages/sdk/protobuf-schemas/ProtobufSchemas.csproj',
  ]);
}

await releaseChangelog({
  createRelease: false,
  dryRun,
  gitCommit: true,
  gitPush: true,
  gitTag: true,
  releaseGraph,
  verbose: true,
  version: workspaceVersion,
  versionData: projectsVersionData,
});
process.exit(0);
