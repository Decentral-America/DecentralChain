import { type Config } from '@react-router/dev/config';

export default {
  appDirectory: 'src',
  // Use Vite 8's Environment API (stabilised in react-router v7.10.0).
  // This is the forward-compatible integration path for Vite 8 / Rolldown.
  future: {
    v8_viteEnvironmentApi: true,
  },
  // Prerender the homepage shell at build time for fast initial HTML.
  // Real-time data (block height, latest block) loads after hydration via React Query.
  prerender: ['/'],
  ssr: true,
} satisfies Config;
