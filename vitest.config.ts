import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/modules/core/**/*.ts"],
      exclude: ["**/*.test.ts", "**/index.ts"],
    },
  },
});
