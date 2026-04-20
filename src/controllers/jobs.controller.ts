import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.js";
import prisma from "../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";

// ── Shared ────────────────────────────────────────────────────────────────────

const jobWithCompanyInclude = {
  company: {
    select: {
      id: true,
      description: true,
      logo: true,
      website: true,
      companyUser: { select: { name: true } },
    },
  },
} as const;

// Helper: set isClosed on any job — shared by adminCloseJob and adminOpenJob
async function setJobStatus(
  req: AuthenticatedRequest,
  res: Response,
  isClosed: boolean,
) {
  try {
    const id = req.params["id"] as string;
    const existing = await prisma.jobListing.findUnique({ where: { id } });
    if (!existing) return sendError(res, "Job not found", 404);
    const updated = await prisma.jobListing.update({
      where: { id },
      data: { isClosed },
    });
    return sendSuccess(res, isClosed ? "Job closed" : "Job opened", updated);
  } catch {
    return sendError(res, "Server error", 500);
  }
}

// ── Public ────────────────────────────────────────────────────────────────────

// GET /jobs/:id
// Role-aware: admin sees closed jobs; everyone else gets 404 on closed jobs.
export const getJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const isAdmin = req.user?.role === "systemAdmin";

    const job = await prisma.jobListing.findUnique({
      where: { id },
      include: jobWithCompanyInclude,
    });

    if (!job) return sendError(res, "Job not found", 404);
    if (job.isClosed && !isAdmin) return sendError(res, "Job not found", 404);

    return sendSuccess(res, "Job detail", job);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// ── Admin — moved from jobs.routes.ts to admin.routes.ts ─────────────────────

// GET /admin/companies/:companyId/jobs
export const adminGetCompanyJobs = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const companyId = req.params["companyId"] as string;
    const company = await prisma.companyProfile.findUnique({
      where: { id: companyId },
    });
    if (!company) return sendError(res, "Company not found", 404);

    const jobs = await prisma.jobListing.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
    return sendSuccess(res, "Company jobs", jobs);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// GET /admin/jobs/:id
export const adminGetJob = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const job = await prisma.jobListing.findUnique({
      where: { id },
      include: jobWithCompanyInclude,
    });
    if (!job) return sendError(res, "Job not found", 404);
    return sendSuccess(res, "Job detail", job);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// POST /admin/companies/:companyId/jobs
export const adminCreateJob = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const companyId = req.params["companyId"] as string;
    const company = await prisma.companyProfile.findUnique({
      where: { id: companyId },
    });
    if (!company) return sendError(res, "Company not found", 404);

    const {
      title,
      type,
      location,
      description,
      requirements,
      qualifications,
      salary,
      attachment,
    } = req.body;

    if (!title || !type || !location || !description) {
      return sendError(res, "Missing required fields", 400);
    }

    const job = await prisma.jobListing.create({
      data: {
        companyId,
        title,
        type,
        location,
        description,
        requirements,
        qualifications,
        salary,
        attachment,
      },
    });
    return sendSuccess(res, "Job created", job, 201);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// PUT /admin/jobs/:id
export const adminUpdateJob = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const id = req.params["id"] as string;
    const existing = await prisma.jobListing.findUnique({ where: { id } });
    if (!existing) return sendError(res, "Job not found", 404);

    const {
      title,
      type,
      location,
      description,
      requirements,
      qualifications,
      salary,
      attachment,
    } = req.body;

    const data: {
      title?: string;
      type?: any;
      location?: string;
      description?: string;
      requirements?: string;
      qualifications?: string;
      salary?: string;
      attachment?: string;
    } = {};

    if (title !== undefined) data.title = title;
    if (type !== undefined) data.type = type;
    if (location !== undefined) data.location = location;
    if (description !== undefined) data.description = description;
    if (requirements !== undefined) data.requirements = requirements;
    if (qualifications !== undefined) data.qualifications = qualifications;
    if (salary !== undefined) data.salary = salary;
    if (attachment !== undefined) data.attachment = attachment;

    const updated = await prisma.jobListing.update({ where: { id }, data });
    return sendSuccess(res, "Job updated", updated);
  } catch {
    return sendError(res, "Server error", 500);
  }
};

// PATCH /admin/jobs/:id/close
export const adminCloseJob = (req: AuthenticatedRequest, res: Response) =>
  setJobStatus(req, res, true);

// PATCH /admin/jobs/:id/open
export const adminOpenJob = (req: AuthenticatedRequest, res: Response) =>
  setJobStatus(req, res, false);

// DELETE /admin/jobs/:id
export const adminDeleteJob = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const id = req.params["id"] as string;
    const existing = await prisma.jobListing.findUnique({ where: { id } });
    if (!existing) return sendError(res, "Job not found", 404);
    await prisma.jobListing.delete({ where: { id } });
    return sendSuccess(res, "Job deleted", null);
  } catch {
    return sendError(res, "Server error", 500);
  }
};
