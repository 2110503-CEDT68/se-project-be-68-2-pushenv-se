import bcrypt from "bcrypt";
import type prismaType from "../../utils/prisma.js";
import { makeAuthReq, makeRes } from "../../test/helpers.js";

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
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
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    eventCompany: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    eventRegistration: {
      findMany: jest.fn(),
    },
  },
}));

const prisma = require("../../utils/prisma.js").default as typeof prismaType;
const controllers = require("../admin.controller.js") as typeof import("../admin.controller.js");

const mockHash = bcrypt.hash as jest.Mock;
const mockUserFindMany = prisma.user.findMany as jest.Mock;
const mockUserFindUnique = prisma.user.findUnique as jest.Mock;
const mockUserCreate = prisma.user.create as jest.Mock;
const mockUserUpdate = prisma.user.update as jest.Mock;
const mockUserDelete = prisma.user.delete as jest.Mock;
const mockUserCount = prisma.user.count as jest.Mock;
const mockCompanyCreate = prisma.companyProfile.create as jest.Mock;
const mockCompanyFindMany = prisma.companyProfile.findMany as jest.Mock;
const mockCompanyFindUnique = prisma.companyProfile.findUnique as jest.Mock;
const mockCompanyUpdate = prisma.companyProfile.update as jest.Mock;
const mockCompanyCount = prisma.companyProfile.count as jest.Mock;
const mockEventFindMany = prisma.event.findMany as jest.Mock;
const mockEventFindUnique = prisma.event.findUnique as jest.Mock;
const mockEventCreate = prisma.event.create as jest.Mock;
const mockEventUpdate = prisma.event.update as jest.Mock;
const mockEventDelete = prisma.event.delete as jest.Mock;
const mockEventCount = prisma.event.count as jest.Mock;
const mockEventCompanyCreate = prisma.eventCompany.create as jest.Mock;
const mockEventCompanyFindUnique = prisma.eventCompany.findUnique as jest.Mock;
const mockEventCompanyDelete = prisma.eventCompany.delete as jest.Mock;
const mockRegistrationFindMany = prisma.eventRegistration.findMany as jest.Mock;

describe("admin.controller", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("covers getAccounts success and catch", async () => {
    const res = makeRes();

    mockUserFindMany.mockResolvedValueOnce([{ id: "user-1" }]);
    mockUserCount.mockResolvedValueOnce(5);
    await controllers.getAccounts(
      makeAuthReq({
        query: { name: "john", role: "jobSeeker", page: "2", limit: "2" },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockUserFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: "jobSeeker",
          name: { contains: "john", mode: "insensitive" },
        },
        skip: 2,
        take: 2,
      }),
    );
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockUserFindMany.mockRejectedValueOnce(new Error("boom"));
    await controllers.getAccounts(makeAuthReq({ user: { id: "admin-1", role: "systemAdmin" } }), res);
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers createAccount branches", async () => {
    const res = makeRes();

    await controllers.createAccount(makeAuthReq({ body: {}, user: { id: "admin-1", role: "systemAdmin" } }), res);
    expect(res.status).toHaveBeenLastCalledWith(400);

    await controllers.createAccount(
      makeAuthReq({
        body: { name: "A", email: "a@a.com", password: "secret", role: "systemAdmin" },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(400);

    mockUserFindUnique.mockResolvedValueOnce({ id: "existing" });
    await controllers.createAccount(
      makeAuthReq({
        body: { name: "A", email: "a@a.com", password: "secret", role: "jobSeeker" },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(409);

    mockUserFindUnique.mockResolvedValueOnce(null);
    mockHash.mockResolvedValueOnce("hash");
    mockUserCreate.mockResolvedValueOnce({ id: "company-user" });
    mockCompanyCreate.mockResolvedValueOnce({ id: "company-1" });
    await controllers.createAccount(
      makeAuthReq({
        body: { name: "A", email: "a@a.com", password: "secret", role: "companyUser" },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockCompanyCreate).toHaveBeenCalledWith({ data: { companyUserId: "company-user" } });
    expect(res.status).toHaveBeenLastCalledWith(201);

    mockUserFindUnique.mockResolvedValueOnce(null);
    mockHash.mockResolvedValueOnce("hash");
    mockUserCreate.mockResolvedValueOnce({ id: "jobseeker-user" });
    await controllers.createAccount(
      makeAuthReq({
        body: { name: "A", email: "a@a.com", password: "secret", role: "jobSeeker" },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockCompanyCreate).toHaveBeenCalledTimes(1);

    mockUserFindUnique.mockRejectedValueOnce(new Error("boom"));
    await controllers.createAccount(
      makeAuthReq({
        body: { name: "A", email: "a@a.com", password: "secret", role: "jobSeeker" },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers updateAccount branches", async () => {
    const res = makeRes();

    mockUserFindUnique.mockResolvedValueOnce(null);
    await controllers.updateAccount(
      makeAuthReq({ params: { id: "user-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockUserFindUnique.mockResolvedValueOnce({ id: "user-1", email: "old@a.com" });
    mockUserFindUnique.mockResolvedValueOnce({ id: "other" });
    await controllers.updateAccount(
      makeAuthReq({
        params: { id: "user-1" },
        body: { email: "new@a.com" },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(409);

    mockUserFindUnique.mockResolvedValueOnce({ id: "user-1", email: "old@a.com" });
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockHash.mockResolvedValueOnce("new-hash");
    mockUserUpdate.mockResolvedValueOnce({ id: "user-1" });
    await controllers.updateAccount(
      makeAuthReq({
        params: { id: "user-1" },
        body: { name: "New", email: "new@a.com", phone: "123", password: "secret" },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: "New",
          email: "new@a.com",
          phone: "123",
          passwordHash: "new-hash",
        },
      }),
    );

    mockUserFindUnique.mockResolvedValueOnce({ id: "user-1", email: "same@a.com" });
    mockUserUpdate.mockResolvedValueOnce({ id: "user-1" });
    await controllers.updateAccount(
      makeAuthReq({
        params: { id: "user-1" },
        body: { email: "same@a.com" },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockUserUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: { email: "same@a.com" } }),
    );

    mockUserFindUnique.mockResolvedValueOnce({ id: "user-1", email: "same@a.com" });
    mockUserUpdate.mockResolvedValueOnce({ id: "user-1" });
    await controllers.updateAccount(
      makeAuthReq({
        params: { id: "user-1" },
        body: {},
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockUserUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: {} }),
    );

    mockUserFindUnique.mockRejectedValueOnce(new Error("boom"));
    await controllers.updateAccount(
      makeAuthReq({ params: { id: "user-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers deleteAccount branches", async () => {
    const res = makeRes();

    await controllers.deleteAccount(
      makeAuthReq({ params: { id: "admin-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(400);

    mockUserFindUnique.mockResolvedValueOnce(null);
    await controllers.deleteAccount(
      makeAuthReq({ params: { id: "user-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockUserFindUnique.mockResolvedValueOnce({ id: "user-1" });
    mockUserDelete.mockResolvedValueOnce({ id: "user-1" });
    await controllers.deleteAccount(
      makeAuthReq({ params: { id: "user-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockUserFindUnique.mockRejectedValueOnce(new Error("boom"));
    await controllers.deleteAccount(
      makeAuthReq({ params: { id: "user-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers company admin branches", async () => {
    const res = makeRes();

    mockCompanyFindMany.mockResolvedValueOnce([{ id: "company-1" }]);
    mockCompanyCount.mockResolvedValueOnce(1);
    await controllers.getCompanies(
      makeAuthReq({ query: { name: "tech", page: "2", limit: "2" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(mockCompanyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { companyUser: { name: { contains: "tech", mode: "insensitive" } } },
        skip: 2,
        take: 2,
      }),
    );

    mockCompanyFindMany.mockRejectedValueOnce(new Error("boom"));
    await controllers.getCompanies(makeAuthReq({ user: { id: "admin-1", role: "systemAdmin" } }), res);
    expect(res.status).toHaveBeenLastCalledWith(500);

    mockCompanyFindUnique.mockResolvedValueOnce(null);
    await controllers.updateCompany(
      makeAuthReq({ params: { id: "company-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockCompanyFindUnique.mockResolvedValueOnce({ id: "company-1" });
    mockCompanyUpdate.mockResolvedValueOnce({ id: "company-1" });
    await controllers.updateCompany(
      makeAuthReq({
        params: { id: "company-1" },
        body: { description: "desc", website: "https://example.com" },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockCompanyUpdate).toHaveBeenCalledWith({
      where: { id: "company-1" },
      data: { description: "desc", website: "https://example.com" },
    });

    mockCompanyFindUnique.mockResolvedValueOnce({ id: "company-1" });
    mockCompanyUpdate.mockResolvedValueOnce({ id: "company-1" });
    await controllers.updateCompany(
      makeAuthReq({
        params: { id: "company-1" },
        body: {},
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockCompanyUpdate).toHaveBeenLastCalledWith({
      where: { id: "company-1" },
      data: {},
    });

    mockCompanyFindUnique.mockRejectedValueOnce(new Error("boom"));
    await controllers.updateCompany(
      makeAuthReq({ params: { id: "company-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers event listing and mutation branches", async () => {
    const res = makeRes();

    mockEventFindMany.mockResolvedValueOnce([{ id: "event-1" }]);
    mockEventCount.mockResolvedValueOnce(1);
    await controllers.getEvents(
      makeAuthReq({
        query: { name: "fair", date: "2025-01-01", page: "2", limit: "2" },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockEventFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          name: { contains: "fair", mode: "insensitive" },
          startDate: { equals: new Date("2025-01-01") },
        },
        skip: 2,
        take: 2,
      }),
    );

    mockEventFindMany.mockRejectedValueOnce(new Error("boom"));
    await controllers.getEvents(makeAuthReq({ user: { id: "admin-1", role: "systemAdmin" } }), res);
    expect(res.status).toHaveBeenLastCalledWith(500);

    await controllers.createEvent(makeAuthReq({ body: {}, user: { id: "admin-1", role: "systemAdmin" } }), res);
    expect(res.status).toHaveBeenLastCalledWith(400);

    mockEventCreate.mockResolvedValueOnce({ id: "event-1" });
    await controllers.createEvent(
      makeAuthReq({
        body: {
          name: "Fair",
          description: "desc",
          location: "Bangkok",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
          banner: "banner",
        },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(201);

    mockEventCreate.mockRejectedValueOnce(new Error("boom"));
    await controllers.createEvent(
      makeAuthReq({
        body: {
          name: "Fair",
          description: "desc",
          location: "Bangkok",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
        },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers event update/delete/publish branches", async () => {
    const res = makeRes();

    mockEventFindUnique.mockResolvedValueOnce(null);
    await controllers.updateEvent(
      makeAuthReq({ params: { id: "event-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockEventFindUnique.mockResolvedValueOnce({ id: "event-1", isPublished: false });
    mockEventUpdate.mockResolvedValueOnce({ id: "event-1" });
    await controllers.updateEvent(
      makeAuthReq({
        params: { id: "event-1" },
        body: {
          name: "Fair",
          description: "desc",
          location: "Bangkok",
          startDate: "2025-01-01",
          endDate: "2025-01-02",
          banner: "banner",
        },
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockEventUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          name: "Fair",
          description: "desc",
          location: "Bangkok",
          startDate: new Date("2025-01-01"),
          endDate: new Date("2025-01-02"),
          banner: "banner",
        },
      }),
    );

    mockEventFindUnique.mockResolvedValueOnce({ id: "event-1", isPublished: false });
    mockEventUpdate.mockResolvedValueOnce({ id: "event-1" });
    await controllers.updateEvent(
      makeAuthReq({
        params: { id: "event-1" },
        body: {},
        user: { id: "admin-1", role: "systemAdmin" },
      }),
      res,
    );
    expect(mockEventUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: {} }),
    );

    mockEventFindUnique.mockRejectedValueOnce(new Error("boom"));
    await controllers.updateEvent(
      makeAuthReq({ params: { id: "event-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);

    mockEventFindUnique.mockResolvedValueOnce(null);
    await controllers.deleteEvent(
      makeAuthReq({ params: { id: "event-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockEventFindUnique.mockResolvedValueOnce({ id: "event-1" });
    mockEventDelete.mockResolvedValueOnce({ id: "event-1" });
    await controllers.deleteEvent(
      makeAuthReq({ params: { id: "event-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockEventFindUnique.mockRejectedValueOnce(new Error("boom"));
    await controllers.deleteEvent(
      makeAuthReq({ params: { id: "event-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);

    mockEventFindUnique.mockResolvedValueOnce(null);
    await controllers.publishEvent(
      makeAuthReq({ params: { id: "event-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockEventFindUnique.mockResolvedValueOnce({ id: "event-1", isPublished: false });
    mockEventUpdate.mockResolvedValueOnce({ id: "event-1", isPublished: true });
    await controllers.publishEvent(
      makeAuthReq({ params: { id: "event-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.json).toHaveBeenLastCalledWith(expect.objectContaining({ message: "Event published" }));

    mockEventFindUnique.mockResolvedValueOnce({ id: "event-1", isPublished: true });
    mockEventUpdate.mockResolvedValueOnce({ id: "event-1", isPublished: false });
    await controllers.publishEvent(
      makeAuthReq({ params: { id: "event-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.json).toHaveBeenLastCalledWith(expect.objectContaining({ message: "Event unpublished" }));

    mockEventFindUnique.mockRejectedValueOnce(new Error("boom"));
    await controllers.publishEvent(
      makeAuthReq({ params: { id: "event-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers event-company link branches", async () => {
    const res = makeRes();

    await controllers.addCompanyToEvent(
      makeAuthReq({ params: { id: "event-1" }, body: {}, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(400);

    mockEventFindUnique.mockResolvedValueOnce(null);
    await controllers.addCompanyToEvent(
      makeAuthReq({ params: { id: "event-1" }, body: { companyId: "company-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockEventFindUnique.mockResolvedValueOnce({ id: "event-1" });
    mockCompanyFindUnique.mockResolvedValueOnce(null);
    await controllers.addCompanyToEvent(
      makeAuthReq({ params: { id: "event-1" }, body: { companyId: "company-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockEventFindUnique.mockResolvedValueOnce({ id: "event-1" });
    mockCompanyFindUnique.mockResolvedValueOnce({ id: "company-1" });
    mockEventCompanyCreate.mockResolvedValueOnce({ eventId: "event-1", companyId: "company-1" });
    await controllers.addCompanyToEvent(
      makeAuthReq({ params: { id: "event-1" }, body: { companyId: "company-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(201);

    mockEventFindUnique.mockResolvedValueOnce({ id: "event-1" });
    mockCompanyFindUnique.mockResolvedValueOnce({ id: "company-1" });
    mockEventCompanyCreate.mockRejectedValueOnce({ code: "P2002" });
    await controllers.addCompanyToEvent(
      makeAuthReq({ params: { id: "event-1" }, body: { companyId: "company-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(409);

    mockEventFindUnique.mockResolvedValueOnce({ id: "event-1" });
    mockCompanyFindUnique.mockResolvedValueOnce({ id: "company-1" });
    mockEventCompanyCreate.mockRejectedValueOnce(new Error("boom"));
    await controllers.addCompanyToEvent(
      makeAuthReq({ params: { id: "event-1" }, body: { companyId: "company-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);

    mockEventCompanyFindUnique.mockResolvedValueOnce(null);
    await controllers.removeCompanyFromEvent(
      makeAuthReq({ params: { id: "event-1", companyId: "company-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(404);

    mockEventCompanyFindUnique.mockResolvedValueOnce({ eventId: "event-1", companyId: "company-1" });
    mockEventCompanyDelete.mockResolvedValueOnce({});
    await controllers.removeCompanyFromEvent(
      makeAuthReq({ params: { id: "event-1", companyId: "company-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockEventCompanyFindUnique.mockRejectedValueOnce(new Error("boom"));
    await controllers.removeCompanyFromEvent(
      makeAuthReq({ params: { id: "event-1", companyId: "company-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);
  });

  it("covers getEventRegisteredUsers success and catch", async () => {
    const res = makeRes();

    mockRegistrationFindMany.mockResolvedValueOnce([{ id: "reg-1" }]);
    await controllers.getEventRegisteredUsers(
      makeAuthReq({ params: { id: "event-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockRegistrationFindMany.mockRejectedValueOnce(new Error("boom"));
    await controllers.getEventRegisteredUsers(
      makeAuthReq({ params: { id: "event-1" }, user: { id: "admin-1", role: "systemAdmin" } }),
      res,
    );
    expect(res.status).toHaveBeenLastCalledWith(500);
  });
});
