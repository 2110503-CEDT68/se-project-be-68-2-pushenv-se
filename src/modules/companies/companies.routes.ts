import { Router } from "express";
import {
  getCompanies,
  getCompany,
  getJobsInCompany
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
 *         schema:
 *           type: string
 *         description: Search by company name (case-insensitive)
 *         example: tech
 *     responses:
 *       200:
 *         description: List of all company profiles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Companies
 *               data:
 *                 - id: "profile-uuid"
 *                   description: We build great software
 *                   logo: /uploads/logos/uuid.png
 *                   website: https://techcorp.com
 *                   companyUser:
 *                     id: "user-uuid"
 *                     name: Tech Corp
 *                     email: hr@techcorp.com
 *                     avatar: null
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
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CompanyProfile ID
 *     responses:
 *       200:
 *         description: Company profile detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Company
 *               data:
 *                 id: "profile-uuid"
 *                 description: We build great software
 *                 logo: /uploads/logos/uuid.png
 *                 website: https://techcorp.com
 *                 companyUser:
 *                   id: "user-uuid"
 *                   name: Tech Corp
 *                   email: hr@techcorp.com
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
 * /companies/{companyId}/Jobs:
 *   get:
 *     summary: Get open job listings for a company
 *     description: >
 *       Returns only open job listings (isClosed = false). Closed jobs are
 *       never shown in this public endpoint.
 *       Note — the path uses a capital J in /Jobs (matches server routing).
 *     tags: [Companies]
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
 *         description: Open job listings for the company
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Jobs
 *               data:
 *                 - id: "job-uuid"
 *                   title: Frontend Developer
 *                   type: full_time
 *                   location: Bangkok
 *                   description: Build cool UIs
 *                   salary: "50,000 THB"
 *                   isClosed: false
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
companiesRouter.get("/:companyId/Jobs", getJobsInCompany);