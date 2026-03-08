import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['dist/**/*.js'],
      reporter: ['text', 'lcov', 'json-summary'],
      // Coverage thresholds are intentionally moderate for this project because
      // the source code is entirely generated from protobuf schemas via pbjs.
      // Quality is ensured via comprehensive encode/decode roundtrip tests that
      // exercise every protobuf message type and all oneOf transaction variants.
      thresholds: {
        branches: 15,
        functions: 15,
        lines: 15,
        statements: 15,
      },
    },
  },
});
