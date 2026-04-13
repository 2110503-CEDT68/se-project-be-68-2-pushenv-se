import { Response } from "express";
import { AuthenticatedRequest } from "./../middlewares/auth.js";
import prisma from "./../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";

// GET /companies/:companyId/jobs
// US3-1 & US3-5: public — only show OPEN listings (isClosed: false)
export const getCompanyJobs = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params["companyId"] as string;

        const company = await prisma.companyProfile.findUnique({ where: { id } });
        if (!company) return sendError(res, "Company not found", 404);

        // US3-5 fix: filter out closed jobs so they are not visible to public
        const jobs = await prisma.jobListing.findMany({
            where: { companyId: id, isClosed: false },
            orderBy: { createdAt: "desc" },
        });
        return sendSuccess(res, "All jobs in this company", jobs);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// GET /jobs/:id
// US3-2: public — return full job detail including isClosed status indicator
export const getJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params["id"] as string;
        const job = await prisma.jobListing.findUnique({
            where: { id },
            include: {
                company: {
                    select: {
                        id: true,
                        description: true,
                        logo: true,
                        website: true,
                        user: { select: { name: true } },
                    },
                },
            },
        });

        if (!job) return sendError(res, "Job not found", 404);
        return sendSuccess(res, "Job detail", job);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// GET /admin/companies/:companyId/jobs
// US3-6: admin sees ALL jobs (open and closed) under a company
export const adminGetCompanyJobs = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const companyId = req.params["companyId"] as string;

        // Fixed: CompanyProfile has no 'role' field — removed invalid query
        const company = await prisma.companyProfile.findUnique({ where: { id: companyId } });
        if (!company) return sendError(res, "Company not found", 404);

        const jobs = await prisma.jobListing.findMany({
            where: { companyId },
            orderBy: { createdAt: "desc" },
        });
        return sendSuccess(res, "All jobs in this company", jobs);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// GET /admin/jobs/:id
// US3-7: admin views full job detail including closed status
export const adminGetCompanyJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId = req.params["id"] as string;
        const job = await prisma.jobListing.findUnique({
            where: { id: jobId },
            include: {
                company: {
                    select: {
                        id: true,
                        description: true,
                        logo: true,
                        website: true,
                        user: { select: { name: true } },
                    },
                },
            },
        });

        if (!job) return sendError(res, "Job not found", 404);
        return sendSuccess(res, "Job detail", job);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// POST /admin/companies/:companyId/jobs
// US3-8: admin creates a job listing under a specific company
export const adminCreateCompanyJobs = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const companyId = req.params["companyId"] as string;

        const company = await prisma.companyProfile.findUnique({ where: { id: companyId } });
        if (!company) return sendError(res, "Company not found", 404);

        const { title, type, location, description, requirements, qualifications, salary, attachment } = req.body;

        if (!title || !type || !location || !description) {
            return sendError(res, "Missing required fields", 400);
        }

        const job = await prisma.jobListing.create({
            data: { companyId, title, type, location, description, requirements, qualifications, salary, attachment },
        });

        return sendSuccess(res, "Job created", job, 201);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// PUT /admin/jobs/:id
// US3-9: admin updates any job listing
export const adminUpdateJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId = req.params["id"] as string;

        const existingJob = await prisma.jobListing.findUnique({ where: { id: jobId } });
        if (!existingJob) return sendError(res, "Job not found", 404);

        const { title, type, location, description, requirements, qualifications, salary, attachment } = req.body;

        // Build data conditionally to avoid exactOptionalPropertyTypes errors
        const data: {
            title?: string; type?: any; location?: string; description?: string;
            requirements?: string; qualifications?: string; salary?: string; attachment?: string;
        } = {};

        if (title !== undefined)          data.title          = title;
        if (type !== undefined)           data.type           = type;
        if (location !== undefined)       data.location       = location;
        if (description !== undefined)    data.description    = description;
        if (requirements !== undefined)   data.requirements   = requirements;
        if (qualifications !== undefined) data.qualifications = qualifications;
        if (salary !== undefined)         data.salary         = salary;
        if (attachment !== undefined)     data.attachment     = attachment;

        const updatedJob = await prisma.jobListing.update({ where: { id: jobId }, data });
        return sendSuccess(res, "Job updated", updatedJob);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// PATCH /admin/jobs/:id/close
// US3-10: admin closes a job listing
export const adminCloseJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId = req.params["id"] as string;

        const existingJob = await prisma.jobListing.findUnique({ where: { id: jobId } });
        if (!existingJob) return sendError(res, "Job not found", 404);

        const closedJob = await prisma.jobListing.update({
            where: { id: jobId },
            data: { isClosed: true },
        });
        return sendSuccess(res, "Job closed", closedJob);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// PATCH /admin/jobs/:id/open
// US3-10: admin re-opens a job listing
export const adminOpenJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId = req.params["id"] as string;

        const existingJob = await prisma.jobListing.findUnique({ where: { id: jobId } });
        if (!existingJob) return sendError(res, "Job not found", 404);

        const openedJob = await prisma.jobListing.update({
            where: { id: jobId },
            data: { isClosed: false },
        });
        return sendSuccess(res, "Job opened", openedJob);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// DELETE /admin/jobs/:id
// US3-10: admin deletes a job listing
export const adminDeleteJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId = req.params["id"] as string;

        const existingJob = await prisma.jobListing.findUnique({ where: { id: jobId } });
        if (!existingJob) return sendError(res, "Job not found", 404);

        await prisma.jobListing.delete({ where: { id: jobId } });
        return sendSuccess(res, "Job deleted", null);
    } catch {
        return sendError(res, "Server error", 500);
    }
};