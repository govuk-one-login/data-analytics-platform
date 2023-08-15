module.exports = async () => {
  return {
    roots: ['<rootDir>/tests/e2e-tests'],
    testMatch: ['**/tests/e2e-tests/*.spec.ts'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    // globalSetup: "./src/handlers/int-test-support/helpers/testSetup.ts",
    testTimeout: 300000,
    verbose: true,
    transform: {
      '^.+\\.tsx?$': 'esbuild-jest',
    },
    collectCoverage: true,
    testResultsProcessor: './node_modules/jest-stare',
    reporters: [
      'default',
      [
        'jest-stare',
        {
          resultDir: 'test-report',
          reportTitle: 'DAP',
          reportHeadline: 'DAP',
          coverageLink: '../../coverage/lcov-report/index.html',
        },
      ],
    ],
    setupFiles: ['<rootDir>/jest.setup.js'],
  };
};
