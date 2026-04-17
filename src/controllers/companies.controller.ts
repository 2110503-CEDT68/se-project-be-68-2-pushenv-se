import type { Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";

// GET /companies
export const getCompanies = async (req: Request, res: Response) => {
    try {
        const q = req.query.q as string | undefined;

        const where: any = {};

        if (q) {
            where.companyUser = {
                name: {
                    contains: q,
                    mode: "insensitive",
                },
            };
        }

        const companies = await prisma.companyProfile.findMany({
            where,
            include: {
                companyUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });

        sendSuccess(res, "Companies", companies);
    } catch {
        sendError(res, "Server error", 500);
    }
};

// GET /companies/:companyId
export const getCompany = async (req: Request, res: Response) => {
    try {
        const companyId = req.params["companyId"] as string;

        const company = await prisma.companyProfile.findUnique({
            where: { id: companyId },
            include: {
                companyUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });

        if (!company) return sendError(res, "Company not found", 404);

        sendSuccess(res, "Company", company);
    } catch {
        sendError(res, "Server error", 500);
    }
}

// GET /companies/:companyId/Jobs
export const getJobsInCompany = async (req: Request, res: Response) => {
    try {
        const companyId = req.params["companyId"] as string;

        const companyExists = await prisma.companyProfile.findUnique({
            where: { id: companyId }
        });

        if (!companyExists) return sendError(res, "Company not found", 404);

        const jobs = await prisma.jobListing.findMany({
            where: {
                companyId: companyId,
                isClosed: false
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        sendSuccess(res, "Jobs", jobs);
    } catch (error) {
        sendError(res, "Server error", 500);
    }
}