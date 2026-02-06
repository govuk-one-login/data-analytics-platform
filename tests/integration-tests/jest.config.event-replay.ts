import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test-suites/event-replay/**/*.spec.ts'],
  globalSetup: '<rootDir>/setup-event-replay.ts',
  // globalTeardown: '<rootDir>/teardown.ts',
  testTimeout: 10 * 60 * 1000,
  maxWorkers: 1,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './reports',
        outputName: 'junit-event-replay.xml',
        suiteName: 'Event Replay Integration Tests',
      },
    ],
  ],
};

export default config;
