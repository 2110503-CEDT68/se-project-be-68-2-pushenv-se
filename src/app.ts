import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { doubleCsrf } from "csrf-csrf";
import { env } from "./config/env.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { apiRouter } from "./routes/index.js";
import { swaggerSpec } from "./utils/swagger.js";

export function createApp() {
  const app = express();
  const uploadsDirectory = path.join(process.cwd(), "uploads");

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    "/uploads",
    express.static(uploadsDirectory, {
      setHeaders: (response) => {
        response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        response.setHeader("Access-Control-Allow-Origin", env.CORS_ORIGIN);
      },
    }),
  );

  const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
    getSecret: () => env.JWT_SECRET,
    cookieName: "x-csrf-token",
    cookieOptions: {
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
    size: 64,
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
    getSessionIdentifier: (req) => req.cookies?.["job-fair-token"] || "anonymous",
  });

  app.get("/api/v1/csrf-token", (req, res) => {
    res.json({ csrfToken: generateCsrfToken(req, res) });
  });

  app.use(doubleCsrfProtection);

  app.use("/api/v1", apiRouter);
  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
