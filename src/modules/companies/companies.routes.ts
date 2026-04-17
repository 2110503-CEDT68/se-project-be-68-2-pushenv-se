import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import {
  getCompanies,
  getCompany,
  getJobsInCompany
} from "../../controllers/companies.controller.js";

export const companiesRouter = Router();

companiesRouter.get("/", getCompanies);
companiesRouter.get("/:companyId", getCompany);
companiesRouter.get("/:companyId/jobs", getJobsInCompany);
