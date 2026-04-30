import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/e2e-tests/test-suites/e2e-regression/**/*.spec.ts'],
    globalSetup: './tests/e2e-tests/setup-e2e-regression.ts',
    testTimeout: 600000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    reporters: [
      'verbose',
      ['junit', { outputFile: './tests/e2e-tests/reports/junit.xml', suiteName: 'E2E Regression tests' }],
    ],
  },
});
