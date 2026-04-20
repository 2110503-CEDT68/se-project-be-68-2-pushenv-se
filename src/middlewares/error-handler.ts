import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { sendError } from "../utils/http.js";

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return sendError(response, "File size must be 5 MB or smaller", 400);
    }

    return sendError(response, error.message, 400);
  }

  if (error instanceof Error && error.message === "Only JPEG, PNG, and WebP images are allowed") {
    return sendError(response, error.message, 400);
  }

  console.error(error);
  return sendError(response, "Internal Server Error", 500);
}
