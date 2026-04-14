import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { getCompanyJobs, getJob, adminGetCompanyJobs, adminCreateCompanyJob, adminGetCompanyJob, adminCloseJob, adminDeleteJob, adminUpdateJob, adminOpenJob } from "../../controllers/jobs.controller.js";
export const jobsRouter = Router();

jobsRouter.get("/companies/:companyId/jobs", getCompanyJobs);

jobsRouter.get("/jobs/:id", getJob);

jobsRouter.get("/admin/companies/:companyId/jobs", requireAuth, requireRole(["systemAdmin"]), adminGetCompanyJobs);

jobsRouter.get("/admin/jobs/:id", requireAuth, requireRole(["systemAdmin"]), adminGetCompanyJob);

jobsRouter.post(
  "/admin/companies/:companyId/jobs",
  requireAuth,
  requireRole(["systemAdmin"]),
  adminCreateCompanyJob
);

jobsRouter.put(
  "/admin/jobs/:id",
  requireAuth,
  requireRole(["systemAdmin"]),
  adminUpdateJob
);

jobsRouter.patch(
  "/admin/jobs/:id/close",
  requireAuth,
  requireRole(["systemAdmin"]),
  adminCloseJob
);

jobsRouter.patch(
  "/admin/jobs/:id/open",
  requireAuth,
  requireRole(["systemAdmin"]),
  adminOpenJob
);

jobsRouter.delete(
  "/admin/jobs/:id",
  requireAuth,
  requireRole(["systemAdmin"]),
  adminDeleteJob
);
