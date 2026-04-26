import fs from "node:fs/promises";
import type prismaType from "../../utils/prisma.js";
import { makeAuthReq, makeRes } from "../../test/helpers.js";

jest.mock("node:fs/promises", () => ({
  mkdir: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(), // <-- ADDED
}));

jest.mock("uuid", () => ({
  v4: jest.fn(() => "uuid-123"),
}));

jest.mock("../../utils/prisma.js", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    eventRegistration: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const prisma = require("../../utils/prisma.js").default;
const mockUuid = require("uuid").v4 as jest.Mock;
const { getMe, updateMe, deleteMe, getRegistrations, deleteRegistration } =
  require("../user.controller.js") as typeof import("../user.controller.js");

const mockUserFindUnique = prisma.user.findUnique as jest.Mock;
const mockUserUpdate = prisma.user.update as jest.Mock;
const mockUserDelete = prisma.user.delete as jest.Mock;
const mockRegFindMany = prisma.eventRegistration.findMany as jest.Mock;
const mockRegCount = prisma.eventRegistration.count as jest.Mock;
const mockRegFindUnique = prisma.eventRegistration.findUnique as jest.Mock;
const mockRegDelete = prisma.eventRegistration.delete as jest.Mock;
const mockMkdir = fs.mkdir as jest.Mock;
const mockWriteFile = fs.writeFile as jest.Mock;
const mockUnlink = fs.unlink as jest.Mock; // <-- ADDED

describe("user.controller", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockUuid.mockReturnValue("uuid-123");
    jest.spyOn(console, "error").mockImplementation(() => undefined); // Silence console.errors in tests
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("covers getMe branches", async () => {
    const req = makeAuthReq({ user: { id: "user-1", role: "jobSeeker" } });
    const res = makeRes();

    mockUserFindUnique.mockResolvedValueOnce({ id: "user-1" });
    await getMe(req, res);
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockUserFindUnique.mockResolvedValueOnce(null);
    await getMe(req, res);
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockUserFindUnique.mockRejectedValueOnce(new Error("boom"));
    await getMe(req, res);
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers updateMe validation, file branch, and catch", async () => {
    const res = makeRes();

    await updateMe(makeAuthReq({ body: { name: " " } }), res);
    expect(res.status).toHaveBeenLastCalledWith(400);

    await updateMe(makeAuthReq({ body: { phone: " " } }), res);
    expect(res.status).toHaveBeenLastCalledWith(400);

    mockUserUpdate.mockResolvedValueOnce({ id: "user-1" });
    await updateMe(makeAuthReq({ body: { name: "New", phone: "123" } }), res);
    expect(mockUserUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { name: "New", phone: "123" } }),
    );

    // File Provided + User has existing avatar (unlink succeeds)
    mockUserFindUnique.mockResolvedValueOnce({ avatar: "/uploads/avatars/old.png" });
    mockUnlink.mockResolvedValueOnce(undefined);
    mockMkdir.mockResolvedValueOnce(undefined);
    mockWriteFile.mockResolvedValueOnce(undefined);
    mockUserUpdate.mockResolvedValueOnce({
      id: "user-1",
      avatar: "/uploads/avatars/uuid-123.png",
    });
    await updateMe(
      makeAuthReq({
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
    expect(mockUserUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          avatar: "/uploads/avatars/uuid-123.png",
        }),
      }),
    );

    // File Provided + User has existing avatar (unlink throws error, is caught safely)
    mockUserFindUnique.mockResolvedValueOnce({ avatar: "/uploads/avatars/old.png" });
    mockUnlink.mockRejectedValueOnce(Object.assign(new Error("File not found on disk"), { code: "ENOENT" }));
    mockMkdir.mockResolvedValueOnce(undefined);
    mockWriteFile.mockResolvedValueOnce(undefined);
    mockUserUpdate.mockResolvedValueOnce({ id: "user-1" });
    await updateMe(
      makeAuthReq({
        body: {},
        file: {
          originalname: "avatar.png",
          buffer: Buffer.from("img"),
        } as Express.Multer.File,
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(200);

    // File Provided + No existing avatar + mkdir fails -> 500 error
    mockUserFindUnique.mockResolvedValueOnce({ avatar: null });
    mockMkdir.mockRejectedValueOnce(new Error("boom"));
    await updateMe(
      makeAuthReq({
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

  it("covers deleteMe branches", async () => {
    const req = makeAuthReq({ user: { id: "user-1", role: "jobSeeker" } });
    const res = makeRes();

    mockUserFindUnique.mockResolvedValueOnce(null);
    await deleteMe(req, res);
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockUserFindUnique.mockResolvedValueOnce({ id: "user-1" });
    mockUserDelete.mockResolvedValueOnce({ id: "user-1" });
    await deleteMe(req, res);
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockUserFindUnique.mockRejectedValueOnce(new Error("boom"));
    await deleteMe(req, res);
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers getRegistrations defaults, clamping, and catch", async () => {
    const req = makeAuthReq({
      user: { id: "user-1", role: "jobSeeker" },
      query: {},
    });
    const res = makeRes();

    mockRegFindMany.mockResolvedValueOnce([]);
    mockRegCount.mockResolvedValueOnce(0);
    await getRegistrations(req, res);
    expect(mockRegFindMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );

    mockRegFindMany.mockResolvedValueOnce([]);
    mockRegCount.mockResolvedValueOnce(101);
    await getRegistrations(
      makeAuthReq({
        user: { id: "user-1", role: "jobSeeker" },
        query: { page: "0", limit: "1000" },
      }),
      res,
    );
    expect(mockRegFindMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: 0, take: 100 }),
    );

    mockRegFindMany.mockRejectedValueOnce(new Error("boom"));
    await getRegistrations(req, res);
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers deleteRegistration branches", async () => {
    const req = makeAuthReq({
      user: { id: "user-1", role: "jobSeeker" },
      params: { eventId: "event-1" },
    });
    const res = makeRes();

    mockRegFindUnique.mockResolvedValueOnce(null);
    await deleteRegistration(req, res);
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockRegFindUnique.mockResolvedValueOnce({ id: "reg-1" });
    mockRegDelete.mockResolvedValueOnce({ id: "reg-1" });
    await deleteRegistration(req, res);
    expect(mockRegDelete).toHaveBeenCalledWith({ where: { id: "reg-1" } });
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockRegFindUnique.mockRejectedValueOnce(new Error("boom"));
    await deleteRegistration(req, res);
    expect(res.status).toHaveBeenLastCalledWith(500);
  });
});
