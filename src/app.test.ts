import jwt from "jsonwebtoken";
import request from "supertest";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

function makeToken(role: "jobSeeker" | "companyUser" | "systemAdmin") {
  return jwt.sign({ id: `${role}-1`, role }, env.JWT_SECRET);
}

describe("createApp", () => {
  const app = createApp();

  it("serves the health endpoint", async () => {
    const response = await request(app).get("/api/v1/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "OK",
      data: { service: "job-fair-backend" },
    });
  });

  it("mounts swagger docs", async () => {
    const response = await request(app).get("/api/v1/docs");

    expect([200, 301]).toContain(response.status);
  });

  it("enforces auth on protected routes", async () => {
    const response = await request(app).get("/api/v1/users/me");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Unauthorized");
  });

  it("enforces role-based access", async () => {
    const response = await request(app)
      .get("/api/v1/admin/accounts")
      .set("Authorization", `Bearer ${makeToken("jobSeeker")}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Forbidden");
  });

  it("wires company routes behind auth", async () => {
    const response = await request(app).get("/api/v1/company/profile");

    expect(response.status).toBe(401);
  });

  it("falls through to the not found handler", async () => {
    const response = await request(app).get("/api/v1/unknown-route");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Route not found: GET /api/v1/unknown-route");
  });
});
