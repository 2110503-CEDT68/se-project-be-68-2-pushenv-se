import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendSuccess, sendError } from "../utils/http.js";
import prisma from "../utils/prisma.js";
import * as authControllers from "./auth.controller.js";

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("bcrypt", () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
    sign: jest.fn(),
}));

jest.mock("../utils/http.js", () => ({
    sendSuccess: jest.fn(),
    sendError: jest.fn(),
}));

jest.mock("../config/env.js", () => ({
    env: {
        JWT_SECRET: "super-secret-test-key",
    },
}));

jest.mock("../utils/prisma.js", () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockRequest = (body: any = {}) => {
    return {
        body,
    } as Request;
};

const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res as Response;
};

// ── Test Suite ────────────────────────────────────────────────────────────────

describe("Auth Controllers", () => {
    let res: Response;

    beforeEach(() => {
        jest.clearAllMocks();
        res = mockResponse();
        jest.spyOn(console, "log").mockImplementation(() => {});
    });

    describe("register", () => {
        const validUserBody = { name: "John", email: "j@test.com", password: "pwd", role: "user" };

        it("should return 400 if required fields are missing", async () => {
            const req = mockRequest({ name: "John" }); 
            await authControllers.register(req, res);
            expect(sendError).toHaveBeenCalledWith(res, "Missing required fields", 400);
        });

        it("should return 400 if trying to register as a company or admin", async () => {
            const req = mockRequest({ ...validUserBody, role: "company" });
            await authControllers.register(req, res);
            expect(sendError).toHaveBeenCalledWith(res, "Invalid role. Only 'user' accounts can be registered here.", 400);
        });

        it("should return 409 if email is already in use", async () => {
            const req = mockRequest(validUserBody);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "existing-user" });

            await authControllers.register(req, res);
            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "j@test.com" } });
            expect(sendError).toHaveBeenCalledWith(res, "Email already in use", 409);
        });

        it("should register a user successfully and return a token", async () => {
            const req = mockRequest(validUserBody);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
            (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-pwd");
            (prisma.user.create as jest.Mock).mockResolvedValue({ id: "user-1", role: "user" });
            (jwt.sign as jest.Mock).mockReturnValue("mock-jwt-token");

            await authControllers.register(req, res);

            expect(bcrypt.hash).toHaveBeenCalledWith("pwd", 10);
            expect(prisma.user.create).toHaveBeenCalledWith({
                data: { name: "John", email: "j@test.com", passwordHash: "hashed-pwd", role: "user" }
            });
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: "user-1", role: "user" },
                "super-secret-test-key",
                { expiresIn: "7d" }
            );
            expect(sendSuccess).toHaveBeenCalledWith(res, "Registered successfully", { token: "mock-jwt-token" }, 201);
        });

        it("should return 500 on database error", async () => {
            const req = mockRequest(validUserBody);
            (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("DB Connection Error"));

            await authControllers.register(req, res);
            expect(sendError).toHaveBeenCalledWith(res, "Server error", 500);
        });
    });

    // ... (Login tests remain exactly the same as before)
    describe("login", () => {
        const credentials = { email: "j@test.com", password: "pwd" };

        it("should return 401 if user does not exist", async () => {
            const req = mockRequest(credentials);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            await authControllers.login(req, res);

            expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "j@test.com" } });
            expect(sendError).toHaveBeenCalledWith(res, "Invalid credentials", 401);
        });

        it("should return 401 if password does not match", async () => {
            const req = mockRequest(credentials);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user-1", passwordHash: "real-hash" });
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await authControllers.login(req, res);

            expect(bcrypt.compare).toHaveBeenCalledWith("pwd", "real-hash");
            expect(sendError).toHaveBeenCalledWith(res, "Invalid credentials", 401);
        });

        it("should return a token on successful login", async () => {
            const req = mockRequest(credentials);
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user-1", role: "user", passwordHash: "real-hash" });
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            (jwt.sign as jest.Mock).mockReturnValue("mock-login-token");

            await authControllers.login(req, res);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: "user-1", role: "user" },
                "super-secret-test-key"
            );
            expect(sendSuccess).toHaveBeenCalledWith(res, "Login successful", { token: "mock-login-token" });
        });
    });
});