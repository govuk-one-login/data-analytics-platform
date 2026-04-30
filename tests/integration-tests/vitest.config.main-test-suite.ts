import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration-tests/test-suites/**/*.spec.ts', 'tests/integration-tests/test-suites/**/*.test.ts'],
    exclude: ['tests/integration-tests/test-suites/raw-to-stage-unhappy-path/**'],
    globalSetup: './tests/integration-tests/setup-main-test-suite.ts',
    teardownTimeout: 600000,
    testTimeout: 600000,
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 4,
      },
    },
    reporters: [
      'verbose',
      [
        'junit',
        {
          outputFile: './tests/integration-tests/reports/junit.xml',
          suiteName: 'TxMA event processing integration tests',
        },
      ],
    ],
  },
});
