import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["dist/**/*.js"],
      reporter: ["text", "lcov", "json-summary"],
      // Coverage thresholds are intentionally low for this project because
      // the source code is entirely generated from protobuf schemas via pbjs.
      // Quality is ensured via encode/decode roundtrip tests, not line coverage.
      thresholds: {
        branches: 5,
        functions: 5,
        lines: 5,
        statements: 5,
      },
    },
  },
});
