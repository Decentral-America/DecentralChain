import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter()],
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
