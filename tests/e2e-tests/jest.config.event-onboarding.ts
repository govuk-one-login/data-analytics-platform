import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  verbose: true,
  testMatch: ['**/tests/e2e-tests/test-suites/event-onboarding/**/*.spec.ts'],
  globalSetup: '<rootDir>/setup-event-onboarding.ts',
  testTimeout: 600000,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'Event Onboarding e2e tests',
        outputDirectory: '<rootDir>/reports',
        ancestorSeparator: ',',
        includeConsoleOutput: true,
      },
    ],
  ],
};

export default config;
