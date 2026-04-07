import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { notImplemented, sendSuccess } from "../../utils/http.js";

export const eventsRouter = Router();

eventsRouter.get("/", (_request, response) =>
  sendSuccess(response, "Published events route scaffolded", notImplemented("GET /events"), 501),
);

eventsRouter.get("/:id/companies", (_request, response) =>
  sendSuccess(response, "Event companies route scaffolded", notImplemented("GET /events/:id/companies"), 501),
);

eventsRouter.post("/:id/register", requireAuth, requireRole(["user"]), (_request, response) =>
  sendSuccess(response, "Event registration scaffolded", notImplemented("POST /events/:id/register"), 501),
);
