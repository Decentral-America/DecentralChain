/**
 * @fileoverview Nx inferred targets plugin — Biome lint and fix.
 *
 * Automatically adds `biome-lint` (cached) and `biome-fix` (write, uncached)
 * targets to every project that has a `biome.json` at its root.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY A DEFAULT EXPORT IS REQUIRED (Node.js ≥22 + Nx 22.x)
 * ─────────────────────────────────────────────────────────────────────────────
 * Nx 22.x loads plugins with `require()` even in ESM workspaces
 * (`load-resolved-plugin.js`: `require(s => require(s))`).
 *
 * In Node.js ≥22, `require()` of an ESM module (`"type":"module"`) returns
 * a Module Namespace Object. Per the ECMAScript spec, namespace objects are
 * permanently *non-extensible* — you cannot add properties to them.
 *
 * Nx does `plugin.name ??= pluginPath` after loading the module. That
 * null-coalescing assignment would throw a TypeError in strict mode when
 * `plugin` is a non-extensible namespace.
 *
 * Two-part fix applied here:
 *   1. `export default { name, createNodesV2 }` — a plain, extensible object.
 *      Nx's `importPluginModule` detects `createNodesV2` (or `createNodes`) on
 *      `m.default` and returns it instead of the namespace, giving Nx a
 *      mutable object.
 *   2. `name` is pre-populated so `plugin.name ??= pluginPath` becomes a
 *      no-op — no mutation of any object is ever attempted.
 *
 * Reference: nx/src/project-graph/plugins/load-resolved-plugin.js
 *            https://github.com/nicolo-ribaudo/tc39-module-namespace-non-ext
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY `createNodesV2` (NOT `createNodes`)
 * ─────────────────────────────────────────────────────────────────────────────
 * `createNodes` (Nx ≤17.1) called the handler once per file sequentially.
 * `createNodesV2` (Nx ≥17.2) passes ALL matching files at once for parallel
 * processing. Nx 22 internally does `plugin.createNodesV2 ?? plugin.createNodes`
 * — `createNodesV2` is always preferred. Exporting only `createNodesV2` removes
 * the ambiguity.
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY `^default` IS EXCLUDED FROM biome-lint INPUTS
 * ─────────────────────────────────────────────────────────────────────────────
 * `^default` means "all files from every upstream dependency". Biome lints
 * each project's files in *isolation* — it never follows import chains to
 * analyse code in other packages. Including `^default` would invalidate the
 * biome-lint cache of every downstream package whenever any upstream package
 * changes a file — a correctness anti-pattern for a tool that has zero
 * cross-package awareness.
 *
 * The correct minimal input set for biome-lint:
 *   "default"                     — this project's own files
 *   "{workspaceRoot}/biome.json"  — shared format/lint rules
 *   externalDependencies          — the installed Biome version
 */

import { dirname } from 'node:path';
import { createNodesFromFiles } from '@nx/devkit';

const PLUGIN_NAME = '@decentralchain/nx-biome-inferred';

/**
 * Infer biome-lint and biome-fix targets for a single project.
 *
 * @param {string} configFilePath  Absolute path to the project's biome.json
 * @returns {object}               Nx `CreateNodesResult` for this project
 */
async function inferBiomeTargets(configFilePath) {
  const root = dirname(configFilePath);

  // The workspace-root biome.json is the *shared config*, not a project root.
  if (root === '.') {
    return {};
  }

  return {
    projects: {
      [root]: {
        targets: {
          /**
           * biome-fix: apply auto-fixes and re-format files.
           *
           * `cache: false` — this is a write operation; there are no output
           * files to cache, and it must always run on demand.
           */
          'biome-fix': {
            cache: false,
            command: 'pnpm biome check --write {projectRoot}',
          },

          /**
           * biome-lint: check formatting and lint rules without writing.
           *
           * Fully cacheable — Biome is deterministic given the same inputs.
           *
           * Inputs explained:
           *   "default"  — all files under {projectRoot}/**  (includes the
           *                per-package biome.json via sharedGlobals → default)
           *   workspaceRoot biome.json — shared rules; a rule change must
           *                             invalidate all cached lint results
           *   externalDependencies — invalidate when @biomejs/biome is upgraded
           *
           * Intentionally excludes "^default":
           *   Biome analyses each file independently; it does NOT follow
           *   imports into sibling packages. Adding "^default" would cascade-
           *   bust the lint cache across all downstream packages on every
           *   upstream source change — giving zero correctness benefit while
           *   multiplying spurious cache misses in a 22-package dependency tree.
           */
          'biome-lint': {
            cache: true,
            command: 'pnpm biome check {projectRoot}',
            inputs: [
              'default',
              '{workspaceRoot}/biome.json',
              { externalDependencies: ['@biomejs/biome'] },
            ],
          },
        },
      },
    },
  };
}

/**
 * `createNodesV2` — the Nx ≥17.2 batch plugin API.
 *
 * Receives all matching `biome.json` paths at once and processes them in
 * parallel via `createNodesFromFiles`, which fans out to `inferBiomeTargets`
 * per file and aggregates errors without aborting the whole batch.
 *
 * @type {import('@nx/devkit').CreateNodesV2}
 */
export const createNodesV2 = [
  '**/biome.json',
  (configFiles, options, context) =>
    createNodesFromFiles(inferBiomeTargets, configFiles, options, context),
];

/**
 * Default export required for Nx's `require()`-based plugin loader in ESM
 * workspaces on Node.js ≥22. See the fileoverview comment for full rationale.
 *
 * `name` is pre-set so `plugin.name ??= pluginPath` (in Nx's loader) is always
 * a no-op — the loaded object never needs to be mutated.
 */
export default {
  createNodesV2,
  name: PLUGIN_NAME,
};
