import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

const projectRoot = dirname(fileURLToPath(import.meta.url));

function reactRouterTypesResolver(): Plugin {
  return {
    enforce: 'pre',
    name: 'dcc:react-router-types-resolver',
    resolveId(id, importer) {
      if (!importer || !id.includes('+types')) return;
      const importerDir = dirname(importer);
      const relFromSrc = importerDir.replace(resolve(projectRoot, 'src'), '').replace(/^\//, '');
      const typesPath = resolve(projectRoot, '.react-router/types/src', relFromSrc, `${id}.ts`);
      if (existsSync(typesPath)) return typesPath;
    },
  };
}

function withoutEsbuildConfig(plugins: Plugin | Plugin[]): Plugin[] {
  const arr = Array.isArray(plugins) ? plugins : [plugins];
  return arr.map((p): Plugin => {
    if (!p.config) return p;
    const origHook = p.config;
    const origFn = typeof origHook === 'function' ? origHook : origHook.handler;
    return {
      ...p,
      config: async function (
        this: ThisParameterType<typeof origFn>,
        ...args: Parameters<typeof origFn>
      ) {
        const result = await Reflect.apply(origFn, this, args);
        if (result && typeof result === 'object' && 'esbuild' in result) {
          const { esbuild: _removed, ...rest } = result as Record<string, unknown>;
          return rest as Awaited<ReturnType<typeof origFn>>;
        }
        return result;
      },
    };
  });
}

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  plugins: [tailwindcss(), reactRouterTypesResolver(), ...withoutEsbuildConfig(reactRouter())],
  resolve: {
    alias: {
      '@/': '/src/',
    },
  },
  root: projectRoot,
  server: {
    proxy: {
      '/api/node': {
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/node/, ''),
        target: process.env.DCC_NODE_URL ?? 'https://testnet-node.decentralchain.io',
      },
    },
  },
  // Server-only workspace packages that use Node.js APIs or WASM — must not be
  // bundled into the SSR bundle. Rolldown resolves them as runtime requires instead.
  ssr: {
    external: [
      '@decentralchain/bignumber',
      '@decentralchain/crypto',
      '@decentralchain/marshall',
      '@decentralchain/node-api',
      '@decentralchain/protobuf-schemas',
      '@decentralchain/transactions',
      '@decentralchain/ts-lib-crypto',
      '@decentralchain/types',
      'postgres',
    ],
  },
});
