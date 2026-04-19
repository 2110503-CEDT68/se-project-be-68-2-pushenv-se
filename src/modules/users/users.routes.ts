import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { getMe, updateMe, deleteMe, getRegistrations, deleteRegistration } from "./../../controllers/user.controller.js";
import { upload } from "./../../utils/uploads.js";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole(["jobSeeker"]));

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get my job seeker profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Job seeker profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: User profile
 *               data:
 *                 id: "uuid-here"
 *                 name: John Doe
 *                 email: john@example.com
 *                 phone: "0812345678"
 *                 avatar: /uploads/avatars/uuid.jpg
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
usersRouter.get("/me", getMe);

/**
 * @openapi
 * /users/me:
 *   put:
 *     summary: Update my job seeker profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Updated
 *               phone:
 *                 type: string
 *                 example: "0899999999"
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file (max 5 MB)
 *     responses:
 *       200:
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Name or phone cannot be empty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
usersRouter.put("/me", upload.single("avatar"), updateMe);

/**
 * @openapi
 * /users/me:
 *   delete:
 *     summary: Delete my account permanently
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: User deleted
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
usersRouter.delete("/me", deleteMe);

/**
 * @openapi
 * /users/registrations:
 *   get:
 *     summary: Get my event registrations (paginated)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *           default: 10
 *           maximum: 100
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Paginated list of my event registrations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: User registrations
 *               data:
 *                 data:
 *                   - id: "reg-uuid"
 *                     eventId: "event-uuid"
 *                     jobSeekerId: "user-uuid"
 *                     registeredAt: "2024-11-01T08:00:00Z"
 *                     event:
 *                       id: "event-uuid"
 *                       name: Job Fair 2025
 *                       location: Bangkok
 *                       startDate: "2025-11-01"
 *                       endDate: "2025-11-02"
 *                 total: 1
 *                 page: 1
 *                 limit: 10
 *                 totalPages: 1
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
usersRouter.get("/registrations", getRegistrations);

/**
 * @openapi
 * /users/me/registrations/{eventId}:
 *   delete:
 *     summary: Cancel my registration for an event
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the event to unregister from
 *     responses:
 *       200:
 *         description: Registration cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Registration deleted
 *               data: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Registration not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
usersRouter.delete("/me/registrations/:eventId", deleteRegistration);