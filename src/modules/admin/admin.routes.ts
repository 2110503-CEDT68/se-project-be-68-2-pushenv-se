import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import {
    getAccounts, getAccountById, createAccount, updateAccount, deleteAccount,
    getCompanies, getCompanyById, updateCompany,
    getEvents, getEventById, createEvent, updateEvent, deleteEvent,
    publishEvent, addCompanyToEvent, removeCompanyFromEvent,
    getEventRegisteredUsers,
} from "../../controllers/admin.controller.js";
import {
    adminGetCompanyJobs, adminGetJob, adminCreateJob,
    adminUpdateJob, adminCloseJob, adminOpenJob, adminDeleteJob,
} from "../../controllers/jobs.controller.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(["systemAdmin"]));

// ── Accounts ──────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /admin/accounts:
 *   get:
 *     summary: Get all user accounts (paginated, filterable)
 *     tags: [Admin - Accounts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by name (case-insensitive partial match)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [jobSeeker, companyUser, systemAdmin]
 *         description: Filter by role
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated list of user accounts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: All accounts
 *               data:
 *                 data:
 *                   - id: "user-uuid"
 *                     name: John Doe
 *                     email: john@example.com
 *                     role: jobSeeker
 *                     phone: null
 *                     avatar: null
 *                     createdAt: "2024-01-01T00:00:00Z"
 *                 total: 1
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.get("/accounts", getAccounts);

/**
 * @openapi
 * /admin/accounts/{id}:
 *   get:
 *     summary: Get one account with related profile data
 *     tags: [Admin - Accounts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Account details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
adminRouter.get("/accounts/:id", getAccountById);

/**
 * @openapi
 * /admin/accounts:
 *   post:
 *     summary: Create a new account (companyUser or jobSeeker)
 *     description: >
 *       Creating a companyUser account automatically creates a CompanyProfile
 *       record linked to that user.
 *     tags: [Admin - Accounts]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, role]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Tech Corp
 *               email:
 *                 type: string
 *                 format: email
 *                 example: hr@techcorp.com
 *               password:
 *                 type: string
 *                 example: pass1234
 *               role:
 *                 type: string
 *                 enum: [jobSeeker, companyUser]
 *                 example: companyUser
 *     responses:
 *       201:
 *         description: Account created — returns User.id (not CompanyProfile.id)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Account created
 *               data:
 *                 id: "user-uuid"
 *                 name: Tech Corp
 *                 email: hr@techcorp.com
 *                 role: companyUser
 *       400:
 *         description: Missing required fields or invalid role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
adminRouter.post("/accounts", createAccount);

/**
 * @openapi
 * /admin/accounts/{id}:
 *   put:
 *     summary: Update any account — optionally reset password
 *     description: All fields are optional. Provide password to reset it.
 *     tags: [Admin - Accounts]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *                 description: If provided, the account password is reset to this value
 *     responses:
 *       200:
 *         description: Account updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already in use by another account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
adminRouter.put("/accounts/:id", updateAccount);

/**
 * @openapi
 * /admin/accounts/{id}:
 *   delete:
 *     summary: Delete any account
 *     description: Admin cannot delete their own account.
 *     tags: [Admin - Accounts]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: Account deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Account deleted
 *               data: null
 *       400:
 *         description: Cannot delete your own account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.delete("/accounts/:id", deleteAccount);

// ── Companies ─────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /admin/companies:
 *   get:
 *     summary: Get all company profiles (paginated, filterable)
 *     tags: [Admin - Companies]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by company name (case-insensitive)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated list of company profiles with job count
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: All companies
 *               data:
 *                 data:
 *                   - id: "profile-uuid"
 *                     description: We build great software
 *                     logo: null
 *                     website: https://techcorp.com
 *                     companyUser:
 *                       id: "user-uuid"
 *                       name: Tech Corp
 *                       email: hr@techcorp.com
 *                     _count:
 *                       jobs: 3
 *                 total: 1
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.get("/companies", getCompanies);

/**
 * @openapi
 * /admin/companies/{id}:
 *   get:
 *     summary: Get one company profile with event links
 *     tags: [Admin - Companies]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CompanyProfile ID
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
adminRouter.get("/companies/:id", getCompanyById);

/**
 * @openapi
 * /admin/companies/{id}:
 *   put:
 *     summary: Update any company profile
 *     description: id refers to CompanyProfile.id (not User.id).
 *     tags: [Admin - Companies]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CompanyProfile ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               website:
 *                 type: string
 *                 format: uri
 *     responses:
 *       200:
 *         description: Company profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
adminRouter.put("/companies/:id", updateCompany);

// ── Events ────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /admin/events:
 *   get:
 *     summary: Get all events including unpublished drafts (paginated)
 *     tags: [Admin - Events]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by event name (case-insensitive)
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by exact startDate (e.g. 2025-11-01)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated events with registration and company counts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: All events
 *               data:
 *                 data:
 *                   - id: "event-uuid"
 *                     name: Job Fair 2025
 *                     isPublished: false
 *                     _count:
 *                       registrations: 42
 *                       companies: 10
 *                 total: 1
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.get("/events", getEvents);

/**
 * @openapi
 * /admin/events/{id}:
 *   get:
 *     summary: Get one event including linked companies and registrations
 *     tags: [Admin - Events]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/EventId'
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.get("/events/:id", getEventById);

/**
 * @openapi
 * /admin/events:
 *   post:
 *     summary: Create a new event (draft by default)
 *     description: New events are always created with isPublished = false. Use PATCH /publish to publish.
 *     tags: [Admin - Events]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, location, startDate, endDate]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Job Fair 2025
 *               description:
 *                 type: string
 *                 example: Annual tech job fair in Bangkok
 *               location:
 *                 type: string
 *                 example: BITEC Bangkok
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-02"
 *               banner:
 *                 type: string
 *                 description: Banner image URL (optional)
 *     responses:
 *       201:
 *         description: Event created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.post("/events", createEvent);

/**
 * @openapi
 * /admin/events/{id}:
 *   put:
 *     summary: Update event details
 *     description: All fields are optional — only provided fields are updated.
 *     tags: [Admin - Events]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/EventId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               banner:
 *                 type: string
 *     responses:
 *       200:
 *         description: Event updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.put("/events/:id", updateEvent);

/**
 * @openapi
 * /admin/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     description: Cascades — deletes all EventRegistrations and EventCompany links.
 *     tags: [Admin - Events]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/EventId'
 *     responses:
 *       200:
 *         description: Event deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Event deleted
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.delete("/events/:id", deleteEvent);

/**
 * @openapi
 * /admin/events/{id}/publish:
 *   patch:
 *     summary: Toggle event publish state
 *     description: >
 *       No request body needed. If the event is published it becomes unpublished,
 *       and vice versa.
 *     tags: [Admin - Events]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/EventId'
 *     responses:
 *       200:
 *         description: Event publish state toggled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Event published
 *               data:
 *                 id: "event-uuid"
 *                 isPublished: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.patch("/events/:id/publish", publishEvent);

/**
 * @openapi
 * /admin/events/{id}/companies:
 *   post:
 *     summary: Link a company to an event
 *     tags: [Admin - Events]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/EventId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [companyId]
 *             properties:
 *               companyId:
 *                 type: string
 *                 format: uuid
 *                 description: CompanyProfile ID (not User ID)
 *                 example: "11111111-1111-4111-8111-111111111111"
 *     responses:
 *       201:
 *         description: Company linked to event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: companyId is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Event or company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Company is already linked to this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
adminRouter.post("/events/:id/companies", addCompanyToEvent);

/**
 * @openapi
 * /admin/events/{id}/companies/{companyId}:
 *   delete:
 *     summary: Unlink a company from an event
 *     tags: [Admin - Events]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/EventId'
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: CompanyProfile ID
 *     responses:
 *       200:
 *         description: Company unlinked from event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Company removed from event
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Company is not linked to this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
adminRouter.delete("/events/:id/companies/:companyId", removeCompanyFromEvent);

/**
 * @openapi
 * /admin/events/{id}/registrations:
 *   get:
 *     summary: Get all users registered for an event
 *     tags: [Admin - Events]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/EventId'
 *     responses:
 *       200:
 *         description: List of job seekers registered for the event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Event registered users
 *               data:
 *                 - id: "reg-uuid"
 *                   eventId: "event-uuid"
 *                   jobSeekerId: "user-uuid"
 *                   registeredAt: "2024-11-01T08:00:00Z"
 *                   user:
 *                     id: "user-uuid"
 *                     name: John Doe
 *                     email: john@example.com
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRouter.get("/events/:id/registrations", getEventRegisteredUsers);

// ── Jobs ──────────────────────────────────────────────────────────────────────
// Previously scattered across jobs.routes.ts with requireAuth + requireRole
// repeated on each of the 7 routes. Moved here so the router-level middleware
// (requireAuth + requireRole(["systemAdmin"])) applied at line 1 covers them all.

/**
 * @openapi
 * /admin/companies/{companyId}/jobs:
 *   get:
 *     summary: Get all jobs for a company including closed (admin)
 *     tags: [Admin - Jobs]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: All jobs (open and closed)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
adminRouter.get("/companies/:companyId/jobs", adminGetCompanyJobs);

/**
 * @openapi
 * /admin/jobs/{id}:
 *   get:
 *     summary: Get any job detail including closed (admin)
 *     tags: [Admin - Jobs]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: Full job detail including company info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.get("/jobs/:id", adminGetJob);

/**
 * @openapi
 * /admin/companies/{companyId}/jobs:
 *   post:
 *     summary: Create a job listing under any company (admin)
 *     tags: [Admin - Jobs]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobInput'
 *     responses:
 *       201:
 *         description: Job listing created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
adminRouter.post("/companies/:companyId/jobs", adminCreateJob);

/**
 * @openapi
 * /admin/jobs/{id}:
 *   put:
 *     summary: Update any job listing (admin)
 *     description: Only provided fields are updated.
 *     tags: [Admin - Jobs]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobInput'
 *     responses:
 *       200:
 *         description: Job updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.put("/jobs/:id", adminUpdateJob);

/**
 * @openapi
 * /admin/jobs/{id}/close:
 *   patch:
 *     summary: Close any job listing (admin)
 *     tags: [Admin - Jobs]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: Job closed — isClosed set to true
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.patch("/jobs/:id/close", adminCloseJob);

/**
 * @openapi
 * /admin/jobs/{id}/open:
 *   patch:
 *     summary: Re-open any job listing (admin)
 *     tags: [Admin - Jobs]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: Job opened — isClosed set to false
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.patch("/jobs/:id/open", adminOpenJob);

/**
 * @openapi
 * /admin/jobs/{id}:
 *   delete:
 *     summary: Delete any job listing (admin)
 *     tags: [Admin - Jobs]
 *     security:
 *       - cookieAuth: []
 *         csrfToken: []
 *     parameters:
 *       - $ref: '#/components/parameters/JobId'
 *     responses:
 *       200:
 *         description: Job deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Job deleted
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRouter.delete("/jobs/:id", adminDeleteJob);
