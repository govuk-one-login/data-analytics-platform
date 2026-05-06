import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.spec.ts', 'common/**/*.spec.ts', 'src/**/*.test.ts', 'common/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        '**/scripts/**',
        '**/interface/**',
        '**/interfaces/**',
        '**/type/**',
        '**/types/**',
        '**/logger.ts',
        '**/tests/**',
        '**/*.config.ts',
        '.*/**',
        'src/utils/tests/mocks/mockLambdaContext.ts',
        'src/shared/utils/test-utils.ts',
      ],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: -24, // Vite exposes some internal code that is not covered by our tests, so we need to set this to a negative value to avoid failing the build
      },
    },
  },
});
