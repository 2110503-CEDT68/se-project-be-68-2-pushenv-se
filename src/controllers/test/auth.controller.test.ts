import fs from "node:fs/promises";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { makeAuthReq, makeReq, makeRes } from "../../test/helpers.js";

jest.mock("node:fs/promises", () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "uuid-123"),
}));

jest.mock("../../utils/prisma.js", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prisma = require("../../utils/prisma.js").default;
const mockUuid = require("uuid").v4 as jest.Mock;
const {
  register,
  getAuthProfile,
  updateAuthProfile,
  changePassword,
  login,
  logout,
} = require("../auth.controller.js") as typeof import("../auth.controller.js");

const mockFindUnique = prisma.user.findUnique as jest.Mock;
const mockCreate = prisma.user.create as jest.Mock;
const mockUpdate = prisma.user.update as jest.Mock;
const mockHash = bcrypt.hash as jest.Mock;
const mockCompare = bcrypt.compare as jest.Mock;
const mockSign = jwt.sign as jest.Mock;
const mockMkdir = fs.mkdir as jest.Mock;
const mockWriteFile = fs.writeFile as jest.Mock;
const mockUnlink = fs.unlink as jest.Mock;

describe("auth.controller", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUuid.mockReturnValue("uuid-123");
  });

  describe("register", () => {
    it("handles missing fields, invalid role, duplicate email, success, and catch", async () => {
      const res = makeRes();

      await register(makeReq({ body: { name: "A" } }), res);
      expect(res.status).toHaveBeenLastCalledWith(400);

      await register(
        makeReq({ body: { name: "A", email: "a@a.com", password: "secret", role: "companyUser" } }),
        res,
      );
      expect(res.status).toHaveBeenLastCalledWith(400);

      mockFindUnique.mockResolvedValueOnce({ id: "existing" });
      await register(
        makeReq({ body: { name: "A", email: "a@a.com", password: "secret", role: "jobSeeker" } }),
        res,
      );
      expect(res.status).toHaveBeenLastCalledWith(409);

      mockFindUnique.mockResolvedValueOnce(null);
      mockHash.mockResolvedValueOnce("hashed");
      mockCreate.mockResolvedValueOnce({ id: "user-1", role: "jobSeeker" });
      mockSign.mockReturnValueOnce("jwt-token");
      await register(
        makeReq({ body: { name: "A", email: "a@a.com", password: "secret", role: "jobSeeker" } }),
        res,
      );
      expect(res.status).toHaveBeenLastCalledWith(201);

      mockFindUnique.mockRejectedValueOnce(new Error("boom"));
      await register(
        makeReq({ body: { name: "A", email: "a@a.com", password: "secret", role: "jobSeeker" } }),
        res,
      );
      expect(res.status).toHaveBeenLastCalledWith(500);
    });
  });

  describe("getAuthProfile", () => {
    it("returns success, not found, and catch branches", async () => {
      const req = makeAuthReq({ user: { id: "user-1", role: "jobSeeker" } });
      const res = makeRes();

      mockFindUnique.mockResolvedValueOnce({ id: "user-1" });
      await getAuthProfile(req, res);
      expect(res.status).toHaveBeenLastCalledWith(200);

      mockFindUnique.mockResolvedValueOnce(null);
      await getAuthProfile(req, res);
      expect(res.status).toHaveBeenLastCalledWith(404);

      mockFindUnique.mockRejectedValueOnce(new Error("boom"));
      await getAuthProfile(req, res);
      expect(res.status).toHaveBeenLastCalledWith(500);
    });
  });

  describe("updateAuthProfile", () => {
    it("validates empty fields", async () => {
      const res = makeRes();

      await updateAuthProfile(makeAuthReq({ body: { name: "   " } }), res);
      expect(res.status).toHaveBeenLastCalledWith(400);

      await updateAuthProfile(makeAuthReq({ body: { phone: "  " } }), res);
      expect(res.status).toHaveBeenLastCalledWith(400);
    });

    it("updates without a file and with a file, then handles catch", async () => {
      const req = makeAuthReq({
        user: { id: "user-1", role: "jobSeeker" },
        body: { name: "New", phone: "123" },
      });
      const res = makeRes();

      mockUpdate.mockResolvedValueOnce({ id: "user-1" });
      await updateAuthProfile(req, res);
      expect(mockUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({ data: { name: "New", phone: "123" } }),
      );
      expect(res.status).toHaveBeenLastCalledWith(200);

      mockFindUnique.mockResolvedValueOnce({ avatar: "/uploads/avatars/old.png" });
      mockUnlink.mockResolvedValueOnce(undefined);
      mockMkdir.mockResolvedValueOnce(undefined);
      mockWriteFile.mockResolvedValueOnce(undefined);
      mockUpdate.mockResolvedValueOnce({ id: "user-1", avatar: "/uploads/avatars/uuid-123.png" });
      await updateAuthProfile(
        makeAuthReq({
          user: { id: "user-1", role: "jobSeeker" },
          body: { name: "New" },
          file: {
            originalname: "avatar.png",
            buffer: Buffer.from("img"),
          } as Express.Multer.File,
        }),
        res,
      );
      expect(mockUnlink).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();
      expect(mockUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ avatar: "/uploads/avatars/uuid-123.png" }),
        }),
      );

      mockFindUnique.mockResolvedValueOnce({ avatar: "/uploads/avatars/missing.png" });
      mockUnlink.mockRejectedValueOnce(Object.assign(new Error("missing"), { code: "ENOENT" }));
      mockMkdir.mockResolvedValueOnce(undefined);
      mockWriteFile.mockResolvedValueOnce(undefined);
      mockUpdate.mockResolvedValueOnce({ id: "user-1", avatar: "/uploads/avatars/uuid-123.png" });
      await updateAuthProfile(
        makeAuthReq({
          user: { id: "user-1", role: "jobSeeker" },
          body: {},
          file: {
            originalname: "avatar.png",
            buffer: Buffer.from("img"),
          } as Express.Multer.File,
        }),
        res,
      );
      expect(res.status).toHaveBeenLastCalledWith(200);

      mockMkdir.mockRejectedValueOnce(new Error("boom"));
      await updateAuthProfile(
        makeAuthReq({
          user: { id: "user-1", role: "jobSeeker" },
          body: {},
          file: {
            originalname: "avatar.png",
            buffer: Buffer.from("img"),
          } as Express.Multer.File,
        }),
        res,
      );
      expect(res.status).toHaveBeenLastCalledWith(500);
    });
  });

  describe("changePassword", () => {
    it("covers validation, lookup, invalid password, success, and catch", async () => {
      const res = makeRes();

      await changePassword(makeAuthReq({ body: {} }), res);
      expect(res.status).toHaveBeenLastCalledWith(400);

      await changePassword(makeAuthReq({ body: { currentPassword: "old", newPassword: "123" } }), res);
      expect(res.status).toHaveBeenLastCalledWith(400);

      mockFindUnique.mockResolvedValueOnce(null);
      await changePassword(makeAuthReq({ body: { currentPassword: "old", newPassword: "123456" } }), res);
      expect(res.status).toHaveBeenLastCalledWith(404);

      mockFindUnique.mockResolvedValueOnce({ id: "user-1", passwordHash: "hash" });
      mockCompare.mockResolvedValueOnce(false);
      await changePassword(makeAuthReq({ body: { currentPassword: "old", newPassword: "123456" } }), res);
      expect(res.status).toHaveBeenLastCalledWith(401);

      mockFindUnique.mockResolvedValueOnce({ id: "user-1", passwordHash: "hash" });
      mockCompare.mockResolvedValueOnce(true);
      mockHash.mockResolvedValueOnce("new-hash");
      mockUpdate.mockResolvedValueOnce({ id: "user-1" });
      await changePassword(makeAuthReq({ body: { currentPassword: "old", newPassword: "123456" } }), res);
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { passwordHash: "new-hash" },
      });
      expect(res.status).toHaveBeenLastCalledWith(200);

      mockFindUnique.mockRejectedValueOnce(new Error("boom"));
      await changePassword(
        makeAuthReq({
          user: { id: "user-1", role: "jobSeeker" },
          body: { currentPassword: "old", newPassword: "123456" },
        }),
        res,
      );
      expect(res.status).toHaveBeenLastCalledWith(500);
    });
  });

  describe("login", () => {
    it("covers validation, invalid credentials, success, and catch", async () => {
      const res = makeRes();

      await login(makeReq({ body: {} }), res);
      expect(res.status).toHaveBeenLastCalledWith(400);

      mockFindUnique.mockResolvedValueOnce(null);
      await login(makeReq({ body: { email: "a@a.com", password: "secret" } }), res);
      expect(res.status).toHaveBeenLastCalledWith(401);

      mockFindUnique.mockResolvedValueOnce({ id: "user-1", role: "jobSeeker", passwordHash: "hash" });
      mockCompare.mockResolvedValueOnce(false);
      await login(makeReq({ body: { email: "a@a.com", password: "secret" } }), res);
      expect(res.status).toHaveBeenLastCalledWith(401);

      mockFindUnique.mockResolvedValueOnce({ id: "user-1", role: "jobSeeker", passwordHash: "hash" });
      mockCompare.mockResolvedValueOnce(true);
      mockSign.mockReturnValueOnce("jwt-token");
      await login(makeReq({ body: { email: "a@a.com", password: "secret" } }), res);
      expect(res.status).toHaveBeenLastCalledWith(200);

      mockFindUnique.mockRejectedValueOnce(new Error("boom"));
      await login(makeReq({ body: { email: "a@a.com", password: "secret" } }), res);
      expect(res.status).toHaveBeenLastCalledWith(500);
    });
  });

  describe("logout", () => {
    it("returns success and catch branches", async () => {
      const res = makeRes();

      await logout(makeAuthReq(), res);
      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.status).toHaveBeenLastCalledWith(200);

      const throwingRes = makeRes();
      (throwingRes.clearCookie as jest.Mock).mockImplementationOnce(() => {
        throw new Error("boom");
      });
      await logout(makeAuthReq(), throwingRes);
      expect(throwingRes.status).toHaveBeenLastCalledWith(500);
    });
  });
});
