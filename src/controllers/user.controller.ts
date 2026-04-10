import { Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { AuthenticatedRequest } from "./../middlewares/auth.js";
import { storageDirectories, StorageService } from "./../services/storage.service.js";
import prisma from "./../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";

// GET /users/me
export const getMe = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return sendError(res, "Unauthorized", 401);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                avatar: true
            }
        });

        if (!user) return sendError(res, "User not found", 404);

        sendSuccess(res, "User get", user);
    } catch (err) {
        sendError(res, "Server Error", 500);
    }
};

// PUT /users/me
type UpdateUserForm = {
    name?: string;
    phone?: string;
    avatar?: string;
};

export const updateMe = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return sendError(res, "Unauthorized", 401);

        const { name, phone }: { name?: string; phone?: string } = req.body;

        if (name?.trim() === "" || name === undefined) return sendError(res, "Name cannot be empty", 400);
        if (phone?.trim() === "" || phone === undefined) return sendError(res, "Phone cannot be empty", 400);

        let formData: UpdateUserForm = {};

        formData.name = name;
        formData.phone = phone;

        if (req.file) {
            await fs.mkdir(storageDirectories.avatars, { recursive: true });

            const fileName = `${uuidv4()}${path.extname(req.file.originalname)}`;
            const filePath = path.join(storageDirectories.avatars, fileName);

            await fs.writeFile(filePath, req.file.buffer);

            formData.avatar = StorageService.relativeUrl("avatars", fileName);
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: formData,
        });

        sendSuccess(res, "User updated", updated);
    } catch (err) {
        sendError(res, "Server Error", 500);
    }
};

// DELETE /users/me
export const deleteMe = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return sendError(res, "Unauthorized", 401);

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) return sendError(res, "User not found", 404);

        await prisma.user.delete({
            where: { id: userId }
        });

        sendSuccess(res, "User deleted", null);
    } catch (err) {
        sendError(res, "Server Error", 500);
    }
};