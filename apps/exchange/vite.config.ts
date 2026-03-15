import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1000,
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (/node_modules\/(react|react-dom)\//.test(id)) {
            return 'vendor';
          }

          if (id.includes('node_modules/react-router')) {
            return 'router';
          }

          if (id.includes('node_modules/styled-components')) {
            return 'ui';
          }

          if (/node_modules\/(@mui|@emotion)\//.test(id)) {
            return 'mui-core';
          }

          return;
        },
      },
    },
    sourcemap: process.env.NODE_ENV !== 'production',
  },
  optimizeDeps: {
    exclude: ['data-service'],
    include: [
      '@mui/material',
      '@mui/material/styles',
      '@mui/system',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
  plugins: [react()],
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
        "connect-src 'self' https://mainnet-node.decentralchain.io https://testnet-node.decentralchain.io https://stagenet-node.decentralchain.io https://mainnet-matcher.decentralchain.io https://testnet-matcher.decentralchain.io https://stagenet-matcher.decentralchain.io https://matcher.decentralchain.io https://data-service.decentralchain.io https://raw.githubusercontent.com https://s3.tradingview.com https://*.tradingview.com wss://mainnet-node.decentralchain.io wss://testnet-node.decentralchain.io wss://stagenet-node.decentralchain.io ws://localhost:* wss://localhost:*",
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
        target: process.env.VITE_API_URL || 'https://mainnet-node.decentralchain.io',
      },
      '/matcher': {
        changeOrigin: true,
        rewrite: (reqPath) => reqPath.replace(/^\/matcher/, '/matcher'),
        secure: false,
        target: 'https://mainnet-matcher.decentralchain.io',
      },
      '/trading-view': {
        changeOrigin: true,
        secure: false,
        target: 'https://charts.decentral.exchange',
      },
    },
  },
});
