#!/usr/bin/env node
// Licence gate (AUD-166). Fails when:
//  1. a production npm dependency of any workspace project has a licence that is
//     not allow-listed and has no reviewed exception;
//  2. a packages/sdk/* package has no LICENSE file or a non-allow-listed licence;
//  3. a JVM package's pom.xml licence differs from its LICENSE file, or is not
//     allow-listed and has no reviewed exception.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repo = process.env.LICENSE_SCAN_ROOT ?? resolve(import.meta.dirname, '..');
const ALLOWED = new Set([
  '0BSD',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC-BY-4.0',
  'CC0-1.0',
  'ISC',
  'MIT',
  'MPL-2.0',
  'OFL-1.1',
  'Unlicense',
  'Zlib',
]);
// Reviewed exceptions. Adding one needs PR review and a reason.
const NPM_EXCEPTIONS = {
  '@react-leaflet/core':
    'Hippocratic-2.1, dependency of react-leaflet. Pending operator review (AUD-166).',
  'react-leaflet':
    'Hippocratic-2.1 (ethical-use licence, not OSI-approved). Pending operator review (AUD-166).',
  'rpc-websockets':
    'LGPL-3.0-only: unmodified, separately replaceable npm module pulled in by @solana/web3.js.',
  'text-encoding-utf-8':
    'No licence declared in package.json; transitive of @solana/web3.js. Pending operator review (AUD-166).',
};
const JVM_EXCEPTIONS = {
  'packages/jvm/curve25519':
    'GPL-3.0-only from upstream WhisperSystems curve25519-java. Documented in THIRD_PARTY_NOTICES.md; operator decision 2026-10-18: document, do not replace (AUD-079).',
};
const POM_NAMES = {
  'Apache License, Version 2.0': 'Apache-2.0',
  'GNU General Public License v3.0 only': 'GPL-3.0-only',
  MIT: 'MIT',
  'MIT License': 'MIT',
};

function allowed(expr) {
  const e = String(expr ?? '')
    .replace(/[()]/g, ' ')
    .trim();
  if (e === '') return false;
  if (/\sOR\s/i.test(e)) return e.split(/\s+OR\s+/i).some((part) => allowed(part));
  return e.split(/\s+AND\s+/i).every((part) => ALLOWED.has(part.trim()));
}

function licenceFileSpdx(text) {
  const head = text.replace(/\s+/g, ' ').trim().slice(0, 120);
  if (head.startsWith('MIT License')) return 'MIT';
  if (head.startsWith('Apache License Version 2.0')) return 'Apache-2.0';
  if (head.startsWith('GNU GENERAL PUBLIC LICENSE Version 3')) return 'GPL-3.0-only';
  return null;
}

const failures = [];

// 1. Production npm dependencies of every workspace project.
const raw = execFileSync('pnpm', ['-r', 'licenses', 'list', '--prod', '--json'], {
  cwd: repo,
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
let deps = 0;
for (const [licence, pkgs] of Object.entries(JSON.parse(raw))) {
  for (const { name, versions } of pkgs) {
    deps += 1;
    if (!allowed(licence) && !NPM_EXCEPTIONS[name]) {
      failures.push(
        `npm dependency ${name}@${versions.join(',')}: licence "${licence}" is not allowed`,
      );
    }
  }
}
if (deps === 0) failures.push('pnpm licenses list returned no packages: the scan is not scanning');

// 2. Our own npm packages.
const sdk = join(repo, 'packages', 'sdk');
for (const dir of readdirSync(sdk).sort()) {
  const pkgPath = join(sdk, dir, 'package.json');
  if (!existsSync(pkgPath)) continue;
  const { license, name } = JSON.parse(readFileSync(pkgPath, 'utf8'));
  if (!existsSync(join(sdk, dir, 'LICENSE')))
    failures.push(`${name}: packages/sdk/${dir}/LICENSE is missing`);
  if (!allowed(license)) failures.push(`${name}: package.json licence "${license}" is not allowed`);
}

// 3. JVM packages (and the Maven side of protobuf-schemas).
const jvmDirs = readdirSync(join(repo, 'packages', 'jvm')).map((d) => `packages/jvm/${d}`);
for (const rel of [...jvmDirs.sort(), 'packages/sdk/protobuf-schemas']) {
  const pom = join(repo, rel, 'pom.xml');
  if (!existsSync(pom)) continue;
  const name = readFileSync(pom, 'utf8')
    .match(/<licenses>[\s\S]*?<license>[\s\S]*?<name>([^<]+)<\/name>/)?.[1]
    ?.trim();
  const pomSpdx = POM_NAMES[name] ?? null;
  const licencePath = join(repo, rel, 'LICENSE');
  if (!existsSync(licencePath)) {
    failures.push(`${rel}: LICENSE is missing`);
    continue;
  }
  const fileSpdx = licenceFileSpdx(readFileSync(licencePath, 'utf8'));
  if (pomSpdx === null)
    failures.push(`${rel}: pom.xml licence "${name}" is not a known licence name`);
  else if (pomSpdx !== fileSpdx)
    failures.push(`${rel}: pom.xml says ${pomSpdx} but LICENSE is ${fileSpdx ?? 'unrecognised'}`);
  else if (!allowed(pomSpdx) && !JVM_EXCEPTIONS[rel])
    failures.push(`${rel}: licence ${pomSpdx} is not allowed`);
}

if (failures.length > 0) {
  console.error(`Licence scan FAILED (${failures.length}):\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
// biome-ignore lint/suspicious/noConsole: CLI gate output
console.log(
  `Licence scan OK: ${deps} production npm dependencies, all workspace and JVM packages checked`,
);
