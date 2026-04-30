import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/e2e-tests/test-suites/event-onboarding-check-only/**/*.spec.ts'],
    globalSetup: './tests/e2e-tests/setup-event-onboarding-check-only.ts',
    testTimeout: 600000,
    pool: 'forks',
    poolOptions: { forks: { singleFork: true } },
    reporters: [
      'verbose',
      [
        'junit',
        { outputFile: './tests/e2e-tests/reports/junit.xml', suiteName: 'Event Onboarding e2e tests (check only)' },
      ],
    ],
  },
});
