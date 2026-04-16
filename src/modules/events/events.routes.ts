import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import {
  getPublishedEvents,
  getEventCompanies,
  getMyEventRegistrationStatus,
  registerForEvent,
} from "../../controllers/events.controller.js";


export const eventsRouter = Router();

// Public routes — no auth needed
eventsRouter.get("/", getPublishedEvents);
eventsRouter.get("/:id/companies", getEventCompanies);
eventsRouter.get(
  "/:id/registration-status",
  requireAuth,
  requireRole(["jobSeeker"]),
  getMyEventRegistrationStatus,
);

// Protected — must be logged in as a "user" role
eventsRouter.post(
  "/:id/register",
  requireAuth,
  requireRole(["jobSeeker"]),
  registerForEvent,
);
