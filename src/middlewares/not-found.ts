import type { Request, Response } from "express";
import { sendError } from "../utils/http.js";

export function notFoundHandler(request: Request, response: Response) {
  return sendError(response, `Route not found: ${request.method} ${request.originalUrl}`, 404);
}
