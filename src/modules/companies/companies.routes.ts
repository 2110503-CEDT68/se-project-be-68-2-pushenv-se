import { Router } from "express";
import {
  getCompanies,
  getCompany,
  getCompanyJobs,
} from "../../controllers/companies.controller.js";

export const companiesRouter = Router();

/**
 * @openapi
 * /companies:
 *   get:
 *     summary: Get all companies (public directory)
 *     tags: [Companies]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by company name (case-insensitive)
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, oldest, a-z, z-a] }
 *         description: Sort order (default newest)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated company list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
companiesRouter.get("/", getCompanies);

/**
 * @openapi
 * /companies/{companyId}:
 *   get:
 *     summary: Get a single company's public profile
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Company profile with event history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
companiesRouter.get("/:companyId", getCompany);

/**
 * @openapi
 * /companies/{companyId}/jobs:
 *   get:
 *     summary: Get open job listings for a company
 *     description: Returns only open listings (isClosed = false).
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Open job listings
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Fixed: was /jobs with capital J — now lowercase to match all other routes
companiesRouter.get("/:companyId/jobs", getCompanyJobs);