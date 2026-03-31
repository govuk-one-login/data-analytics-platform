import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  preset: 'ts-jest',
  verbose: true,
  testMatch: ['**/tests/e2e-tests/test-suites/rp-onboarding/**/*.spec.ts'],
  globalSetup: '<rootDir>/setup-rp-onboarding-check-only.ts',
  testTimeout: 600000,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'RP Onboarding e2e tests (check only)',
        outputDirectory: '<rootDir>/reports',
        ancestorSeparator: ',',
        includeConsoleOutput: true,
      },
    ],
  ],
};

export default config;
