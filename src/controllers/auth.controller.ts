import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendSuccess, sendError } from "../utils/http.js";
import prisma from "../utils/prisma.js";
import { env } from "../config/env.js";

// POST /auth/register
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return sendError(res, "Missing required fields", 400);
    }

    // Strictly enforce "user" role for public registration
    if (role !== "user") {
      return sendError(res, "Invalid role. Only 'user' accounts can be registered here.", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return sendError(res, "Email already in use", 409);

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role },
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return sendSuccess(res, "Registered successfully", { token }, 201);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// POST /auth/login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return sendError(res, "Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return sendError(res, "Invalid credentials", 401);

    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET
    );
    return sendSuccess(res, "Login successful", { token });
  } catch (err) {
    console.log(err);
    return sendError(res, "Server error", 500);
  }
};