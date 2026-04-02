import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    globalSetup: ["src/__tests__/setup.ts"],
    testTimeout: 30000,
    fileParallelism: false,
    include: ["src/__tests__/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5433/reliefcher_test",
      DIRECT_URL: "postgresql://postgres:postgres@localhost:5433/reliefcher_test",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
