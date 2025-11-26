import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  verbose: true,
  testSequencer: '<rootDir>/jest-sequencer.mjs',
  projects: [
    {
      displayName: 'happy-edge-cases',
      coveragePathIgnorePatterns: ['/dist/'],
      preset: 'ts-jest',
      testMatch: ['**/tests/integration-tests/test-suites/**/*.spec.ts'],
      testPathIgnorePatterns: ['<rootDir>/test-suites/raw-to-stage-unhappy-path/'],
      globalSetup: '<rootDir>/setup.ts',
      globalTeardown: '<rootDir>/teardown.ts',
      testTimeout: 600000,
      maxWorkers: 4,
    },
    {
      displayName: 'unhappy-path',
      coveragePathIgnorePatterns: ['/dist/'],
      preset: 'ts-jest',
      testMatch: ['**/tests/integration-tests/test-suites/raw-to-stage-unhappy-path/**/*.spec.ts'],
      globalSetup: '<rootDir>/setup-unhappy-path.ts',
      testTimeout: 600000,
      maxWorkers: 1,
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
