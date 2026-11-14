# Snack Overflow

Snack Overflow is a full-stack office pantry application for Bipolar Factory. 

- **Members:** Explore available snacks, consume stock in real-time, vote for favorites, and submit private snack requests with status tracking.
- **Admins:** Manage pantry inventory (CRUD + Restock), review aggregated demand by product, approve/reject/purchase requests, convert purchases into pantry stock (with automatic New Arrival badging), and audit real-time activity and dashboard metrics.

---

## 1. Prerequisites

- **Node.js:** v20.x or newer
- **Package Manager:** `pnpm` (v10+ recommended)
- **Database:** PostgreSQL (with `pg_trgm` extension support)

---

## 2. Local Setup & Running

### Step 1: Clone & Install Dependencies
```bash
git clone <repo-url>
cd SNACKOVERFLOW
pnpm install
```

### Step 2: Configure Environment Variables
Create a local `.env.local` file (never commit secrets to version control):

```env
# Database connection URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/snackoverflow?schema=public"

# Application origin for CSRF & trusted origin enforcement
APP_ORIGIN="http://localhost:3000"

# Initial seed passwords for demo accounts (used during pnpm db:seed)
SEED_ADMIN_PASSWORD="AdminSecurePassword123!"
SEED_MEMBER_PASSWORD="MemberSecurePassword123!"
```

### Step 3: Database Migration & Seeding
Run Prisma migrations and seed the database with initial users, snacks, and historical request data:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### Step 4: Start Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Demo Accounts & Role Journeys

The seed script initializes accounts with Argon2id password hashing and verified employee status:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Admin** | `admin@bipolarfactory.com` | Value from `SEED_ADMIN_PASSWORD` | Full inventory CRUD, restock, review requests, approve/reject/purchase, add to pantry, activity log, operations dashboard |
| **Member** | `member@bipolarfactory.com` | Value from `SEED_MEMBER_PASSWORD` | Living pantry home, explore/filter snacks, consume stock, vote (1 per snack), private requests (`/my-requests`) |

---

## 4. Verification & Testing

Run the test suite, linter, type checks, and production build:

```bash
# Run unit & integration test suite (Vitest)
pnpm test

# Run ESLint rules
pnpm lint

# Run strict TypeScript compiler verification
pnpm exec tsc --noEmit

# Run Next.js production build
pnpm run build
```

---

## 5. Security & Architecture

### Authentication & Sessions
- **Session Tokens:** Random 32-byte cryptographically secure tokens stored in `HttpOnly`, `SameSite=Lax` cookies (`snackoverflow_session`). Only SHA-256 hashes of tokens are stored in the database.
- **Role Enforcement:** Authenticated role checks (`requireAdmin`, `requireMember`) verify identities against PostgreSQL session records on every server request.
- **CSRF Defense:** State-changing API mutations (`POST`, `PATCH`, `DELETE`) validate the incoming `Origin` header against `APP_ORIGIN`.
- **Concurrency & Stock Safety:** Concurrency conflicts during consumption (racing for the last packet) are handled via optimistic database checks and return `409 STOCK_CONFLICT` with descriptive feedback (*"Someone beat you to the last packet. Better luck next time."*).

### Data & Privacy Invariants
- **Member Privacy:** The `GET /api/requests/me` endpoint returns strictly the authenticated user's own request records. Demand totals, other requester names, and admin alerts are strictly inaccessible to members.
- **Product Normalization:** Snack names and request titles are normalized for whitespace, casing, and punctuation to prevent duplicate inventory items and accurately aggregate member demand.

---

## 6. Complete API Reference

All responses conform to `{ [key]: data }` or `{ error: { code, message } }`.

### Authentication
- `POST /api/auth/login` — Authenticate using email and password; sets HttpOnly cookie.
- `GET /api/auth/me` — Return current session user details and role.
- `POST /api/auth/logout` — Invalidate session in database and clear cookie.

### Snacks & Pantry
- `GET /api/snacks` — Search and filter snacks (`search`, `category`, `status`, `sortBy`, `newArrivals`, `page`, `limit`).
- `GET /api/snacks/:id` — Get single snack details.
- `POST /api/snacks` — *(Admin)* Create a new snack item with initial stock and record activity.
- `PATCH /api/snacks/:id` — *(Admin)* Update snack attributes (name, category, price, threshold, description).
- `DELETE /api/snacks/:id` — *(Admin)* Delete snack (prevented if linked to an active request group).
- `POST /api/snacks/:id/consume` — Decrement stock by 1 packet atomically.
- `POST /api/snacks/:id/restock` — *(Admin)* Restock snack with quantity and optional audit note.

### Voting
- `GET /api/votes` — Retrieve list of snack IDs voted by the current user.
- `POST /api/snacks/:id/vote` — Toggle vote for snack (enforced unique per user in database).

### Snack Requests
- `POST /api/requests` — Submit a private snack request (grouped by normalized product name).
- `GET /api/requests/me` — Get personal requests history and status timeline.
- `GET /api/requests` — *(Admin)* List product request groups with distinct requester counts.
- `PATCH /api/requests/:id` — *(Admin)* Transition request status (`approved`, `rejected`, `purchased`).
- `POST /api/requests/:id/inventory` — *(Admin)* Add purchased product to pantry inventory and mark group as `available`.

### Operations & Activity
- `GET /api/admin/summary` — *(Admin)* Inventory health breakdown, low stock count, pending request count, and vote statistics.
- `GET /api/admin/alerts` — *(Admin)* Actionable smart alerts for running-low inventory and top-demand requests.
- `GET /api/activity` — *(Admin)* Audit trail of consumption, restocking, and request status updates.
