import { defineConfig } from "vitest/config";
import path from "path";

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          environment: "node",
          include: ["src/**/*.test.ts"],
          alias: {
            "@": path.resolve(__dirname, "src"),
          },
        },
      },
    ],
  },
});
