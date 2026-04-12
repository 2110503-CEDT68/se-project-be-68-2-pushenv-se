import { Response } from "express";
import { AuthenticatedRequest } from "./../middlewares/auth.js";
import prisma from "./../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";

// GET /companies/:companyId/jobs
export const getCompanyJobs = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params["companyId"] as string;
        
        // FIX: Added 'await' to ensure the Promise resolves before evaluating
        const company = await prisma.companyProfile.findUnique({ where: { id: id} });
        if (!company) return sendError(res, "Company not found", 404);
        
        const jobs = await prisma.jobListing.findMany({ where: { companyId: id } });
        return sendSuccess(res, "All jobs in this company", jobs);
    } catch (error) {
        console.error("Error in getCompanyJobs:", error);
        return sendError(res, "Internal server error", 500);
    }
}

// GET /jobs/:id
export const getJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params["id"] as string;
        const job = await prisma.jobListing.findUnique({ where: { id: id } });
        
        if (!job) return sendError(res, "Job not found", 404);
        return sendSuccess(res, "Can find this job", job);
    } catch (error) {
        console.error("Error in getJob:", error);
        return sendError(res, "Internal server error", 500);
    }
}

// GET /admin/companies/:companyId/jobs
export const adminGetCompanyJobs = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const companyId = req.params["companyId"] as string;

        const company = await prisma.companyProfile.findUnique({ where: { id: companyId, role: "company" } });
        if (!company) return sendError(res, "Company not found", 404);

        const jobs = await prisma.jobListing.findMany({ where: { companyId: companyId } });
        
        return sendSuccess(res, "All jobs in this company", jobs);
    } catch (error) {
        console.error("Error in adminGetCompanyJobs:", error);
        return sendError(res, "Internal server error", 500);
    }
}

// GET /admin/jobs/:id
export const adminGetCompanyJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId = req.params["id"] as string;
        const job = await prisma.jobListing.findUnique({ where: { id: jobId } });
        
        if (!job) return sendError(res, "Cannot find this job", 404);
        return sendSuccess(res, "Can find this job", job);
    } catch (error) {
        console.error("Error in adminGetCompanyJob:", error);
        return sendError(res, "Internal server error", 500);
    }
}

// POST /admin/companies/:companyId/jobs
export const adminCreateCompanyJobs = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const companyId = req.params["companyId"] as string;
        
        // FIX: Added 'await' to properly check if the company exists
        const company = await prisma.companyProfile.findUnique({ where: { id: companyId } });
        if (!company) return sendError(res, "Cannot find this companyId", 404);
        
        const { title, type, location, description, requirements, qualifications, salary, attachment, isClosed } = req.body;
        
        // FIX: Basic validation to prevent Prisma crashes from null constraints
        if (!title || !type || !location) {
            return sendError(res, "Missing required fields (e.g., title, type, location)", 400);
        }

        const job = await prisma.jobListing.create({ 
            data: { 
                companyId: companyId, 
                title, 
                type, 
                location, 
                description, 
                requirements, 
                qualifications, 
                salary, 
                attachment, 
                isClosed 
            } 
        });
        
        return sendSuccess(res, "Create success", job);
    } catch (error) {
        console.error("Error in adminCreateCompanyJobs:", error);
        return sendError(res, "Internal server error", 500);
    }
}

// PUT /admin/jobs/:id
export const adminUpdateJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId = req.params["id"] as string;
        
        // 1. Verify the job exists first
        const existingJob = await prisma.jobListing.findUnique({ where: { id: jobId } });
        if (!existingJob) return sendError(res, "Job not found", 404);

        // 2. Extract only the fields you want to allow updating
        // This prevents users from maliciously updating the job's ID or companyId
        const { title, type, location, description, requirements, qualifications, salary, attachment, isClosed } = req.body;

        // 3. Update the job
        const updatedJob = await prisma.jobListing.update({
            where: { id: jobId },
            data: { 
                title, 
                type, 
                location, 
                description, 
                requirements, 
                qualifications, 
                salary, 
                attachment, 
                isClosed 
            }
        });

        return sendSuccess(res, "Job updated successfully", updatedJob);
    } catch (error) {
        console.error("Error updating job:", error);
        return sendError(res, "Internal server error", 500);
    }
};

// PATCH /admin/jobs/:id/close
export const adminCloseJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId = req.params["id"] as string;

        const existingJob = await prisma.jobListing.findUnique({ where: { id: jobId } });
        if (!existingJob) return sendError(res, "Job not found", 404);

        // A PATCH route should only modify specific fields. Here, we just toggle isClosed.
        const closedJob = await prisma.jobListing.update({
            where: { id: jobId },
            data: { isClosed: true }
        });

        return sendSuccess(res, "Job closed successfully", closedJob);
    } catch (error) {
        console.error("Error closing job:", error);
        return sendError(res, "Internal server error", 500);
    }
};

// PATCH /admin/jobs/:id/close
export const adminOpenJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId = req.params["id"] as string;

        const existingJob = await prisma.jobListing.findUnique({ where: { id: jobId } });
        if (!existingJob) return sendError(res, "Job not found", 404);

        const closedJob = await prisma.jobListing.update({
            where: { id: jobId },
            data: { isClosed: false }
        });

        return sendSuccess(res, "Job closed successfully", closedJob);
    } catch (error) {
        console.error("Error closing job:", error);
        return sendError(res, "Internal server error", 500);
    }
};

// DELETE /admin/jobs/:id
export const adminDeleteJob = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const jobId = req.params["id"] as string;

        const existingJob = await prisma.jobListing.findUnique({ where: { id: jobId } });
        if (!existingJob) return sendError(res, "Job not found", 404);

        // Delete the job
        await prisma.jobListing.delete({
            where: { id: jobId }
        });

        return sendSuccess(res, "Job deleted successfully", null);
    } catch (error) {
        console.error("Error deleting job:", error);
        return sendError(res, "Internal server error", 500);
    }
};