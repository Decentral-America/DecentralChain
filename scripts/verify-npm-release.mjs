#!/usr/bin/env node
// Post-publish gate for release.yml. Proves every publishable packages/sdk/*
// version on disk is on the npm registry and is the `latest` dist-tag; with
// --smoke it also installs each one into a clean project and imports it on this
// Node. A release job that publishes nothing can no longer finish green.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const smoke = process.argv.includes('--smoke');
const registry = 'https://registry.npmjs.org';
const root = resolve(import.meta.dirname, '..', 'packages', 'sdk');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const attempts = Number(process.env.NPM_VERIFY_ATTEMPTS ?? 30);

const packages = readdirSync(root)
  .sort()
  .map((d) => join(root, d, 'package.json'))
  .filter((p) => existsSync(p))
  .map((p) => JSON.parse(readFileSync(p, 'utf8')))
  .filter((p) => !p.private);

function npmView(spec, field) {
  try {
    const out = execFileSync('npm', ['view', spec, field, '--json', `--registry=${registry}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return out.trim() === '' ? null : JSON.parse(out);
  } catch {
    return null;
  }
}

const failures = [];
for (const { name, version } of packages) {
  let published = null;
  let latest = null;
  // The registry is eventually consistent: poll (default 30 x 10 s = 5 min per package).
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    published = npmView(`${name}@${version}`, 'version');
    latest = npmView(name, 'dist-tags.latest');
    if (published === version && latest === version) break;
    if (attempt + 1 < attempts) await sleep(10_000);
  }
  if (published !== version) failures.push(`${name}@${version} is not on ${registry}`);
  else if (!version.includes('-') && latest !== version)
    failures.push(`${name}: dist-tags.latest is ${latest}, expected ${version}`);
  else console.log(`ok   ${name}@${version} (latest=${latest})`);
}

if (smoke && failures.length === 0) {
  for (const { name, version } of packages) {
    const dir = mkdtempSync(join(tmpdir(), 'npm-smoke-'));
    try {
      writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'smoke', private: true, type: 'module' }));
      execFileSync('npm', ['install', `${name}@${version}`, '--no-audit', '--no-fund', `--registry=${registry}`], {
        cwd: dir,
        stdio: 'inherit',
      });
      execFileSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(name)})`], {
        cwd: dir,
        stdio: 'inherit',
      });
      console.log(`ok   install+import ${name}@${version} on Node ${process.version}`);
    } catch (e) {
      failures.push(`${name}@${version}: install/import failed: ${e instanceof Error ? e.message.split('\n')[0] : e}`);
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  }
}

if (failures.length > 0) {
  console.error(`\nnpm release verification FAILED:\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
console.log(`\nnpm release verified for ${packages.length} package(s)${smoke ? ' (published, latest, installable, importable)' : ''}`);
