import type { Request, Response } from "express";
import type { Prisma } from "@prisma/client";
import type { AuthenticatedRequest } from "../middlewares/auth.js";
import prisma from "../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";

// ── Shared ────────────────────────────────────────────────────────────────────

const companySelect = {
  company: {
    select: {
      id: true,
      description: true,
      logo: true,
      website: true,
      companyUser: { select: { name: true, email: true } },
    },
  },
} as const;

// Helper: load a published event by id, or send the appropriate error.
async function getPublishedEvent(eventId: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || !event.isPublished) {
    return null;
  }
  return event;
}

// ── Public ────────────────────────────────────────────────────────────────────

// GET /events
export const getPublishedEvents = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query["limit"] as string) || 20),
    );
    const search = (req.query["search"] as string | undefined)?.slice(0, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = { isPublished: true };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { startDate: "asc" },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return sendSuccess(res, "Published events", { events, total, page, limit });
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// GET /events/:id
export const getEventById = async (req: Request, res: Response) => {
  try {
    const id = req.params["id"] as string;

    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true, companies: true } } },
    });

    if (!event || !event.isPublished)
      return sendError(res, "Event not found", 404);
    return sendSuccess(res, "Event details", event);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// GET /events/:id/companies
export const getEventCompanies = async (req: Request, res: Response) => {
  try {
    const id = req.params["id"] as string;

    const event = await prisma.event.findUnique({
      where: { id },
      include: { companies: { select: companySelect } },
    });

    if (!event || !event.isPublished) return sendError(res, "Event not found", 404);
    
    return sendSuccess(res, "Event companies", event.companies);
  } catch (err) {
    console.error(err);
    return sendError(res, "Server error", 500);
  }
};

// GET /events/:id/registration-status  — requireAuth + jobSeeker
export const getMyEventRegistrationStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const eventId = req.params["id"] as string;
    const jobSeekerId = req.user!.id;

    const event = await getPublishedEvent(eventId);
    if (!event) return sendError(res, "Event not found", 404);

    const registration = await prisma.eventRegistration.findUnique({
      where: { eventId_jobSeekerId: { eventId, jobSeekerId } },
      select: { id: true },
    });

    return sendSuccess(res, "Event registration status", {
      registered: Boolean(registration),
    });
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// POST /events/:id/register  — requireAuth + jobSeeker
export const registerForEvent = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const eventId = req.params["id"] as string;
    const jobSeekerId = req.user!.id;

    // requirePublishedEvent replaces the duplicate findUnique + 404/403 checks
    const event = await getPublishedEvent(eventId);
    if (!event) return sendError(res, "Event not found", 404);

    const registration = await prisma.eventRegistration.create({
      data: { eventId, jobSeekerId },
    });
    return sendSuccess(res, "Registered for event", registration, 201);
  } catch (err: any) {
    if (err?.code === "P2002") {
      return sendError(res, "Already registered for this event", 409);
    }
    return sendError(res, "Server error", 500);
  }
};
