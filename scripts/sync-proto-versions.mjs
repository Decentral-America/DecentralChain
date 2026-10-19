#!/usr/bin/env node
// packages/sdk/protobuf-schemas ships one schema to four registries. package.json
// (versioned by nx release) is the single source of truth; this copies its
// version into pom.xml (Maven), Cargo.toml (crates) and ProtobufSchemas.csproj
// (NuGet). With --check it fails instead of writing (CI).
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(import.meta.dirname, '..', 'packages', 'sdk', 'protobuf-schemas');
const check = process.argv.includes('--check');
const { version } = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
const targets = [
  {
    file: 'pom.xml',
    re: /(<artifactId>protobuf-schemas<\/artifactId>\s*<packaging>jar<\/packaging>\s*<version>)([^<]+)(<\/version>)/,
  },
  { file: 'Cargo.toml', re: /(\[package\][^[]*?\nversion = ")([^"]+)(")/ },
  { file: 'ProtobufSchemas.csproj', re: /(<Version>)([^<]+)(<\/Version>)/ },
];

const drift = [];
for (const { file, re } of targets) {
  const path = join(dir, file);
  const text = readFileSync(path, 'utf8');
  const match = text.match(re);
  if (!match) throw new Error(`${file}: project version field not found`);
  if (match[2] === version) continue;
  drift.push(`${file}: ${match[2]} (package.json: ${version})`);
  if (!check) writeFileSync(path, text.replace(re, `$1${version}$3`));
}

if (check && drift.length > 0) {
  console.error(
    `protobuf-schemas manifest versions differ from package.json:\n  ${drift.join('\n  ')}`,
  );
  console.error('Fix: node scripts/sync-proto-versions.mjs');
  process.exit(1);
}
console.log(
  drift.length > 0
    ? `synced to ${version}: ${drift.join('; ')}`
    : `protobuf-schemas: every manifest at ${version}`,
);
