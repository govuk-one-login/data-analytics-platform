import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    projects: [
      {
        test: {
          name: 'main-test-suite',
          globals: true,
          environment: 'node',
          include: ['**/tests/integration-tests/test-suites/**/*.spec.ts'],
          exclude: ['**/test-suites/raw-to-stage-unhappy-path/**'],
          globalSetup: './tests/integration-tests/setup-main-test-suite.ts',
          setupFiles: ['./tests/integration-tests/setup-inject-globals.ts'],
          testTimeout: 600000,
          maxWorkers: 6,
        },
      },
      {
        test: {
          name: 'raw-to-stage-unhappy-path',
          globals: true,
          environment: 'node',
          include: ['**/tests/integration-tests/test-suites/raw-to-stage-unhappy-path/**/*.spec.ts'],
          globalSetup: './tests/integration-tests/setup-raw-to-stage-unhappy-path.ts',
          testTimeout: 600000,
          maxWorkers: 1,
        },
      },
    ],
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
