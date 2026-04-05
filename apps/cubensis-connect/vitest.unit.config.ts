import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
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
 * WebExtension runtime.  React component class-method and lifecycle tests run
 * here too; the React plugin is included purely for JSX transformation.
 * The existing `vitest.config.ts` targets the WebdriverIO E2E suite.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: srcAliases,
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    // PBKDF2 with 600 000 iterations takes ~1-2 s per call on dev hardware.
    testTimeout: 30_000,
  },
});
