import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

const __dirname = new URL('.', import.meta.url).pathname.replace(/\/$/, '');

const srcAliases: Record<string, string> = {};
const srcDirs = [
  '_core',
  'accounts',
  'assets',
  'background',
  'balances',
  'controllers',
  'fee',
  'fonts',
  'i18n',
  'icons',
  'ipc',
  'keystore',
  'layout',
  'ledger',
  'lib',
  'messages',
  'networks',
  'nfts',
  'nodeApi',
  'notifications',
  'permissions',
  'popup',
  'preferences',
  'sentry',
  'storage',
  'store',
  'swap',
  'ui',
  'wallets',
];

for (const dir of srcDirs) {
  srcAliases[dir] = resolve(__dirname, 'src', dir);
}
srcAliases.constants = resolve(__dirname, 'src/constants.ts');

/**
 * Isolated unit-test configuration for cubensis-connect.
 *
 * Runs in a Node.js environment (no Vite browser plugins) so that pure
 * TypeScript logic — especially vault crypto — can be tested without a DOM or
 * WebExtension runtime.  The existing `vitest.config.ts` targets the
 * WebdriverIO E2E suite; this config is intentionally separate.
 */
export default defineConfig({
  resolve: {
    alias: srcAliases,
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    // PBKDF2 with 600 000 iterations takes ~1-2 s per call on dev hardware.
    testTimeout: 30_000,
  },
});
