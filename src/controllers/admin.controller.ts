import { Response } from "express";
import { AuthenticatedRequest } from "./../middlewares/auth.js";
import bcrypt from "bcrypt";
import prisma from "./../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";

// POST /admin/accounts
export const createAccount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) return sendError(res, "Unauthorized", 401);
        const { name, email, password, role } = req.body;
        const CREATABLE_ROLES = ["company", "user"] as const;

        if (!CREATABLE_ROLES.includes(role)) {return sendError(res, "Invalid role", 400);}
        if (!name || !email || !password || !role) {return sendError(res, "Missing required fields", 400);}

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