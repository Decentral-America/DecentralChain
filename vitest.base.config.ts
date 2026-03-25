import { transform as esbuildTransform } from 'esbuild';
import { type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * Pre-transform plugin: uses esbuild to lower TC39 Stage 3 decorator syntax
 * before oxc sees the file. oxc (Vite 8/Rolldown default transformer) passes
 * TC39 Stage 3 decorators through unchanged — it only strips TypeScript type
 * annotations. Node.js 24 LTS does not yet support TC39 Stage 3 decorators
 * natively (V8 --js-decorators is still experimental as of v24.14.0 and fails
 * even for ES modules). esbuild supported.decorators=false is a per-feature
 * override that transforms ONLY @decorator tokens into __decorateElement TC39
 * helpers while keeping target:esnext for every other ES2025 construct.
 *
 * This plugin can be deleted when Node.js LTS ships stable TC39 decorator
 * support — no other changes required.
 */
function tc39DecoratorsPlugin(): Plugin {
  // Match actual TC39 Stage 3 decorator syntax: '@' at the start of a line
  // followed immediately by a word character (identifier start). This avoids
  // false-positives on JSDoc @param/@returns tags, email addresses in string
  // literals, and plain '@' characters in comments/templates.
  const DECORATOR_RE = /^\s*@\w/m;
  return {
    enforce: 'pre',
    name: 'dcc:tc39-decorators',
    async transform(code, id) {
      if (!/\.m?tsx?$/.test(id) || !DECORATOR_RE.test(code)) return null;
      const result = await esbuildTransform(code, {
        loader: id.endsWith('.tsx') ? 'tsx' : 'ts',
        sourcemap: 'inline',
        supported: { decorators: false },
        target: 'esnext',
      });
      return { code: result.code };
    },
  };
}

/**
 * Shared Vitest base configuration for all @decentralchain/* SDK packages.
 *
 * Usage in per-package vitest.config.ts:
 *
 *   import { mergeConfig } from 'vitest/config';
 *   import baseConfig from '../../vitest.base.config';
 *   export default mergeConfig(baseConfig, { test: { ... } });
 */
export default defineConfig({
  plugins: [tc39DecoratorsPlugin()],
  test: {
    clearMocks: true,
    coverage: {
      exclude: ['src/index.ts'],
      include: ['src/**/*.ts'],
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
    globals: true,
    include: ['test/**/*.{spec,test}.ts'],
    reporters: ['default'],
    typecheck: {
      enabled: true,
    },
  },
});
