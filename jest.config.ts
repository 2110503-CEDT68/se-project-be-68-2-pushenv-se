import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",

  // Tell ts-jest to use the jest-specific tsconfig (CommonJS mode)
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },

  // Strip the .js extension from ESM imports so Jest can resolve .ts files
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  // Where to find test files
  testMatch: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],

  // Collect coverage from src (excluding entry points)
  collectCoverageFrom: [
    "src/controllers/**/*.ts",
    "!src/server.ts",
    "!src/app.ts",
  ],
};

export default config;