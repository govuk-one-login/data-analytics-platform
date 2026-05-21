import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/tests/e2e-tests/test-suites/event-onboarding/**/*.spec.ts'],
    globalSetup: './tests/e2e-tests/setup-event-onboarding.ts',
    testTimeout: 600000,
    reporters: [
      'verbose',
      ['junit', { suiteName: 'Event Onboarding e2e tests', outputFile: './tests/e2e-tests/reports/junit.xml' }],
    ],
  },
});
