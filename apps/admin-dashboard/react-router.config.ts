import { type Config } from '@react-router/dev/config';

// All v7 future.v8_* flags (middleware, passThroughRequests, splitRouteModules,
// trailingSlashAwareDataRequests, viteEnvironmentApi) have been stabilised/removed
// in react-router v8 and are now always-on defaults; splitRouteModules moved to a
// top-level config field.
export default {
  appDirectory: 'src',
  splitRouteModules: true,
  ssr: true,
} satisfies Config;
