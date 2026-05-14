import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration-tests/test-suites/raw-to-stage-unhappy-path/**/*.spec.ts'],
    globalSetup: './tests/integration-tests/setup-raw-to-stage-unhappy-path.ts',
    testTimeout: 600000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
