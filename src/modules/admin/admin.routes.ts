import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { notImplemented, sendSuccess } from "../../utils/http.js";
import { createAccount } from "../../controllers/admin.controller.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(["admin"]));

adminRouter.get("/accounts", (_request, response) =>
  sendSuccess(response, "Admin accounts route scaffolded", notImplemented("GET /admin/accounts"), 501),
);

adminRouter.post("/accounts", createAccount);

adminRouter.put("/accounts/:id", (_request, response) =>
  sendSuccess(response, "Admin update account scaffolded", notImplemented("PUT /admin/accounts/:id"), 501),
);

adminRouter.delete("/accounts/:id", (_request, response) =>
  sendSuccess(response, "Admin delete account scaffolded", notImplemented("DELETE /admin/accounts/:id"), 501),
);

adminRouter.get("/events", (_request, response) =>
  sendSuccess(response, "Admin events route scaffolded", notImplemented("GET /admin/events"), 501),
);

adminRouter.post("/events", (_request, response) =>
  sendSuccess(response, "Admin create event scaffolded", notImplemented("POST /admin/events"), 501),
);

adminRouter.put("/events/:id", (_request, response) =>
  sendSuccess(response, "Admin update event scaffolded", notImplemented("PUT /admin/events/:id"), 501),
);

adminRouter.delete("/events/:id", (_request, response) =>
  sendSuccess(response, "Admin delete event scaffolded", notImplemented("DELETE /admin/events/:id"), 501),
);

adminRouter.patch("/events/:id/publish", (_request, response) =>
  sendSuccess(
    response,
    "Admin publish event scaffolded",
    notImplemented("PATCH /admin/events/:id/publish"),
    501,
  ),
);
