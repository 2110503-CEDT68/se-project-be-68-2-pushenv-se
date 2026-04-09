# Backend

Express + Prisma backend for the Job Fair platform.

## Database Setup

This branch includes the base Prisma schema and a shared Prisma client singleton.

1. Copy `.env.example` to `.env` and fill in `DATABASE_URL` and `JWT_SECRET`.
1. Start Postgres:

   ```bash
   pnpm compose:up
   ```

1. Generate the Prisma client:

   ```bash
   pnpm prisma:generate
   ```

1. Push the schema to the database:

   ```bash
   pnpm db:push
   ```

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm typecheck`
- `pnpm prisma:generate`
- `pnpm db:push`
- `pnpm compose:up`

## Notes

- Prisma reads the datasource URL from `prisma.config.ts`, so `.env` stays the single source of truth for local and shared development.
- `src/utils/prisma.ts` exports a singleton Prisma client for reuse across handlers and services.
- REST endpoints are still stubbed to mirror the supplied API specification.
- File uploads are expected under `uploads/` with resource-specific subfolders.
