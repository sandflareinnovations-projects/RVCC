import { defineConfig } from "vitest/config";

/**
 * Default (CI-safe) config: runs unit + integration tests only.
 * Live E2E tests that require a real PostgreSQL connection are excluded here
 * and should be run locally via: pnpm test:live
 */
export default defineConfig({
  test: {
    include: [
      "src/**/*.{test,spec}.ts",
      "tests/unit/**/*.{test,spec}.ts",
      "tests/integration/**/*.{test,spec}.ts",
    ],
    exclude: ["tests/live/**"],
    environment: "node",
  },
});
