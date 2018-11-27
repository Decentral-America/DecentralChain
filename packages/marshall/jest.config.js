module.exports = {
  verbose: true,
  roots: [
    "<rootDir>/test"
  ],
  collectCoverage: true,
  coverageReporters: [
    "json-summary",
    "text",
    "lcov"
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test))\\.tsx?$",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ]
}