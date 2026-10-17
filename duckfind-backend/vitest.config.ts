import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    passWithNoTests: true,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgres://duckfind:duckfind@localhost:5432/duckfind_test",
    },
  },
});
