import type { Response } from "express";
import { sendSuccess, sendError } from "../utils/http.js";
import prisma from "../utils/prisma.js";
import type { AuthenticatedRequest } from "../middlewares/auth.js";

//Helper: get company profile from logged-in user
async function getCompanyProfile(userId: string) {
    return prisma.companyProfile.findUnique({ where: { userId } });
}

//Helper: patch job close or open
async function setJobClosed(req: AuthenticatedRequest, res: Response, isClosed: boolean) {
  const id = req.params["id"] as string;
  const profile = await getCompanyProfile(req.user!.id);
  if (!profile) return sendError(res, "Profile not found", 404);
  const existing = await prisma.jobListing.findFirst({ where: { id, companyId: profile.id } });
  if (!existing) return sendError(res, "Job not found", 404);
  const updated = await prisma.jobListing.update({ where: { id }, data: { isClosed } });
  return sendSuccess(res, isClosed ? "Job closed" : "Job opened", updated);
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

// Get /company/events
export const getCompanyEvents = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const profile = await getCompanyProfile(req.user!.id);
        if (!profile) return sendError(res, "Profile not found", 404);

        const events = await prisma.event.findMany({
            where: {
                companies: { some: { companyId: profile.id } }
            },
            orderBy: { startDate: "asc" }
        });
        return sendSuccess(res, "Company events", events);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// POST /company/jobs
export const createJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { title, type, location, description,
            requirements, qualifications, salary, attachment } = req.body;

        const profile = await getCompanyProfile(req.user!.id);
        if (!profile) return sendError(res, "Profile not found", 404);

        const job = await prisma.jobListing.create({
            data: {
                companyId: profile.id,
                title, type, location, description,
                requirements, qualifications, salary, attachment
            },
        });
        return sendSuccess(res, "Job created", job, 201);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// PUT /company/jobs/:id
export const updateJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params["id"] as string;
        const { title, type, location, description,
            requirements, qualifications, salary, attachment } = req.body;

        const profile = await getCompanyProfile(req.user!.id);
        if (!profile) return sendError(res, "Profile not found", 404);

        // Verify this job belongs to the logged-in company
        const existing = await prisma.jobListing.findFirst({
            where: { id, companyId: profile.id },
        });
        if (!existing) return sendError(res, "Job not found", 404);

        const updated = await prisma.jobListing.update({
            where: { id },
            data: {
                title, type, location, description,
                requirements, qualifications, salary, attachment
            },
        });
        return sendSuccess(res, "Job updated", updated);
    } catch {
        return sendError(res, "Server error", 500);
    }
};

// PATCH /company/jobs/:id/close
export const closeJob = (req: AuthenticatedRequest, res: Response) => setJobClosed(req, res, true);

// PATCH /company/jobs/:id/open
export const openJob  = (req: AuthenticatedRequest, res: Response) => setJobClosed(req, res, false);

// DELETE /company/jobs/:id
export const deleteJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params["id"] as string;

        const profile = await getCompanyProfile(req.user!.id);
        if (!profile) return sendError(res, "Profile not found", 404);

        const existing = await prisma.jobListing.findFirst({
            where: { id, companyId: profile.id },
        });
        if (!existing) return sendError(res, "Job not found", 404);

        await prisma.jobListing.delete({ where: { id } });
        return sendSuccess(res, "Job deleted", null);
    } catch {
        return sendError(res, "Server error", 500);
    }
};