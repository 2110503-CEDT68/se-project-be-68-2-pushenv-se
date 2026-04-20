import type { Request } from "express";
import type prismaType from "../../utils/prisma.js";
import { makeReq, makeRes } from "../../test/helpers.js";

jest.mock("../../utils/prisma.js", () => ({
  __esModule: true,
  default: {
    companyProfile: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    jobListing: {
      findMany: jest.fn(),
    },
  },
}));

const prisma = require("../../utils/prisma.js").default as typeof prismaType;
const { getCompanies, getCompany, getJobsInCompany } = require("../companies.controller.js") as
  typeof import("../companies.controller.js");

const mockCompanyFindMany = prisma.companyProfile.findMany as jest.Mock;
const mockCompanyFindUnique = prisma.companyProfile.findUnique as jest.Mock;
const mockCompanyCount = prisma.companyProfile.count as jest.Mock;
const mockJobFindMany = prisma.jobListing.findMany as jest.Mock;

const fakeCompany = {
  id: "company-1",
  companyUserId: "user-1",
  description: "desc",
  logo: null,
  website: null,
  companyUser: {
    id: "user-1",
    name: "Tech Corp",
    email: "hr@example.com",
    avatar: null,
    phone: null,
  },
  eventLinks: [],
};

describe("companies.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCompanies", () => {
    it("uses default pagination and sort", async () => {
      mockCompanyFindMany.mockResolvedValueOnce([fakeCompany]);
      mockCompanyCount.mockResolvedValueOnce(1);

      const req = makeReq<Request>();
      const res = makeRes();

      await getCompanies(req, res);

      expect(mockCompanyFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { updatedAt: "desc" },
          skip: 0,
          take: 10,
        }),
      );
      expect(mockCompanyCount).toHaveBeenCalledWith({ where: {} });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("applies query, pagination, and oldest sort", async () => {
      mockCompanyFindMany.mockResolvedValueOnce([]);
      mockCompanyCount.mockResolvedValueOnce(0);

      const req = makeReq<Request>({
        query: { q: "tech", page: "2", limit: "3", sort: "oldest" } as Request["query"],
      });
      const res = makeRes();

      await getCompanies(req, res);

      expect(mockCompanyFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            companyUser: {
              name: { contains: "tech", mode: "insensitive" },
            },
          },
          orderBy: { updatedAt: "asc" },
          skip: 3,
          take: 3,
        }),
      );
    });

    it("supports alphabetical sorts", async () => {
      mockCompanyFindMany.mockResolvedValue([]);
      mockCompanyCount.mockResolvedValue(0);

      const res = makeRes();

      await getCompanies(
        makeReq<Request>({ query: { sort: "a-z" } as Request["query"] }),
        res,
      );
      expect(mockCompanyFindMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: { companyUser: { name: "asc" } } }),
      );

      await getCompanies(
        makeReq<Request>({ query: { sort: "z-a" } as Request["query"] }),
        res,
      );
      expect(mockCompanyFindMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: { companyUser: { name: "desc" } } }),
      );
    });

    it("returns server error when a query fails", async () => {
      mockCompanyFindMany.mockRejectedValueOnce(new Error("db error"));

      const req = makeReq<Request>();
      const res = makeRes();

      await getCompanies(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: "Server error" }),
      );
    });
  });

  describe("getCompany", () => {
    it("returns the company when found", async () => {
      mockCompanyFindUnique.mockResolvedValueOnce(fakeCompany);

      const req = makeReq<Request>({ params: { companyId: "company-1" } as Request["params"] });
      const res = makeRes();

      await getCompany(req, res);

      expect(mockCompanyFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "company-1" } }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when company is missing", async () => {
      mockCompanyFindUnique.mockResolvedValueOnce(null);

      const req = makeReq<Request>({ params: { companyId: "missing" } as Request["params"] });
      const res = makeRes();

      await getCompany(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns server error on failure", async () => {
      mockCompanyFindUnique.mockRejectedValueOnce(new Error("db error"));

      const req = makeReq<Request>({ params: { companyId: "company-1" } as Request["params"] });
      const res = makeRes();

      await getCompany(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getJobsInCompany", () => {
    it("returns open jobs for an existing company", async () => {
      mockCompanyFindUnique.mockResolvedValueOnce({ id: "company-1" });
      mockJobFindMany.mockResolvedValueOnce([{ id: "job-1", isClosed: false }]);

      const req = makeReq<Request>({ params: { companyId: "company-1" } as Request["params"] });
      const res = makeRes();

      await getJobsInCompany(req, res);

      expect(mockJobFindMany).toHaveBeenCalledWith({
        where: { companyId: "company-1", isClosed: false },
        orderBy: { createdAt: "desc" },
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when the company is missing", async () => {
      mockCompanyFindUnique.mockResolvedValueOnce(null);

      const req = makeReq<Request>({ params: { companyId: "missing" } as Request["params"] });
      const res = makeRes();

      await getJobsInCompany(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("returns server error when the query fails", async () => {
      mockCompanyFindUnique.mockRejectedValueOnce(new Error("db error"));

      const req = makeReq<Request>({ params: { companyId: "company-1" } as Request["params"] });
      const res = makeRes();

      await getJobsInCompany(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
