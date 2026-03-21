#!/usr/bin/env node
/**
 * validate-manifest.mjs — pre-release manifest security gate
 *
 * Reads the built dist/{platform}/manifest.json for every platform in
 * PLATFORMS and asserts the following invariants:
 *
 *  1. manifest_version is not null (must be 2 or 3)
 *  2. version is not null (must be set by the build via CUBENSIS_VERSION)
 *  3. Content Security Policy contains no 'unsafe-inline' or bare 'unsafe-eval'
 *     ('wasm-unsafe-eval' is allowed for @decentralchain/crypto WASM)
 *  4. Every web_accessible_resources entry that matches '<all_urls>' must have
 *     use_dynamic_url: true (MV3 only — prevents extension URL fingerprinting)
 *
 * Exit code 0 = all checks pass, non-zero = one or more failures.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = resolve(__dirname, '../dist');
const PLATFORMS = ['chrome', 'edge', 'firefox', 'opera'];

let failures = 0;

function fail(platform, message) {
  console.error(`[FAIL] ${platform}: ${message}`);
  failures++;
}

function pass(platform, message) {
  console.log(`[PASS] ${platform}: ${message}`);
}

for (const platform of PLATFORMS) {
  const manifestPath = resolve(distDir, platform, 'manifest.json');

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch {
    fail(platform, `manifest.json not found at ${manifestPath} — run the build first`);
    continue;
  }

  // 1. manifest_version must not be null
  if (manifest.manifest_version == null) {
    fail(platform, 'manifest_version is null — build did not inject platform values');
  } else {
    pass(platform, `manifest_version = ${manifest.manifest_version}`);
  }

  // 2. version must not be null
  if (manifest.version == null) {
    fail(platform, 'version is null — CUBENSIS_VERSION was not set during build');
  } else {
    pass(platform, `version = ${manifest.version}`);
  }

  // 3. CSP must not contain 'unsafe-inline' or plain 'unsafe-eval'
  const cspSources = [];
  if (typeof manifest.content_security_policy === 'string') {
    cspSources.push(manifest.content_security_policy);
  } else if (
    manifest.content_security_policy &&
    typeof manifest.content_security_policy === 'object'
  ) {
    cspSources.push(...Object.values(manifest.content_security_policy));
  }

  for (const csp of cspSources) {
    if (/'unsafe-inline'/.test(csp)) {
      fail(platform, `CSP contains 'unsafe-inline': ${csp}`);
    } else {
      pass(platform, "CSP: no 'unsafe-inline'");
    }

    // Allow wasm-unsafe-eval (required for @decentralchain/crypto) but block plain unsafe-eval.
    if (/'unsafe-eval'/.test(csp) && !/'wasm-unsafe-eval'/.test(csp)) {
      fail(platform, `CSP contains 'unsafe-eval' (without wasm restriction): ${csp}`);
    } else if (/'wasm-unsafe-eval'/.test(csp)) {
      pass(
        platform,
        'CSP: wasm-unsafe-eval present (required for WASM crypto), no plain unsafe-eval',
      );
    } else {
      pass(platform, "CSP: no 'unsafe-eval'");
    }
  }

  // 4. MV3 web_accessible_resources: <all_urls> entries must have use_dynamic_url: true
  if (manifest.manifest_version === 3 && Array.isArray(manifest.web_accessible_resources)) {
    for (const entry of manifest.web_accessible_resources) {
      if (Array.isArray(entry.matches) && entry.matches.includes('<all_urls>')) {
        if (entry.use_dynamic_url !== true) {
          fail(
            platform,
            `web_accessible_resources entry matching <all_urls> is missing use_dynamic_url: true`,
          );
        } else {
          pass(platform, 'web_accessible_resources: use_dynamic_url: true present');
        }
      }
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} manifest check(s) failed.`);
  process.exit(1);
} else {
  console.log('\nAll manifest checks passed.');
}
