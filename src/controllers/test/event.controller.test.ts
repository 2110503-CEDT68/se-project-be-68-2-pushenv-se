import type { Request } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.js";
import { makeAuthReq, makeReq, makeRes } from "../../test/helpers.js";

jest.mock("../../utils/prisma.js", () => ({
  __esModule: true,
  default: {
    event: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    eventRegistration: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

const prisma = require("../../utils/prisma.js").default;
const {
  getPublishedEvents,
  getEventById,
  getEventCompanies,
  getMyEventRegistrationStatus,
  registerForEvent,
} = require("../events.controller.js") as typeof import("../events.controller.js");

const mockEventFindMany = prisma.event.findMany as jest.Mock;
const mockEventFindUnique = prisma.event.findUnique as jest.Mock;
const mockEventCount = prisma.event.count as jest.Mock;
const mockRegistrationCreate = prisma.eventRegistration.create as jest.Mock;
const mockRegistrationFindUnique = prisma.eventRegistration.findUnique as jest.Mock;

const event = {
  id: "event-1",
  name: "Job Fair",
  description: "desc",
  location: "Bangkok",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-01-02"),
  banner: null,
  isPublished: true,
};

describe("events.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getPublishedEvents", () => {
    it("uses newest sort by default with no search", async () => {
      mockEventFindMany.mockResolvedValueOnce([event]);
      mockEventCount.mockResolvedValueOnce(1);

      const req = makeReq<Request>();
      const res = makeRes();

      await getPublishedEvents(req, res);

      expect(mockEventFindMany).toHaveBeenCalledWith({
        where: { isPublished: true },
        orderBy: { startDate: "desc" },
        skip: 0,
        take: 20,
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("adds a truncated search filter and custom pagination", async () => {
      mockEventFindMany.mockResolvedValueOnce([]);
      mockEventCount.mockResolvedValueOnce(0);

      const req = makeReq<Request>({
        query: {
          page: "3",
          limit: "2",
          search: "a".repeat(120),
        } as Request["query"],
      });
      const res = makeRes();

      await getPublishedEvents(req, res);

      const where = (
        mockEventFindMany.mock.calls[0]?.[0] as {
          where: { OR: Array<{ name: { contains: string } }> };
        }
      ).where;
      expect(where.OR[0]?.name.contains).toHaveLength(100);
      expect(mockEventFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 4, take: 2 }),
      );
    });

    it("supports sort variants", async () => {
      mockEventFindMany.mockResolvedValue([]);
      mockEventCount.mockResolvedValue(0);

      const res = makeRes();

      await getPublishedEvents(
        makeReq<Request>({ query: { sort: "oldest" } as Request["query"] }),
        res,
      );
      expect(mockEventFindMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: { startDate: "asc" } }),
      );

      await getPublishedEvents(
        makeReq<Request>({ query: { sort: "newest" } as Request["query"] }),
        res,
      );
      expect(mockEventFindMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: { startDate: "desc" } }),
      );

      await getPublishedEvents(
        makeReq<Request>({ query: { sort: "a-z" } as Request["query"] }),
        res,
      );
      expect(mockEventFindMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: { name: "asc" } }),
      );

      await getPublishedEvents(
        makeReq<Request>({ query: { sort: "z-a" } as Request["query"] }),
        res,
      );
      expect(mockEventFindMany).toHaveBeenLastCalledWith(
        expect.objectContaining({ orderBy: { name: "desc" } }),
      );
    });

    it("returns server error for thrown errors", async () => {
      mockEventFindMany.mockRejectedValueOnce(new Error("boom"));

      const res = makeRes();
      await getPublishedEvents(makeReq<Request>(), res);
      expect(res.status).toHaveBeenCalledWith(500);

      mockEventFindMany.mockRejectedValueOnce("boom");
      const nonErrorRes = makeRes();
      await getPublishedEvents(makeReq<Request>(), nonErrorRes);
      expect(nonErrorRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getEventById", () => {
    it("returns the published event", async () => {
      mockEventFindUnique.mockResolvedValueOnce({
        ...event,
        _count: { registrations: 1, companies: 1 },
      });

      const req = makeReq<Request>({
        params: { id: "event-1" } as Request["params"],
      });
      const res = makeRes();

      await getEventById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 when the event is missing or unpublished", async () => {
      const req = makeReq<Request>({
        params: { id: "event-1" } as Request["params"],
      });

      mockEventFindUnique.mockResolvedValueOnce(null);
      const missingRes = makeRes();
      await getEventById(req, missingRes);
      expect(missingRes.status).toHaveBeenCalledWith(404);

      mockEventFindUnique.mockResolvedValueOnce({
        ...event,
        isPublished: false,
      });
      const hiddenRes = makeRes();
      await getEventById(req, hiddenRes);
      expect(hiddenRes.status).toHaveBeenCalledWith(404);
    });

    it("returns server error on thrown errors", async () => {
      mockEventFindUnique.mockRejectedValueOnce(new Error("boom"));

      const res = makeRes();
      await getEventById(
        makeReq<Request>({ params: { id: "event-1" } as Request["params"] }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(500);

      mockEventFindUnique.mockRejectedValueOnce("boom");
      const nonErrorRes = makeRes();
      await getEventById(
        makeReq<Request>({ params: { id: "event-1" } as Request["params"] }),
        nonErrorRes,
      );
      expect(nonErrorRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getEventCompanies", () => {
    it("returns linked companies", async () => {
      mockEventFindUnique.mockResolvedValueOnce({
        ...event,
        companies: [{ company: { id: "company-1" } }],
      });

      const res = makeRes();
      await getEventCompanies(
        makeReq<Request>({ params: { id: "event-1" } as Request["params"] }),
        res,
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("returns 404 and 500 error branches", async () => {
      const req = makeReq<Request>({
        params: { id: "event-1" } as Request["params"],
      });

      // Missing Event
      mockEventFindUnique.mockResolvedValueOnce(null);
      const notFoundRes = makeRes();
      await getEventCompanies(req, notFoundRes);
      expect(notFoundRes.status).toHaveBeenCalledWith(404);

      // Unpublished Event -> Now returns 404
      mockEventFindUnique.mockResolvedValueOnce({
        id: "event-1",
        isPublished: false,
        companies: [],
      });
      const unpublishedRes = makeRes();
      await getEventCompanies(req, unpublishedRes);
      expect(unpublishedRes.status).toHaveBeenCalledWith(404);

      // Server Error
      mockEventFindUnique.mockRejectedValueOnce(new Error("boom"));
      const errorRes = makeRes();
      await getEventCompanies(req, errorRes);
      expect(errorRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("getMyEventRegistrationStatus", () => {
    it("returns registration state for a published event", async () => {
      mockEventFindUnique.mockResolvedValueOnce(event);
      mockRegistrationFindUnique.mockResolvedValueOnce({ id: "reg-1" });

      const req = makeAuthReq({
        user: { id: "user-1", role: "jobSeeker" },
        params: { id: "event-1" },
      });
      const res = makeRes();

      await getMyEventRegistrationStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { registered: true } }),
      );

      mockEventFindUnique.mockResolvedValueOnce(event);
      mockRegistrationFindUnique.mockResolvedValueOnce(null);
      const falseRes = makeRes();
      await getMyEventRegistrationStatus(req, falseRes);
      expect(falseRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { registered: false } }),
      );
    });

    it("handles missing, unpublished, and thrown errors", async () => {
      const req = makeAuthReq({
        user: { id: "user-1", role: "jobSeeker" },
        params: { id: "event-1" },
      }) as AuthenticatedRequest;

      mockEventFindUnique.mockResolvedValueOnce(null);
      const notFoundRes = makeRes();
      await getMyEventRegistrationStatus(req, notFoundRes);
      expect(notFoundRes.status).toHaveBeenCalledWith(404);

      mockEventFindUnique.mockResolvedValueOnce({
        ...event,
        isPublished: false,
      });
      const unpublishedRes = makeRes();
      await getMyEventRegistrationStatus(req, unpublishedRes);
      expect(unpublishedRes.status).toHaveBeenCalledWith(404);

      mockEventFindUnique.mockRejectedValueOnce(new Error("boom"));
      const errorRes = makeRes();
      await getMyEventRegistrationStatus(req, errorRes);
      expect(errorRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe("registerForEvent", () => {
    it("registers when the event is available", async () => {
      mockEventFindUnique.mockResolvedValueOnce(event);
      mockRegistrationCreate.mockResolvedValueOnce({ id: "reg-1" });

      const req = makeAuthReq({
        user: { id: "user-1", role: "jobSeeker" },
        params: { id: "event-1" },
      });
      const res = makeRes();

      await registerForEvent(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("handles missing, unpublished, duplicate, and generic failures", async () => {
      const req = makeAuthReq({
        user: { id: "user-1", role: "jobSeeker" },
        params: { id: "event-1" },
      });

      mockEventFindUnique.mockResolvedValueOnce(null);
      const notFoundRes = makeRes();
      await registerForEvent(req, notFoundRes);
      expect(notFoundRes.status).toHaveBeenCalledWith(404);

      mockEventFindUnique.mockResolvedValueOnce({
        ...event,
        isPublished: false,
      });
      const unpublishedRes = makeRes();
      await registerForEvent(req, unpublishedRes);
      expect(unpublishedRes.status).toHaveBeenCalledWith(404);

      mockEventFindUnique.mockResolvedValueOnce(event);
      mockRegistrationCreate.mockRejectedValueOnce({ code: "P2002" });
      const duplicateRes = makeRes();
      await registerForEvent(req, duplicateRes);
      expect(duplicateRes.status).toHaveBeenCalledWith(409);

      mockEventFindUnique.mockResolvedValueOnce(event);
      mockRegistrationCreate.mockRejectedValueOnce(new Error("boom"));
      const errorRes = makeRes();
      await registerForEvent(req, errorRes);
      expect(errorRes.status).toHaveBeenCalledWith(500);
    });
  });
});