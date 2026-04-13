import { Response } from "express";
import { AuthenticatedRequest } from "./../middlewares/auth.js";
import bcrypt from "bcrypt";
import prisma from "./../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";
import { Role, Prisma } from "@prisma/client";

const accountSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    avatar: true,
};

// GET /admin/accounts
export const getAccounts = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { page = "1", limit = "10", search, role } = req.query;

        const pageNumber = parseInt(page as string, 10) || 1;
        const pageSize = parseInt(limit as string, 10) || 10;
        const skip = (pageNumber - 1) * pageSize;

        const whereClause: Prisma.UserWhereInput = {};

        if (search && typeof search === "string" && search.trim() !== "") {
            whereClause.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
            ];
        }

        if (role && typeof role === "string" && role.trim() !== "") whereClause.role = role as Role;
        
        const [accounts, totalCount] = await Promise.all([
            prisma.user.findMany({
                where: whereClause,
                skip: skip,
                take: pageSize,
                select: accountSelect,
                orderBy: { createdAt: "desc" },
            }),
            prisma.user.count({
                where: whereClause,
            })
        ]);

        const totalPages = Math.ceil(totalCount / pageSize);

        sendSuccess(res, "Data Accounts", {
            data: accounts,
            pagination: {
                total: totalCount,
                page: pageNumber,
                limit: pageSize,
                totalPages: totalPages,
            }
        });
    } catch (err) {
        sendError(res, "Server Error", 500);
    }
};

// POST /admin/accounts
export const createAccount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user?.id) return sendError(res, "Unauthorized", 401);
        const { name, email, password, role } = req.body;
        const CREATABLE_ROLES = ["company", "user"] as const;

        if (!CREATABLE_ROLES.includes(role)) { return sendError(res, "Invalid role", 400); }
        if (!name || !email || !password || !role) { return sendError(res, "Missing required fields", 400); }

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

// PUT /admin/accounts/:id
type UpdateAccountForm = {
    name?: string;
    email?: string;
    role?: Role;
    passwordHash?: string;
}

export const updateAccount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = req.params?.id as string;

        const { name, email, role, password } = req.body;

        if (name !== undefined && name.trim() === "") return sendError(res, "Name cannot be empty", 400);
        if (email !== undefined && email.trim() === "") return sendError(res, "Email cannot be empty", 400);
        if (role !== undefined && role.trim() === "") return sendError(res, "Role cannot be empty", 400);

        const account = await prisma.user.findUnique({
            where: { id: accountId }
        });

        if (!account) return sendError(res, "Account not found", 404);

        const formData: UpdateAccountForm = {};

        if (name) formData.name = name;
        if (email) formData.email = email;
        if (role) formData.role = role;

        if (password && password.trim() !== "") formData.passwordHash = await bcrypt.hash(password, 10);

        const updated = await prisma.user.update({
            where: { id: accountId },
            data: formData,
            select: accountSelect
        });

        sendSuccess(res, "Account updated successfully", updated);
    } catch (err) {
        sendError(res, "Server Error", 500);
    }
};

// DELETE /admin/accounts/:id
export const deleteAccount = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const accountId = req.params?.id as string;

        const account = await prisma.user.findUnique({
            where: { id: accountId }
        });

        if (!account) return sendError(res, "Account not found", 404);

        await prisma.user.delete({
            where: { id: accountId }
        });

        sendSuccess(res, "Account deleted", null);
    } catch (err) {
        sendError(res, "Server Error", 500);
    }
};
