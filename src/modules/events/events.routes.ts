import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import {
  getPublishedEvents,
  getEventCompanies,
  registerForEvent,
} from "../../controllers/events.controller.js";


export const eventsRouter = Router();

// Public routes — no auth needed
eventsRouter.get("/", getPublishedEvents);
eventsRouter.get("/:id/companies", getEventCompanies);

// Protected — must be logged in as a "user" role
eventsRouter.post(
  "/:id/register",
  requireAuth,
  requireRole(["user"]),
  registerForEvent,
);
