import type { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/http.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  console.error(error);
  return sendError(response, "Internal Server Error", 500);
}
