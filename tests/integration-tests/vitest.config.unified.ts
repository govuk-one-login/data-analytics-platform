import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration-tests/test-suites/**/*.spec.ts', 'tests/integration-tests/test-suites/**/*.test.ts'],
    globalSetup: './tests/integration-tests/setup-main-test-suite.ts',
    teardownTimeout: 600000,
    testTimeout: 600000,
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 6,
      },
    },
    reporters: [
      'verbose',
      [
        'junit',
        {
          outputFile: './tests/integration-tests/reports/junit-unified.xml',
          suiteName: 'TxMA event processing integration tests',
        },
      ],
    ],
    projects: [
      {
        test: {
          name: 'main-test-suite',
          include: ['tests/integration-tests/test-suites/**/*.spec.ts'],
          exclude: ['tests/integration-tests/test-suites/raw-to-stage-unhappy-path/**'],
          globalSetup: './tests/integration-tests/setup-main-test-suite.ts',
          testTimeout: 600000,
          pool: 'forks',
          poolOptions: { forks: { maxForks: 6 } },
        },
      },
      {
        test: {
          name: 'raw-to-stage-unhappy-path',
          include: ['tests/integration-tests/test-suites/raw-to-stage-unhappy-path/**/*.spec.ts'],
          globalSetup: './tests/integration-tests/setup-raw-to-stage-unhappy-path.ts',
          testTimeout: 600000,
          pool: 'forks',
          poolOptions: { forks: { singleFork: true } },
        },
      },
    ],
  },
});
