import { defineConfig } from "vitest/config";

/**
 * Live E2E test config: runs all tests including tests/live/** suites.
 * Requires a real PostgreSQL connection (DATABASE_URL must be set in .env).
 *
 * Run locally with: pnpm test:live
 * These tests are intentionally excluded from CI (see vitest.config.ts).
 */
export default defineConfig({
  test: {
    include: [
      "src/**/*.{test,spec}.ts",
      "tests/**/*.{test,spec}.ts",
    ],
    environment: "node",
    testTimeout: 30000, // Live DB tests need more time
    hookTimeout: 30000,
  },
});
