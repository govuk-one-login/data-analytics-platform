import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  verbose: true,
  projects: [
    {
      displayName: 'main-test-suite',
      coveragePathIgnorePatterns: ['/dist/'],
      preset: 'ts-jest',
      testMatch: ['**/tests/integration-tests/test-suites/**/*.spec.ts'],
      testPathIgnorePatterns: ['<rootDir>/test-suites/raw-to-stage-unhappy-path/'],
      globalSetup: '<rootDir>/setup-main-test-suite.ts',
      globalTeardown: '<rootDir>/teardown.ts',
      testTimeout: 600000,
      maxWorkers: 6,
    },
    {
      displayName: 'raw-to-stage-unhappy-path',
      coveragePathIgnorePatterns: ['/dist/'],
      preset: 'ts-jest',
      testMatch: ['**/tests/integration-tests/test-suites/raw-to-stage-unhappy-path/**/*.spec.ts'],
      globalSetup: '<rootDir>/setup-raw-to-stage-unhappy-path.ts',
      testTimeout: 600000,
      maxWorkers: 2,
    },
  ],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'TxMA event processing integration tests',
        outputDirectory: '<rootDir>/reports',
        ancestorSeparator: ',',
        includeConsoleOutput: true,
      },
    ],
  ],
};

export default config;
