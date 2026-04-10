import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.js";
import type prismaType from "../utils/prisma.js";
import type {
  getProfile as GetProfileType,
  updateProfile as UpdateProfileType,
} from "../controllers/company.controller.js"

jest.mock("../utils/prisma.js", () => ({
  __esModule: true,
  default: {
    companyProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const prisma = require("../utils/prisma.js").default as typeof prismaType;
const { getProfile, updateProfile } = require("../controllers/company.controller") as {
  getProfile: typeof GetProfileType;
  updateProfile: typeof UpdateProfileType;
};
// ── Typed mock helpers ────────────────────────────────────────────────────────
const mockFindUnique = prisma.companyProfile.findUnique as jest.MockedFunction<
  typeof prisma.companyProfile.findUnique
>;
const mockUpdate = prisma.companyProfile.update as jest.MockedFunction<
  typeof prisma.companyProfile.update
>;

// ── Shared test helpers ───────────────────────────────────────────────────────

/** Build a minimal AuthenticatedRequest with the given user id */
function makeReq(
  overrides: Partial<AuthenticatedRequest> = {}
): AuthenticatedRequest {
  return {
    user: { id: "user-123", role: "company" },
    body: {},
    params: {},
    ...overrides,
  } as unknown as AuthenticatedRequest;
}

/** Build a spy-based mock Response */
function makeRes(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
const fakeProfile = {
  id: "profile-abc",
  userId: "user-123",
  description: "We build great software",
  logo: "https://cdn.example.com/logo.png",
  website: "https://example.com",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-06-01T00:00:00Z"),
};

// ─────────────────────────────────────────────────────────────────────────────
describe("getProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with the company profile when found", async () => {
    mockFindUnique.mockResolvedValueOnce(fakeProfile);

    const req = makeReq();
    const res = makeRes();

    await getProfile(req, res);

    // Prisma was called with the logged-in user's id
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { userId: "user-123" },
    });

    // Response shape: { success: true, message, data }
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Company profile",
      data: fakeProfile,
    });
  });

  it("returns 404 when no profile exists for the user", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const req = makeReq();
    const res = makeRes();

    await getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Profile not found" })
    );
  });

  it("returns 500 when prisma throws an unexpected error", async () => {
    mockFindUnique.mockRejectedValueOnce(new Error("DB connection lost"));

    const req = makeReq();
    const res = makeRes();

    await getProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Server error" })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("updateProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  const updateBody = {
    description: "Updated description",
    logo: "https://cdn.example.com/new-logo.png",
    website: "https://new.example.com",
  };

  it("returns 200 with updated profile when update succeeds", async () => {
    const updatedProfile = { ...fakeProfile, ...updateBody };
    mockUpdate.mockResolvedValueOnce(updatedProfile);

    const req = makeReq({ body: updateBody });
    const res = makeRes();

    await updateProfile(req, res);

    // Prisma update called with the user id as the where clause
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { userId: "user-123" },
      data: {
        description: updateBody.description,
        logo: updateBody.logo,
        website: updateBody.website,
      },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Profile updated",
      data: updatedProfile,
    });
  });

  it("only sends fields that were provided in the body", async () => {
    const partialBody = { description: "Only updating description" };
    const updatedProfile = { ...fakeProfile, description: partialBody.description };
    mockUpdate.mockResolvedValueOnce(updatedProfile);

    const req = makeReq({ body: partialBody });
    const res = makeRes();

    await updateProfile(req, res);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: "Only updating description" }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 500 when prisma throws an unexpected error", async () => {
    mockUpdate.mockRejectedValueOnce(new Error("Unique constraint failed"));

    const req = makeReq({ body: updateBody });
    const res = makeRes();

    await updateProfile(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Server error" })
    );
  });
});