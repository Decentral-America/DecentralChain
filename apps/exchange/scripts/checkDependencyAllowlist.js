import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packageJsonPath = path.join(rootDir, 'package.json');
const allowlistPath = path.join(rootDir, 'governance', 'dependency-allowlist.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toRegex(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function matchesPattern(name, patterns) {
  return patterns.some((pattern) => toRegex(pattern).test(name));
}

function run() {
  const packageJson = readJson(packageJsonPath);
  const allowlist = readJson(allowlistPath);

  const dependencies = Object.keys(packageJson.dependencies ?? {});
  const devDependencies = Object.keys(packageJson.devDependencies ?? {});

  const allowedDependencies = new Set(allowlist.dependencies ?? []);
  const allowedDevDependencies = new Set(allowlist.devDependencies ?? []);
  const denylistPatterns = allowlist.denylist ?? [];

  const unauthorizedDependencies = dependencies.filter(
    (dependencyName) => !allowedDependencies.has(dependencyName),
  );
  const unauthorizedDevDependencies = devDependencies.filter(
    (dependencyName) => !allowedDevDependencies.has(dependencyName),
  );

  const deniedDependencies = [...dependencies, ...devDependencies].filter((dependencyName) =>
    matchesPattern(dependencyName, denylistPatterns),
  );

  if (
    unauthorizedDependencies.length === 0 &&
    unauthorizedDevDependencies.length === 0 &&
    deniedDependencies.length === 0
  ) {
    process.stdout.write('✅ Dependency allowlist check passed.\n');
    process.exit(0);
  }

  if (unauthorizedDependencies.length > 0) {
    process.stderr.write('❌ Unauthorized dependencies found:\n');
    unauthorizedDependencies.forEach((dependencyName) => {
      process.stderr.write(`  - ${dependencyName}\n`);
    });
  }

  if (unauthorizedDevDependencies.length > 0) {
    process.stderr.write('❌ Unauthorized devDependencies found:\n');
    unauthorizedDevDependencies.forEach((dependencyName) => {
      process.stderr.write(`  - ${dependencyName}\n`);
    });
  }

  if (deniedDependencies.length > 0) {
    process.stderr.write('❌ Denylisted dependencies found:\n');
    deniedDependencies.forEach((dependencyName) => {
      process.stderr.write(`  - ${dependencyName}\n`);
    });
  }

  process.stderr.write(
    '\nUpdate governance/dependency-allowlist.json with approval evidence before introducing new packages.\n',
  );
  process.exit(1);
}

run();
