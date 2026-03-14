import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

const networks = {
  mainnet: ['mainnet', 'testnet', 'stagenet'],
  stagenet: ['mainnet', 'testnet', 'stagenet'],
  testnet: ['mainnet', 'testnet', 'stagenet'],
  devnet: ['devnet'],
  custom: [],
};

const network = process.env.NETWORK || 'mainnet';
const decompileUrl =
  process.env.DECOMPILE_URL || 'https://mainnet-node.decentralchain.io/utils/script/decompile';
const basePath = process.env.BASE_PATH || '/';

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    base: basePath,
    plugins: [react()],
    css: {
      preprocessorOptions: {
        scss: {
          api: 'modern-compiler',
        },
      },
    },
    define: {
      __VERSION__: JSON.stringify(pkg.version),
      __NETWORKS__: JSON.stringify(networks[network] || []),
      __GOOGLE_TRACKING_ID__: JSON.stringify(isDev ? '' : ''),
      __AMPLITUDE_API_KEY__: JSON.stringify(isDev ? '' : ''),
      __SENTRY_DSN__: JSON.stringify(isDev ? '' : ''),
      __DECOMPILE_SCRIPT_URL__: JSON.stringify(decompileUrl),
      __BASE_PATH__: JSON.stringify(basePath),
    },
    server: {
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: isDev,
    },
  };
});
