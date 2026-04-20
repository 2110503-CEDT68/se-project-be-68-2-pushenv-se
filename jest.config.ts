import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
        diagnostics: false,
      },
    ],
  },

  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  testMatch: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],

  collectCoverageFrom: [
    "src/app.ts",
    "src/config/env.ts",
    "src/controllers/**/*.ts",
    "src/middlewares/**/*.ts",
    "src/modules/**/*.ts",
    "src/routes/**/*.ts",
    "src/services/**/*.ts",
    "src/utils/http.ts",
    "src/utils/swagger.ts",
    "src/utils/uploads.ts",
    "!src/server.ts",
    "!src/**/*.test.ts",
    "!src/utils/prisma.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};

export default config;
