#!/usr/bin/env node

/**
 * Module boundary enforcement script.
 *
 * Rules:
 *   1. A package may only depend on packages in the same or lower layer.
 *   2. Apps (scope:app) can depend on any SDK package.
 *   3. SDK packages (scope:sdk) must NOT depend on apps.
 *
 * Run: node scripts/check-boundaries.mjs
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Collect project metadata from every package.json with nx.tags. */
function loadProjects() {
  const projects = new Map();

  for (const root of ['packages', 'apps']) {
    let entries;
    try {
      entries = readdirSync(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const pkgPath = join(root, entry.name, 'package.json');
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        const tags = pkg.nx?.tags ?? [];
        const scope = tags.find((t) => t.startsWith('scope:'))?.split(':')[1];
        const layer = Number(tags.find((t) => t.startsWith('layer:'))?.split(':')[1]);
        const deps = {
          ...pkg.dependencies,
          ...pkg.devDependencies,
          ...pkg.peerDependencies,
        };
        projects.set(pkg.name, { scope, layer, deps, dir: join(root, entry.name) });
      } catch {
        // skip packages without a parseable package.json
      }
    }
  }
  return projects;
}

const projects = loadProjects();
let violations = 0;

for (const [name, { scope, layer, deps, dir }] of projects) {
  for (const dep of Object.keys(deps)) {
    const target = projects.get(dep);
    if (!target) continue; // external dependency

    // Rule 1: SDK packages must not depend on apps
    if (scope === 'sdk' && target.scope === 'app') {
      console.error(`✗ ${name} (scope:sdk) depends on ${dep} (scope:app)`);
      violations++;
    }

    // Rule 2: Layer enforcement — cannot depend on a higher layer
    if (target.layer > layer) {
      console.error(
        `✗ ${name} (layer:${layer}) depends on ${dep} (layer:${target.layer})`,
      );
      violations++;
    }
  }
}

if (violations > 0) {
  console.error(`\n${violations} boundary violation(s) found.`);
  process.exit(1);
} else {
  console.log(`✓ All ${projects.size} projects pass module boundary checks.`);
}
