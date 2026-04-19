import { Request, Response } from "express";
import type prismaType from "../../utils/prisma.js";
import type {
  getCompanies as GetCompaniesType,
  getCompany as GetCompanyType,
  getJobsInCompany as GetJobsInCompanyType,
} from "../companies.controller.js";

// ── Mock prisma BEFORE any require() ─────────────────────────────────────────
jest.mock("../../utils/prisma.js", () => ({
  __esModule: true,
  default: {
    companyProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    jobListing: {
      findMany: jest.fn(),
    },
  },
}));

// ── Load mocked modules via require() ────────────────────────────────────────
const prisma = require("../../utils/prisma.js").default as typeof prismaType;
const { getCompanies, getCompany, getJobsInCompany } = require(
  "../companies.controller.js",
) as {
  getCompanies: typeof GetCompaniesType;
  getCompany: typeof GetCompanyType;
  getJobsInCompany: typeof GetJobsInCompanyType;
};

// ── Typed mock helpers ────────────────────────────────────────────────────────
const mockProfileFindMany = prisma.companyProfile.findMany as jest.MockedFunction<
  typeof prisma.companyProfile.findMany
>;
const mockProfileFindUnique = prisma.companyProfile.findUnique as jest.MockedFunction<
  typeof prisma.companyProfile.findUnique
>;
const mockJobFindMany = prisma.jobListing.findMany as jest.MockedFunction<
  typeof prisma.jobListing.findMany
>;

// ── Shared helpers ────────────────────────────────────────────────────────────
function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as unknown as Request;
}

function makeRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
const fakeCompany = {
  id: "profile-abc",
  companyUserId: "user-123",
  description: "We build great software",
  logo: "https://example.com/logo.png",
  website: "https://example.com",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  companyUser: {
    id: "user-123",
    name: "Tech Corp",
    email: "hr@techcorp.com",
    avatar: null,
  },
};

const fakeJob = {
  id: "job-001",
  companyId: "profile-abc",
  title: "Frontend Developer",
  type: "full_time" as const,
  location: "Bangkok",
  description: "Build cool UIs",
  requirements: "3+ years React",
  qualifications: "Bachelor degree",
  salary: "50,000 THB",
  attachment: null,
  isClosed: false,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
};

// ─────────────────────────────────────────────────────────────────────────────
describe("getCompanies", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with all companies when no query", async () => {
    mockProfileFindMany.mockResolvedValueOnce([fakeCompany] as any);
    const req = makeReq({ query: {} });
    const res = makeRes();

    await getCompanies(req, res);

    expect(mockProfileFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Companies" }),
    );
  });

  it("filters by name when ?q= is provided", async () => {
    mockProfileFindMany.mockResolvedValueOnce([fakeCompany] as any);
    const req = makeReq({ query: { q: "tech" } });
    const res = makeRes();

    await getCompanies(req, res);

    expect(mockProfileFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyUser: {
            name: { contains: "tech", mode: "insensitive" },
          },
        },
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 200 with empty array when no companies exist", async () => {
    mockProfileFindMany.mockResolvedValueOnce([] as any);
    const req = makeReq({ query: {} });
    const res = makeRes();

    await getCompanies(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: [] }),
    );
  });

  it("returns 500 when prisma throws", async () => {
    mockProfileFindMany.mockRejectedValueOnce(new Error("DB error"));
    const req = makeReq({ query: {} });
    const res = makeRes();

    await getCompanies(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Server error" }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getCompany", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with the company when found", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeCompany as any);
    const req = makeReq({ params: { companyId: "profile-abc" } });
    const res = makeRes();

    await getCompany(req, res);

    expect(mockProfileFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "profile-abc" } }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Company" }),
    );
  });

  it("returns 404 when company does not exist", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(null);
    const req = makeReq({ params: { companyId: "non-existent" } });
    const res = makeRes();

    await getCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Company not found" }),
    );
  });

  it("returns 500 when prisma throws", async () => {
    mockProfileFindUnique.mockRejectedValueOnce(new Error("DB error"));
    const req = makeReq({ params: { companyId: "profile-abc" } });
    const res = makeRes();

    await getCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Server error" }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getJobsInCompany", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with open jobs when company exists", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeCompany as any);
    mockJobFindMany.mockResolvedValueOnce([fakeJob] as any);
    const req = makeReq({ params: { companyId: "profile-abc" } });
    const res = makeRes();

    await getJobsInCompany(req, res);

    // Must only show open jobs
    expect(mockJobFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyId: "profile-abc", isClosed: false },
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: [fakeJob] }),
    );
  });

  it("returns 200 with empty array when company has no open jobs", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeCompany as any);
    mockJobFindMany.mockResolvedValueOnce([] as any);
    const req = makeReq({ params: { companyId: "profile-abc" } });
    const res = makeRes();

    await getJobsInCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: [] }),
    );
  });

  it("returns 404 when company does not exist", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(null);
    const req = makeReq({ params: { companyId: "non-existent" } });
    const res = makeRes();

    await getJobsInCompany(req, res);

    expect(mockJobFindMany).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Company not found" }),
    );
  });

  it("returns 500 when prisma throws", async () => {
    mockProfileFindUnique.mockRejectedValueOnce(new Error("DB error"));
    const req = makeReq({ params: { companyId: "profile-abc" } });
    const res = makeRes();

    await getJobsInCompany(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Server error" }),
    );
  });
});