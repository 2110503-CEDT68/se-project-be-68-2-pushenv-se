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

// Apply auth to ALL routes in this router once — no need to repeat per route
companyRouter.use(requireAuth, requireRole(["companyUser"]));

companyRouter.get("/profile",          getProfile);
companyRouter.put("/profile",          updateProfile);
companyRouter.get("/events",           getCompanyEvents);
companyRouter.post("/jobs",            createJob);
companyRouter.put("/jobs/:id",         updateJob);
companyRouter.patch("/jobs/:id/close", closeJob);
companyRouter.patch("/jobs/:id/open", openJob);
companyRouter.delete("/jobs/:id",      deleteJob);