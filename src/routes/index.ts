import { Router } from "express";
import { adminRouter } from "../modules/admin/admin.routes.js";
import { authRouter } from "../modules/auth/auth.routes.js";
import { companyRouter } from "../modules/company/company.routes.js";
import { companiesRouter } from "../modules/companies/companies.routes.js";
import { eventsRouter } from "../modules/events/events.routes.js";
import { jobsRouter } from "../modules/jobs/jobs.routes.js";
import { usersRouter } from "../modules/users/users.routes.js";
import { sendSuccess } from "../utils/http.js";

export const apiRouter = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
apiRouter.get("/health", (_request, response) =>
  sendSuccess(response, "OK", { service: "job-fair-backend" }),
);

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/companies", companiesRouter);
apiRouter.use("/company", companyRouter);
apiRouter.use("/events", eventsRouter);
apiRouter.use("/", jobsRouter);
apiRouter.use("/admin", adminRouter);
