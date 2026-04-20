import { swaggerSpec } from "./swagger.js";

describe("swaggerSpec", () => {
  it("contains the expected API metadata", () => {
    expect(swaggerSpec.openapi).toBe("3.0.0");
    expect(swaggerSpec.info?.title).toBe("Job Fair API");
    expect(swaggerSpec.tags).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Auth" })]),
    );
  });

  it("includes paths from route modules", () => {
    expect(swaggerSpec.paths).toEqual(
      expect.objectContaining({
        "/auth/register": expect.any(Object),
        "/users/me": expect.any(Object),
        "/events": expect.any(Object),
      }),
    );
  });
});
