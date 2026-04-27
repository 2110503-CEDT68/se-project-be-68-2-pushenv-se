import swaggerJsdoc from "swagger-jsdoc";

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: job-fair-token
 *       description: Session JWT stored in the `job-fair-token` cookie.
 *     csrfToken:
 *       type: apiKey
 *       in: header
 *       name: x-csrf-token
 *       description: Required for non-GET/HEAD/OPTIONS requests after calling `/api/v1/csrf-token`.
 *
 *   parameters:
 *     JobId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: JobListing ID
 *     EventId:
 *       in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: Event ID
 *
 *   schemas:
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Operation successful
 *         data:
 *           description: Varies by endpoint
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: Error description
 *
 *     AuthSessionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Login successful
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 role:
 *                   type: string
 *                   enum: [jobSeeker, companyUser, systemAdmin]
 *
 *     JobInput:
 *       type: object
 *       required: [title, type, location, description]
 *       properties:
 *         title:
 *           type: string
 *           example: Frontend Developer
 *         type:
 *           type: string
 *           enum: [full_time, part_time, internship, contract]
 *           example: full_time
 *         location:
 *           type: string
 *           example: Bangkok
 *         description:
 *           type: string
 *           example: Build amazing UIs for our platform
 *         requirements:
 *           type: string
 *           example: "3+ years of React experience"
 *         qualifications:
 *           type: string
 *           example: Bachelor degree in Computer Science
 *         salary:
 *           type: string
 *           example: "50,000 THB"
 *         attachment:
 *           type: string
 *           description: URL to job description PDF
 *
 *   responses:
 *     Unauthorized:
 *       description: Missing or invalid session cookie
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             message: Unauthorized
 *     Forbidden:
 *       description: Authenticated but wrong role for this endpoint
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             message: Forbidden
 *     NotFound:
 *       description: Resource not found
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 *           example:
 *             success: false
 *             message: Not found
 */

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Job Fair API",
      version: "1.0.0",
      description: "Backend API for the Job Fair platform. Roles: jobSeeker, companyUser, systemAdmin.",
    },
    servers: [
      { url: "http://localhost:4000/api/v1", description: "Local development" },
    ],
    tags: [
      { name: "Auth",               description: "Authentication — all roles" },
      { name: "System",             description: "Operational and documentation endpoints" },
      { name: "Users",              description: "Job seeker profile and registrations" },
      { name: "Events",             description: "Public event discovery and registration" },
      { name: "Companies",          description: "Public company directory" },
      { name: "Company",            description: "Company user — manage profile and jobs" },
      { name: "Jobs",               description: "Public job listings" },
      { name: "Admin - Accounts",   description: "System admin — user account management" },
      { name: "Admin - Companies",  description: "System admin — company profile management" },
      { name: "Admin - Events",     description: "System admin — event management" },
      { name: "Admin - Jobs",       description: "System admin — job listing management" },
    ],
  },
  apis: [
    "./src/app.ts",
    "./src/routes/index.ts",
    "./src/utils/swagger.ts",
    "./src/modules/**/*.ts",
  ],
});
