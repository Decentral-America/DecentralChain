import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'data-service': path.resolve(__dirname, './src/lib/data-service'),
    },
    // Preserve symlinks to ensure dependencies are resolved correctly
    preserveSymlinks: false,
  },
  optimizeDeps: {
    // Exclude data-service from dependency pre-bundling to avoid resolution issues
    exclude: ['data-service'],
    // Note: @decentralchain/waves-transactions has issues with Vite and is currently excluded
  },
  server: {
    host: true, // Expose on local network
    port: 3333,
    allowedHosts: ['cf4a81d5458a.ngrok-free.app'],
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://*.tradingview.com; style-src 'self' 'unsafe-inline' https://s3.tradingview.com https://*.tradingview.com; img-src 'self' data: https:; connect-src 'self' https://mainnet-node.decentralchain.io https://testnet-node.decentralchain.io https://stagenet-node.decentralchain.io https://mainnet-matcher.decentralchain.io https://testnet-matcher.decentralchain.io https://stagenet-matcher.decentralchain.io https://matcher.decentralchain.io https://data-service.decentralchain.io https://raw.githubusercontent.com https://s3.tradingview.com https://*.tradingview.com wss://mainnet-node.decentralchain.io wss://testnet-node.decentralchain.io wss://stagenet-node.decentralchain.io ws://localhost:* wss://localhost:*; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-src 'self' https://s3.tradingview.com https://*.tradingview.com https://www.tradingview-widget.com https://s.tradingview.com;",
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'https://mainnet-node.decentralchain.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/matcher': {
        target: 'https://mainnet-matcher.decentralchain.io',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/matcher/, '/matcher'),
      },
      '/trading-view': {
        target: 'https://charts.decentral.exchange',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    // Disable sourcemaps in production for smaller bundle size
    sourcemap: process.env.NODE_ENV !== 'production',
    // Use esbuild for fast minification (default, faster than terser)
    minify: 'esbuild',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk: Core React libraries
          vendor: ['react', 'react-dom'],
          // Router chunk: React Router
          router: ['react-router-dom'],
          // UI chunk: styled-components and theme (will be removed after migration)
          ui: ['styled-components'],
          // MUI chunk: Material UI core + Emotion (must be in same chunk to avoid circular dep)
          'mui-core': ['@mui/material', '@mui/system', '@emotion/react', '@emotion/styled'],
        },
      },
    },
  },
})
