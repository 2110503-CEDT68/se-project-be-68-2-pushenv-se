import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.js";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";

// ── Shared ────────────────────────────────────────────────────────────────────

// Reused select shape — never expose passwordHash
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatar: true,
  createdAt: true,
} as const;

// ── Accounts ──────────────────────────────────────────────────────────────────

// GET /admin/accounts?name=john&role=company&page=1&limit=10
export const getAccounts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const name = req.query["name"] as string | undefined;
    const role = req.query["role"] as string | undefined;
    const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query["limit"] as string) || 10));
    const skip = (page - 1) * limit;

    const where = {
      ...(role ? { role: role as any } : {}),
      ...(name ? { name: { contains: name, mode: "insensitive" as const } } : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: safeUserSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return sendSuccess(res, "All accounts", {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// POST /admin/accounts
export const createAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const CREATABLE_ROLES = ["companyUser", "jobSeeker"] as const;

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

    if (role === "companyUser") {
      await prisma.companyProfile.create({ data: { companyUserId: user.id } });
    }

    return sendSuccess(res, "Account created", { id: user.id, name, email, role }, 201);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// PUT /admin/accounts/:id
export const updateAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const { name, email, phone, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return sendError(res, "Account not found", 404);

    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) return sendError(res, "Email already in use", 409);
    }

    const data: {
      name?: string;
      email?: string;
      phone?: string;
      passwordHash?: string;
    } = {};

    if (name !== undefined)     data.name  = name;
    if (email !== undefined)    data.email = email;
    if (phone !== undefined)    data.phone = phone;
    if (password !== undefined) data.passwordHash = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: safeUserSelect,
    });
    return sendSuccess(res, "Account updated", updated);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// DELETE /admin/accounts/:id
export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;

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

// Shared helper — find event or return null
async function findEvent(id: string) {
  return prisma.event.findUnique({ where: { id } });
}

// GET /admin/events?name=fair&date=2025-11-01
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
        _count: { select: { registrations: true, companies: true } },
      },
    });
    return sendSuccess(res, "All events", events);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// POST /admin/events
export const createEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, location, startDate, endDate, banner } = req.body;

    if (!name || !description || !location || !startDate || !endDate) {
      return sendError(res, "Missing required fields", 400);
    }

    const event = await prisma.event.create({
      data: {
        name, description, location, banner,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        createdBy: req.user!.id,
      },
    });
    return sendSuccess(res, "Event created", event, 201);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// PUT /admin/events/:id
export const updateEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const { name, description, location, startDate, endDate, banner } = req.body;

    const existing = await findEvent(id);
    if (!existing) return sendError(res, "Event not found", 404);

    const data: {
      name?: string; description?: string; location?: string;
      startDate?: Date; endDate?: Date; banner?: string;
    } = {};

    if (name !== undefined)        data.name        = name;
    if (description !== undefined) data.description = description;
    if (location !== undefined)    data.location    = location;
    if (startDate !== undefined)   data.startDate   = new Date(startDate);
    if (endDate !== undefined)     data.endDate     = new Date(endDate);
    if (banner !== undefined)      data.banner      = banner;

    const updated = await prisma.event.update({ where: { id }, data });
    return sendSuccess(res, "Event updated", updated);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// DELETE /admin/events/:id
export const deleteEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const existing = await findEvent(id);
    if (!existing) return sendError(res, "Event not found", 404);
    await prisma.event.delete({ where: { id } });
    return sendSuccess(res, "Event deleted", null);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// PATCH /admin/events/:id/publish  — toggles between published and unpublished
export const publishEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const existing = await findEvent(id);
    if (!existing) return sendError(res, "Event not found", 404);

    const updated = await prisma.event.update({
      where: { id },
      data: { isPublished: !existing.isPublished },
    });
    return sendSuccess(
      res,
      updated.isPublished ? "Event published" : "Event unpublished",
      updated,
    );
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// POST /admin/events/:id/companies
export const addCompanyToEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const eventId = req.params["id"] as string;
    const { companyId } = req.body;

    if (!companyId) return sendError(res, "companyId is required", 400);

    const event = await findEvent(eventId);
    if (!event) return sendError(res, "Event not found", 404);

    const company = await prisma.companyProfile.findUnique({ where: { id: companyId } });
    if (!company) return sendError(res, "Company not found", 404);

    const link = await prisma.eventCompany.create({ data: { eventId, companyId } });
    return sendSuccess(res, "Company added to event", link, 201);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return sendError(res, "Company is already linked to this event", 409);
    }
    return sendError(res, "Server error", 500);
  }
};

// DELETE /admin/events/:id/companies/:companyId
export const removeCompanyFromEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const eventId   = req.params["id"] as string;
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