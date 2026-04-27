# Backend

Express + Prisma backend for the Job Fair platform.

## What Lives Here

- `src/app.ts`: Express app setup, middleware, and route mounting
- `src/server.ts`: process entry point
- `src/routes/index.ts`: API route composition
- `src/modules/`: feature route modules
- `prisma/schema.prisma`: database schema
- `src/utils/prisma.ts`: shared Prisma client singleton
- `infra/`: Centralized Docker infrastructure for the entire stack.

## Running Local Development (Standalone)

Start here when developing on your host machine without Docker (or with only the DB in Docker).

1. Copy the env template:

   ```bash
   cp .env.example .env
   ```

   _(Fill in `DB_PASSWORD`, `SEED_ADMIN_PASSWORD`, and `JWT_SECRET`)_

2. Start Postgres Database:
   ```bash
   pnpm compose:up
   ```

3. Generate Prisma client & Push schema:
   ```bash
   pnpm prisma:generate
   pnpm db:push
   ```

4. Seed the database with sample data & admin user:
   ```bash
   pnpm db:seed
   ```

5. Start the backend:
   ```bash
   pnpm dev
   ```

## Running via Full Stack Docker Compose

Use this to run the entire system (Frontend, Backend, DB) in Docker using the root `.env`.

1. Build the backend image:
   ```bash
   pnpm docker:build
   ```
   *(Note: There is no `docker:push` script. If you need to push this image to a registry, tag and push it manually using your own Docker Hub credentials.)*

2. Run the Full Stack:
   ```bash
   pnpm compose:prod
   ```
   *(Note: The backend container will automatically run migrations and seed the database on startup!)*

## Automated Testing

This project uses Jest for Backend testing.

- Run all tests: `pnpm test`
- Run tests with coverage: `pnpm test:coverage`

## Backend Scripts

- `pnpm dev` - Start local dev server
- `pnpm build` - Compile TypeScript to `dist/`
- `pnpm test` - Run Jest tests
- `pnpm docker:build` - Build Docker image
- `pnpm db:push` - Push Prisma schema to database
- `pnpm db:seed` - Seed database
- `pnpm prisma:generate` - Generate Prisma Client
- `pnpm prisma:studio` - Open Prisma DB Viewer

## Prisma Studio

Use Prisma Studio to inspect and edit local database records in a browser.

1. Make sure the local database is running (`cd infra && docker compose up -d`).
2. Run `pnpm prisma:studio` and open the URL shown in the terminal.

## Development Flow

1. Update the Prisma schema first if the data model changes.
2. If this is a new schema change, push it to local: `pnpm db:push`
3. Regenerate the Prisma client: `pnpm prisma:generate`
4. Add or update the route handler in `src/modules/<feature>/`.
5. Reuse `sendSuccess`, `sendError`, and `notImplemented` from `src/utils/http.ts`.
6. Use `requireAuth` and `requireRole` from `src/middlewares/auth.ts` for protected routes.
7. Verify with `pnpm typecheck` and `pnpm test`.
