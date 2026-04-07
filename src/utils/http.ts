import type { Response } from "express";

export function sendSuccess<T>(
  response: Response,
  message: string,
  data: T,
  statusCode = 200,
) {
  return response.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  response: Response,
  message: string,
  statusCode = 500,
  errors?: Array<{ field: string; message: string }>,
) {
  return response.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

export function notImplemented(feature: string) {
  return {
    message: `${feature} is scaffolded but not implemented yet.`,
  };
}
