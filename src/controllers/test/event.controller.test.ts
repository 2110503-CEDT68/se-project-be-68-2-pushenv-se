import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middlewares/auth.js";
import type prismaType from "../../utils/prisma.js";
import {
  type getPublishedEvents as GetPublishedEventsType,
  type getEventCompanies as GetEventCompaniesType,
  type registerForEvent as RegisterForEventType,
  type getEvent as GetEventType,
  getEvent,
} from "../events.controller.js";

// ── Mock prisma BEFORE any require() ─────────────────────────────────────────
jest.mock("../../utils/prisma.js", () => ({
  __esModule: true,
  default: {
    event: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    eventRegistration: {
      create: jest.fn(),
    },
  },
}));

// ── Load mocked modules via require() ─────────────────────────────────────────
const prisma = require("../../utils/prisma.js").default as typeof prismaType;
const { getPublishedEvents, getEventCompanies, registerForEvent } =
  require("../events.controller.js") as {
    getPublishedEvents: typeof GetPublishedEventsType;
    getEventCompanies: typeof GetEventCompaniesType;
    registerForEvent: typeof RegisterForEventType;
    getEvent: typeof GetEventType;
  };

// ── Typed mock helpers ────────────────────────────────────────────────────────
const mockFindMany = prisma.event.findMany as jest.MockedFunction<
  typeof prisma.event.findMany
>;
const mockFindUnique = prisma.event.findUnique as jest.MockedFunction<
  typeof prisma.event.findUnique
>;
const mockCount = prisma.event.count as jest.MockedFunction<
  typeof prisma.event.count
>;
const mockRegistrationCreate = prisma.eventRegistration
  .create as jest.MockedFunction<typeof prisma.eventRegistration.create>;

const mockFindFirst = prisma.event.findFirst as jest.MockedFunction<
  typeof prisma.event.findFirst
>;

// ── Shared test helpers ───────────────────────────────────────────────────────
function makeReq(
  overrides: Partial<AuthenticatedRequest> = {},
): AuthenticatedRequest {
  return {
    user: { id: "user-123", role: "user" },
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as unknown as AuthenticatedRequest;
}

function makeRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────
const fakeEvent = {
  id: "event-abc",
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

const fakeCompany = {
  company: {
    id: "profile-xyz",
    description: "We build software",
    logo: "https://example.com/logo.png",
    website: "https://example.com",
    user: { name: "Tech Corp", email: "hr@techcorp.com" },
  },
};

const fakeRegistration = {
  id: "reg-001",
  eventId: "event-abc",
  jobSeekerId: "user-123",
  registeredAt: new Date("2024-10-01T00:00:00Z"),
};

// ─────────────────────────────────────────────────────────────────────────────
describe("getPublishedEvents", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns 200 with paginated events using default page/limit", async () => {
    mockFindMany.mockResolvedValueOnce([fakeEvent] as Awaited<
      ReturnType<typeof prisma.event.findMany>
    >);
    mockCount.mockResolvedValueOnce(1);

    const req = makeReq() as unknown as Request;
    const res = makeRes();

    await getPublishedEvents(req, res);

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { isPublished: true },
      orderBy: { startDate: "asc" },
      skip: 0,
      take: 20,
    });
    expect(mockCount).toHaveBeenCalledWith({ where: { isPublished: true } });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Published events",
      data: { events: [fakeEvent], total: 1, page: 1, limit: 20 },
    });
  });

  it("returns 200 with correct skip when page > 1", async () => {
    mockFindMany.mockResolvedValueOnce(
      [] as Awaited<ReturnType<typeof prisma.event.findMany>>,
    );
    mockCount.mockResolvedValueOnce(5);

    const req = makeReq({
      query: { page: "3", limit: "2" },
    } as any) as unknown as Request;
    const res = makeRes();

    await getPublishedEvents(req, res);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 4, take: 2 }),
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ page: 3, limit: 2, total: 5 }),
      }),
    );
  });

  it("returns 200 with empty events array when no events are published", async () => {
    mockFindMany.mockResolvedValueOnce(
      [] as Awaited<ReturnType<typeof prisma.event.findMany>>,
    );
    mockCount.mockResolvedValueOnce(0);

    const req = makeReq() as unknown as Request;
    const res = makeRes();

    await getPublishedEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ events: [], total: 0 }),
      }),
    );
  });

  it("returns 500 when prisma throws an unexpected error", async () => {
    mockFindMany.mockRejectedValueOnce(new Error("DB connection lost"));

    const req = makeReq() as unknown as Request;
    const res = makeRes();

    await getPublishedEvents(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Server error" }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("getEventCompanies", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns 200 with the companies list for a valid event", async () => {
    mockFindUnique.mockResolvedValueOnce({
      ...fakeEvent,
      companies: [fakeCompany],
    } as Awaited<ReturnType<typeof prisma.event.findUnique>>);

    const req = makeReq({ params: { id: "event-abc" } }) as unknown as Request;
    const res = makeRes();

    await getEventCompanies(req, res);

    // Must query by the event id from params
    expect(mockFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "event-abc" } }),
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Event companies",
      data: [fakeCompany],
    });
  });

  it("returns 200 with an empty array when event has no companies", async () => {
    mockFindUnique.mockResolvedValueOnce({
      ...fakeEvent,
      companies: [],
    } as Awaited<ReturnType<typeof prisma.event.findUnique>>);

    const req = makeReq({ params: { id: "event-abc" } }) as unknown as Request;
    const res = makeRes();

    await getEventCompanies(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: [] }),
    );
  });

  it("returns 404 when the event id does not exist", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const req = makeReq({
      params: { id: "non-existent-id" },
    }) as unknown as Request;
    const res = makeRes();

    await getEventCompanies(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Event not found" }),
    );
  });

  it("returns 500 when prisma throws an unexpected error", async () => {
    mockFindUnique.mockRejectedValueOnce(new Error("Query timeout"));

    const req = makeReq({ params: { id: "event-abc" } }) as unknown as Request;
    const res = makeRes();

    await getEventCompanies(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Server error" }),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe("registerForEvent", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns 201 with the registration when successful", async () => {
    // findUnique (event check) returns a published event
    mockFindUnique.mockResolvedValueOnce(
      fakeEvent as Awaited<ReturnType<typeof prisma.event.findUnique>>,
    );
    // create returns the new registration
    mockRegistrationCreate.mockResolvedValueOnce(
      fakeRegistration as Awaited<
        ReturnType<typeof prisma.eventRegistration.create>
      >,
    );

    const req = makeReq({ params: { id: "event-abc" } });
    const res = makeRes();

    await registerForEvent(req, res);

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: "event-abc" } });
    expect(mockRegistrationCreate).toHaveBeenCalledWith({
      data: { eventId: "event-abc", jobSeekerId: "user-123" },
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Registered for event",
      data: fakeRegistration,
    });
  });

  it("returns 404 when the event does not exist", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const req = makeReq({ params: { id: "non-existent-id" } });
    const res = makeRes();

    await registerForEvent(req, res);

    // Should not attempt to create a registration
    expect(mockRegistrationCreate).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Event not found" }),
    );
  });

  it("returns 404 when the event exists but is not published", async () => {
    mockFindUnique.mockResolvedValueOnce({
      ...fakeEvent,
      isPublished: false,
    } as Awaited<ReturnType<typeof prisma.event.findUnique>>);

    const req = makeReq({ params: { id: "event-abc" } });
    const res = makeRes();

    await registerForEvent(req, res);

    expect(mockRegistrationCreate).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Event not available",
      }),
    );
  });

  it("returns 409 when the user has already registered for the event", async () => {
    mockFindUnique.mockResolvedValueOnce(
      fakeEvent as Awaited<ReturnType<typeof prisma.event.findUnique>>,
    );

    // Simulate Prisma P2002 unique constraint violation
    const prismaError = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
    });
    mockRegistrationCreate.mockRejectedValueOnce(prismaError);

    const req = makeReq({ params: { id: "event-abc" } });
    const res = makeRes();

    await registerForEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Already registered for this event",
      }),
    );
  });

  it("returns 500 when prisma throws an unexpected error", async () => {
    mockFindUnique.mockResolvedValueOnce(
      fakeEvent as Awaited<ReturnType<typeof prisma.event.findUnique>>,
    );
    mockRegistrationCreate.mockRejectedValueOnce(
      new Error("DB connection lost"),
    );

    const req = makeReq({ params: { id: "event-abc" } });
    const res = makeRes();

    await registerForEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Server error" }),
    );
  });
});

// ── getEvent test — add to existing event.controller.test.ts ─────────────────
// Place this describe block inside event.controller.test.ts alongside the
// existing getPublishedEvents, getEventCompanies, registerForEvent tests.
// You also need to add getEvent to the mock setup and require block:
//
// Add to jest.mock prisma block:
//   event: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn() }
//
// Add to require block:
//   import type { getEvent as GetEventType } from "../events.controller.js";
//   getEvent: typeof GetEventType
//
// Add typed mock helper:
//   const mockFindFirst = prisma.event.findFirst as jest.MockedFunction<typeof prisma.event.findFirst>;

describe("getEvent", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with the event when published and found", async () => {
    mockFindFirst.mockResolvedValueOnce(
      fakeEvent as Awaited<ReturnType<typeof prisma.event.findFirst>>,
    );

    const req = makeReq({ params: { id: "event-abc" } });
    const res = makeRes();

    await getEvent(req as Request, res);

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: "event-abc", isPublished: true },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Event" }),
    );
  });

  it("returns 404 when event does not exist or is not published", async () => {
    mockFindFirst.mockResolvedValueOnce(null);

    const req = makeReq({ params: { id: "non-existent" } });
    const res = makeRes();

    await getEvent(req as Request, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Event not found" }),
    );
  });

  it("returns 500 when prisma throws", async () => {
    mockFindFirst.mockRejectedValueOnce(new Error("DB error"));

    const req = makeReq({ params: { id: "event-abc" } });
    const res = makeRes();

    await getEvent(req as Request, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Server error" }),
    );
  });
});
