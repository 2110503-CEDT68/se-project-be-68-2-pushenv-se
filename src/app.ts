import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
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
  app.use(
    "/uploads",
    express.static(uploadsDirectory, {
      setHeaders: (response) => {
        response.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        response.setHeader("Access-Control-Allow-Origin", env.CORS_ORIGIN);
      },
    }),
  );
  app.use("/api/v1", apiRouter);
  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
