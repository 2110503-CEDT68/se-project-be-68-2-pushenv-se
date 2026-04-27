import { readFileSync } from "node:fs";
import path from "node:path";
import { swaggerSpec } from "./swagger.js";

describe("swaggerSpec", () => {
  it("contains the expected API metadata", () => {
    const spec = swaggerSpec as {
      openapi?: string;
      info?: { title?: string };
      tags?: unknown[];
      paths?: Record<string, unknown>;
    };

    expect(spec.openapi).toBe("3.0.0");
    expect(spec.info?.title).toBe("Job Fair API");
    expect(spec.tags).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Auth" })]),
    );
  });

  it("includes paths from route modules", () => {
    const spec = swaggerSpec as { paths?: Record<string, unknown> };

    expect(spec.paths).toEqual(
      expect.objectContaining({
        "/auth/register": expect.any(Object),
        "/users/me": expect.any(Object),
        "/events": expect.any(Object),
        "/health": expect.any(Object),
        "/csrf-token": expect.any(Object),
        "/events/{id}/registration-status": expect.any(Object),
        "/admin/accounts/{id}": expect.any(Object),
        "/admin/companies/{id}": expect.any(Object),
        "/admin/events/{id}": expect.any(Object),
      }),
    );
  });

  it("matches the checked-in openapi.yaml artifact", () => {
    const openapiPath = path.resolve(process.cwd(), "openapi.yaml");
    const fileSpec = JSON.parse(readFileSync(openapiPath, "utf8")) as unknown;

    expect(fileSpec).toEqual(swaggerSpec);
  });
});
