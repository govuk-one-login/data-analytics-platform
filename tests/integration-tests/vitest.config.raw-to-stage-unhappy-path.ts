import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/tests/integration-tests/test-suites/raw-to-stage-unhappy-path/**/*.spec.ts'],
    globalSetup: './tests/integration-tests/setup-raw-to-stage-unhappy-path.ts',
    testTimeout: 600000,
    maxWorkers: 1,
    maxConcurrency: 1,
  },
});
