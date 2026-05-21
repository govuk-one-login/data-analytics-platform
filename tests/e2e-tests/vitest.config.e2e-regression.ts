import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/tests/e2e-tests/test-suites/e2e-regression/**/*.spec.ts'],
    globalSetup: './tests/e2e-tests/setup-e2e-regression.ts',
    testTimeout: 600000,
    reporters: [
      'verbose',
      ['junit', { suiteName: 'E2E Regression tests', outputFile: './tests/e2e-tests/reports/junit.xml' }],
    ],
  },
});
