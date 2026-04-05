import { defineConfig } from 'vitest/config';
import path from 'path';
import { playwright } from '@vitest/browser-playwright';

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [{
      extends: true,
      test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
        alias: {
          '@': path.resolve(__dirname, 'src')
        }
      }
    }, {
      extends: true,
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});