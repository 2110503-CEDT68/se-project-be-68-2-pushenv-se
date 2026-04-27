import { Router } from "express";
import { getJob } from "../../controllers/jobs.controller.js";
import { attachOptionalAuth } from "../../middlewares/auth.js";

export const jobsRouter = Router();

/**
 * @openapi
 * /jobs/{id}:
 *   get:
 *     summary: Get job detail by ID
 *     description: >
 *       Public endpoint. Closed jobs return 404 for unauthenticated users,
 *       jobSeekers, and companyUsers. systemAdmin tokens see closed jobs too.
 *     tags: [Jobs]
 *     security:
 *       - {}
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: Job detail including company info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Job not found or is closed (for non-admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
jobsRouter.get("/jobs/:id", attachOptionalAuth, getJob);
