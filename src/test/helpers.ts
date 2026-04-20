import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.js";

export function makeReq<T extends Request = Request>(overrides: Partial<T> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    header: jest.fn(),
    ...overrides,
  } as T;
}

export function makeAuthReq(overrides: Partial<AuthenticatedRequest> = {}) {
  return makeReq<AuthenticatedRequest>({
    user: { id: "user-1", role: "jobSeeker" },
    ...overrides,
  });
}

export function makeRes() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

export function makeNext() {
  return jest.fn() as NextFunction;
}

export function makeBearer(token = "valid.token") {
  return `Bearer ${token}`;
}
