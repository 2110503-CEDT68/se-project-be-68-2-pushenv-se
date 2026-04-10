import { Response } from "express";
import fs from "node:fs/promises";
import type { Express } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.js";
import type prismaType from "../utils/prisma.js";
import type {
  getMe as GetMeType,
  updateMe as UpdateMeType,
} from "../controllers/user.controller.js";

jest.mock("node:fs/promises", () => ({
  __esModule: true,
  default: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

jest.mock("uuid", () => ({
  __esModule: true,
  v4: jest.fn(() => "generated-avatar-id"),
}));

jest.mock("../utils/prisma.js", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prisma = require("../utils/prisma.js").default as typeof prismaType;
const { getMe, updateMe } = require("../controllers/user.controller") as {
  getMe: typeof GetMeType;
  updateMe: typeof UpdateMeType;
};

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<
  typeof prisma.user.findUnique
>;
const mockUpdate = prisma.user.update as jest.MockedFunction<
  typeof prisma.user.update
>;

function makeReq(
  overrides: Partial<AuthenticatedRequest> = {},
): AuthenticatedRequest {
  return {
    user: { id: "user-123", role: "user" },
    body: {},
    params: {},
    ...overrides,
  } as unknown as AuthenticatedRequest;
}

function makeRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

const safeUserProfile = {
  id: "user-123",
  name: "Alice",
  email: "alice@example.com",
  phone: "0812345678",
  avatar: "/uploads/avatars/avatar.png",
};

const fileUpload = {
  fieldname: "avatar",
  originalname: "avatar.png",
  encoding: "7bit",
  mimetype: "image/png",
  size: 11,
  stream: undefined as unknown as NodeJS.ReadableStream,
  destination: "",
  filename: "",
  path: "",
  buffer: Buffer.from("image-bytes"),
} as Express.Multer.File;

describe("getMe", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns only safe profile fields", async () => {
    mockFindUnique.mockResolvedValueOnce(
      safeUserProfile as Awaited<ReturnType<typeof prisma.user.findUnique>>,
    );

    const req = makeReq();
    const res = makeRes();

    await getMe(req, res);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: "user-123" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
      },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User get",
      data: safeUserProfile,
    });
  });
});

describe("updateMe", () => {
  beforeEach(() => jest.clearAllMocks());

  it("allows partial updates without requiring phone", async () => {
    mockUpdate.mockResolvedValueOnce(
      {
        ...safeUserProfile,
        name: "Updated Alice",
      } as Awaited<ReturnType<typeof prisma.user.update>>,
    );

    const req = makeReq({
      body: { name: "Updated Alice" },
    });
    const res = makeRes();

    await updateMe(req, res);

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-123" },
      data: { name: "Updated Alice" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
      },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User updated",
      data: {
        ...safeUserProfile,
        name: "Updated Alice",
      },
    });
  });

  it("allows avatar-only updates", async () => {
    mockUpdate.mockResolvedValueOnce(
      {
        ...safeUserProfile,
        avatar: "/uploads/avatars/new-avatar.png",
      } as Awaited<ReturnType<typeof prisma.user.update>>,
    );

    const req = makeReq({
      file: fileUpload,
    });
    const res = makeRes();

    await updateMe(req, res);

    expect(mockedFs.mkdir).toHaveBeenCalled();
    expect(mockedFs.writeFile).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-123" },
      data: expect.objectContaining({
        avatar: expect.stringMatching(/^\/uploads\/avatars\/.+\.png$/),
      }),
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
      },
    });
  });

  it("does not expose passwordHash in the response payload", async () => {
    mockUpdate.mockResolvedValueOnce(
      safeUserProfile as Awaited<ReturnType<typeof prisma.user.update>>,
    );

    const req = makeReq({
      body: { phone: "0899999999" },
    });
    const res = makeRes();

    await updateMe(req, res);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User updated",
      data: expect.not.objectContaining({
        passwordHash: expect.anything(),
      }),
    });
  });
});
