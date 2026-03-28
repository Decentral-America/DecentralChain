import { reactRouter } from '@react-router/dev/vite';
import { defineConfig, type Plugin } from 'vite';

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
  return arr.map((p) => {
    if (!p.config) return p;
    const orig = p.config;
    return {
      ...p,
      config: async function (this: unknown, ...args: Parameters<typeof orig>) {
        const result = await Reflect.apply(orig, this, args);
        if (result && typeof result === 'object' && 'esbuild' in result) {
          const { esbuild: _removed, ...rest } = result as Record<string, unknown>;
          return rest;
        }
        return result;
      },
    };
  });
}

export default defineConfig({
  // Vite 8 uses oxc for JavaScript transforms. Configure jsx here explicitly.
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  plugins: [ssrBrowserOnlyStub(), ...withoutEsbuildConfig(reactRouter())],
  resolve: {
    alias: {
      '@/': '/src/',
    },
  },
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
