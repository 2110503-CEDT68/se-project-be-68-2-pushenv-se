import { Response } from "express";
import { AuthenticatedRequest } from "./../middlewares/auth.js";
import bcrypt from "bcrypt";
import prisma from "./../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";

// ── Accounts ──────────────────────────────────────────────────────────────────

// GET /admin/accounts?name=john&role=company
// US1-7: list all accounts, filterable by name or role
export const getAccounts = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const name = req.query["name"] as string | undefined;
        const role = req.query["role"] as string | undefined;

        const users = await prisma.user.findMany({
            where: {
                ...(role ? { role: role as any } : {}),
                ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                avatar: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
        return sendSuccess(res, "All accounts", users);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// POST /admin/accounts
// US1-8: admin creates a new account
export const createAccount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) return sendError(res, "Unauthorized", 401);
        const { name, email, password, role } = req.body;
        const CREATABLE_ROLES = ["company", "user"] as const;

        if (!name || !email || !password || !role) {
            return sendError(res, "Missing required fields", 400);
        }
        if (!CREATABLE_ROLES.includes(role)) {
            return sendError(res, "Invalid role", 400);
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return sendError(res, "Email already in use", 409);

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, passwordHash, role },
        });

        let id = user.id;

        if (role === "company") {
            const profile = await prisma.companyProfile.create({ data: { userId: user.id } });
            id = profile.id
        }

        return sendSuccess(res, "Account created", { id, name, email, role }, 201);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// PUT /admin/accounts/:id
// US1-9: admin edits any account details and can reset password
export const updateAccount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params["id"] as string;
        const { name, email, phone, password } = req.body;

        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) return sendError(res, "Account not found", 404);

        // Check new email is not already taken by another user
        if (email && email !== existing.email) {
            const emailTaken = await prisma.user.findUnique({ where: { email } });
            if (emailTaken) return sendError(res, "Email already in use", 409);
        }

        // Build update data conditionally — never pass undefined
        const data: {
            name?: string;
            email?: string;
            phone?: string;
            passwordHash?: string;
        } = {};

        if (name !== undefined) data.name = name;
        if (email !== undefined) data.email = email;
        if (phone !== undefined) data.phone = phone;

        // US1-9 AC2: password reset — hash and save new password
        if (password !== undefined) {
            data.passwordHash = await bcrypt.hash(password, 10);
        }

        const updated = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                avatar: true,
                createdAt: true,
            },
        });
        return sendSuccess(res, "Account updated", updated);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// DELETE /admin/accounts/:id
// US1-10: admin deletes any account
export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params["id"] as string;

        // Prevent admin from deleting their own account
        if (id === req.user!.id) {
            return sendError(res, "Cannot delete your own account", 400);
        }

        const existing = await prisma.user.findUnique({ where: { id } });
        if (!existing) return sendError(res, "Account not found", 404);

        await prisma.user.delete({ where: { id } });
        return sendSuccess(res, "Account deleted", null);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// ── Events ────────────────────────────────────────────────────────────────────

// GET /admin/events?name=fair&date=2025-11-01
// US2-4: admin sees ALL events, filterable by name or date
export const getEvents = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const name = req.query["name"] as string | undefined;
        const date = req.query["date"] as string | undefined;

        const events = await prisma.event.findMany({
            where: {
                ...(name ? { name: { contains: name, mode: "insensitive" } } : {}),
                ...(date ? { startDate: { equals: new Date(date) } } : {}),
            },
            orderBy: { startDate: "asc" },
            include: {
                _count: {
                    select: { registrations: true, companies: true },
                },
            },
        });
        return sendSuccess(res, "All events", events);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// POST /admin/events
// US2-6: admin creates a new event
export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { name, description, location, startDate, endDate, banner } = req.body;

        if (!name || !description || !location || !startDate || !endDate) {
            return sendError(res, "Missing required fields", 400);
        }

        const event = await prisma.event.create({
            data: {
                name,
                description,
                location,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                banner,
                createdBy: req.user!.id,
            },
        });
        return sendSuccess(res, "Event created", event, 201);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// PUT /admin/events/:id
// US2-5: admin updates event details
export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params["id"] as string;
        const { name, description, location, startDate, endDate, banner } = req.body;

        const existing = await prisma.event.findUnique({ where: { id } });
        if (!existing) return sendError(res, "Event not found", 404);

        const data: {
            name?: string;
            description?: string;
            location?: string;
            startDate?: Date;
            endDate?: Date;
            banner?: string;
        } = {};

        if (name !== undefined) data.name = name;
        if (description !== undefined) data.description = description;
        if (location !== undefined) data.location = location;
        if (startDate !== undefined) data.startDate = new Date(startDate);
        if (endDate !== undefined) data.endDate = new Date(endDate);
        if (banner !== undefined) data.banner = banner;

        const updated = await prisma.event.update({ where: { id }, data });
        return sendSuccess(res, "Event updated", updated);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// DELETE /admin/events/:id
// US2-7: admin deletes an event
export const deleteEvent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params["id"] as string;

        const existing = await prisma.event.findUnique({ where: { id } });
        if (!existing) return sendError(res, "Event not found", 404);

        await prisma.event.delete({ where: { id } });
        return sendSuccess(res, "Event deleted", null);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// PATCH /admin/events/:id/publish
// US2-8: admin toggles publish/unpublish
export const publishEvent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params["id"] as string;

        const existing = await prisma.event.findUnique({ where: { id } });
        if (!existing) return sendError(res, "Event not found", 404);

        const updated = await prisma.event.update({
            where: { id },
            data: { isPublished: !existing.isPublished },
        });

        const message = updated.isPublished ? "Event published" : "Event unpublished";
        return sendSuccess(res, message, updated);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// POST /admin/events/:id/companies
// US2-5 AC: link a company to an event
export const addCompanyToEvent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const eventId = req.params["id"] as string;
        const { companyId } = req.body;

        if (!companyId) return sendError(res, "companyId is required", 400);

        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) return sendError(res, "Event not found", 404);

        const company = await prisma.companyProfile.findFirst({ where: { id: companyId } });
        if (!company) return sendError(res, "Company not found", 404);

        // P2002 = already linked
        const link = await prisma.eventCompany.create({
            data: { eventId, companyId },
        });
        return sendSuccess(res, "Company added to event", link, 201);
    } catch (err: any) {
        if (err?.code === "P2002") {
            return sendError(res, "Company is already linked to this event", 409);
        }
        console.log(err);
        return sendError(res, "Server error", 500);
    }
};

// DELETE /admin/events/:id/companies/:companyId
// US2-5: remove a company from an event
export const removeCompanyFromEvent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const eventId = req.params["id"] as string;
        const companyId = req.params["companyId"] as string;

        const link = await prisma.eventCompany.findUnique({
            where: { eventId_companyId: { eventId, companyId } },
        });
        if (!link) return sendError(res, "Company is not linked to this event", 404);

        await prisma.eventCompany.delete({
            where: { eventId_companyId: { eventId, companyId } },
        });
        return sendSuccess(res, "Company removed from event", null);
    } catch {
        return sendError(res, "Server error", 500);
    }
};