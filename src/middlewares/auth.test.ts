import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth.js";

// ── Mock jwt and env BEFORE require ──────────────────────────────────────────
jest.mock("jsonwebtoken");
jest.mock("../config/env.js", () => ({
  env: { JWT_SECRET: "test-secret" },
}));

const jwt = require("jsonwebtoken");
const { requireAuth, requireRole } = require("./auth") as typeof import("./auth.js");

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeReq(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
  return { headers: {}, header: jest.fn(), ...overrides } as unknown as AuthenticatedRequest;
}

function makeRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

function makeNext(): NextFunction {
  return jest.fn();
}

// ── requireAuth ───────────────────────────────────────────────────────────────
describe("requireAuth", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls next() and attaches user when token is valid", () => {
    const payload = { id: "user-1", role: "user" };
    (jwt.verify as jest.Mock).mockReturnValueOnce(payload);

    const req = makeReq();
    (req.header as jest.Mock).mockReturnValue("Bearer valid.token.here");
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith("valid.token.here", "test-secret");
    expect(req.user).toEqual(payload);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when Authorization header is missing", () => {
    const req = makeReq();
    (req.header as jest.Mock).mockReturnValue(undefined);
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Unauthorized" }),
    );
  });

  it("returns 401 when header does not start with Bearer", () => {
    const req = makeReq();
    (req.header as jest.Mock).mockReturnValue("Basic sometoken");
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("returns 401 when jwt.verify throws (expired or tampered token)", () => {
    (jwt.verify as jest.Mock).mockImplementationOnce(() => {
      throw new Error("jwt expired");
    });

    const req = makeReq();
    (req.header as jest.Mock).mockReturnValue("Bearer bad.token");
    const res = makeRes();
    const next = makeNext();

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ── requireRole ───────────────────────────────────────────────────────────────
describe("requireRole", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls next() when user role is in the allowed list", () => {
    const req = makeReq({ user: { id: "u1", role: "user" } });
    const res = makeRes();
    const next = makeNext();

    requireRole(["user"])(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 403 when user role is not in the allowed list", () => {
    const req = makeReq({ user: { id: "c1", role: "company" } });
    const res = makeRes();
    const next = makeNext();

    requireRole(["user"])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Forbidden" }),
    );
  });

  it("returns 403 when admin tries to access user-only route", () => {
    const req = makeReq({ user: { id: "a1", role: "admin" } });
    const res = makeRes();
    const next = makeNext();

    requireRole(["user"])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("returns 401 when req.user is undefined (middleware order mistake)", () => {
    const req = { headers: {}, header: jest.fn() } as unknown as AuthenticatedRequest;
    const res = makeRes();
    const next = makeNext();

    requireRole(["user"])(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Unauthorized" }),
    );
  });

  it("accepts multiple allowed roles", () => {
    const req = makeReq({ user: { id: "a1", role: "admin" } });
    const res = makeRes();
    const next = makeNext();

    requireRole(["user", "admin"])(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
