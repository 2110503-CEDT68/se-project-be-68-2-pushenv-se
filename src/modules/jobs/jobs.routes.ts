import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { notImplemented, sendSuccess } from "../../utils/http.js";

export const jobsRouter = Router();

jobsRouter.get("/companies/:companyId/jobs", (_request, response) =>
  sendSuccess(
    response,
    "Public company jobs route scaffolded",
    notImplemented("GET /companies/:companyId/jobs"),
    501,
  ),
);

jobsRouter.get("/jobs/:id", (_request, response) =>
  sendSuccess(response, "Public job detail route scaffolded", notImplemented("GET /jobs/:id"), 501),
);

jobsRouter.get("/admin/companies/:companyId/jobs", requireAuth, requireRole(["admin"]), (_request, response) =>
  sendSuccess(
    response,
    "Admin company jobs route scaffolded",
    notImplemented("GET /admin/companies/:companyId/jobs"),
    501,
  ),
);

jobsRouter.get("/admin/jobs/:id", requireAuth, requireRole(["admin"]), (_request, response) =>
  sendSuccess(response, "Admin job detail scaffolded", notImplemented("GET /admin/jobs/:id"), 501),
);

jobsRouter.post(
  "/admin/companies/:companyId/jobs",
  requireAuth,
  requireRole(["admin"]),
  (_request, response) =>
    sendSuccess(
      response,
      "Admin create job scaffolded",
      notImplemented("POST /admin/companies/:companyId/jobs"),
      501,
    ),
);

jobsRouter.put("/admin/jobs/:id", requireAuth, requireRole(["admin"]), (_request, response) =>
  sendSuccess(response, "Admin update job scaffolded", notImplemented("PUT /admin/jobs/:id"), 501),
);

jobsRouter.patch("/admin/jobs/:id/close", requireAuth, requireRole(["admin"]), (_request, response) =>
  sendSuccess(response, "Admin close job scaffolded", notImplemented("PATCH /admin/jobs/:id/close"), 501),
);

jobsRouter.delete("/admin/jobs/:id", requireAuth, requireRole(["admin"]), (_request, response) =>
  sendSuccess(response, "Admin delete job scaffolded", notImplemented("DELETE /admin/jobs/:id"), 501),
);
