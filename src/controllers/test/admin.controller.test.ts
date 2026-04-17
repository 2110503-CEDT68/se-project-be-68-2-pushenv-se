import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.js";
import bcrypt from "bcrypt";
import prisma from "../../utils/prisma.js";
import { sendSuccess, sendError } from "../../utils/http.js";
import * as adminControllers from "../admin.controller.js"; // Adjust path to match your file name

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("bcrypt", () => ({
    hash: jest.fn(),
}));

jest.mock("../../utils/http.js", () => ({
    sendSuccess: jest.fn(),
    sendError: jest.fn(),
}));

jest.mock("../../utils/prisma.js", () => ({
    __esModule: true,
    default: {
        user: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        companyProfile: {
            create: jest.fn(),
            findUnique: jest.fn(),
        },
        event: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        },
        eventCompany: {
            create: jest.fn(),
            findUnique: jest.fn(),
            delete: jest.fn(),
        },
    },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockRequest = (
    params: Record<string, string> = {},
    query: Record<string, string> = {},
    body: any = {},
    user: { id: string; role?: string } | null = { id: "admin-123" }
) => {
    return {
        params,
        query,
        body,
        user,
    } as unknown as AuthenticatedRequest;
};

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

// ── Test Suite ────────────────────────────────────────────────────────────────

describe("Admin Controllers", () => {
    let res: Response;

    beforeEach(() => {
        jest.clearAllMocks();
        res = mockResponse();
        // Suppress console.log/error in tests to keep the output clean
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    // ── Accounts Tests ────────────────────────────────────────────────────────
    describe("Accounts", () => {
        describe("getAccounts", () => {
            it("should return all accounts with filters applied", async () => {
                const req = mockRequest({}, { name: "john", role: "user" });
                const mockUsers = [{ id: "1", name: "John Doe" }];
                (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);
                (prisma.user.count as jest.Mock).mockResolvedValue(1);

                await adminControllers.getAccounts(req, res);

                expect(prisma.user.findMany).toHaveBeenCalledWith({
                    where: {
                        role: "user",
                        name: { contains: "john", mode: "insensitive" },
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        phone: true,
                        avatar: true,
                        createdAt: true,
                        updatedAt: true
                    },
                    orderBy: { createdAt: "desc" },
                    skip: 0,
                    take: 10,
                });
                expect(sendSuccess).toHaveBeenCalledWith(res, "All accounts", expect.objectContaining({ data: mockUsers }));
            });
        });

        describe("createAccount", () => {
            it("should return 400 if missing required fields", async () => {
                const req = mockRequest({}, {}, { name: "Test" }); // Missing email, password, role
                await adminControllers.createAccount(req, res);
                expect(sendError).toHaveBeenCalledWith(res, "Missing required fields", 400);
            });

            it("should return 400 if role is invalid", async () => {
                const req = mockRequest({}, {}, { name: "Test", email: "test@test.com", password: "pwd", role: "admin" });
                await adminControllers.createAccount(req, res);
                expect(sendError).toHaveBeenCalledWith(res, "Invalid role", 400);
            });

            it("should return 409 if email already exists", async () => {
                const req = mockRequest({}, {}, { name: "Test", email: "test@test.com", password: "pwd", role: "jobSeeker" });
                (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "existing" });

                await adminControllers.createAccount(req, res);

                expect(sendError).toHaveBeenCalledWith(res, "Email already in use", 409);
            });

            it("should create a company account and profile successfully", async () => {
                const body = { name: "Company A", email: "a@a.com", password: "pwd", role: "companyUser" };
                const req = mockRequest({}, {}, body);

                (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
                (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPwd");
                (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user-123" });
                (prisma.companyProfile.create as jest.Mock).mockResolvedValue({});

                await adminControllers.createAccount(req, res);

                expect(bcrypt.hash).toHaveBeenCalledWith("pwd", 10);
                expect(prisma.companyProfile.create).toHaveBeenCalledWith({ data: { companyUserId: "user-123" } });
                expect(sendSuccess).toHaveBeenCalledWith(res, "Account created", expect.any(Object), 201);
            });
        });

        describe("updateAccount", () => {
            it("should return 404 if account not found", async () => {
                const req = mockRequest({ id: "999" }, {}, { name: "New Name" });
                (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

                await adminControllers.updateAccount(req, res);
                expect(sendError).toHaveBeenCalledWith(res, "Account not found", 404);
            });

            it("should update account and hash new password if provided", async () => {
                const req = mockRequest({ id: "1" }, {}, { password: "newPassword" });
                (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "1", email: "old@test.com" });
                (bcrypt.hash as jest.Mock).mockResolvedValue("newHash");
                (prisma.user.update as jest.Mock).mockResolvedValue({ id: "1" });

                await adminControllers.updateAccount(req, res);

                expect(bcrypt.hash).toHaveBeenCalledWith("newPassword", 10);
                expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                    where: { id: "1" },
                    data: { passwordHash: "newHash" }
                }));
            });
        });

        describe("deleteAccount", () => {
            it("should prevent admin from deleting their own account", async () => {
                const req = mockRequest({ id: "admin-123" }, {}, {}, { id: "admin-123" });
                await adminControllers.deleteAccount(req, res);
                expect(sendError).toHaveBeenCalledWith(res, "Cannot delete your own account", 400);
            });

            it("should delete account successfully", async () => {
                const req = mockRequest({ id: "user-1" });
                (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user-1" });
                (prisma.user.delete as jest.Mock).mockResolvedValue({});

                await adminControllers.deleteAccount(req, res);
                expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
                expect(sendSuccess).toHaveBeenCalledWith(res, "Account deleted", null);
            });
        });
    });

    // ── Events Tests ──────────────────────────────────────────────────────────
    describe("Events", () => {
        describe("createEvent", () => {
            it("should return 400 if required fields are missing", async () => {
                const req = mockRequest({}, {}, { name: "Fair" }); // Missing dates/location
                await adminControllers.createEvent(req, res);
                expect(sendError).toHaveBeenCalledWith(res, "Missing required fields", 400);
            });

            it("should create event successfully", async () => {
                const body = { name: "Fair", description: "Desc", location: "NY", startDate: "2025-01-01", endDate: "2025-01-02" };
                const req = mockRequest({}, {}, body);
                (prisma.event.create as jest.Mock).mockResolvedValue({ id: "evt-1" });

                await adminControllers.createEvent(req, res);
                expect(prisma.event.create).toHaveBeenCalled();
                expect(sendSuccess).toHaveBeenCalledWith(res, "Event created", { id: "evt-1" }, 201);
            });
        });

        describe("publishEvent", () => {
            it("should toggle isPublished status correctly", async () => {
                const req = mockRequest({ id: "evt-1" });
                (prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: "evt-1", isPublished: false });
                (prisma.event.update as jest.Mock).mockResolvedValue({ id: "evt-1", isPublished: true });

                await adminControllers.publishEvent(req, res);
                expect(prisma.event.update).toHaveBeenCalledWith({
                    where: { id: "evt-1" },
                    data: { isPublished: true }
                });
                expect(sendSuccess).toHaveBeenCalledWith(res, "Event published", expect.any(Object));
            });
        });

        describe("addCompanyToEvent", () => {
            it("should handle P2002 error gracefully (already linked)", async () => {
                const req = mockRequest({ id: "evt-1" }, {}, { companyId: "comp-1" });
                
                (prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: "evt-1" });
                (prisma.companyProfile.findUnique as jest.Mock).mockResolvedValue({ id: "comp-1" });
                
                // Simulate Prisma unique constraint error
                (prisma.eventCompany.create as jest.Mock).mockRejectedValue({ code: "P2002" });

                await adminControllers.addCompanyToEvent(req, res);
                
                expect(sendError).toHaveBeenCalledWith(res, "Company is already linked to this event", 409);
            });

            it("should add company successfully", async () => {
                const req = mockRequest({ id: "evt-1" }, {}, { companyId: "comp-1" });
                
                (prisma.event.findUnique as jest.Mock).mockResolvedValue({ id: "evt-1" });
                (prisma.companyProfile.findUnique as jest.Mock).mockResolvedValue({ id: "comp-1" });
                (prisma.eventCompany.create as jest.Mock).mockResolvedValue({ eventId: "evt-1", companyId: "comp-1" });

                await adminControllers.addCompanyToEvent(req, res);
                
                expect(sendSuccess).toHaveBeenCalledWith(res, "Company added to event", expect.any(Object), 201);
            });
        });

        describe("removeCompanyFromEvent", () => {
            it("should return 404 if link does not exist", async () => {
                const req = mockRequest({ id: "evt-1", companyId: "comp-1" });
                (prisma.eventCompany.findUnique as jest.Mock).mockResolvedValue(null);

                await adminControllers.removeCompanyFromEvent(req, res);
                expect(sendError).toHaveBeenCalledWith(res, "Company is not linked to this event", 404);
            });

            it("should remove link successfully", async () => {
                const req = mockRequest({ id: "evt-1", companyId: "comp-1" });
                (prisma.eventCompany.findUnique as jest.Mock).mockResolvedValue({});
                (prisma.eventCompany.delete as jest.Mock).mockResolvedValue({});

                await adminControllers.removeCompanyFromEvent(req, res);
                expect(prisma.eventCompany.delete).toHaveBeenCalled();
                expect(sendSuccess).toHaveBeenCalledWith(res, "Company removed from event", null);
            });
        });
    });
});