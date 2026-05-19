import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/tests/integration-tests/test-suites/**/*.spec.ts', '!**/test-suites/raw-to-stage-unhappy-path/**'],
    globalSetup: './tests/integration-tests/setup-main-test-suite.ts',
    setupFiles: ['./tests/integration-tests/setup-inject-globals.ts'],
    teardownTimeout: 600000,
    testTimeout: 600000,
    maxWorkers: 6,
    reporters: [
      'verbose',
      [
        'junit',
        {
          suiteName: 'TxMA event processing integration tests',
          outputFile: './tests/integration-tests/reports/junit.xml',
        },
      ],
    ],
  },
});
