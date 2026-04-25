import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.js";
import prisma from "../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";
import { deleteStoredUpload, saveAvatarFile } from "../utils/uploads.js";

// ── Shared ────────────────────────────────────────────────────────────────────

// jobSeeker profile select — does not include 'role' (role-locked route, role is known)
const userProfileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar: true,
} as const;

// ── Profile ───────────────────────────────────────────────────────────────────

// GET /users/me
export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: userProfileSelect,
    });
    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, "User profile", user);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// PUT /users/me
export const updateMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, phone }: { name?: string; phone?: string } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string") return sendError(res, "Invalid name format", 400);
      if (name.trim() === "") return sendError(res, "Name cannot be empty", 400);
    }

    if (phone !== undefined) {
      if (typeof phone !== "string") return sendError(res, "Invalid phone format", 400);
      if (phone.trim() === "") return sendError(res, "Phone cannot be empty", 400);
    }

    const data: { name?: string; phone?: string; avatar?: string } = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;

    if (req.file) {
      const existing = await prisma.user.findUnique({ 
        where: { id: req.user!.id }, 
        select: { avatar: true } 
      });

      if (existing?.avatar) {
        try {
          await deleteStoredUpload(existing.avatar);
        } catch (error) {
          const fileError = error as NodeJS.ErrnoException;
          if (fileError.code !== "ENOENT") {
            console.error("Failed to delete old avatar:", error);
          }
        }
      }

      data.avatar = await saveAvatarFile(req.file);
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: userProfileSelect,
    });
    return sendSuccess(res, "User updated", updated);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// DELETE /users/me
export const deleteMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const existing = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });
    if (!existing) return sendError(res, "User not found", 404);
    await prisma.user.delete({ where: { id: req.user!.id } });
    return sendSuccess(res, "User deleted", null);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// ── Registrations ─────────────────────────────────────────────────────────────

// GET /users/registrations
export const getRegistrations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const page = Math.max(1, parseInt(req.query["page"] as string) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query["limit"] as string) || 10),
    );
    const skip = (page - 1) * limit;

    const where = { jobSeekerId: req.user!.id };

    const [registrations, total] = await Promise.all([
      prisma.eventRegistration.findMany({
        where,
        include: {
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              location: true,
              startDate: true,
              endDate: true,
              banner: true,
              isPublished: true,
            },
          },
        },
        orderBy: { registeredAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.eventRegistration.count({ where }),
    ]);

    return sendSuccess(res, "User registrations", {
      data: registrations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// DELETE /users/me/registrations/:eventId
export const deleteRegistration = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const eventId = req.params["eventId"] as string;
    const jobSeekerId = req.user!.id;

    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_jobSeekerId: { eventId, jobSeekerId } },
      select: { id: true },
    });

    if (!existing) return sendError(res, "Registration not found", 404);

    await prisma.eventRegistration.delete({ where: { id: existing.id } });
    return sendSuccess(res, "Registration deleted", null);
  } catch {
    return sendError(res, "Server error", 500);
  }
};
