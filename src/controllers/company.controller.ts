import type { Response } from "express";
import { sendSuccess, sendError } from "../utils/http.js";
import prisma from "../utils/prisma.js";
import type { AuthenticatedRequest } from "../middlewares/auth.js";

//Helper: get company profile from logged-in user
async function getCompanyProfile(userId: string) {
    return prisma.companyProfile.findUnique({ where: { userId } });
}

// Get /company/profile
export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profile = await getCompanyProfile(req.user!.id);
        if (!profile) return sendError(res, "Profile not found", 404);
        return sendSuccess(res, "Company profile", profile)
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// PUT /company/profile
export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { description, logo, website } = req.body;
        const updated = await prisma.companyProfile.update({
            where: { userId: req.user!.id },
            data: { description, logo, website },
        });
        return sendSuccess(res, "Profile updated", updated);
    } catch {
        return sendError(res, "Server error", 500);
    }
};