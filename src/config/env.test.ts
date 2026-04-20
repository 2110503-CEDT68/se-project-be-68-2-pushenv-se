describe("env config", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  it("uses defaults when optional values are absent", () => {
    process.env = {
      DATABASE_URL: "postgres://example",
      JWT_SECRET: "secret",
    };

    jest.isolateModules(() => {
      const { env } = require("./env.js") as typeof import("./env.js");

      expect(env.PORT).toBe(4000);
      expect(env.CORS_ORIGIN).toBe("http://localhost:3000");
    });
  });

  it("uses explicit environment values", () => {
    process.env = {
      DATABASE_URL: "postgres://example",
      JWT_SECRET: "secret",
      PORT: "9000",
      CORS_ORIGIN: "http://localhost:4000",
    };

    jest.isolateModules(() => {
      const { env } = require("./env.js") as typeof import("./env.js");

      expect(env.PORT).toBe(9000);
      expect(env.CORS_ORIGIN).toBe("http://localhost:4000");
    });
  });
});
