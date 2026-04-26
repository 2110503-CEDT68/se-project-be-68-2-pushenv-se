import { Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.js";
import type prismaType from "../../utils/prisma.js";
import type {
  getProfile as GetProfileType,
  updateProfile as UpdateProfileType,
  getCompanyEvents as GetCompanyEventsType,
  createJob as CreateJobType,
  updateJob as UpdateJobType,
  closeJob as CloseJobType,
  deleteJob as DeleteJobType,
} from "../company.controller.js";

jest.mock("../../utils/prisma.js", () => ({
  __esModule: true,
  default: {
    companyProfile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
    },
    jobListing: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const prisma = require("../../utils/prisma.js").default;
const {
  getProfile,
  updateProfile,
  getCompanyEvents,
  createJob,
  updateJob,
  closeJob,
  deleteJob,
} = require("../company.controller.js") as {
  getProfile: typeof GetProfileType;
  updateProfile: typeof UpdateProfileType;
  getCompanyEvents: typeof GetCompanyEventsType;
  createJob: typeof CreateJobType;
  updateJob: typeof UpdateJobType;
  closeJob: typeof CloseJobType;
  deleteJob: typeof DeleteJobType;
};

const mockProfileFindUnique = prisma.companyProfile.findUnique as jest.MockedFunction<typeof prisma.companyProfile.findUnique>;
const mockProfileUpdate = prisma.companyProfile.update as jest.MockedFunction<typeof prisma.companyProfile.update>;
const mockEventFindMany = prisma.event.findMany as jest.MockedFunction<typeof prisma.event.findMany>;
const mockJobCreate = prisma.jobListing.create as jest.MockedFunction<typeof prisma.jobListing.create>;
const mockJobFindFirst = prisma.jobListing.findFirst as jest.MockedFunction<typeof prisma.jobListing.findFirst>;
const mockJobUpdate = prisma.jobListing.update as jest.MockedFunction<typeof prisma.jobListing.update>;
const mockJobDelete = prisma.jobListing.delete as jest.MockedFunction<typeof prisma.jobListing.delete>;

function makeReq(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
  return {
    user: { id: "user-123", role: "company" },
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

const fakeProfile = {
  id: "profile-abc",
  companyUserId: "user-123",
  description: "We build great software",
  logo: "https://cdn.example.com/logo.png",
  website: "https://example.com",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-06-01T00:00:00Z"),
};

const fakeEvent = {
  id: "event-001",
  name: "Job Fair 2024",
  description: "Annual job fair",
  location: "Bangkok",
  startDate: new Date("2024-11-01"),
  endDate: new Date("2024-11-02"),
  banner: null,
  isPublished: true,
  createdBy: "admin-001",
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
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

// ── getProfile ────────────────────────────────────────────────────────────────
describe("getProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with company profile when found", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeProfile as Awaited<ReturnType<typeof prisma.companyProfile.findUnique>>);
    const req = makeReq();
    const res = makeRes();
    await getProfile(req, res);
    expect(mockProfileFindUnique).toHaveBeenCalledWith({ where: { companyUserId: "user-123" } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Company profile", data: fakeProfile });
  });

  it("returns 404 when profile does not exist", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(null);
    const req = makeReq();
    const res = makeRes();
    await getProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Profile not found" }));
  });

  it("returns 500 when prisma throws", async () => {
    mockProfileFindUnique.mockRejectedValueOnce(new Error("DB error"));
    const req = makeReq();
    const res = makeRes();
    await getProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Server error" }));
  });
});

// ── updateProfile ─────────────────────────────────────────────────────────────
describe("updateProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  const updateBody = { description: "Updated description", logo: "https://cdn.example.com/new-logo.png", website: "https://new.example.com" };

  it("returns 200 with updated profile", async () => {
    const updatedProfile = { ...fakeProfile, ...updateBody };
    mockProfileUpdate.mockResolvedValueOnce(updatedProfile as Awaited<ReturnType<typeof prisma.companyProfile.update>>);
    const req = makeReq({ body: updateBody });
    const res = makeRes();
    await updateProfile(req, res);
    expect(mockProfileUpdate).toHaveBeenCalledWith({ where: { companyUserId: "user-123" }, data: { description: updateBody.description, logo: updateBody.logo, website: updateBody.website } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Profile updated", data: updatedProfile });
  });

  it("returns 200 with partial body update", async () => {
    const partialBody = { description: "Only description" };
    mockProfileUpdate.mockResolvedValueOnce({ ...fakeProfile, ...partialBody } as Awaited<ReturnType<typeof prisma.companyProfile.update>>);
    const req = makeReq({ body: partialBody });
    const res = makeRes();
    await updateProfile(req, res);
    expect(mockProfileUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ description: "Only description" }) }));
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("returns 500 when prisma throws", async () => {
    mockProfileUpdate.mockRejectedValueOnce(new Error("DB error"));
    const req = makeReq({ body: updateBody });
    const res = makeRes();
    await updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Server error" }));
  });
});

// ── getCompanyEvents ──────────────────────────────────────────────────────────
describe("getCompanyEvents", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with events linked to the company", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeProfile as Awaited<ReturnType<typeof prisma.companyProfile.findUnique>>);
    mockEventFindMany.mockResolvedValueOnce([fakeEvent] as Awaited<ReturnType<typeof prisma.event.findMany>>);
    const req = makeReq();
    const res = makeRes();
    await getCompanyEvents(req, res);
    expect(mockEventFindMany).toHaveBeenCalledWith({ where: { companies: { some: { companyId: "profile-abc" } } }, orderBy: { startDate: "asc" } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Company events", data: [fakeEvent] });
  });

  it("returns 200 with empty array when company has no events", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeProfile as Awaited<ReturnType<typeof prisma.companyProfile.findUnique>>);
    mockEventFindMany.mockResolvedValueOnce([] as Awaited<ReturnType<typeof prisma.event.findMany>>);
    const req = makeReq();
    const res = makeRes();
    await getCompanyEvents(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: [] }));
  });

  it("returns 404 when company profile does not exist", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(null);
    const req = makeReq();
    const res = makeRes();
    await getCompanyEvents(req, res);
    expect(mockEventFindMany).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Profile not found" }));
  });

  it("returns 500 when prisma throws", async () => {
    mockProfileFindUnique.mockRejectedValueOnce(new Error("DB error"));
    const req = makeReq();
    const res = makeRes();
    await getCompanyEvents(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Server error" }));
  });
});

// ── createJob ─────────────────────────────────────────────────────────────────
describe("createJob", () => {
  beforeEach(() => jest.clearAllMocks());

  const jobBody = { title: "Frontend Developer", type: "full_time", location: "Bangkok", description: "Build cool UIs", requirements: "3+ years React", qualifications: "Bachelor degree", salary: "50,000 THB" };

  it("returns 201 with the created job", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeProfile as Awaited<ReturnType<typeof prisma.companyProfile.findUnique>>);
    mockJobCreate.mockResolvedValueOnce(fakeJob as Awaited<ReturnType<typeof prisma.jobListing.create>>);
    const req = makeReq({ body: jobBody });
    const res = makeRes();
    await createJob(req, res);
    expect(mockJobCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ companyId: "profile-abc", title: jobBody.title, type: jobBody.type, location: jobBody.location }) });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Job created", data: fakeJob });
  });

  it("returns 404 when company profile does not exist", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(null);
    const req = makeReq({ body: jobBody });
    const res = makeRes();
    await createJob(req, res);
    expect(mockJobCreate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Profile not found" }));
  });

  it("returns 500 when prisma throws", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeProfile as Awaited<ReturnType<typeof prisma.companyProfile.findUnique>>);
    mockJobCreate.mockRejectedValueOnce(new Error("DB error"));
    const req = makeReq({ body: jobBody });
    const res = makeRes();
    await createJob(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Server error" }));
  });
});

// ── updateJob ─────────────────────────────────────────────────────────────────
describe("updateJob", () => {
  beforeEach(() => jest.clearAllMocks());

  const updateBody = { title: "Senior Frontend Developer", salary: "70,000 THB" };

  it("returns 200 with the updated job", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeProfile as Awaited<ReturnType<typeof prisma.companyProfile.findUnique>>);
    mockJobFindFirst.mockResolvedValueOnce(fakeJob as Awaited<ReturnType<typeof prisma.jobListing.findFirst>>);
    mockJobUpdate.mockResolvedValueOnce({ ...fakeJob, ...updateBody } as Awaited<ReturnType<typeof prisma.jobListing.update>>);
    const req = makeReq({ params: { id: "job-001" }, body: updateBody });
    const res = makeRes();
    await updateJob(req, res);
    expect(mockJobFindFirst).toHaveBeenCalledWith({ where: { id: "job-001", companyId: "profile-abc" } });
    expect(mockJobUpdate).toHaveBeenCalledWith({ where: { id: "job-001" }, data: expect.objectContaining({ title: "Senior Frontend Developer" }) });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Job updated", data: { ...fakeJob, ...updateBody } });
  });

  it("returns 404 when company profile does not exist", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(null);
    const req = makeReq({ params: { id: "job-001" }, body: updateBody });
    const res = makeRes();
    await updateJob(req, res);
    expect(mockJobFindFirst).not.toHaveBeenCalled();
    expect(mockJobUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 404 when job does not belong to this company", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeProfile as Awaited<ReturnType<typeof prisma.companyProfile.findUnique>>);
    mockJobFindFirst.mockResolvedValueOnce(null);
    const req = makeReq({ params: { id: "job-other" }, body: updateBody });
    const res = makeRes();
    await updateJob(req, res);
    expect(mockJobUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Job not found" }));
  });

  it("returns 500 when prisma throws", async () => {
    mockProfileFindUnique.mockRejectedValueOnce(new Error("DB error"));
    const req = makeReq({ params: { id: "job-001" }, body: updateBody });
    const res = makeRes();
    await updateJob(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── closeJob ──────────────────────────────────────────────────────────────────
describe("closeJob", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with isClosed set to true", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeProfile as Awaited<ReturnType<typeof prisma.companyProfile.findUnique>>);
    mockJobFindFirst.mockResolvedValueOnce(fakeJob as Awaited<ReturnType<typeof prisma.jobListing.findFirst>>);
    mockJobUpdate.mockResolvedValueOnce({ ...fakeJob, isClosed: true } as Awaited<ReturnType<typeof prisma.jobListing.update>>);
    const req = makeReq({ params: { id: "job-001" } });
    const res = makeRes();
    await closeJob(req, res);
    expect(mockJobUpdate).toHaveBeenCalledWith({ where: { id: "job-001" }, data: { isClosed: true } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Job closed", data: { ...fakeJob, isClosed: true } });
  });

  it("returns 404 when company profile does not exist", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(null);
    const req = makeReq({ params: { id: "job-001" } });
    const res = makeRes();
    await closeJob(req, res);
    expect(mockJobUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 404 when job does not belong to this company", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeProfile as Awaited<ReturnType<typeof prisma.companyProfile.findUnique>>);
    mockJobFindFirst.mockResolvedValueOnce(null);
    const req = makeReq({ params: { id: "job-other" } });
    const res = makeRes();
    await closeJob(req, res);
    expect(mockJobUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Job not found" }));
  });

  it("returns 500 when prisma throws", async () => {
    mockProfileFindUnique.mockRejectedValueOnce(new Error("DB error"));
    const req = makeReq({ params: { id: "job-001" } });
    const res = makeRes();
    await closeJob(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── deleteJob ─────────────────────────────────────────────────────────────────
describe("deleteJob", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with null data after deletion", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeProfile as Awaited<ReturnType<typeof prisma.companyProfile.findUnique>>);
    mockJobFindFirst.mockResolvedValueOnce(fakeJob as Awaited<ReturnType<typeof prisma.jobListing.findFirst>>);
    mockJobDelete.mockResolvedValueOnce(fakeJob as Awaited<ReturnType<typeof prisma.jobListing.delete>>);
    const req = makeReq({ params: { id: "job-001" } });
    const res = makeRes();
    await deleteJob(req, res);
    expect(mockJobDelete).toHaveBeenCalledWith({ where: { id: "job-001" } });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: "Job deleted", data: null });
  });

  it("returns 404 when company profile does not exist", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(null);
    const req = makeReq({ params: { id: "job-001" } });
    const res = makeRes();
    await deleteJob(req, res);
    expect(mockJobDelete).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 404 when job does not belong to this company", async () => {
    mockProfileFindUnique.mockResolvedValueOnce(fakeProfile as Awaited<ReturnType<typeof prisma.companyProfile.findUnique>>);
    mockJobFindFirst.mockResolvedValueOnce(null);
    const req = makeReq({ params: { id: "job-other" } });
    const res = makeRes();
    await deleteJob(req, res);
    expect(mockJobDelete).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, message: "Job not found" }));
  });

  it("returns 500 when prisma throws", async () => {
    mockProfileFindUnique.mockRejectedValueOnce(new Error("DB error"));
    const req = makeReq({ params: { id: "job-001" } });
    const res = makeRes();
    await deleteJob(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});