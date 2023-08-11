import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  roots: ['<rootDir>/tests/integration-tests'],
  testMatch: ['**/tests/*e2e-spec.ts'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  preset: 'ts-jest',
  testRunner: 'jasmine2',
  // globalSetup: "./src/handlers/int-test-support/helpers/testSetup.ts",
  verbose: true,
  testTimeout: 300000,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports',
        outputName: 'testReport.xml',
      },
    ],
  ],
};

export default config;
