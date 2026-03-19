import { type Config } from '@react-router/dev/config';

export default {
  appDirectory: 'src',
  // Prerender the homepage shell at build time for fast initial HTML.
  // Real-time data (block height, latest block) loads after hydration via React Query.
  prerender: ['/'],
  ssr: true,
} satisfies Config;
