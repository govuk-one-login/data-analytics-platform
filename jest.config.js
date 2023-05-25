module.exports = async () => {
  return {
    verbose: true,
    transform: {
      "^.+\\.tsx?$": "esbuild-jest"
    },
    collectCoverage: true,
    testResultsProcessor: "./node_modules/jest-stare",
    reporters: [
      "default",
      [
        "jest-stare",
        {
          "resultDir": "test-report",
          "reportTitle": "DAP",
          "reportHeadline": "DAP",
          "coverageLink": "../../coverage/lcov-report/index.html"
        }
      ]
    ]
  };
};
