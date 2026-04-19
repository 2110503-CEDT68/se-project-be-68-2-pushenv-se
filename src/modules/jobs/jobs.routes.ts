import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import {
  getCompanyJobs, getJob,
  adminGetCompanyJobs, adminCreateCompanyJob, adminGetCompanyJob,
  adminCloseJob, adminDeleteJob, adminUpdateJob, adminOpenJob
} from "../../controllers/jobs.controller.js";

export const jobsRouter = Router();

/**
 * @openapi
 * /companies/{companyId}/jobs:
 *   get:
 *     summary: Get open job listings for a company (legacy route)
 *     description: Returns only jobs where isClosed is false. Closed jobs are never visible here.
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CompanyProfile ID
 *     responses:
 *       200:
 *         description: Open job listings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Company jobs
 *               data:
 *                 - id: "job-uuid"
 *                   title: Backend Developer
 *                   type: full_time
 *                   location: Bangkok
 *                   isClosed: false
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
jobsRouter.get("/companies/:companyId/jobs", getCompanyJobs);

/**
 * @openapi
 * /jobs/{id}:
 *   get:
 *     summary: Get job detail by ID
 *     description: >
 *       Public endpoint. Closed jobs return 404 for unauthenticated users and
 *       jobSeeker / companyUser roles. systemAdmin tokens can see closed jobs.
 *     tags: [Jobs]
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: Job detail including company info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Job detail
 *               data:
 *                 id: "job-uuid"
 *                 title: Frontend Developer
 *                 type: full_time
 *                 location: Bangkok
 *                 description: Build cool UIs
 *                 isClosed: false
 *                 company:
 *                   id: "profile-uuid"
 *                   logo: /uploads/logos/uuid.png
 *                   website: https://techcorp.com
 *                   companyUser:
 *                     name: Tech Corp
 *       404:
 *         description: Job not found or is closed (for non-admin)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
jobsRouter.get("/jobs/:id", getJob);

/**
 * @openapi
 * /admin/companies/{companyId}/jobs:
 *   get:
 *     summary: Get all jobs for a company including closed (admin)
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CompanyProfile ID
 *     responses:
 *       200:
 *         description: All jobs (open and closed) for the company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
jobsRouter.get("/admin/companies/:companyId/jobs", requireAuth, requireRole(["systemAdmin"]), adminGetCompanyJobs);

/**
 * @openapi
 * /admin/jobs/{id}:
 *   get:
 *     summary: Get any job detail including closed (admin)
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: Full job detail including company info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
jobsRouter.get("/admin/jobs/:id", requireAuth, requireRole(["systemAdmin"]), adminGetCompanyJob);

/**
 * @openapi
 * /admin/companies/{companyId}/jobs:
 *   post:
 *     summary: Create a job listing under any company (admin)
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CompanyProfile ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobInput'
 *     responses:
 *       201:
 *         description: Job listing created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
jobsRouter.post("/admin/companies/:companyId/jobs", requireAuth, requireRole(["systemAdmin"]), adminCreateCompanyJob);

/**
 * @openapi
 * /admin/jobs/{id}:
 *   put:
 *     summary: Update any job listing (admin)
 *     description: Only provided fields are updated — all fields are optional.
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobInput'
 *     responses:
 *       200:
 *         description: Job updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
jobsRouter.put("/admin/jobs/:id", requireAuth, requireRole(["systemAdmin"]), adminUpdateJob);

/**
 * @openapi
 * /admin/jobs/{id}/close:
 *   patch:
 *     summary: Close any job listing (admin)
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: Job closed — isClosed set to true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
jobsRouter.patch("/admin/jobs/:id/close", requireAuth, requireRole(["systemAdmin"]), adminCloseJob);

/**
 * @openapi
 * /admin/jobs/{id}/open:
 *   patch:
 *     summary: Re-open any job listing (admin)
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: Job opened — isClosed set to false
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
jobsRouter.patch("/admin/jobs/:id/open", requireAuth, requireRole(["systemAdmin"]), adminOpenJob);

/**
 * @openapi
 * /admin/jobs/{id}:
 *   delete:
 *     summary: Delete any job listing (admin)
 *     tags: [Admin - Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: Job deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Job deleted
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
jobsRouter.delete("/admin/jobs/:id", requireAuth, requireRole(["systemAdmin"]), adminDeleteJob);