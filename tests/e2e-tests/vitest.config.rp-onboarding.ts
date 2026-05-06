import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/e2e-tests/test-suites/rp-onboarding/**/*.spec.ts'],
    globalSetup: './tests/e2e-tests/setup-rp-onboarding.ts',
    testTimeout: 600000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    reporters: [
      'verbose',
      ['junit', { outputFile: './tests/e2e-tests/reports/junit.xml', suiteName: 'RP Onboarding e2e tests' }],
    ],
  },
});
