import { Response } from "express";
import { AuthRequest } from "../types/auth.js";
import { sendSuccess, sendError } from "./../utils/http.js";
import prisma from "./../utils/prisma.js";

export const getMe = async (req: AuthRequest, res: Response) => {
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

        sendSuccess(res, "success", user);
    } catch (err) {
        sendError(res, "Internal Server Error", 500);
    }
};