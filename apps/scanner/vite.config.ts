import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reactRouter } from '@react-router/dev/vite';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig, type Plugin } from 'vite';

// Explicit project root — ensures React Router's config loader finds
// react-router.config.ts from the correct directory even when this file
// is evaluated by Nx (which runs resolveConfig from the workspace root).
const projectRoot = dirname(fileURLToPath(import.meta.url));

/**
 * Stubs browser-only packages for the SSR build environment.
 *
 * Rolldown (Vite 8) evaluates CJS module code at bundle time to resolve exports.
 * leaflet@1.9.4 accesses `window` at the top level of leaflet-src.js and crashes
 * Node.js during SSR bundling. react-leaflet (ESM v5) transitively imports leaflet.
 *
 * This plugin intercepts resolution of these packages when building for SSR and
 * returns lightweight stubs so Rolldown never evaluates the real modules. The
 * runtime guard in NetworkMap.tsx (typeof window !== 'undefined') already ensures
 * the NetworkMapContent chunk is never loaded server-side.
 */
function ssrBrowserOnlyStub(): Plugin {
  const STUBS: Record<string, string> = {
    leaflet: 'export default {};',
    'react-leaflet': [
      'export const MapContainer = () => null;',
      'export const TileLayer = () => null;',
      'export const CircleMarker = () => null;',
      'export const Popup = () => null;',
      'export const useMap = () => null;',
    ].join('\n'),
  };

  return {
    enforce: 'pre',
    load(id) {
      if (id.startsWith('\0ssr-stub:')) {
        return STUBS[id.slice('\0ssr-stub:'.length)] ?? 'export default {};';
      }
    },
    name: 'dcc:ssr-browser-only-stub',
    resolveId(id, _importer, opts) {
      if (opts?.ssr && id in STUBS) {
        return `\0ssr-stub:${id}`;
      }
    },
  };
}

/**
 * @react-router/dev@7.x still sets Vite's deprecated `esbuild` config option
 * (for JSX handling) when running on Vite 8, which now uses oxc by default.
 * This wrapper strips the `esbuild` key from every plugin config hook in the
 * react-router plugin suite so Vite 8 does not emit the deprecation warning.
 * JSX is handled by the explicit `oxc` setting in defineConfig below.
 * Remove this wrapper once @react-router/dev migrates to the `oxc` option.
 */
function withoutEsbuildConfig(plugins: Plugin | Plugin[]): Plugin[] {
  const arr = Array.isArray(plugins) ? plugins : [plugins];
  return arr.map((p): Plugin => {
    if (!p.config) return p;
    // Plugin['config'] is ObjectHook<fn> — may be { handler: fn } or the fn itself.
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

const { NODE_ENV } = process.env;

export default defineConfig({
  build: {
    // Generate hidden source maps for Sentry symbolication.
    // 'hidden' maps are not referenced from bundled JS so they are never served to users,
    // but the @sentry/vite-plugin uploads them at build time and deletes them from dist.
    sourcemap: NODE_ENV === 'production' ? 'hidden' : true,
  },
  // Vite 8 uses oxc for JavaScript transforms. Configure jsx here explicitly.
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  plugins: [
    ssrBrowserOnlyStub(),
    ...withoutEsbuildConfig(reactRouter()),
    // sentryVitePlugin must be last — source maps must be finalized before upload.
    // Disabled when SENTRY_AUTH_TOKEN is absent (local dev / forks without the secret).
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      disable: !process.env.SENTRY_AUTH_TOKEN,
      org: 'decentral-america',
      project: 'dcc-scanner',
      sourcemaps: {
        filesToDeleteAfterUpload: ['./build/**/*.map'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@/': '/src/',
    },
  },
  root: projectRoot,
  server: {
    proxy: {
      '/api/geo': {
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/geo/, ''),
        target: 'https://ipinfo.io',
      },
      '/api/greencheck': {
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/greencheck/, '/api/v3/greencheck'),
        target: 'https://api.thegreenwebfoundation.org',
      },
    },
  },
});
