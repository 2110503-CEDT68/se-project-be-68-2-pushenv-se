import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    publishEvent,
    addCompanyToEvent,
    removeCompanyFromEvent,
} from "../../controllers/admin.controller.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(["admin"]));

// ── Accounts ──────────────────────────────────────────────────────────────────
adminRouter.get("/accounts",        getAccounts);       // US1-7 (with ?name & ?role filter)
adminRouter.post("/accounts",       createAccount);     // US1-8
adminRouter.put("/accounts/:id",    updateAccount);     // US1-9 (incl. password reset)
adminRouter.delete("/accounts/:id", deleteAccount);     // US1-10

// ── Events ────────────────────────────────────────────────────────────────────
adminRouter.get("/events",                              getEvents);             // US2-4 (with ?name & ?date filter)
adminRouter.post("/events",                             createEvent);           // US2-6
adminRouter.put("/events/:id",                          updateEvent);           // US2-5 (details)
adminRouter.delete("/events/:id",                       deleteEvent);           // US2-7
adminRouter.patch("/events/:id/publish",                publishEvent);          // US2-8
adminRouter.post("/events/:id/companies",               addCompanyToEvent);     // US2-5 (link company)
adminRouter.delete("/events/:id/companies/:companyId",  removeCompanyFromEvent); // US2-5 (unlink company)