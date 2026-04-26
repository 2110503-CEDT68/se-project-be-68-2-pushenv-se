import type { Request } from "express";
import type prismaType from "../../utils/prisma.js";
import { makeAuthReq, makeReq, makeRes } from "../../test/helpers.js";
jest.mock("../../utils/prisma.js", () => ({
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

const prisma = require("../../utils/prisma.js").default;
const {
  getJob,
  adminGetCompanyJobs,
  adminCreateJob,
  adminGetJob,
  adminUpdateJob,
  adminCloseJob,
  adminOpenJob,
  adminDeleteJob,
} = require("../jobs.controller.js") as typeof import("../jobs.controller.js");
const { getCompanyJobs } =
  require("../companies.controller.js") as typeof import("../companies.controller.js");
const mockCompanyFindUnique = prisma.companyProfile.findUnique as jest.Mock;
const mockJobFindMany = prisma.jobListing.findMany as jest.Mock;
const mockJobFindUnique = prisma.jobListing.findUnique as jest.Mock;
const mockJobCreate = prisma.jobListing.create as jest.Mock;
const mockJobUpdate = prisma.jobListing.update as jest.Mock;
const mockJobDelete = prisma.jobListing.delete as jest.Mock;

describe("jobs.controller", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("covers getCompanyJobs branches", async () => {
    const req = makeReq<Request>({
      params: { companyId: "company-1" } as Request["params"],
    });
    const res = makeRes();

    mockCompanyFindUnique.mockResolvedValueOnce(null);
    await getCompanyJobs(req, res);
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockCompanyFindUnique.mockResolvedValueOnce({ id: "company-1" });
    mockJobFindMany.mockResolvedValueOnce([{ id: "job-1" }]);
    await getCompanyJobs(req, res);
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockCompanyFindUnique.mockRejectedValueOnce(new Error("boom"));
    await getCompanyJobs(req, res);
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers getJob branches for missing, closed, admin, and catch", async () => {
    const res = makeRes();

    mockJobFindUnique.mockResolvedValueOnce(null);
    await getJob(
      makeAuthReq({
        params: { id: "job-1" },
        user: { id: "u1", role: "jobSeeker" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockJobFindUnique.mockResolvedValueOnce({ id: "job-1", isClosed: true });
    await getJob(
      makeAuthReq({
        params: { id: "job-1" },
        user: { id: "u1", role: "jobSeeker" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockJobFindUnique.mockResolvedValueOnce({ id: "job-1", isClosed: true });
    await getJob(
      makeAuthReq({
        params: { id: "job-1" },
        user: { id: "a1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockJobFindUnique.mockRejectedValueOnce(new Error("boom"));
    await getJob(
      makeAuthReq({
        params: { id: "job-1" },
        user: { id: "u1", role: "jobSeeker" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers adminGetCompanyJobs and adminGetCompanyJob branches", async () => {
    const req = makeAuthReq({
      params: { companyId: "company-1", id: "job-1" },
      user: { id: "a1", role: "systemAdmin" },
    });
    const res = makeRes();

    // --- RESTORED adminGetCompanyJobs 404 AND 200 PATHS ---
    mockCompanyFindUnique.mockResolvedValueOnce(null);
    await adminGetCompanyJobs(req, res);
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockCompanyFindUnique.mockResolvedValueOnce({ id: "company-1" });
    mockJobFindMany.mockResolvedValueOnce([{ id: "job-1" }]);
    await adminGetCompanyJobs(req, res);
    expect(res.status).toHaveBeenLastCalledWith(200);
    // ------------------------------------------------------

    mockCompanyFindUnique.mockRejectedValueOnce(new Error("boom"));
    await adminGetCompanyJobs(req, res);
    expect(res.status).toHaveBeenLastCalledWith(500);

    mockJobFindUnique.mockResolvedValueOnce(null);
    await adminGetJob(
      makeAuthReq({
        params: { id: "job-1" },
        user: { id: "a1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockJobFindUnique.mockResolvedValueOnce({ id: "job-1", isClosed: false });
    await adminGetJob(
      makeAuthReq({
        params: { id: "job-1" },
        user: { id: "a1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockJobFindUnique.mockRejectedValueOnce(new Error("boom"));
    await adminGetJob(
      makeAuthReq({
        params: { id: "job-1" },
        user: { id: "a1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers adminCreateCompanyJob branches", async () => {
    const req = makeAuthReq({
      params: { companyId: "company-1" },
      user: { id: "a1", role: "systemAdmin" },
    });
    const res = makeRes();

    mockCompanyFindUnique.mockResolvedValueOnce(null);
    await adminCreateJob(req, res);
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockCompanyFindUnique.mockResolvedValueOnce({ id: "company-1" });
    await adminCreateJob(
      makeAuthReq({
        params: { companyId: "company-1" },
        body: {},
        user: { id: "a1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(400);

    mockCompanyFindUnique.mockResolvedValueOnce({ id: "company-1" });
    mockJobCreate.mockResolvedValueOnce({ id: "job-1" });
    await adminCreateJob(
      makeAuthReq({
        params: { companyId: "company-1" },
        body: {
          title: "Dev",
          type: "full_time",
          location: "Bangkok",
          description: "desc",
        },
        user: { id: "a1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(201);

    mockCompanyFindUnique.mockRejectedValueOnce(new Error("boom"));
    await adminCreateJob(req, res);
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers adminUpdateJob branches and all optional fields", async () => {
    const res = makeRes();

    mockJobFindUnique.mockResolvedValueOnce(null);
    await adminUpdateJob(
      makeAuthReq({
        params: { id: "job-1" },
        user: { id: "a1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockJobFindUnique.mockResolvedValueOnce({ id: "job-1" });
    mockJobUpdate.mockResolvedValueOnce({ id: "job-1" });
    await adminUpdateJob(
      makeAuthReq({
        params: { id: "job-1" },
        body: {
          title: "Dev",
          type: "contract",
          location: "Remote",
          description: "desc",
          requirements: "req",
          qualifications: "qual",
          salary: "1000",
          attachment: "file",
        },
        user: { id: "a1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockJobUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: {
          title: "Dev",
          type: "contract",
          location: "Remote",
          description: "desc",
          requirements: "req",
          qualifications: "qual",
          salary: "1000",
          attachment: "file",
        },
      }),
    );

    mockJobFindUnique.mockResolvedValueOnce({ id: "job-1" });
    mockJobUpdate.mockResolvedValueOnce({ id: "job-1" });
    await adminUpdateJob(
      makeAuthReq({
        params: { id: "job-1" },
        body: {},
        user: { id: "a1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockJobUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: {} }),
    );

    mockJobFindUnique.mockRejectedValueOnce(new Error("boom"));
    await adminUpdateJob(
      makeAuthReq({
        params: { id: "job-1" },
        user: { id: "a1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers close/open helper branches", async () => {
    const res = makeRes();
    const req = makeAuthReq({
      params: { id: "job-1" },
      user: { id: "a1", role: "systemAdmin" },
    });

    mockJobFindUnique.mockResolvedValueOnce(null);
    await adminCloseJob(req, res);
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockJobFindUnique.mockResolvedValueOnce({ id: "job-1" });
    mockJobUpdate.mockResolvedValueOnce({ id: "job-1", isClosed: true });
    await adminCloseJob(req, res);
    expect(mockJobUpdate).toHaveBeenLastCalledWith({
      where: { id: "job-1" },
      data: { isClosed: true },
    });

    mockJobFindUnique.mockResolvedValueOnce({ id: "job-1" });
    mockJobUpdate.mockResolvedValueOnce({ id: "job-1", isClosed: false });
    await adminOpenJob(req, res);
    expect(mockJobUpdate).toHaveBeenLastCalledWith({
      where: { id: "job-1" },
      data: { isClosed: false },
    });

    mockJobFindUnique.mockResolvedValueOnce({ id: "job-1" });
    mockJobUpdate.mockRejectedValueOnce(new Error("boom"));
    await adminOpenJob(req, res);
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers adminDeleteJob branches", async () => {
    const req = makeAuthReq({
      params: { id: "job-1" },
      user: { id: "a1", role: "systemAdmin" },
    });
    const res = makeRes();

    mockJobFindUnique.mockResolvedValueOnce(null);
    await adminDeleteJob(req, res);
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockJobFindUnique.mockResolvedValueOnce({ id: "job-1" });
    mockJobDelete.mockResolvedValueOnce({ id: "job-1" });
    await adminDeleteJob(req, res);
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockJobFindUnique.mockRejectedValueOnce(new Error("boom"));
    await adminDeleteJob(req, res);
    expect(res.status).toHaveBeenLastCalledWith(500);
  });
});
