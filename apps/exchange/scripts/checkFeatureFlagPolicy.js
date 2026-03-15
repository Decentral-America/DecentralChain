import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const policyPath = path.join(rootDir, 'governance', 'feature-flags.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'yes', 'on'].includes(normalized);
}

function getAppEnvironment() {
  return (
    process.env.VITE_APP_ENV ??
    process.env.APP_ENV ??
    process.env.NODE_ENV ??
    'development'
  ).toLowerCase();
}

function run() {
  const policy = readJson(policyPath);
  const environment = getAppEnvironment();
  const flags = policy.flags ?? [];

  const validationErrors = [];
  const approvedFlagNames = new Set(flags.map((flag) => flag.name));

  for (const flag of flags) {
    const missingFields = [
      'name',
      'default',
      'owner',
      'risk',
      'rationale',
      'rollback',
      'approvedEnvironments',
    ].filter(
      (fieldName) =>
        flag[fieldName] === undefined || flag[fieldName] === null || flag[fieldName] === '',
    );

    if (missingFields.length > 0) {
      validationErrors.push(
        `Flag ${flag.name ?? '<unknown>'} is missing required fields: ${missingFields.join(', ')}`,
      );
      continue;
    }

    if (!Array.isArray(flag.approvedEnvironments) || flag.approvedEnvironments.length === 0) {
      validationErrors.push(`Flag ${flag.name} must declare at least one approved environment.`);
      continue;
    }

    const defaultEnabled = normalizeBoolean(flag.default, false);
    if (
      environment === 'production' &&
      defaultEnabled &&
      !flag.approvedEnvironments.includes('production')
    ) {
      validationErrors.push(
        `Flag ${flag.name} defaults to true but is not approved for production.`,
      );
    }

    const enabledInRuntime = normalizeBoolean(process.env[flag.name], defaultEnabled);
    if (
      enabledInRuntime &&
      !flag.approvedEnvironments.map((item) => String(item).toLowerCase()).includes(environment)
    ) {
      validationErrors.push(
        `Flag ${flag.name} is enabled for ${environment} but policy does not approve that environment.`,
      );
    }
  }

  for (const [envKey, envValue] of Object.entries(process.env)) {
    if (!envKey.startsWith('VITE_')) {
      continue;
    }

    if (!envKey.includes('ENABLE') && !envKey.includes('DEBUG') && !envKey.includes('SENTRY')) {
      continue;
    }

    const isEnabled = normalizeBoolean(envValue, false);
    if (isEnabled && !approvedFlagNames.has(envKey)) {
      validationErrors.push(
        `Enabled runtime flag ${envKey} is not registered in governance/feature-flags.json.`,
      );
    }
  }

  if (validationErrors.length === 0) {
    process.stdout.write(`✅ Feature-flag policy check passed for environment: ${environment}\n`);
    process.exit(0);
  }

  process.stderr.write(`❌ Feature-flag policy check failed for environment: ${environment}\n`);
  validationErrors.forEach((errorMessage) => {
    process.stderr.write(`  - ${errorMessage}\n`);
  });
  process.exit(1);
}

run();
