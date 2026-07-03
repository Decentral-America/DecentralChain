import { type Config } from '@react-router/dev/config';

// All v7 future.v8_* flags (middleware, passThroughRequests, splitRouteModules,
// trailingSlashAwareDataRequests, viteEnvironmentApi) have been stabilised/removed
// in react-router v8 and are now always-on defaults; splitRouteModules moved to a
// top-level config field.
export default {
  appDirectory: 'src',
  splitRouteModules: true,
  // Prerender disabled: the root loader injects window.__DCC_CONFIG__ with
  // runtime env vars (DCC_NODE_URL, etc.). Prerendering runs at CI build time
  // when those vars are unset, baking mainnet URLs into the static HTML for
  // all networks. SSR-only ensures the correct network config is injected.
  ssr: true,
} satisfies Config;
