import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { notImplemented, sendSuccess } from "../../utils/http.js";
import { getAccounts, createAccount, updateAccount, deleteAccount } from "../../controllers/admin.controller.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(["admin"]));

adminRouter.get("/accounts", getAccounts);

adminRouter.post("/accounts", createAccount);

adminRouter.put("/accounts/:id", updateAccount);

adminRouter.delete("/accounts/:id", deleteAccount);

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
