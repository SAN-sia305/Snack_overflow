# Snack Overflow

Snack Overflow is a frontend-only office pantry application demo for Bipolar Factory. Members can explore snacks, consume available stock, vote, and submit private product requests. Admins can manage inventory, review product-level demand, record purchases, and inspect pantry activity.

## Requirements

- Node.js 20 or newer
- pnpm

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Use the demo login to choose a role:

- **Member:** `member@bipolarfactory.com`
- **Admin:** `admin@bipolarfactory.com`
- **Demo password:** any value; credentials are not authenticated by a server.

The application also includes demo role switching in the navigation/profile controls.

## Checks

```bash
pnpm build
pnpm lint
```

The production build runs Next.js compilation, TypeScript validation, and static page generation.

## Frontend architecture

- `src/app/` contains the App Router pages and root metadata.
- `src/components/` contains the shared navigation and UI primitives.
- `src/features/` contains reusable snack and request components.
- `src/lib/mock/data/` contains deterministic seed users, snacks, requests, and activity.
- `src/lib/mock/services/` implements asynchronous mock service contracts and business rules.
- `src/lib/api/hooks.ts` connects those services to TanStack Query.
- `src/store/` contains small client-only Zustand stores for demo identity, theme, and toast UI.

The mock store persists in browser `localStorage`; clearing the site's storage restores its seed state. This is an evaluation simulation, not shared or durable server persistence. Client-side consume conflict handling is illustrative and does not provide database atomicity.

## API integration boundary

Phase 1 intentionally has no backend, database, production authentication, or network API. Components should continue to depend on typed service/query interfaces rather than mock arrays. For a future REST API:

1. Keep the existing domain models and define API DTOs separately if server payloads differ.
2. Replace the implementations in `src/lib/mock/services/` with typed `fetch` calls using a configured API base URL.
3. Preserve service validation and error semantics, including stock conflicts and allowed request status transitions.
4. Configure server-side authorization and atomic stock updates; frontend role checks are UX controls, not security boundaries.
5. Update Query invalidation and add integration tests for shared persistence and concurrent requests.

Do not add production credentials or imply that the current demo login secures data.
