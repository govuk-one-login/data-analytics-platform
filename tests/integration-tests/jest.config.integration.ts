import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  coveragePathIgnorePatterns: ['/dist/'],
  preset: 'ts-jest',
  verbose: true,
  testMatch: ['**/tests/integration-tests/test-suites/**/*.spec.ts'],
  globalSetup: '<rootDir>/setup.ts',
  globalTeardown: '<rootDir>/teardown.ts',
  testSequencer: '<rootDir>/jest-sequencer.mjs',
  testTimeout: 600000,
  maxWorkers: 4,
  maxConcurrency: 2,
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
