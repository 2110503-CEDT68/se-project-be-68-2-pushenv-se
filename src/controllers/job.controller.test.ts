import { Response } from "express";
import { AuthenticatedRequest } from "./../middlewares/auth.js";
import prisma from "./../utils/prisma.js";
import { sendSuccess, sendError } from "../utils/http.js";
import * as jobControllers from "./jobs.controller.js"; // Adjust path to your controller file

// --- MOCKS ---

// Mock Prisma
jest.mock("./../utils/prisma.js", () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
        },
        jobListing: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

// Mock HTTP Utilities
jest.mock("../utils/http.js", () => ({
    sendSuccess: jest.fn(),
    sendError: jest.fn(),
}));

// Helper to create a mock Request object
const mockRequest = (params = {}, body = {}) => {
    return {
        params,
        body,
    } as unknown as AuthenticatedRequest;
};

// Helper to create a mock Response object
const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

// --- TEST SUITE ---

describe("Job Controllers", () => {
    let res: Response;

    beforeEach(() => {
        // Clear all mocks before each test to ensure isolated testing
        jest.clearAllMocks();
        res = mockResponse();
        // Suppress console.error in tests to keep terminal output clean when testing 500 errors
        jest.spyOn(console, "error").mockImplementation(() => { });
    });

    describe("getCompanyJobs", () => {
        it("should return 404 if company is not found", async () => {
            const req = mockRequest({ companyId: "123" });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await jobControllers.getCompanyJobs(req, res);

            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "123", role: "company" } });
            expect(sendError).toHaveBeenCalledWith(res, "Company not found", 404);
        });

        it("should return jobs on success", async () => {
            const req = mockRequest({ companyId: "123" });
            const mockJobs = [{ id: "job1" }, { id: "job2" }];

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "123", role: "company" });
            (prisma.jobListing.findMany as jest.Mock).mockResolvedValue(mockJobs);

            await jobControllers.getCompanyJobs(req, res);

            expect(prisma.jobListing.findMany).toHaveBeenCalledWith({ where: { companyId: "123" } });
            expect(sendSuccess).toHaveBeenCalledWith(res, "All jobs in this company", mockJobs);
        });

        it("should return 500 on database error", async () => {
            const req = mockRequest({ companyId: "123" });
            (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("DB Error"));

            await jobControllers.getCompanyJobs(req, res);

            expect(sendError).toHaveBeenCalledWith(res, "Internal server error", 500);
        });
    });

    describe("getJob", () => {
        it("should return 404 if job is not found", async () => {
            const req = mockRequest({ id: "job1" });
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue(null);

            await jobControllers.getJob(req, res);

            expect(sendError).toHaveBeenCalledWith(res, "Job not found", 404);
        });

        it("should return the job on success", async () => {
            const req = mockRequest({ id: "job1" });
            const mockJob = { id: "job1", title: "Software Engineer" };
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue(mockJob);

            await jobControllers.getJob(req, res);

            expect(sendSuccess).toHaveBeenCalledWith(res, "Can find this job", mockJob);
        });
    });

    describe("adminCreateCompanyJobs", () => {
        it("should return 404 if company does not exist", async () => {
            const req = mockRequest({ companyId: "123" }, { title: "Dev", type: "Full", location: "NY" });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await jobControllers.adminCreateCompanyJobs(req, res);

            expect(sendError).toHaveBeenCalledWith(res, "Cannot find this companyId", 404);
        });

        it("should return 400 if required fields are missing", async () => {
            const req = mockRequest({ companyId: "123" }, { title: "Dev" }); // Missing type & location
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "123" });

            await jobControllers.adminCreateCompanyJobs(req, res);

            expect(sendError).toHaveBeenCalledWith(res, "Missing required fields (e.g., title, type, location)", 400);
        });

        it("should create a job and return success", async () => {
            const mockBody = { title: "Dev", type: "Full", location: "NY" };
            const req = mockRequest({ companyId: "123" }, mockBody);
            const mockJob = { id: "job1", ...mockBody };

            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "123" });
            (prisma.jobListing.create as jest.Mock).mockResolvedValue(mockJob);

            await jobControllers.adminCreateCompanyJobs(req, res);

            expect(prisma.jobListing.create).toHaveBeenCalled();
            expect(sendSuccess).toHaveBeenCalledWith(res, "Create success", mockJob);
        });
    });

    describe("adminUpdateJob", () => {
        it("should return 404 if job does not exist", async () => {
            const req = mockRequest({ id: "job1" }, { title: "New Title" });
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue(null);

            await jobControllers.adminUpdateJob(req, res);

            expect(sendError).toHaveBeenCalledWith(res, "Job not found", 404);
        });

        it("should update the job and return success", async () => {
            const req = mockRequest({ id: "job1" }, { title: "New Title" });
            const existingJob = { id: "job1", title: "Old Title" };
            const updatedJob = { id: "job1", title: "New Title" };

            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue(existingJob);
            (prisma.jobListing.update as jest.Mock).mockResolvedValue(updatedJob);

            await jobControllers.adminUpdateJob(req, res);

            expect(prisma.jobListing.update).toHaveBeenCalledWith({
                where: { id: "job1" },
                data: expect.objectContaining({ title: "New Title" }),
            });
            expect(sendSuccess).toHaveBeenCalledWith(res, "Job updated successfully", updatedJob);
        });
    });

    describe("adminCloseJob", () => {
        it("should toggle isClosed to true", async () => {
            const req = mockRequest({ id: "job1" });
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue({ id: "job1", isClosed: false });
            (prisma.jobListing.update as jest.Mock).mockResolvedValue({ id: "job1", isClosed: true });

            await jobControllers.adminCloseJob(req, res);

            expect(prisma.jobListing.update).toHaveBeenCalledWith({
                where: { id: "job1" },
                data: { isClosed: true },
            });
            expect(sendSuccess).toHaveBeenCalledWith(res, "Job closed successfully", { id: "job1", isClosed: true });
        });
    });

    describe("adminOpenJob", () => {
        it("should toggle isClosed to false", async () => {
            const req = mockRequest({ id: "job1" });
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue({ id: "job1", isClosed: true });
            (prisma.jobListing.update as jest.Mock).mockResolvedValue({ id: "job1", isClosed: false });

            await jobControllers.adminOpenJob(req, res);

            expect(prisma.jobListing.update).toHaveBeenCalledWith({
                where: { id: "job1" },
                data: { isClosed: false },
            });
            expect(sendSuccess).toHaveBeenCalledWith(res, "Job closed successfully", { id: "job1", isClosed: false });
        });
    });

    describe("adminDeleteJob", () => {
        it("should return 404 if job does not exist", async () => {
            const req = mockRequest({ id: "job1" });
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue(null);

            await jobControllers.adminDeleteJob(req, res);

            expect(sendError).toHaveBeenCalledWith(res, "Job not found", 404);
        });

        it("should delete the job and return success", async () => {
            const req = mockRequest({ id: "job1" });
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue({ id: "job1" });
            (prisma.jobListing.delete as jest.Mock).mockResolvedValue({ id: "job1" });

            await jobControllers.adminDeleteJob(req, res);

            expect(prisma.jobListing.delete).toHaveBeenCalledWith({ where: { id: "job1" } });
            expect(sendSuccess).toHaveBeenCalledWith(res, "Job deleted successfully", null);
        });
    });
});