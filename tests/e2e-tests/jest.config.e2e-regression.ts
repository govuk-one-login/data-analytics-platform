import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  verbose: true,
  testMatch: ['**/tests/e2e-tests/test-suites/e2e-regression/**/*.spec.ts'],
  globalSetup: '<rootDir>/setup-e2e-regression.ts',
  testTimeout: 600000,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'E2E Regression tests',
        outputDirectory: '<rootDir>/reports',
        ancestorSeparator: ',',
        includeConsoleOutput: true,
      },
    ],
  ],
};

export default config;
