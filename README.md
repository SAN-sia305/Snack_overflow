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

The list accepts `search` (name or description, up to 100 characters), `category` (`sweet`, `savoury`, `drink`, `healthy-ish`, or `all`), `status` (`stocked`, `running_low`, `gone`, or `all`), `sortBy` (`name-asc`, `name-desc`, `votes-desc`, `quantity-asc`, `quantity-desc`, or `newest`), `newArrivals=true` (active arrival date or created within seven days), `page` (default `1`), and `limit` (default `24`, maximum `100`). Invalid or unknown parameters return `400` with the standard `{ error: { code, message } }` envelope. Sorting uses stable ID tie-breakers. Stock status is derived as `gone` when quantity is zero, `running_low` when quantity is positive and at or below its threshold, otherwise `stocked`.

## Admin snack CRUD API

`POST /api/snacks`, `PATCH /api/snacks/:id`, and `DELETE /api/snacks/:id` require an authenticated Admin session and a trusted `Origin` matching `APP_ORIGIN`. Create accepts the editable inventory fields (`name`, `category`, `description`, `imageUrl`, `quantity`, `lowStockThreshold`, and optional `priceInr`). Updates accept a non-empty subset; set `priceInr` to `null` to clear it, while omitting that field leaves the current price unchanged. Snack names are trimmed and whitespace-normalized for uniqueness. Creating a snack with initial stock records its RESTOCKED activity in the same database transaction. A snack linked to an available request cannot be deleted.

## Snack stock API

`POST /api/snacks/:id/consume` requires an authenticated user and atomically decrements one packet only when stock is available; a last-packet race returns `409 STOCK_CONFLICT`. `POST /api/snacks/:id/restock` requires an Admin session and accepts a positive integer `quantity` plus an optional `note`. Each successful stock change and its activity record are committed in one database transaction. Both endpoints require a trusted `Origin`; actor identity is always taken from the server session.

## Vote API

`GET /api/votes` returns the authenticated user's voted snack IDs. `POST /api/snacks/:id/vote` toggles that user's vote and returns `{ voted, newCount }`. The user ID is derived from the session, and the database's `(userId, snackId)` unique constraint prevents duplicate votes. Vote-changing requests require a trusted `Origin`.

## Member snack requests

`POST /api/requests` accepts a product name, expected INR price, and optional note for an authenticated Member. Requests are grouped by normalized product name, while duplicate requests from the same member are rejected. `GET /api/requests/me` returns only the session member's own requests and their product status; it never includes other requesters or community totals.

## Architecture

- `src/app/` contains App Router pages and Route Handlers.
- `src/components/` contains the shared navigation and UI primitives.
- `src/features/` contains reusable snack and request components.
- `src/lib/mock/data/` contains deterministic seed users, snacks, requests, and activity.
- `prisma/` contains the PostgreSQL data model, migrations, and local seed.
- `src/lib/server/` contains Prisma and server-only authentication helpers.
- `src/lib/mock/` and `src/lib/api/hooks.ts` still provide mock implementations for pantry features awaiting API integration.
- `src/store/` contains transient client state for the authenticated profile, theme, and toast UI. Session identity is not persisted in browser storage.
