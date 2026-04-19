import type { Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";

// GET /companies
export const getCompanies = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string | undefined;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
    const sort = req.query.sort as string | undefined;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (q) {
      where.companyUser = {
        name: {
          contains: q,
          mode: "insensitive",
        },
      };
    }

    let orderBy: any = { updatedAt: "desc" };
    if (sort === "oldest") orderBy = { updatedAt: "asc" };
    else if (sort === "a-z") orderBy = { companyUser: { name: "asc" } };
    else if (sort === "z-a") orderBy = { companyUser: { name: "desc" } };

    const [companies, total] = await Promise.all([
      prisma.companyProfile.findMany({
        where,
        include: {
          companyUser: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              phone: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.companyProfile.count({ where }),
    ]);

    return sendSuccess(res, "Companies", {
      data: companies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return sendError(res, "Server error", 500);
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
            phone: true,
          },
        },
        eventLinks: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!company) return sendError(res, "Company not found", 404);

    return sendSuccess(res, "Company", company);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// GET /companies/:companyId/jobs
export const getJobsInCompany = async (req: Request, res: Response) => {
  try {
    const companyId = req.params["companyId"] as string;

    const companyExists = await prisma.companyProfile.findUnique({
      where: { id: companyId },
    });

    if (!companyExists) return sendError(res, "Company not found", 404);

    const jobs = await prisma.jobListing.findMany({
      where: {
        companyId: companyId,
        isClosed: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return sendSuccess(res, "Jobs", jobs);
  } catch (error) {
    return sendError(res, "Server error", 500);
  }
};
