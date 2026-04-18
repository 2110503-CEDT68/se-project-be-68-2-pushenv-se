import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import {
  getPublishedEvents,
  getEventById,
  getEventCompanies,
  getMyEventRegistrationStatus,
  registerForEvent,
} from "../../controllers/events.controller.js";

export const eventsRouter = Router();

/**
 * @openapi
 * /events:
 *   get:
 *     summary: Get all published events (paginated)
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Paginated published events
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Published events
 *               data:
 *                 events:
 *                   - id: "event-uuid"
 *                     name: Job Fair 2025
 *                     description: Annual job fair
 *                     location: Bangkok
 *                     startDate: "2025-11-01"
 *                     endDate: "2025-11-02"
 *                     banner: /uploads/event-banners/uuid.jpg
 *                     isPublished: true
 *                 total: 1
 *                 page: 1
 *                 limit: 20
 */
eventsRouter.get("/", getPublishedEvents);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     summary: Get a single published event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Event
 *               data:
 *                 id: "event-uuid"
 *                 name: Job Fair 2025
 *                 location: Bangkok
 *                 startDate: "2025-11-01"
 *                 endDate: "2025-11-02"
 *                 isPublished: true
 *       404:
 *         description: Event not found or not published
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
eventsRouter.get("/:id", getEventById);

/**
 * @openapi
 * /events/{id}/companies:
 *   get:
 *     summary: Get companies participating in an event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of companies in the event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Event companies
 *               data:
 *                 - company:
 *                     id: "profile-uuid"
 *                     description: We build great software
 *                     logo: /uploads/logos/uuid.png
 *                     website: https://example.com
 *                     companyUser:
 *                       name: Tech Corp
 *                       email: hr@techcorp.com
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
eventsRouter.get("/:id/companies", getEventCompanies);
eventsRouter.get(
  "/:id/registration-status",
  requireAuth,
  requireRole(["jobSeeker"]),
  getMyEventRegistrationStatus,
);

/**
 * @openapi
 * /events/{id}/register:
 *   post:
 *     summary: Register for an event
 *     description: Only jobSeeker accounts can register. Returns 409 if already registered.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       201:
 *         description: Registered for event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Registered for event
 *               data:
 *                 id: "reg-uuid"
 *                 eventId: "event-uuid"
 *                 jobSeekerId: "user-uuid"
 *                 registeredAt: "2024-11-01T08:00:00Z"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden (wrong role) or event not published
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Already registered for this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
eventsRouter.post(
  "/:id/register",
  requireAuth,
  requireRole(["jobSeeker"]),
  registerForEvent,
);