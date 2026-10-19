#!/usr/bin/env node
// Imports every publishable packages/sdk/* build entry in plain Node, so build
// output Node cannot execute (for example un-lowered decorators) fails CI
// instead of failing for npm users. Packages without a dist/ are skipped unless
// --require-all is passed (release.yml builds everything first).
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const requireAll = process.argv.includes('--require-all');
const root = resolve(import.meta.dirname, '..', 'packages', 'sdk');
const failures = [];
let checked = 0;

for (const dir of readdirSync(root).sort()) {
  const pkgPath = join(root, dir, 'package.json');
  if (!existsSync(pkgPath)) continue;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  if (pkg.private) continue;
  const entry = pkg.exports?.['.']?.default;
  if (typeof entry !== 'string') {
    failures.push(`${pkg.name}: package.json has no exports["."].default`);
    continue;
  }
  const file = join(root, dir, entry);
  if (!existsSync(file)) {
    if (requireAll) failures.push(`${pkg.name}: ${entry} is not built`);
    else console.log(`skip ${pkg.name}: ${entry} not built in this run`);
    continue;
  }
  try {
    await import(pathToFileURL(file).href);
    checked += 1;
    console.log(`ok   ${pkg.name}`);
  } catch (e) {
    failures.push(`${pkg.name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} package(s) cannot be imported by Node ${process.version}:`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`\n${checked} package(s) import cleanly in Node ${process.version}`);
