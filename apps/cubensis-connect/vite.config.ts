import 'dotenv-flow/config';

import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const __dirname = new URL('.', import.meta.url).pathname.replace(/\/$/, '');

/**
 * Shared resolve aliases — mirrors webpack's `resolve.modules: ['src']`.
 * Every top-level directory/file in src/ is aliased so bare specifiers
 * like `import { x } from 'controllers/foo'` resolve to src/controllers/foo.
 */
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

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      ...srcAliases,
      // Node.js polyfills for browser
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  define: {
    'process.env.NODE_DEBUG': JSON.stringify(undefined),
    __AMPLITUDE_API_KEY__: JSON.stringify(process.env.AMPLITUDE_API_KEY ?? ''),
    __MIXPANEL_TOKEN__: JSON.stringify(process.env.MIXPANEL_TOKEN ?? ''),
    __SENTRY_DSN__: JSON.stringify(process.env.SENTRY_DSN ?? ''),
    __SENTRY_ENVIRONMENT__: JSON.stringify(process.env.SENTRY_ENVIRONMENT ?? ''),
    __SENTRY_RELEASE__: JSON.stringify(process.env.SENTRY_RELEASE ?? ''),
  },
  css: {
    modules: {
      localsConvention: 'dashesOnly',
      generateScopedName: '[local]@[name]#[hash:base64:5]',
    },
  },
  plugins: [
    bufferPolyfill(),
    react({
      babel: {
        plugins: [
          [
            'prismjs',
            {
              languages: ['json'],
              theme: 'solarizedlight',
              css: true,
            },
          ],
        ],
      },
    }),
  ],
});

/**
 * Injects `import { Buffer } from 'buffer'` into source files that reference
 * `Buffer` — replaces webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }).
 */
function bufferPolyfill(): Plugin {
  return {
    name: 'buffer-polyfill',
    transform(code, id) {
      if (id.includes('node_modules') || !id.match(/\.[jt]sx?$/)) return null;
      if (!code.includes('Buffer')) return null;
      // Avoid double-injection
      if (code.includes("from 'buffer'") || code.includes('from "buffer"')) return null;
      return {
        code: `import { Buffer } from 'buffer';\n${code}`,
        map: null,
      };
    },
  };
}
