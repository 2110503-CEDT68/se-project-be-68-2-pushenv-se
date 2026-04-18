import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import {
  getProfile,
  updateProfile,
  getCompanyEvents,
  createJob,
  updateJob,
  closeJob,
  deleteJob,
  openJob
} from "../../controllers/company.controller.js";

export const companyRouter = Router();

companyRouter.use(requireAuth, requireRole(["companyUser"]));

/**
 * @openapi
 * /company/profile:
 *   get:
 *     summary: Get my company profile
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My company profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Company profile
 *               data:
 *                 id: "profile-uuid"
 *                 companyUserId: "user-uuid"
 *                 description: We build great software
 *                 logo: /uploads/logos/uuid.png
 *                 website: https://techcorp.com
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Company profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
companyRouter.get("/profile", getProfile);

/**
 * @openapi
 * /company/profile:
 *   put:
 *     summary: Update my company profile
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 example: We build amazing software products
 *               logo:
 *                 type: string
 *                 description: URL of the company logo
 *                 example: https://cdn.example.com/logo.png
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: https://techcorp.com
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
companyRouter.put("/profile", updateProfile);

/**
 * @openapi
 * /company/events:
 *   get:
 *     summary: Get events my company is participating in
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Events linked to my company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Company events
 *               data:
 *                 - id: "event-uuid"
 *                   name: Job Fair 2025
 *                   location: Bangkok
 *                   startDate: "2025-11-01"
 *                   endDate: "2025-11-02"
 *                   isPublished: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Company profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
companyRouter.get("/events", getCompanyEvents);

/**
 * @openapi
 * /company/jobs:
 *   post:
 *     summary: Create a new job listing
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
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
 *             example:
 *               success: true
 *               message: Job created
 *               data:
 *                 id: "job-uuid"
 *                 title: Frontend Developer
 *                 type: full_time
 *                 location: Bangkok
 *                 isClosed: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Company profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
companyRouter.post("/jobs", createJob);

/**
 * @openapi
 * /company/jobs/{id}:
 *   put:
 *     summary: Update a job listing (ownership enforced)
 *     tags: [Company]
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
 *         description: Job not found or not owned by this company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
companyRouter.put("/jobs/:id", updateJob);

/**
 * @openapi
 * /company/jobs/{id}/close:
 *   patch:
 *     summary: Close a job listing (hidden from public)
 *     tags: [Company]
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
companyRouter.patch("/jobs/:id/close", closeJob);

/**
 * @openapi
 * /company/jobs/{id}/open:
 *   patch:
 *     summary: Re-open a closed job listing
 *     tags: [Company]
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
companyRouter.patch("/jobs/:id/open", openJob);

/**
 * @openapi
 * /company/jobs/{id}:
 *   delete:
 *     summary: Delete a job listing (ownership enforced)
 *     tags: [Company]
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
companyRouter.delete("/jobs/:id", deleteJob);