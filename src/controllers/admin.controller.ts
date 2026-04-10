import { Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedRequest } from "./../middlewares/auth.js";
import { storageDirectories, StorageService } from "./../services/storage.service.js";
import bcrypt from "bcrypt";
import prisma from "./../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";

// POST /admin/accounts
export const createAccount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return sendError(res, "Unauthorized", 401);

        const { name, email, password, role } = req.body;

        if (!name || !email || !password || !role) {
            return sendError(res, "Missing required fields", 400);
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return sendError(res, "Email already in use", 409);

        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { name, email, passwordHash, role },
        });

        if (role === "company") {
            await prisma.companyProfile.create({ data: { userId: user.id } });
        }

        return sendSuccess(res, "Created User profile", { name, email, role });
    } catch (err) {
        sendError(res, "Server Error", 500);
    }
};