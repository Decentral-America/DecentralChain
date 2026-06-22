import { mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.base.config';

export default mergeConfig(baseConfig, {
  test: {
    // admin-dashboard is a React Router SSR app — unit tests cover lib utilities only.
    // Coverage is scoped to lib/ to avoid instrumenting server routes and React pages
    // (those require integration testing against a live server).
    coverage: {
      exclude: ['src/index.ts'],
      include: ['src/lib/**/*.ts'],
      // No threshold enforcement — admin-dashboard is an SSR app where the
      // meaningful coverage comes from E2E tests, not unit test percentages.
      thresholds: {
        branches: 0,
        functions: 0,
        lines: 0,
        statements: 0,
      },
    },
  },
});
