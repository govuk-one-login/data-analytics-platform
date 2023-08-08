import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  roots: ["<rootDir>/integration-tests"],
  testMatch: ["**/tests/*spec.ts"],
  coveragePathIgnorePatterns: ["/node_modules/"],
  preset: "ts-jest",
  testRunner: "jasmine2",
  // globalSetup: "./src/handlers/int-test-support/helpers/testSetup.ts",
  verbose: true,
  testTimeout: 300000,
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "reports",
        outputName: "testReport.xml",
      },
    ],
    [
      "jest-html-reporters",
      {
        publicPath: `./reports/jest-html-reports/test-report-${new Date().toISOString()}`,
        filename: "index.html",
        expand: true,
        openReport: true,
        pageTitle: "DAP INTEGRATION TEST REPORT",
      },
    ],
  ],
};
export default config;
