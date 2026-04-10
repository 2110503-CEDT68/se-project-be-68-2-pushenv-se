import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { sendError } from "../utils/http.js";

type JwtPayload = {
  id: string;
  role: "user" | "company" | "admin";
};

export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

export function requireAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction,
) {
  const header = request.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return sendError(response, "Unauthorized", 401);
  }
  try {
    const token = header.replace("Bearer ", "");
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
