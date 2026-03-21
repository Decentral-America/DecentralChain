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
  css: {
    modules: {
      generateScopedName: '[local]@[name]#[hash:base64:5]',
      localsConvention: 'dashesOnly',
    },
  },
  define: {
    __AMPLITUDE_API_KEY__: JSON.stringify(process.env.AMPLITUDE_API_KEY ?? ''),
    __MIXPANEL_TOKEN__: JSON.stringify(process.env.MIXPANEL_TOKEN ?? ''),
    __SENTRY_DSN__: JSON.stringify(process.env.SENTRY_DSN ?? ''),
    __SENTRY_ENVIRONMENT__: JSON.stringify(process.env.SENTRY_ENVIRONMENT ?? ''),
    __SENTRY_RELEASE__: JSON.stringify(process.env.SENTRY_RELEASE ?? ''),
    'process.env.NODE_DEBUG': JSON.stringify(undefined),
  },
  plugins: [
    bufferPolyfill(),
    fixCommonJSMinOrdering(),
    react({
      babel: {
        plugins: [
          [
            'prismjs',
            {
              css: true,
              languages: ['json'],
              theme: 'solarizedlight',
            },
          ],
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      ...srcAliases,
      // Node.js polyfills for browser
      stream: 'stream-browserify',
      util: 'util',
    },
  },
  root: __dirname,
});

/**
 * Injects `import { Buffer } from 'buffer'` into source files that reference
 * `Buffer` — replaces webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }).
 */
/**
 * Injects `import { Buffer } from 'buffer'` into source files that reference
 * `Buffer` — replaces webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }).
 *
 * Applied to both project source files (.ts/.tsx) and ESM files inside
 * node_modules that use `Buffer` as an undeclared global (e.g. \@ledgerhq/*).
 * CJS files in node_modules are skipped — they receive `Buffer` via rolldown's
 * __commonJSMin CJS interop wrapper instead.
 */
function bufferPolyfill(): Plugin {
  return {
    name: 'buffer-polyfill',
    transform(code, id) {
      if (!id.match(/\.[jt]sx?$|\.[cm]?js$/)) return null;
      if (!code.includes('Buffer')) return null;
      // Avoid double-injection
      if (code.includes("from 'buffer'") || code.includes('from "buffer"')) return null;
      // For node_modules, only apply to ES module files (those using import/export)
      // to avoid interfering with CJS bundles handled by the __commonJSMin wrapper.
      if (id.includes('node_modules')) {
        if (!/^\s*(import\s|export\s)/m.test(code)) return null;
      }
      return {
        code: `import { Buffer } from 'buffer';\n${code}`,
        map: null,
      };
    },
  };
}

/**
 * Fixes a rolldown (≤ rc.9) code-generation ordering bug where the
 * `__commonJSMin` CJS-interop helper is emitted AFTER the first call site
 * in a shared chunk. JavaScript `var` hoisting makes the function visible
 * in scope but still `undefined` at the point of call, causing
 * "TypeError: __commonJSMin is not a function" at runtime.
 *
 * This hook reorders any affected chunk so the definition precedes all uses.
 */
function fixCommonJSMinOrdering(): Plugin {
  return {
    generateBundle(_options, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== 'chunk') continue;

        const { code } = chunk;
        if (!code.includes('__commonJSMin')) continue;

        const firstUseIdx = code.indexOf('__commonJSMin(');
        const defMatch = /^var __commonJSMin = .+;$/m.exec(code);

        if (firstUseIdx === -1 || defMatch === null) continue;
        if (defMatch.index <= firstUseIdx) continue; // already in correct order

        // Move the single-line definition above the first use site.
        const defLine = defMatch[0];
        const beforeDef = code.slice(0, defMatch.index);
        const afterDef = code.slice(defMatch.index + defLine.length).replace(/^\n/, '');
        chunk.code = `${defLine}\n${beforeDef}${afterDef}`;
      }
    },
    name: 'fix-commonjsmin-ordering',
  };
}
