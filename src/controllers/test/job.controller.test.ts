import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.js";

// --- MOCKS ---

// Mock Prisma
jest.mock("./../utils/prisma.js", () => ({
    __esModule: true,
    default: {
        companyProfile: {
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


// Load controller via require() so jest.mock is already applied
const prisma = require("./../utils/prisma.js").default;
const {
    getCompanyJobs,
    getJob,
    adminCreateCompanyJobs,
    adminUpdateJob,
    adminCloseJob,
    adminOpenJob,
    adminDeleteJob,
} = require("./jobs.controller");

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
            (prisma.companyProfile.findUnique as jest.Mock).mockResolvedValue(null);

            await getCompanyJobs(req, res);

            expect(prisma.companyProfile.findUnique).toHaveBeenCalledWith({ where: { id: "123" } });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Company not found" }));
        });

        it("should return only open jobs on success", async () => {
            const req = mockRequest({ companyId: "123" });
            const mockJobs = [{ id: "job1", isClosed: false }];

            (prisma.companyProfile.findUnique as jest.Mock).mockResolvedValue({ id: "123" });
            (prisma.jobListing.findMany as jest.Mock).mockResolvedValue(mockJobs);

            await getCompanyJobs(req, res);

            expect(prisma.jobListing.findMany).toHaveBeenCalledWith({
                where: { companyId: "123", isClosed: false },
                orderBy: { createdAt: "desc" },
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: mockJobs }));
        });

        it("should return 500 on database error", async () => {
            const req = mockRequest({ companyId: "123" });
            (prisma.companyProfile.findUnique as jest.Mock).mockRejectedValue(new Error("DB Error"));

            await getCompanyJobs(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Server error" }));
        });
    });

    describe("getJob", () => {
        it("should return 404 if job is not found", async () => {
            const req = mockRequest({ id: "job1" });
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue(null);

            await getJob(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Job not found" }));
        });

        it("should return the job on success", async () => {
            const req = mockRequest({ id: "job1" });
            const mockJob = { id: "job1", title: "Software Engineer", company: {} };
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue(mockJob);

            await getJob(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Job detail" }));
        });
    });

    describe("adminCreateCompanyJobs", () => {
        it("should return 404 if company does not exist", async () => {
            const req = mockRequest({ companyId: "123" }, { title: "Dev", type: "Full", location: "NY", description: "Desc" });
            (prisma.companyProfile.findUnique as jest.Mock).mockResolvedValue(null);

            await adminCreateCompanyJobs(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Company not found" }));
        });

        it("should return 400 if required fields are missing", async () => {
            const req = mockRequest({ companyId: "123" }, { title: "Dev" }); // Missing type, location, description
            (prisma.companyProfile.findUnique as jest.Mock).mockResolvedValue({ id: "123" });

            await adminCreateCompanyJobs(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Missing required fields" }));
        });

        it("should create a job and return 201", async () => {
            const mockBody = { title: "Dev", type: "full_time", location: "NY", description: "Desc" };
            const req = mockRequest({ companyId: "123" }, mockBody);
            const mockJob = { id: "job1", ...mockBody };

            (prisma.companyProfile.findUnique as jest.Mock).mockResolvedValue({ id: "123" });
            (prisma.jobListing.create as jest.Mock).mockResolvedValue(mockJob);

            await adminCreateCompanyJobs(req, res);

            expect(prisma.jobListing.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Job created" }));
        });
    });

    describe("adminUpdateJob", () => {
        it("should return 404 if job does not exist", async () => {
            const req = mockRequest({ id: "job1" }, { title: "New Title" });
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue(null);

            await adminUpdateJob(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Job not found" }));
        });

        it("should update the job and return success", async () => {
            const req = mockRequest({ id: "job1" }, { title: "New Title" });
            const existingJob = { id: "job1", title: "Old Title" };
            const updatedJob = { id: "job1", title: "New Title" };

            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue(existingJob);
            (prisma.jobListing.update as jest.Mock).mockResolvedValue(updatedJob);

            await adminUpdateJob(req, res);

            expect(prisma.jobListing.update).toHaveBeenCalledWith({
                where: { id: "job1" },
                data: expect.objectContaining({ title: "New Title" }),
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Job updated" }));
        });
    });

    describe("adminCloseJob", () => {
        it("should set isClosed to true", async () => {
            const req = mockRequest({ id: "job1" });
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue({ id: "job1", isClosed: false });
            (prisma.jobListing.update as jest.Mock).mockResolvedValue({ id: "job1", isClosed: true });

            await adminCloseJob(req, res);

            expect(prisma.jobListing.update).toHaveBeenCalledWith({
                where: { id: "job1" },
                data: { isClosed: true },
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Job closed" }));
        });
    });

    describe("adminOpenJob", () => {
        it("should set isClosed to false", async () => {
            const req = mockRequest({ id: "job1" });
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue({ id: "job1", isClosed: true });
            (prisma.jobListing.update as jest.Mock).mockResolvedValue({ id: "job1", isClosed: false });

            await adminOpenJob(req, res);

            expect(prisma.jobListing.update).toHaveBeenCalledWith({
                where: { id: "job1" },
                data: { isClosed: false },
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Job opened" }));
        });
    });

    describe("adminDeleteJob", () => {
        it("should return 404 if job does not exist", async () => {
            const req = mockRequest({ id: "job1" });
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue(null);

            await adminDeleteJob(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Job not found" }));
        });

        it("should delete the job and return success", async () => {
            const req = mockRequest({ id: "job1" });
            (prisma.jobListing.findUnique as jest.Mock).mockResolvedValue({ id: "job1" });
            (prisma.jobListing.delete as jest.Mock).mockResolvedValue({ id: "job1" });

            await adminDeleteJob(req, res);

            expect(prisma.jobListing.delete).toHaveBeenCalledWith({ where: { id: "job1" } });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: "Job deleted" }));
        });
    });
});