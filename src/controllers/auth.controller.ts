import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../middlewares/auth.js";
import prisma from "../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";
import { deleteStoredUpload, saveAvatarFile } from "../utils/uploads.js";
import { env } from "../config/env.js";

// ── Shared ────────────────────────────────────────────────────────────────────

const selfSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  avatar: true,
} as const;

// ── Auth ──────────────────────────────────────────────────────────────────────

// POST /auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return sendError(res, "Missing required fields", 400);
    }
    if (role !== "jobSeeker") {
      return sendError(res, "Invalid role", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return sendError(res, "Email already in use", 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role },
    });

    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("job-fair-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return sendSuccess(res, "Registered successfully", { user: { id: user.id, role: user.role } }, 201);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, "Missing required fields", 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return sendError(res, "Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return sendError(res, "Invalid credentials", 401);

    const token = jwt.sign({ id: user.id, role: user.role }, env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("job-fair-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return sendSuccess(res, "Login successful", { user: { id: user.id, role: user.role } });
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// GET /auth/me
export const getAuthProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: selfSelect,
    });
    if (!user) return sendError(res, "User not found", 404);
    return sendSuccess(res, "Profile", user);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// PUT /auth/me  — name, phone, avatar (multipart/form-data)
export const updateAuthProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { name, phone }: { name?: string; phone?: string } = req.body;

    if (name !== undefined && name.trim() === "")
      return sendError(res, "Name cannot be empty", 400);
    if (phone !== undefined && phone.trim() === "")
      return sendError(res, "Phone cannot be empty", 400);

    const data: { name?: string; phone?: string; avatar?: string } = {};
    if (name !== undefined) data.name = name;
    if (phone !== undefined) data.phone = phone;

    if (req.file) {
      const existing = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { avatar: true },
      });

      if (existing?.avatar) {
        try {
          await deleteStoredUpload(existing.avatar);
        } catch (error) {
          // Keep profile updates working even if an old file is already missing.
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
      select: selfSelect,
    });
    return sendSuccess(res, "Profile updated", updated);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// POST /auth/change-password
export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return sendError(res, "Missing fields", 400);
    if (newPassword.length < 6)
      return sendError(res, "New password must be at least 6 characters", 400);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return sendError(res, "User not found", 404);

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return sendError(res, "Current password is incorrect", 401);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash },
    });
    return sendSuccess(res, "Password changed", null);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// POST /auth/logout
export const logout = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    res.clearCookie("job-fair-token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return sendSuccess(res, "Logout successful", null);
  } catch {
    return sendError(res, "Server error", 500);
  }
};
