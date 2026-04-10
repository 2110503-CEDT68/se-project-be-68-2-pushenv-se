import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { notImplemented, sendSuccess } from "../../utils/http.js";
import { getProfile, updateProfile } from "../../controllers/company.controller.js";

export const companyRouter = Router();

companyRouter.use(requireAuth, requireRole(["company"]));

companyRouter.get("/profile", requireAuth, getProfile);

companyRouter.put("/profile", requireAuth, updateProfile);

companyRouter.get("/events", (_request, response) =>
  sendSuccess(response, "Company events route scaffolded", notImplemented("GET /company/events"), 501),
);

companyRouter.post("/jobs", (_request, response) =>
  sendSuccess(response, "Create company job scaffolded", notImplemented("POST /company/jobs"), 501),
);

companyRouter.put("/jobs/:id", (_request, response) =>
  sendSuccess(response, "Update company job scaffolded", notImplemented("PUT /company/jobs/:id"), 501),
);

companyRouter.patch("/jobs/:id/close", (_request, response) =>
  sendSuccess(response, "Close company job scaffolded", notImplemented("PATCH /company/jobs/:id/close"), 501),
);

companyRouter.delete("/jobs/:id", (_request, response) =>
  sendSuccess(response, "Delete company job scaffolded", notImplemented("DELETE /company/jobs/:id"), 501),
);
