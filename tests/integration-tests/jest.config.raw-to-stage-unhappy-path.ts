import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
  coveragePathIgnorePatterns: ['/dist/'],
  preset: 'ts-jest',
  verbose: true,
  testMatch: ['**/tests/integration-tests/test-suites/raw-to-stage-unhappy-path/**/*.spec.ts'],
  globalSetup: '<rootDir>/setup-raw-to-stage-unhappy-path.ts',
  testTimeout: 600000,
  maxWorkers: 1,
  maxConcurrency: 1,
};

export default config;
