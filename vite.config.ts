import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, "packages/template/*", "test/middleware/DummyFetchHandler.ts"],
    include: [...configDefaults.include, "test/**/*.ts"],
    coverage: {
      reporter: ["html"],
    },
  },
});
