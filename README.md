# Snack Overflow

Snack Overflow is an office pantry application for Bipolar Factory. Members can explore snacks, consume available stock, vote, and submit private product requests. Admins can manage inventory, review product-level demand, record purchases, and inspect pantry activity.

## Requirements

- Node.js 20 or newer
- pnpm
- PostgreSQL

## Run locally

Create a local database, copy the environment template, and set the database URL, app origin, and seed passwords in `.env.local`. Do not commit `.env.local`.

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with one of the seeded accounts:

- **Member:** `member@bipolarfactory.com`
- **Admin:** `admin@bipolarfactory.com`

The passwords are the values configured locally as `SEED_MEMBER_PASSWORD` and `SEED_ADMIN_PASSWORD`. The server verifies credentials against Argon2id hashes and determines account roles from PostgreSQL.

## Checks

```bash
pnpm build
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```

## Authentication and sessions

Sessions use random opaque tokens in HttpOnly cookies; only SHA-256 token hashes are persisted in PostgreSQL. Cookies are `SameSite=Lax`, use `Secure` in production, and expire after seven days. Cookie-authenticated state-changing endpoints must require an exact `Origin` match with `APP_ORIGIN`; the auth POST endpoints already do so. Server-rendered route guards and API helpers load roles from the session's database user, not client state.

- Login failures are rate-limited per email and source address in process memory. This is suitable only for a single local development process; production deployments need a shared rate limiter and a trusted proxy that replaces forwarded-address headers.

## Snack read API

`GET /api/snacks` and `GET /api/snacks/:id` require an authenticated session. List responses have the shape `{ items, pagination: { page, limit, total, totalPages } }`; detail responses have the shape `{ snack }`. Snack DTOs contain the public pantry fields and a vote count, never ORM records.

The list accepts `search` (name or description, up to 100 characters), `category` (`sweet`, `savoury`, `drink`, `healthy-ish`, or `all`), `status` (`stocked`, `running_low`, `gone`, or `all`), `sortBy` (`name-asc`, `name-desc`, `votes-desc`, `quantity-asc`, `quantity-desc`, or `newest`), `page` (default `1`), and `limit` (default `24`, maximum `100`). Invalid or unknown parameters return `400` with the standard `{ error: { code, message } }` envelope. Sorting uses stable ID tie-breakers. Stock status is derived as `gone` when quantity is zero, `running_low` when quantity is positive and at or below its threshold, otherwise `stocked`.

## Architecture

- `src/app/` contains App Router pages and Route Handlers.
- `src/components/` contains the shared navigation and UI primitives.
- `src/features/` contains reusable snack and request components.
- `src/lib/mock/data/` contains deterministic seed users, snacks, requests, and activity.
- `prisma/` contains the PostgreSQL data model, migrations, and local seed.
- `src/lib/server/` contains Prisma and server-only authentication helpers.
- `src/lib/mock/` and `src/lib/api/hooks.ts` still provide mock implementations for pantry features awaiting API integration.
- `src/store/` contains transient client state for the authenticated profile, theme, and toast UI. Session identity is not persisted in browser storage.
