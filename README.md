# Backend

Express + Prisma backend for the Job Fair platform.

## What Lives Here

- `src/app.ts`: Express app setup, middleware, and route mounting
- `src/server.ts`: process entry point
- `src/routes/index.ts`: API route composition
- `src/modules/`: feature route modules
- `prisma/schema.prisma`: database schema
- `src/utils/prisma.ts`: shared Prisma client singleton

## Fresh Backend Setup

Start here when setting up the backend from scratch.

1. Copy the env template:

   ```bash
   cp .env.example .env
   ```

2. Fill in these required values in `.env`:

   - `DATABASE_URL`
   - `POSTGRES_PORT`
   - `JWT_SECRET`

3. Start Postgres:

   ```bash
   pnpm compose:up
   ```

4. Generate the Prisma client:

   ```bash
   pnpm prisma:generate
   ```

5. Push the schema to the database if this is a fresh disposable local database:

   ```bash
   pnpm db:push
   ```

6. Start the backend:

   ```bash
   pnpm dev
   ```

## Backend Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm typecheck`
- `pnpm prisma:generate`
- `pnpm prisma:studio`
- `pnpm prisma:migrate:dev`
- `pnpm prisma:migrate:deploy`
- `pnpm db:push`
- `pnpm compose:up`

## Prisma Studio

Use Prisma Studio to inspect and edit local database records in a browser.

1. Make sure the local database is running:

   ```bash
   pnpm compose:up
   ```

2. If needed, generate the Prisma client:

   ```bash
   pnpm prisma:generate
   ```

3. Start Prisma Studio:

   ```bash
   pnpm prisma:studio
   ```

4. Open the URL shown in the terminal. Prisma Studio uses the default local port unless you pass a custom one through the underlying Prisma CLI.

Notes:

- Run the command inside `backend/`.
- Prisma Studio reads the database connection from `prisma.config.ts` and `.env`.
- If you only need a one-off command without the package script, `pnpm exec prisma studio` works too.

## Development Flow

Use this order when adding or changing backend behavior.

1. Update the Prisma schema first if the data model changes.
2. If this is a new schema change, create a migration in development:

   ```bash
   pnpm prisma:migrate:dev -- --name <change-name>
   ```

3. Regenerate the Prisma client:

   ```bash
   pnpm prisma:generate
   ```

4. Add or update the route handler in `src/modules/<feature>/`.
5. Reuse `sendSuccess`, `sendError`, and `notImplemented` from `src/utils/http.ts`.
6. Use `requireAuth` and `requireRole` from `src/middlewares/auth.ts` for protected routes.
7. Keep upload files under `uploads/` so they are served from `/uploads`.
8. Verify with `pnpm typecheck` and `pnpm build`.

## Schema Changes

Use the right Prisma command for the environment.

1. Local bootstrap or disposable databases:

   ```bash
   pnpm db:push
   ```

2. Development schema changes that should be committed:

   ```bash
   pnpm prisma:migrate:dev -- --name <change-name>
   ```

3. Production deploys:

   ```bash
   pnpm prisma:migrate:deploy
   ```

4. Do not use `db:push` in production.

## Runtime Notes

- The backend listens on `PORT` from `.env` and defaults to `4000`.
- `POSTGRES_PORT` controls the host port exposed by the local Postgres container.
- `CORS_ORIGIN` should match the frontend origin during local development.
- Prisma reads the datasource URL from `prisma.config.ts`, so `.env` stays the single source of truth.
- The current route modules are scaffolds, so they are ready for implementation work.
