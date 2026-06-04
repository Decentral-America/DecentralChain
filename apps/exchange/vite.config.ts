import path from 'node:path';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import pkg from './package.json' with { type: 'json' };

const { NODE_ENV, VITE_API_URL } = process.env;

/**
 * Injects VITE_APP_VERSION into i18n preload hints in index.html at build time.
 *
 * The i18next-http-backend appends `?v=APP_VERSION` to every locale fetch URL
 * (e.g. `/locales/en/translation.json?v=1.0.0`).  A preload hint without the
 * same query string is a URL mismatch — the browser downloads the file into the
 * preload cache but i18next never uses that cached response, wasting bandwidth.
 *
 * This plugin rewrites the static href so it exactly matches the runtime fetch URL.
 */
const i18nPreloadVersionPlugin: Plugin = {
  // Build-only: this optimization is irrelevant during dev (dev server ignores query strings
  // on static files). apply:'build' avoids running a string replacement on every dev request.
  apply: 'build',
  name: 'i18n-preload-version',
  transformIndexHtml(html) {
    return html.replace(
      'href="/locales/en/translation.json"',
      `href="/locales/en/translation.json?v=${pkg.version}"`,
    );
  },
};

// https://vite.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    outDir: 'dist',
    rolldownOptions: {
      output: {
        // Rolldown's canonical chunk splitting API (replaces deprecated manualChunks function form).
        // Each group is matched by regex; higher priority wins when patterns overlap.
        codeSplitting: {
          groups: [
            { name: 'vendor', priority: 80, test: /node_modules\/(react|react-dom)\// },
            { name: 'router', priority: 70, test: /node_modules\/react-router/ },
            // React Query: isolate @tanstack/* so it's not bundled inside index.js.
            // query-core is ~250 kB minified; splitting it enables independent caching.
            { name: 'tanstack-query', priority: 65, test: /node_modules\/@tanstack\// },
            { name: 'ui', priority: 60, test: /node_modules\/styled-components/ },
            // @mui/icons-material is intentionally EXCLUDED from this group.
            // Including it would bundle all 3,000+ icons into a shared chunk and defeat
            // Rolldown's tree-shaking. Let it be naturally included/tree-shaken per lazy chunk.
            {
              name: 'mui-core',
              priority: 50,
              test: /node_modules\/(@mui\/(material|system|lab|base|styled-engine)|@emotion)\//,
            },
            // Sentry must be in its own chunk, not co-located with feature routes (e.g. Leasing).
            // Without this, Vite may defer Sentry until a lazy route loads, delaying error capture.
            { name: 'sentry', priority: 40, test: /node_modules\/@sentry\// },
            // TradingView charting library is massive — isolate it for lazy-loaded DEX route
            {
              name: 'tradingview',
              priority: 30,
              test: /node_modules\/(charting_library|tradingview)/,
            },
            // ALL @decentralchain SDK packages + crypto primitives
            // Covers signature-adapter, data-entities, node-api etc. that the
            // data-service layer pulls in — keeps them out of both index and lazy chunks.
            {
              name: 'dcc-sdk',
              priority: 25,
              test: /node_modules\/@decentralchain\//,
            },
            // Crypto primitives — @noble/* + @scure/* + @bufbuild/*
            {
              name: 'crypto-primitives',
              priority: 22,
              test: /node_modules\/(@noble\/|@scure\/|@bufbuild\/)/,
            },
            // Utility libs shared across data-service + features
            // ramda (3.3 MB src), bignumber.js, date-fns — isolate so they're
            // not duplicated across lazy chunks.
            {
              name: 'utils',
              priority: 18,
              test: /node_modules\/(ramda|bignumber\.js|date-fns)\//,
            },
            // i18n — loaded at app init but doesn't need to block initial render
            { name: 'i18n', priority: 10, test: /node_modules\/(i18next|react-i18next)\// },
          ],
        },
      },
    },
    // Generate hidden source maps for Sentry error symbolication.
    // 'hidden' maps are not referenced from bundled JS (not served to users),
    // but can be uploaded to Sentry during CI for production stack traces.
    sourcemap: NODE_ENV === 'production' ? 'hidden' : true,
  },
  define: {
    // Sentry tree-shaking flags (docs: https://docs.sentry.io/platforms/javascript/guides/react/configuration/tree-shaking/)
    // Raw booleans: Vite auto-converts via JSON.stringify → JS expressions 'false'/'true' in output.
    // '__SENTRY_DEBUG__: false'       — eliminates all Sentry debug logging code (~1.5 kB)
    // Replay rrweb flags safe: replayIntegration is not used in this app.
    // '__SENTRY_TRACING__' intentionally NOT set — tracesSampleRate: 0.1 is active.
    __RRWEB_EXCLUDE_IFRAME__: true,
    __RRWEB_EXCLUDE_SHADOW_DOM__: true,
    __SENTRY_DEBUG__: false,
    __SENTRY_EXCLUDE_REPLAY_WORKER__: true,
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  optimizeDeps: {
    exclude: ['data-service'],
    include: [
      '@mui/material',
      '@mui/material/styles',
      // '@mui/icons-material' intentionally omitted — pre-bundling the entire icons package
      // prevents Rolldown from tree-shaking it in lazy chunks (3,000+ icons → 3.3 MB).
      '@emotion/react',
      '@emotion/styled',
    ],
  },
  plugins: [
    react(),
    i18nPreloadVersionPlugin,
    // sentryVitePlugin must be last — source maps must be finalized before upload.
    // Disabled when SENTRY_AUTH_TOKEN is absent (local dev / forks without the secret).
    sentryVitePlugin({
      // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature requires bracket notation for process.env
      authToken: process.env['SENTRY_AUTH_TOKEN'],
      // biome-ignore lint/complexity/useLiteralKeys: TS noPropertyAccessFromIndexSignature requires bracket notation for process.env
      disable: !process.env['SENTRY_AUTH_TOKEN'],
      org: 'decentral-america',
      project: 'dcc-exchange',
      sourcemaps: {
        filesToDeleteAfterUpload: ['./dist/**/*.map'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      'data-service': path.resolve(import.meta.dirname, './src/lib/data-service'),
    },
    preserveSymlinks: false,
  },
  server: {
    headers: {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://s3.tradingview.com https://*.tradingview.com",
        "worker-src 'self' blob:",
        "style-src 'self' 'unsafe-inline' https://s3.tradingview.com https://*.tradingview.com",
        "img-src 'self' data: https:",
        "connect-src 'self' http://localhost:* https://mainnet-node.decentralchain.io https://testnet-node.decentralchain.io https://stagenet-node.decentralchain.io https://mainnet-matcher.decentralchain.io https://testnet-matcher.decentralchain.io https://stagenet-matcher.decentralchain.io https://matcher.decentralchain.io https://data-service.decentralchain.io https://testnet-data-service.decentralchain.io https://stagenet-data-service.decentralchain.io https://s3.tradingview.com https://*.tradingview.com wss://mainnet-node.decentralchain.io wss://testnet-node.decentralchain.io wss://stagenet-node.decentralchain.io ws://localhost:* wss://localhost:*",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-src 'self' https://s3.tradingview.com https://*.tradingview.com https://www.tradingview-widget.com https://s.tradingview.com",
      ].join('; '),
    },
    host: true,
    port: 3333,
    proxy: {
      '/api': {
        changeOrigin: true,
        rewrite: (reqPath) => reqPath.replace(/^\/api/, ''),
        target: VITE_API_URL || 'https://mainnet-node.decentralchain.io',
      },
      '/matcher': {
        changeOrigin: true,
        target: 'https://mainnet-matcher.decentralchain.io',
      },
      '/trading-view': {
        changeOrigin: true,
        target: 'https://charts.decentral.exchange',
      },
    },
  },
});
