import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { sendError } from "../utils/http.js";

type JwtPayload = {
  id: string;
  role: "jobSeeker" | "companyUser" | "systemAdmin";
};

export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

export function requireAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
) {
  const token = request.cookies?.["job-fair-token"];
  if (!token) {
    return sendError(response, "Unauthorized", 401);
  }
  try {
    request.user = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return next();
  } catch {
    return sendError(response, "Unauthorized", 401);
  }
}

export function requireRole(roles: Array<JwtPayload["role"]>) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    if (!request.user) {
      return sendError(response, "Unauthorized", 401);
    }

    if (!roles.includes(request.user.role)) {
      return sendError(response, "Forbidden", 403);
    }

    return next();
  };
}
