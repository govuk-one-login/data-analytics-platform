module.exports = async () => {
  return {
    roots: ['<rootDir>/tests/smoke-tests'],
    testMatch: ['**/tests/smoke-tests/*.spec.ts'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    // globalSetup: "./src/handlers/int-test-support/helpers/testSetup.ts",
    testTimeout: 300000,
    verbose: true,
    transform: {
      '^.+\\.tsx?$': 'esbuild-jest',
    },
    collectCoverage: true,
    testResultsProcessor: 'jest-junit',
    reporters: [
      'default',
      [
        'jest-junit',
        {
          suiteName: 'Test report',
          outputDirectory: '<rootDir>/reports',
          outputName: 'testReport.xml',
          ancestorSeparator: ',',
          includeConsoleOutput: true,
        },
      ],
    ],
    setupFiles: ['<rootDir>/jest.setup.js'],
  };
};
