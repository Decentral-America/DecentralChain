import { type Config } from '@react-router/dev/config';

export default {
  appDirectory: 'src',
  // Use Vite 8's Environment API (stabilised in react-router v7.10.0).
  // This is the forward-compatible integration path for Vite 8 / Rolldown.
  future: {
    v8_viteEnvironmentApi: true,
  },
  // Prerender disabled: the root loader injects window.__DCC_CONFIG__ with
  // runtime env vars (DCC_NODE_URL, etc.). Prerendering runs at CI build time
  // when those vars are unset, baking mainnet URLs into the static HTML for
  // all networks. SSR-only ensures the correct network config is injected.
  ssr: true,
} satisfies Config;
