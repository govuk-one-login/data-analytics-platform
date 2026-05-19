import { defineConfig } from 'vitest/config';

const baseCoverage = [
  // scan all files
  'src/**/*.ts',
  'common/**/*.ts',
  // types can be ignored
  '!**/interface/**',
  '!**/interfaces/**',
  '!**/type/**',
  '!**/types/**',
  '!**/logger.ts',
  '!**/tests/**',
  '!**/*.config.ts',
  // ignore dotfiles
  '!**/.*',
];

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'common/**/*.test.ts', 'src/**/*.spec.ts', 'common/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: baseCoverage,
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/utils/tests/mocks/mockLambdaContext.ts',
        'src/shared/utils/test-utils.ts',
      ],
      reporter: ['lcov', 'text'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: -10,
      },
    },
    reporters: ['verbose'],
  },
});
