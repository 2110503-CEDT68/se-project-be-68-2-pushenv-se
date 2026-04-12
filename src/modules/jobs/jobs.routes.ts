import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { getCompanyJobs, getJob, adminGetCompanyJobs, adminCreateCompanyJobs, adminGetCompanyJob, adminCloseJob, adminDeleteJob, adminUpdateJob, adminOpenJob } from "../../controllers/jobs.controller.js";
export const jobsRouter = Router();

jobsRouter.get("/companies/:companyId/jobs", getCompanyJobs);

jobsRouter.get("/jobs/:id", getJob);

jobsRouter.get("/admin/companies/:companyId/jobs", requireAuth, requireRole(["admin"]), adminGetCompanyJobs);

jobsRouter.get("/admin/jobs/:id", requireAuth, requireRole(["admin"]), adminGetCompanyJob);

jobsRouter.post(
  "/admin/companies/:companyId/jobs",
  requireAuth,
  requireRole(["admin"]),
  adminCreateCompanyJobs
);

jobsRouter.put(
  "/admin/jobs/:id",
  requireAuth,
  requireRole(["admin"]),
  adminUpdateJob
);

jobsRouter.patch(
  "/admin/jobs/:id/close",
  requireAuth,
  requireRole(["admin"]),
  adminCloseJob
);

jobsRouter.patch(
  "/admin/jobs/:id/open",
  requireAuth,
  requireRole(["admin"]),
  adminOpenJob
);

jobsRouter.delete(
  "/admin/jobs/:id",
  requireAuth,
  requireRole(["admin"]),
  adminDeleteJob
);
