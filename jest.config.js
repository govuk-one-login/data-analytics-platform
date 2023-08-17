module.exports = async () => {
  return {
    verbose: true,
    transform: {
      "^.+\\.tsx?$": "esbuild-jest"
    },
    collectCoverage: true,
    testResultsProcessor: "jest-junit",
    reporters: [
      "default",
      [
        "jest-junit",
        {
          suiteName: 'Test report',
          outputDirectory: '<rootDir>/reports',
          outputName: "testReport.xml",
          ancestorSeparator: ',',
          includeConsoleOutput: true
        }
      ]
    ],
    setupFiles: ['<rootDir>/jest.setup.js']
  };
};
