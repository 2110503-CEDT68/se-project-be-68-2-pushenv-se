import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.js";
import { sendSuccess, sendError } from "../utils/http.js";
import prisma from "../utils/prisma.js";

// GET /events?page=1&limit=20  — public, no auth required
export const getPublishedEvents = async (req: Request, res: Response) => {
    try {
        const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query["limit"] as string) || 20));
        const skip = (page - 1) * limit;

        const [events, total] = await Promise.all([
            prisma.event.findMany({
                where: { isPublished: true },
                orderBy: { startDate: "asc" },
                skip,
                take: limit,
            }),
            prisma.event.count({ where: { isPublished: true } }),
        ]);

        return sendSuccess(res, "Published events", { events, total, page, limit });
    } catch {
        return sendError(res, "Server error", 500);
    }
}

// GET /events/:id/companies  — public, no auth required
export const getEventCompanies = async (req: Request, res: Response) => {
    try {
        const id = req.params["id"] as string;  // ← cast here

        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                companies: {
                    select: {
                        company: {
                            select: {
                                id: true,
                                description: true,
                                logo: true,
                                website: true,
                                user: { select: { name: true, email: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!event) return sendError(res, "Event not found", 404);
        return sendSuccess(res, "Event companies", event.companies);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// POST /events/:id/register  — requireAuth + role "user"
export const registerForEvent = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const eventId = req.params["id"] as string;  // ← cast here
        const userId = req.user!.id;

        const event = await prisma.event.findUnique({ where: { id: eventId } });
        if (!event) return sendError(res, "Event not found", 404);
        if (!event.isPublished) return sendError(res, "Event not available", 403);

        const registration = await prisma.eventRegistration.create({
            data: { eventId, userId },
        });
        return sendSuccess(res, "Registered for event", registration, 201);
    } catch (err: any) {
        if (err?.code === "P2002") {
            return sendError(res, "Already registered for this event", 409);
        }
        return sendError(res, "Server error", 500);
    }
};