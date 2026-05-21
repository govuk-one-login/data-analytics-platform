import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/tests/e2e-tests/test-suites/event-onboarding-check-only/**/*.spec.ts'],
    globalSetup: './tests/e2e-tests/setup-event-onboarding-check-only.ts',
    testTimeout: 600000,
    reporters: [
      'verbose',
      [
        'junit',
        {
          suiteName: 'Event Onboarding e2e tests (check only)',
          outputFile: './tests/e2e-tests/reports/junit.xml',
        },
      ],
    ],
  },
});
