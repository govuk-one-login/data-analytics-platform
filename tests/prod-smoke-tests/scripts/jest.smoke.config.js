module.exports = async () => {
  return {
    roots: ['<rootDir>/tests/prod-smoke-tests'],
    testMatch: ['**/tests/prod-smoke-tests/*.spec.ts'],
    coveragePathIgnorePatterns: ['/node_modules/'],
    testTimeout: 300000,
    verbose: true,
    transform: {
      '^.+\\.tsx?$': '@swc/jest',
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
