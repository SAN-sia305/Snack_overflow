# Snack Overflow --- Google Antigravity Master Prompt

> **Build Phase 1 only: a complete, premium-quality React frontend
> powered by realistic mock APIs.**
>
> This document is the product brief, UX specification, frontend
> architecture brief, and implementation acceptance contract for Google
> Antigravity. Read it completely before changing or creating files.
> Inspect the existing workspace, make coherent product decisions from
> this brief, and implement the complete Phase 1 application rather than
> stopping at a plan or asking for page-by-page instructions.

------------------------------------------------------------------------

## 1. Mission

Build **Snack Overflow**, an internal office pantry application for
Bipolar Factory. The product helps employees discover and consume
snacks, participate in snack voting, and request new products. It helps
pantry administrators maintain accurate inventory, respond to demand,
and manage restocking.

The current problem is practical: pantry items run out unexpectedly,
spreadsheets become inaccurate, and multiple employees may try to
consume the last available packet at the same time. The product must
make stock availability understandable and make conflicting actions feel
clear and fair.

The application must feel like a real, carefully designed product---not
a hackathon prototype or a generic admin dashboard.

### Phase 1 boundary --- non-negotiable

Build **only the React frontend**.

-   Do not build a real backend, database, authentication server,
    payment flow, or production business logic.
-   Do not add a real database, ORM, server-side persistence, OAuth
    provider, or external service dependency.
-   Use realistic mock APIs, deterministic mock data, and a frontend
    simulation layer.
-   Demo authentication may simulate login and role selection, but must
    not be represented as secure production authentication.
-   Simulate concurrency/conflict outcomes in mock services where
    useful; do not claim that client-side simulation provides
    database-level atomicity.
-   Keep API contracts, types, and service boundaries ready for a later
    real backend.
-   Do not weaken or forget the original assignment's backend
    requirements. Record them as future integration constraints in the
    code comments or project documentation where useful, but do not
    implement them in this phase.

The product is intended to evolve into a full-stack application. Phase 1
should make Phase 2 integration straightforward.

------------------------------------------------------------------------

## 2. Product Vision and Business Context

**Product:** Snack Overflow\
**Tagline:** Never run out.

**Positioning:** Snack Overflow is a collaborative office pantry
management platform that helps employees discover, consume and vote for
snacks while enabling administrators to maintain accurate inventory
through reliable stock management.

**Business context:** Bipolar Factory is an AI-driven technology company
headquartered in Coimbatore, India, working in deep learning and
computer vision. Snack Overflow is an internal office product for
managing the shared snack pantry.

### Product outcomes

1.  Employees can quickly understand what is available before going to
    the pantry.
2.  Employees can consume a snack with immediate, understandable
    feedback.
3.  Admins can see low-stock and unavailable items and take action.
4.  Employees can express demand for snacks that are not currently
    available.
5.  Admins can prioritise snack purchases using demand from distinct
    employees.
6.  The application feels enjoyable enough that employees choose to use
    it instead of maintaining an informal spreadsheet.

### Product principles

-   Accuracy and clarity over decorative complexity.
-   Every screen has one primary job.
-   The interface should answer the user's next question without making
    them hunt.
-   Member privacy is a product requirement.
-   Admin workflows should be efficient and decision-oriented.
-   The frontend architecture must separate presentation from data
    access.
-   Never imply that a mock action has been persisted to a real server.

------------------------------------------------------------------------

## 3. Users, Roles, and Permissions

There are exactly **two roles** in the initial product. Do not invent
additional permission tiers.

### 3.1 Member

**Goals** - Discover available snacks. - Quickly understand stock
status. - Consume available stock. - Vote for favourite snacks. -
Request snacks not currently available. - Track the status of their own
requests.

**Member capabilities** - View the pantry, snack details, Snack of the
Week and New Arrivals. - Search and filter snacks. - Consume a snack
when mock stock is available. - Vote/unvote according to the
one-vote-per-member-per-snack rule. - Submit a snack request with snack
name, expected price and optional note. - View only their own snack
requests and their status progression.

**Member restrictions** - Members must not see admin dashboards, admin
alerts, inventory management controls, restock controls, all-employee
request lists, demand rankings, or admin activity history. - Members
must not see requests submitted by other employees. - Members must not
see a community-wide activity feed. - Remove Activity from Member
navigation and Member screens. - Do not expose other employees'
identities or request counts in Member views.

### 3.2 Admin

**Goals** - Understand pantry health quickly. - Identify low-stock and
unavailable items. - Add, edit, delete and restock snacks. - Understand
which requested products have the strongest employee demand. -
Approve/reject product requests and manage purchasing. - Track inventory
changes and relevant activity.

**Admin capabilities** - Access the admin dashboard and inventory
management. - Add, edit, delete and restock snacks. - Review snack
consumption/restocking activity. - View all snack request demand grouped
by product. - See the number of distinct employees requesting each
product. - Approve or reject a product once, not once per employee
request. - Mark an approved product as purchased. - Add the purchased
product to inventory and make it a New Arrival. - View and act on Admin
Smart Alerts.

**Admin restrictions** - Keep the role model simple: Admin and Member
only. - Do not build a granular permission editor.

### 3.3 Demo role switching

Provide a polished demo login experience with clearly labelled demo
accounts or a role selector. Suggested mock accounts:

-   `admin@bipolarfactory.com` --- Admin
-   `member@bipolarfactory.com` --- Member

A mock password may be displayed for demo convenience, but do not use or
imply real credentials. Include a visible demo-mode note. Allow
switching roles for evaluation without a real authentication system.

------------------------------------------------------------------------

## 4. Signature Experience --- The Living Pantry

The signature experience is **The Living Pantry**: a shared, lively view
of the office pantry that feels current and easy to act on.

It combines three ideas:

1.  **Discover:** browse attractive snack cards, see what is available,
    explore New Arrivals and find the Snack of the Week.
2.  **Participate:** consume, vote and request products through quick,
    satisfying interactions.
3.  **Stay Informed:** see clear stock changes and request status
    without exposing private employee activity.

### Signature interaction details

-   Stock status must be visually obvious without relying on colour
    alone.
-   Consumption should have a short, tasteful confirmation animation and
    immediate stock feedback.
-   If the mock service returns a conflict because stock was exhausted,
    show a friendly message such as: **"Someone beat you to the last
    packet. Better luck next time."**
-   A snack that reaches zero immediately becomes **Gone** in the UI.
-   A snack newly added to inventory appears in New Arrivals with a New
    badge and added date.
-   Snack of the Week should feel editorial and prominent, not like an
    arbitrary metric tile.

------------------------------------------------------------------------

## 5. User Journeys

Treat these journeys as implementation flows and acceptance-test
scenarios.

### Journey A --- Member discovers and enjoys a snack

1.  Member opens the app and lands on the Member Pantry Home.
2.  Home shows a concise greeting, pantry overview, Snack of the Week,
    New Arrivals preview and snack discovery entry point.
3.  Member searches or filters the snack collection.
4.  Member opens a snack detail view and sees image, category,
    description, stock quantity/status and vote state.
5.  Member selects **Consume** when stock is available.
6.  The UI immediately shows a pending/processing state, then a success
    state and updated quantity.
7.  If the mock service returns a conflict, show the friendly conflict
    message and refresh the displayed quantity.
8.  Member votes for or removes their vote from a snack.
9.  Member can request a snack that is not currently in the pantry.
10. The new request appears in **My Requests**, visible only to that
    member.
11. The member later sees the product-level status change on their own
    request: Requested, Approved or Rejected, Purchased, then Available
    when it has been added to inventory as a New Arrival.

### Journey B --- Admin maintains the pantry and manages product demand

1.  Admin logs in and lands on Admin Dashboard.
2.  Dashboard answers within seconds: How many snacks are stocked,
    running low or gone? Which items need restocking? How many product
    requests need review?
3.  Admin Smart Alerts show low-stock products and pending product
    requests.
4.  Clicking a low-stock alert opens inventory filtered to running-low
    products.
5.  Clicking a request alert opens the request management view.
6.  Admin adds, edits, deletes or restocks a snack.
7.  Inventory status and relevant dashboard counts update.
8.  Admin opens Snack Requests Management and sees requests grouped by
    product and ranked by the number of distinct verified employees
    requesting each product.
9.  Admin approves or rejects the product once. This is a
    **product-level decision**, not an individual-request decision.
10. Every member who requested that product sees the shared product
    status update under their own private request tracking view.
11. If approved, Admin marks the product Purchased.
12. Admin adds the purchased snack to inventory with the actual quantity
    and any available details.
13. The product becomes a New Arrival; every requesting member sees
    Available under their own request.
14. Admin can inspect relevant activity history.

------------------------------------------------------------------------

## 6. Product-Level Snack Request Workflow

This is a critical domain rule. Implement the UI and mock services to
reflect it consistently.

### 6.1 Member request submission

Fields: - Snack/product name --- required. - Expected price ---
required, positive numeric amount in INR. - Note/reason --- optional. -
Submitted timestamp --- generated by mock service. - Requesting member
identity --- derived from the active mock user.

A member can submit a request for a particular product only once. If
that member has already requested the product, prevent a duplicate and
show a clear explanation. Normalise product names for duplicate matching
(trim whitespace and compare case-insensitively).

### 6.2 Admin demand aggregation

Admin sees **one product-level request entry per product**, not one
approval row per employee.

Each product entry includes: - Product name. - Number of distinct
requesting employees. - Expected price information (show a sensible
range or representative summary if employees entered different prices;
do not imply that one value is authoritative). - Optional notes in an
expandable detail area. - Requester list available to Admin only. -
Product-level status. - Submitted/last-updated date. - Admin decision
controls appropriate to the current status.

Rank products by distinct requester count, highest first. Use a
deterministic secondary sort (most recently requested first, then
product name) so the order is stable.

A single employee contributes at most one count to a product. The mock
service must enforce this even if the UI is bypassed.

### 6.3 Product-level status lifecycle

Use these exact statuses and transitions:

-   `requested` --- one or more employees have requested the product;
    awaiting admin decision.
-   `approved` --- Admin approved the product request.
-   `rejected` --- Admin rejected the product request.
-   `purchased` --- Admin has marked the approved product as purchased.
-   `available` --- Admin added the product to pantry inventory; the
    product is now available as a New Arrival.

Allowed transitions: - requested → approved - requested → rejected -
approved → purchased - purchased → available

Do not allow rejected → purchased or rejected → available. Do not
automatically add inventory when a product is approved or purchased.

### 6.4 Shared product state, private member view

The product's status is shared across all employees who requested that
product. The member's request record is private.

Example: - Eight distinct employees request "Masala Chips". - Admin sees
one Masala Chips product row with demand count 8. - Admin approves
Masala Chips once. - All eight employees see Approved under their own
request tracking view. - Admin marks Masala Chips Purchased. - All eight
see Purchased. - Admin adds stock, for example 20 packets. - The snack
appears in pantry inventory and New Arrivals. - All eight see Available
under their own request.

Members must never see the other seven employees, total demand, or other
people's notes. Admin can see the aggregated requester list and notes
for operational review.

### 6.5 Available means actually added to inventory

The Available status is only set when the admin completes the
inventory-add action. At that point: - Create the Snack mock entity. -
Set quantity to the admin-entered quantity. - Set a low-stock
threshold. - Set its creation/arrival date. - Mark it as a New Arrival
for a reasonable configured period (for example, seven days). - Link the
product request group to the created snack. - Update the shared product
request status to `available`.

Do not mark a product Available merely because it was approved or
purchased.

------------------------------------------------------------------------

## 7. Admin Smart Alerts

Admin Dashboard must include two actionable alert types.

### 7.1 Low-stock alert

-   Warning treatment using a red/coral accent, warning icon and
    explicit text label.
-   Show the number of products with `running_low` status.
-   Include a short preview of affected products.
-   Clicking the alert opens Pantry Inventory with the status filter set
    to `running_low`.
-   The alert count updates when mock inventory quantities change.
-   Provide a calm empty state when no products are running low.

### 7.2 New snack request alert

-   Distinct yellow/amber accent, request/lightbulb-style icon and
    explicit text label.
-   Show the number of product groups in `requested` status.
-   Preview the highest-demand pending products.
-   Clicking the alert opens Snack Requests Management filtered to
    pending requests.
-   Count updates when new product requests arrive or a product is
    approved/rejected.
-   Provide an empty state when no product requests need review.

Use accessible labels and text; colour must never be the only way to
distinguish alerts. Do not use emoji icons. Use the chosen icon library.

These alerts are Admin-only. Members must never see them.

------------------------------------------------------------------------

## 8. Feature Scope

### 8.1 Must Have --- Phase 1

**Shared** - Demo login and role-aware application shell. - Mobile-first
responsive design. - Light and Dark themes. - Realistic mock data and
mock API service layer. - Search, filtering and sorting where
relevant. - Loading, empty, error, disabled, success and conflict
states. - Type-safe domain models. - Toasts or inline feedback for
important actions.

**Member** - Member Pantry Home. - Snack discovery/list and snack
detail. - Search and category/status filters. - Snack of the Week. - New
Arrivals list and badges. - Consume interaction and stock feedback. -
Vote/unvote interaction. - Submit snack request. - My Requests with
private status tracking. - No Activity page. - No community request list
or demand rankings.

**Admin** - Admin Dashboard. - Pantry Inventory list and filters. - Add
snack. - Edit snack. - Delete snack with confirmation. - Snack detail. -
Restock flow. - Snack Requests Management with product-level aggregation
and demand ranking. - Product-level approve/reject/purchased/available
transitions. - Admin Smart Alerts. - Admin Activity Log for
consumption/restocking. - Useful empty states.

### 8.2 Nice to Have --- if time remains after Must Have

-   Optimistic UI with reliable rollback in the mock service layer.
-   Simulated real-time changes between demo users or across mock data
    refreshes.
-   Sorting by quantity, name, votes and demand.
-   Popularity ranking.
-   Polished transition between request workflow stages.
-   Admin activity filters.

### 8.3 Future --- do not implement in Phase 1

-   Monthly snack spending and budget analytics.
-   Vendor and supplier management.
-   Purchase order workflows.
-   Employee preference profiles.
-   Personalised AI snack recommendations.
-   Predictive consumption/restock analytics.
-   Real push notifications.
-   Real-time infrastructure such as WebSockets.
-   Real backend, database, authentication or deployment secrets.

------------------------------------------------------------------------

## 9. Screen Specifications

Build complete screens, not static mockups. Every visible control must
work within the mock application.

### 9.1 Shared screens

#### A. Demo Login

Purpose: enter the product quickly and make the two roles
understandable.

Layout: - Premium branded welcome panel with Snack Overflow identity. -
Warm snack photography or a carefully composed illustration/photo
treatment. - Clear statement: "Good snacks. Great office energy." - Two
demo role cards or a role selector for Admin and Member. - Demo account
details and a clear demo-mode disclaimer. - Sign-in action with loading
and error states. - Mobile layout should be compact and focused.

Interactions: - Selecting a role updates the demo login context. -
Successful mock login routes to the correct role home. - Role switching
is available through a safe demo control/profile menu.

#### B. Shared App Shell

-   Responsive desktop navigation and mobile bottom navigation.
-   Persistent top bar with product identity, page title/context, theme
    toggle and profile menu.
-   Active navigation state.
-   Role-aware route guards in the frontend.
-   Smooth route/page transitions.
-   On mobile, use a floating or elevated bottom navigation treatment
    that does not obscure content.
-   Never render Admin navigation for Members.

### 9.2 Member screens

#### A. Member Pantry Home

Purpose: make snack discovery and quick action effortless.

Content hierarchy: 1. Personal greeting and short contextual line. 2.
Compact pantry status summary (available, running low, unavailable
counts) without exposing admin controls. 3. Featured Snack of the Week
with large image, vote count, and quick view/vote action. 4. New
Arrivals horizontal or editorial card section with dates and New badges.
5. "Explore the pantry" section with a few snack cards and a clear route
to the full collection. 6. A discreet My Requests preview showing the
member's own active requests and current status.

Avoid a generic grid of dashboard metrics. This should feel like a
consumer-quality pantry discovery experience.

#### B. Explore Snacks

Purpose: browse the complete pantry.

Features: - Search by snack name. - Category filter: sweet, savoury,
drink, healthy-ish. - Availability filter: stocked, running low, gone. -
Optional sorting by name, popularity/votes or recently added. -
Responsive card grid/list. - Each card includes image, snack name,
category, status, quantity where appropriate, vote affordance and detail
action. - Clear active-filter chips and reset action. - Search empty
state with suggestions or reset filters. - Loading skeletons and
retryable error state.

Members can see stock quantity/status, but do not show admin-only
threshold configuration or management actions.

#### C. Snack Detail

Purpose: give enough context to decide whether to consume or vote.

Include: - Large, high-quality snack image. - Name, category, short
realistic description. - Stock status and quantity. - Consume action. -
Vote/unvote action and vote count. - New Arrival marker/date when
relevant. - Friendly unavailable state for Gone items. - Related snack
suggestions only if meaningful and supported by mock data.

Interactions: - Consume opens a confirmation or performs a clearly
labelled quick action; avoid unnecessary friction. - During action show
pending state and prevent accidental double submission. - Success
updates quantity and status. - Conflict displays friendly feedback and
refreshed stock. - Vote toggles state and count.

#### D. New Arrivals

Purpose: help Members discover recently added pantry items.

Include: - Editorial header and concise description. - New Arrival cards
with snack image, added date, category and current stock state. - Sort
newest first. - Empty state when no current arrivals. - Clicking opens
Snack Detail.

#### E. My Requests

Purpose: let a Member track only their own snack requests.

Include: - Submit request action. - List of the active member's requests
only. - Product name, submitted date, expected price, their own note and
current product-level status. - Compact visual progress
indicator/timeline: Requested → Approved/Rejected → Purchased →
Available. - Rejected requests show a clear terminal state and do not
imply future availability. - Approved/Purchased/Available updates should
be reflected on every member's own request for that product. - When
Available, link to the new snack detail if it exists and indicate that
it has appeared in New Arrivals. - Empty state with a clear request
CTA. - Never show requester count, other requesters, other employee
notes or a community feed.

#### F. Request Snack form / modal

Fields: - Snack name (required). - Expected price in INR (required;
positive numeric value). - Optional note/reason. - Submit and cancel
actions. - Inline validation using Zod and React Hook Form. - Duplicate
request feedback. - Success toast and insertion into My Requests.

Do not ask the member to select another employee or choose an approval
workflow. The active mock user is the requester.

### 9.3 Admin screens

#### A. Admin Dashboard

Purpose: answer "What needs my attention?" in under 30 seconds.

Top hierarchy: 1. Greeting and short operational context. 2. Summary:
total snacks, stocked, running low, gone, pending product requests. 3.
Admin Smart Alerts: - Low-stock alert with running-low count and
preview. - Pending snack request alert with pending product-group count
and top demand preview. 4. Inventory health visualisation or compact
distribution view. 5. Highest-demand pending snack requests preview. 6.
Recent admin-relevant activity (consumption/restock). 7. Quick actions:
Add Snack, Restock, View Inventory, Review Requests.

Keep the dashboard decision-oriented. Avoid decorative metrics that do
not lead to a useful action.

#### B. Pantry Inventory

Purpose: manage all snack records.

Include: - Search. - Category and stock-status filters. - Sort by name,
quantity, newest, most voted. - Table/list on desktop and card/list
layout on mobile. - Snack image, name, category, quantity, threshold,
derived status and last updated. - Row/card actions: View, Edit,
Restock, Delete. - Add Snack primary action. - Pagination or load-more
behaviour in the mock API. - Empty, no-results, loading and error
states.

#### C. Add/Edit Snack

Fields: - Name (required, unique in mock data). - Category: sweet,
savoury, drink, healthy-ish. - Quantity: integer \>= 0. - Low-stock
threshold: integer \>= 0, default 5. - Description. - Image URL or
selected local/mock image reference. - Optional price in INR if used in
the UI. Validation: - Use React Hook Form + Zod. - Show field-level
messages. - Prevent duplicate names (case-insensitive). - Save through
mock service. - Confirm navigation and success feedback.

#### D. Admin Snack Detail

Include: - Snack identity, image, category and description. - Current
quantity and derived status. - Configured low-stock threshold. - Vote
count/popularity. - Created/updated timestamps. - Recent
consumption/restock history for this snack. - Edit and Restock actions.

#### E. Restock

-   Choose quantity to add (positive integer).
-   Show current quantity and projected quantity before confirmation.
-   Optional note.
-   Confirm action.
-   Update inventory and add an Activity record in the same mock service
    operation.
-   Show success feedback and refresh dashboard/alerts.
-   Handle validation and mock errors.

#### F. Snack Requests Management

Purpose: make product-level demand decisions, not process individual
requests one by one.

Layout: - Page title and clear explanation: "Ranked by distinct
employees requesting each snack." - Tabs or filters: Needs Review,
Approved, Rejected, Purchased, Available, All. - Product-level request
cards/table rows. - Sort pending products by distinct requester count
descending. - Show product name, distinct requester count, expected
price summary, first/last request date, status and actions. - Expandable
detail panel with individual requester names, their expected price and
optional note. This detail is Admin-only. - One Approve and one Reject
action per product group while status is Requested. - For Approved, show
Mark Purchased. - For Purchased, show Add to Pantry / Mark Available
flow. - For Rejected, show terminal status and no purchase action. -
Show confirmation for irreversible-looking decisions. - After any
product-level transition, update every member's own request view for
that product. - Ensure duplicate requests from the same employee cannot
inflate demand. - Empty states for each filter.

#### G. Purchase-to-Inventory flow

When status is Purchased: - Admin chooses actual quantity to add. -
Admin can confirm or edit snack category, description, threshold and
image. - On completion, create the Snack record in mock inventory. - Set
status to Available and mark as New Arrival. - Update all associated
member tracking records through the shared product group. - Do not
create inventory at the approval stage.

#### H. Admin Activity Log

-   Show consumption and restocking records.
-   Include actor, snack, action, amount and timestamp.
-   Filters by action and snack.
-   Newest first.
-   Useful empty state.
-   This is Admin-only. Do not add it to Member navigation.

------------------------------------------------------------------------

## 10. Navigation and Information Architecture

### Member navigation

-   Home
-   Explore
-   New Arrivals
-   My Requests

Member profile menu: - Profile/demo identity. - Theme toggle (may also
be in top bar). - Switch demo role. - Sign out.

Do not include Activity or a shared Snack Requests feed.

### Admin navigation

-   Dashboard
-   Inventory
-   Snack Requests
-   Activity

Admin quick actions: - Add Snack - Restock (where contextually
appropriate) - Review Requests

Admin profile menu: - Profile/demo identity. - Theme toggle. - Switch
demo role. - Sign out.

### Route protection

-   Define route groups/layouts by role.
-   If a Member navigates to an Admin route, redirect to Member Home and
    show a non-intrusive access message.
-   If an Admin opens a Member-only route, either render a useful shared
    snack detail or redirect appropriately; do not create confusing dead
    ends.
-   Preserve the selected role during demo navigation and refresh using
    a safe frontend-only persistence approach.

------------------------------------------------------------------------

## 11. Data Model and TypeScript Contracts

Use explicit TypeScript types. Suggested models:

``` ts
type UserRole = "admin" | "member";

type SnackCategory = "sweet" | "savoury" | "drink" | "healthy-ish";

type SnackStatus = "stocked" | "running_low" | "gone";

type ProductRequestStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "purchased"
  | "available";

type ActivityAction = "consumed" | "restocked";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  isVerified: boolean;
}

interface Snack {
  id: string;
  name: string;
  category: SnackCategory;
  description: string;
  imageUrl: string;
  quantity: number;
  lowStockThreshold: number;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
  arrivalUntil?: string;
  priceInr?: number;
}

interface Vote {
  id: string;
  userId: string;
  snackId: string;
  createdAt: string;
}

interface Activity {
  id: string;
  userId: string;
  snackId: string;
  action: ActivityAction;
  amount: number;
  note?: string;
  createdAt: string;
}

interface SnackProductRequest {
  id: string;
  normalizedProductKey: string;
  productName: string;
  status: ProductRequestStatus;
  requests: MemberSnackRequest[];
  distinctRequesterCount: number;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  decisionNote?: string;
  purchasedAt?: string;
  availableAt?: string;
  linkedSnackId?: string;
  actualQuantityAdded?: number;
}

interface MemberSnackRequest {
  id: string;
  productRequestId: string;
  userId: string;
  expectedPriceInr: number;
  note?: string;
  createdAt: string;
}

interface AdminAlert {
  id: string;
  type: "low_stock" | "pending_requests";
  count: number;
  href: string;
}
```

You may refine these types where needed, but preserve the domain rules.

### Derived stock status

-   `gone` when quantity is 0.
-   `running_low` when quantity is greater than 0 and less than or equal
    to lowStockThreshold.
-   `stocked` when quantity is greater than lowStockThreshold.

Keep stock status derived from quantity and threshold; avoid storing
conflicting duplicate state.

### Verified employee demand

Only verified employees count toward product demand. Seed demo users as
verified. Distinct count is based on unique `userId` per normalized
product key. Do not use raw request-row count.

### Request data shape

Represent the product-level decision separately from each member's
private request record. The product group owns the shared status. Each
member record stores that member's own expected price, note and
timestamp. This separation is essential to avoid individual approvals.

------------------------------------------------------------------------

## 12. Mock APIs and Service Layer

Create a realistic mock API layer with asynchronous behaviour, typed
inputs/outputs, predictable errors and optional latency. Components must
not directly mutate mock arrays or import seed data to perform actions.

Suggested API contracts:

``` ts
// Snacks
GET    /api/snacks
GET    /api/snacks/:id
POST   /api/snacks
PATCH  /api/snacks/:id
DELETE /api/snacks/:id
POST   /api/snacks/:id/consume
POST   /api/snacks/:id/restock
POST   /api/snacks/:id/vote
DELETE /api/snacks/:id/vote

// Member requests
GET    /api/me/snack-requests
POST   /api/snack-requests

// Admin product request groups
GET    /api/admin/snack-request-products
PATCH  /api/admin/snack-request-products/:id/status
POST   /api/admin/snack-request-products/:id/available

// Admin overview and activity
GET    /api/admin/summary
GET    /api/admin/activity
```

These are **contract examples**, not real server endpoints in Phase 1.
Implement equivalent typed mock service functions. If Next.js Route
Handlers are not required for the chosen mock architecture, do not
create fake production server routes just to imitate the paths.

### Service design

Suggested modules: - `snackService` - `voteService` -
`snackRequestService` - `adminService` - `activityService` -
`demoAuthService`

Requirements: - Return typed data. - Simulate network latency. - Support
deterministic success/error outcomes. - Use a consistent error shape,
for example `{ error: { code, message } }`. - Keep seed data and mock
state in one controlled layer. - Do not allow components to modify
records directly. - Centralise filtering, sorting, pagination and status
derivation. - Make the service interface easy to replace with real
`fetch` calls in Phase 2.

### Mock API behaviours to simulate

**Consume** - If quantity is greater than zero, decrement once and
create an activity record. - If quantity is zero, return a conflict
error. - Prevent duplicate clicks while a request is pending. -
Optionally support a deterministic conflict scenario for
demonstration. - Clearly document that this is a UI simulation, not a
concurrency guarantee.

**Restock** - Validate positive integer quantity. - Increment stock. -
Create activity record. - Refresh relevant admin data.

**Vote** - Enforce one vote per active user per snack in the mock
service. - Toggle vote state and keep count consistent. - Do not rely
only on button state.

**Snack request** - Normalise product name. - Reject a duplicate request
from the same user for the same product group. - Only verified users
count toward demand. - Keep a single product group with member-specific
request records.

**Product status** - Enforce only the allowed transitions. - A single
admin action updates the product group status. - Every member request
for that product reflects the same status. - Do not create inventory at
approval or purchase. - Only the `available` operation creates inventory
and links the snack.

**Filtering and pagination** - Support search, category, stock status,
sorting and pagination through service parameters. - Keep query state in
the URL where practical, so filters survive refresh/navigation. - Use
TanStack Query for cache invalidation and refresh.

### Phase 2 API integration readiness

-   Keep API DTOs separate from view-model transformations where useful.
-   Use environment-based API base URL only when real APIs are
    introduced.
-   Avoid coupling components to mock implementation details.
-   Document expected response and error shapes.
-   Do not add secrets or real credentials.
-   Include a short `README` section explaining how mock services can
    later be swapped for a real REST API.

------------------------------------------------------------------------

## 13. State Management

Use the following division of responsibility:

-   **TanStack Query:** server-like data fetching, caching,
    loading/error states, invalidation and mutation lifecycle.
-   **Zustand:** small client-only state such as active demo user/role,
    theme preference, navigation state and temporary UI preferences.
-   **React Hook Form + Zod:** form state and validation.
-   **URL search parameters:** shareable/reload-safe list filters,
    search, sort and pagination where practical.
-   Avoid putting all server-like data into Zustand.
-   Avoid unnecessary global state.

After mutations: - Invalidate or update the appropriate TanStack Query
caches. - Ensure dashboard counts, alerts, inventory rows and member
request status remain consistent. - For optimistic updates, implement
rollback on mock error; otherwise prefer a clear pending state.

------------------------------------------------------------------------

## 14. Technology Stack

Use the following default stack unless a dependency conflict makes it
impossible. If a version is incompatible, choose the closest stable
compatible version and explain it in the README.

-   Next.js 15
-   React 19
-   TypeScript with strict mode
-   Tailwind CSS v4
-   shadcn/ui components, customised to the design system
-   Framer Motion
-   Phosphor Icons (or the compatible React package)
-   Zustand
-   TanStack Query
-   React Hook Form
-   Zod
-   Mock API/service layer
-   PWA-ready structure
-   Vercel-ready frontend configuration

Do not introduce Bootstrap, Material UI defaults, or a generic admin
template. Use Lucide only if a required icon is unavailable in the
selected Phosphor package; maintain one coherent icon family.

------------------------------------------------------------------------

## 15. Design Philosophy and Visual Language

### Design direction: Premium Playful

The visual identity should combine the sophistication of Apple and
Linear with the lively energy of a premium snack brand.

**Personality** - Warm, welcoming and energetic. - Premium, not
childish. - Playful in small details, not noisy. - Human and
approachable. - Confident, clear and trustworthy.

### Colour direction

Light theme: - Warm cream/off-white canvas. - Deep charcoal
typography. - Vibrant orange/coral as the primary action accent. - Soft
warm neutrals for surfaces. - Muted green/teal for positive stock
states. - Amber for attention states. - Red/coral for low-stock or
destructive states.

Dark theme: - Deep charcoal/near-black background. - Layered dark
surfaces with clear elevation. - Warm off-white text. - Controlled
orange/coral accent. - Accessible status colours with sufficient
contrast.

Define semantic design tokens rather than scattering raw colours through
components. Check contrast in both themes. Colour must never be the only
signal for status.

### Typography

-   Use a premium, highly legible sans-serif such as Geist or Inter.
-   Clear hierarchy: expressive page titles, concise section headings,
    readable body text, compact metadata.
-   Avoid excessive font weights and tiny low-contrast text.
-   Use tabular numerals for quantities and counts where appropriate.

### Surfaces and layout

-   Generous whitespace.
-   Rounded cards and controls with consistent radii.
-   Subtle borders and restrained shadows.
-   Strong alignment and spacing rhythm.
-   Premium snack photography with consistent crop and aspect ratios.
-   Use image overlays only where they improve legibility.
-   Avoid excessive glassmorphism, gradients, neon, or decorative
    charts.

### Imagery and content

-   Use high-quality, relevant snack imagery from Unsplash or Pexels, or
    reliable remote image sources configured for Next.js.
-   Never use Lorem Ipsum.
-   Use realistic snack names, categories, descriptions, prices in INR,
    employee names, timestamps, vote counts and activity.
-   Avoid random unrelated imagery or repeated placeholder images.
-   Provide graceful image fallbacks and fixed aspect ratios to avoid
    layout shifts.
-   Do not invent real employee data; use clearly fictional demo names.

### Icons

-   Use Phosphor Icons consistently.
-   No emoji icons in navigation, controls, alerts or status indicators.
-   Pair meaningful icons with accessible labels/tooltips.
-   Use icon-only buttons only when their purpose is unambiguous and
    they have accessible names.

------------------------------------------------------------------------

## 16. Motion System and Micro-interactions

Use Framer Motion deliberately. Motion should communicate state and add
delight without slowing down work.

### Global motion

-   Short, smooth page transitions.
-   Spring-based entrance for key cards and menus.
-   Shared-element or layout transitions for selected snack
    cards/details where stable.
-   Respect `prefers-reduced-motion`.
-   Avoid animating every element or using long decorative sequences.

### Interaction motion

-   Buttons: subtle press scale and clear pending/disabled state.
-   Snack cards: gentle hover elevation on pointer devices; no
    hover-only functionality.
-   Consume: quantity transition and brief success confirmation.
-   Vote: restrained icon fill/scale transition.
-   New badge: subtle entrance, no continuous pulsing.
-   Alerts: count changes animate briefly.
-   Request timeline: active stage advances smoothly.
-   Modals/sheets: spring entrance and accessible focus handling.
-   Toasts: quick enter/exit, readable and dismissible.

Create shared motion variants and duration/easing tokens. Do not scatter
arbitrary animation values throughout the application.

------------------------------------------------------------------------

## 17. Responsive Strategy

Design mobile-first, then adapt to tablet and desktop. The product is
one experience across breakpoints, not three separate products.

### Mobile

-   Single-column content and compact cards.
-   Floating/elevated bottom navigation.
-   Large touch targets (minimum approximately 44px).
-   Search/filter controls that fit narrow widths; use filter sheets
    where appropriate.
-   Snack detail actions remain easy to reach.
-   Admin tables become stacked cards or carefully designed horizontal
    layouts; never force unreadable tiny tables.
-   Modals become bottom sheets when that improves ergonomics.
-   Avoid sticky elements that cover content.

### Tablet

-   Two-column card grids where useful.
-   Balanced dashboard sections.
-   Navigation may use a compact rail or responsive sidebar.
-   Preserve readable spacing and touch targets.

### Desktop

-   Refined sidebar for role navigation.
-   Comfortable max-width content area.
-   Multi-column dashboard and inventory layouts.
-   Tables can be used for dense admin data.
-   Keep content centred and avoid stretching cards across excessively
    wide screens.

Test at representative widths, including narrow mobile, standard mobile,
tablet and wide desktop. No horizontal overflow.

------------------------------------------------------------------------

## 18. Accessibility

Accessibility is a release requirement, not polish.

-   Semantic HTML and correct heading hierarchy.
-   Keyboard-accessible navigation, dialogs, menus, forms and controls.
-   Visible focus indicators.
-   Accessible names for icon buttons.
-   Sufficient colour contrast in both themes.
-   Statuses communicated with text/icons, not colour alone.
-   Form labels, descriptions and actionable validation messages.
-   Dialog focus trap, focus return and Escape handling.
-   Announce important mutation feedback through accessible live
    regions/toasts.
-   Respect reduced-motion preferences.
-   Avoid tiny text and low-contrast metadata.
-   Ensure touch targets are comfortably sized.
-   Test main journeys using keyboard-only navigation.

------------------------------------------------------------------------

## 19. Loading, Empty, Error and Feedback States

Every data-driven screen must have intentional states.

### Loading

-   Use skeletons that match final content geometry.
-   Avoid full-screen spinners unless the action genuinely blocks the
    entire experience.
-   Show local pending states on buttons during mutations.

### Empty

Examples: - No snacks match filters → explain and offer Clear Filters. -
No New Arrivals → explain that newly added snacks will appear here. - No
personal requests → offer Request a Snack. - No low-stock products →
calm positive empty state. - No pending product requests → clear Admin
state. - No activity → explain what events will be recorded.

### Error

-   Human-readable error messages.
-   Retry action where appropriate.
-   Preserve user-entered form values on recoverable failures.
-   Avoid exposing stack traces or implementation details.

### Success and conflict

-   Confirm what changed.
-   Update affected data.
-   Conflict state for unavailable stock must be distinct from generic
    error.
-   Destructive actions require confirmation and clear consequences.

------------------------------------------------------------------------

## 20. Folder Structure

Use a feature-oriented, maintainable structure. Adapt only where the
framework requires it.

``` text
src/
  app/
    (auth)/
      login/
    (member)/
      home/
      explore/
      new-arrivals/
      my-requests/
    (admin)/
      dashboard/
      inventory/
      requests/
      activity/
    layout.tsx
    globals.css
  components/
    ui/
    layout/
    navigation/
    feedback/
    data-display/
    forms/
  features/
    auth/
      components/
      hooks/
      schemas/
      types/
    snacks/
      components/
      hooks/
      services/
      schemas/
      types/
    votes/
      components/
      hooks/
      services/
    requests/
      components/
      hooks/
      services/
      schemas/
      types/
    admin/
      components/
      hooks/
      services/
    activity/
      components/
      hooks/
      services/
  lib/
    api/
      client.ts
      errors.ts
      query-client.ts
    mock/
      data/
      store/
      latency.ts
    auth/
    formatters/
    utils/
  store/
  hooks/
  types/
  styles/
  public/
    images/
```

Keep business/domain logic in services and pure helpers, not in large
page components. Use clear feature boundaries. Avoid creating
abstractions that add complexity without reuse.

------------------------------------------------------------------------

## 21. Reusable Component Library

Build a coherent design system and reusable product components.

### Foundation

-   `AppShell`
-   `DesktopSidebar`
-   `MobileBottomNav`
-   `TopBar`
-   `PageHeader`
-   `SectionHeader`
-   `ThemeToggle`
-   `ProfileMenu`
-   `RoleBadge`
-   `StatusBadge`
-   `EmptyState`
-   `ErrorState`
-   `LoadingSkeleton`
-   `ConfirmDialog`
-   `ResponsiveSheet`
-   `ToastProvider`

### Snack components

-   `SnackCard`
-   `SnackGrid`
-   `SnackListItem`
-   `SnackImage`
-   `SnackStatusIndicator`
-   `StockQuantity`
-   `CategoryBadge`
-   `SnackOfTheWeekCard`
-   `NewArrivalCard`
-   `NewArrivalBadge`
-   `ConsumeButton`
-   `VoteButton`
-   `SnackFilters`
-   `SnackSearch`

### Admin components

-   `SummaryCard`
-   `InventoryTable`
-   `InventoryMobileCard`
-   `AdminAlertCard`
-   `LowStockPreview`
-   `PendingRequestPreview`
-   `ProductDemandCard`
-   `DemandRank`
-   `RequesterDetails`
-   `ProductRequestStatus`
-   `RequestProgressTimeline`
-   `RestockDialog`
-   `SnackForm`

### Forms and feedback

-   `FormField`
-   `PriceInput`
-   `InlineValidationMessage`
-   `MutationButton`
-   `ConflictNotice`
-   `SuccessToast`

All components should have typed props, intentional variants and
consistent spacing. Avoid one-off styling when a shared component or
token is appropriate.

------------------------------------------------------------------------

## 22. Mock Data Requirements

Seed realistic, varied demo content. The app should look convincing
immediately after login.

### Users

Create fictional demo users: - At least one Admin. - At least 8 verified
Members to demonstrate demand aggregation. - Distinct names, initials
and avatar images. - No real employee personal information.

### Snacks

Seed approximately 15--20 snacks across all categories: - Sweet -
Savoury - Drink - Healthy-ish

Include examples across: - Stocked. - Running low. - Gone. - Recently
added/New Arrival. - High-vote/popular. - Zero votes.

Use realistic names such as Masala Chips, Dark Chocolate Bites, Banana
Chips, Roasted Almonds, Filter Coffee, Lemon Soda, Millet Cookies and
Trail Mix. Use realistic descriptions and prices in INR where displayed.

### Requests

Seed enough product groups to demonstrate: - Different distinct
requester counts. - Requested, approved, rejected, purchased and
available states. - A product with multiple member requests. - Duplicate
prevention for one member/product. - Different expected prices and
optional notes. - A product that has been added to inventory and appears
as a New Arrival.

Ensure the sample data demonstrates that demand count is based on
distinct verified users, not number of request rows.

### Activity

Seed consumption and restocking events with realistic timestamps and
amounts. Keep this Admin-only.

### Snack of the Week

Choose the featured snack from mock vote/popularity data, or seed a
featured product with a clear rationale. The display must be consistent
with the product's popularity information.

### Data consistency

-   All IDs must be stable.
-   Every relationship must point to an existing entity.
-   Quantities must be non-negative integers.
-   Derived stock states must be correct.
-   Vote counts must match seeded votes.
-   Request group counts must match distinct verified requester IDs.
-   New Arrivals must have a valid arrival date/window.
-   Use deterministic seed data so screenshots and demos are repeatable.

------------------------------------------------------------------------

## 23. Performance and PWA Readiness

-   Use Next.js best practices for client/server component boundaries.
-   Keep interactive components client-side only where needed.
-   Optimise images and avoid layout shifts.
-   Lazy-load below-the-fold imagery and heavy components where
    appropriate.
-   Avoid unnecessary re-renders and oversized client bundles.
-   Use TanStack Query cache settings sensibly.
-   Provide metadata and a clean app title/description.
-   Add a web app manifest and basic PWA-ready metadata if it does not
    distract from the core work.
-   Do not claim offline data sync or push notifications unless
    implemented.
-   Ensure the app is Vercel-ready without requiring secrets for mock
    mode.

------------------------------------------------------------------------

## 24. Coding Standards

-   TypeScript strict mode; avoid `any`.
-   Use clear naming and small focused components.
-   Prefer composition over deeply nested conditionals.
-   Keep page components focused on composition.
-   Put validation schemas next to the feature forms.
-   Centralise formatters for INR, dates and quantities.
-   Use consistent error handling.
-   Avoid direct mock data mutation from components.
-   Avoid duplicate domain rules across pages.
-   Use semantic tokens and shared variants.
-   Keep dependencies purposeful.
-   Remove unused code, console noise and dead routes.
-   Add comments for non-obvious product rules, especially product-level
    request state and mock concurrency simulation.
-   Include a concise README with setup, demo roles, architecture and
    mock/real API boundary.

------------------------------------------------------------------------

## 25. Testing Strategy and Acceptance Criteria

Write tests for core utilities and user journeys where practical. At
minimum, validate the following behaviours manually or with automated
tests.

### Authentication and role experience

-   Demo Admin login opens Admin Dashboard.
-   Demo Member login opens Member Home.
-   Member cannot access Admin routes or see Admin navigation/alerts.
-   Admin can access admin routes.
-   Demo role switching works.
-   Theme preference persists across navigation/refresh.

### Member snack experience

-   Search and filters work together.
-   Snack detail shows correct derived stock state.
-   Consume decrements quantity once when available.
-   Quantity zero produces Gone state.
-   Consume conflict displays friendly feedback and refreshes quantity.
-   Vote/unvote toggles correctly and updates count.
-   New Arrivals show only qualifying recent products.
-   Snack of the Week is displayed consistently.

### Member requests

-   Member can submit a valid request.
-   Required fields validate correctly.
-   Expected price must be positive.
-   Optional note can be omitted.
-   Duplicate request by the same member for the same normalised product
    is rejected.
-   Member sees only their own request records.
-   Member cannot see requester count, other employees, notes or demand
    rankings.
-   Product status changes are reflected in the member's own tracking
    view.
-   Available appears only after Admin adds the product to inventory.
-   The Available request links to the newly created snack/New Arrival
    where appropriate.

### Admin inventory

-   Admin can add a snack.
-   Duplicate snack names are rejected case-insensitively.
-   Admin can edit and delete snacks with confirmation.
-   Admin can restock with a positive integer quantity.
-   Restocking updates quantity and creates activity.
-   Derived status is correct at boundary values:
    -   quantity 0 → gone
    -   quantity 1 through threshold → running_low
    -   quantity above threshold → stocked
-   Low-stock alert count and preview update correctly.

### Admin product requests

-   Admin sees one product-level row/group per normalised product.
-   Demand count is the number of distinct verified employees.
-   Multiple requests from one employee never inflate the count.
-   Ranking is highest distinct demand first with deterministic
    tie-breaking.
-   Admin approves/rejects once per product group.
-   Product-level status updates all associated member request views.
-   Approved → Purchased is supported.
-   Purchased → Available occurs only when inventory is created.
-   Approval does not create inventory.
-   Rejected products cannot be marked Purchased or Available.
-   Pending request alert count updates when product groups leave
    Requested status.

### Activity and general UX

-   Admin Activity Log shows consumption/restocking events.
-   Members do not see Activity navigation or feed.
-   All pages have loading, empty and error states.
-   Forms have accessible labels and useful validation.
-   Destructive actions require confirmation.
-   Main journeys work at mobile, tablet and desktop widths.
-   Light and Dark themes are polished and readable.
-   Keyboard navigation and visible focus work.
-   Reduced-motion preference is respected.
-   No horizontal overflow or broken images.
-   No dead buttons, placeholder links, Lorem Ipsum or console errors.

### Definition of Done

The Phase 1 frontend is complete when: 1. Both roles can complete their
intended journeys end-to-end using mock services. 2. Product-level
request decisions and private member tracking are consistent. 3.
Inventory, alerts, votes and activity remain coherent after mutations.
4. The design feels premium, playful and production-ready. 5. Responsive
layouts and both themes are complete. 6. Core interactions are
functional, not merely decorative. 7. The codebase is organised for
future real API integration. 8. The README explains how to run the app
and how the mock layer is structured.

------------------------------------------------------------------------

## 26. Future Backend Integration Contract --- Do Not Implement Now

This section preserves the original assignment's engineering
expectations for Phase 2. It is not permission to build backend code
during Phase 1.

When Phase 2 begins, the real backend must address:

-   User authentication and secure password hashing.
-   Server-side Admin/Member authorization.
-   Unique user email.
-   Snack validation and non-negative integer quantity.
-   Derived stock status.
-   Server-side filtering, search and pagination.
-   Atomic consume operation at the database level. If 10 people attempt
    to consume the last 3 units simultaneously, exactly 3 may succeed
    and the rest must receive a conflict response (HTTP 409).
-   Unique constraint for one vote per user per snack.
-   Product-level request grouping and unique requester/product
    membership.
-   Demand ranking based on distinct verified employees.
-   Product-level status transitions and consistent propagation to each
    member's private request view.
-   Approval must not automatically create inventory.
-   Purchase completion and inventory creation must be coordinated
    correctly.
-   Activity and stock changes must be committed in the same database
    transaction.
-   Consistent API error format, such as
    `{ "error": { "code": "...", "message": "..." } }`.
-   Tests for concurrency, authorization, validation, duplicate votes
    and request aggregation.
-   No secrets committed to source control.
-   Seed Admin and Member accounts for development.
-   README covering setup, schema, authentication and concurrency
    approach.

The future backend may use PostgreSQL and Prisma, with a Node.js REST
API. Final technology selection can be confirmed before Phase 2. Do not
introduce these dependencies in Phase 1.

------------------------------------------------------------------------

## 27. Execution Instructions for Google Antigravity

### Required implementation sequence

1.  Read this entire brief before making changes. Treat it as the source
    of truth for product scope, permissions, domain rules, UX, and
    acceptance criteria.
2.  Inspect the existing workspace and repository. Identify the current
    framework, routes, dependencies, design system, reusable components,
    and incomplete work. Preserve useful code and configuration.
3.  If the workspace is empty, scaffold the application using the
    specified stack. If an application already exists, extend it instead
    of replacing it unnecessarily.
4.  Establish design tokens, typography, the shared app shell,
    responsive navigation, and role-aware route protection.
5.  Define the TypeScript domain models, deterministic seed data, and
    mock service layer before connecting feature screens.
6.  Implement the Member and Admin journeys end-to-end. All screens must
    use the same coherent mock state and service contracts.
7.  Build the required interactions, validation,
    loading/empty/error/success/conflict states, and responsive layouts.
    Do not leave dead buttons, fake links, or disconnected controls.
8.  Use realistic fictional demo content and relevant snack imagery.
    Include image fallbacks and avoid layout shifts.
9.  Verify the application at mobile, tablet, and desktop widths. Check
    navigation, forms, dialogs, overflow, and keyboard access.
10. Verify both Light and Dark themes, including contrast, focus states,
    and status readability.
11. Run the available lint, type-check, test, and production-build
    commands. Fix failures before completion. Report only checks that
    were actually run.
12. Create or update the README with setup instructions, demo-role
    access, architecture, mock API boundaries, and Phase 2 integration
    notes.
13. Finish with a concise implementation report: features completed, key
    routes, demo login instructions, checks run, and known limitations.

### Antigravity working protocol

-   Work directly in the opened project workspace. Do not assume the
    repository is empty or that the current implementation should be
    discarded.
-   Start with a brief repository assessment and implementation plan,
    then continue into the actual build. Do not stop after planning,
    scaffolding, or producing a static visual mockup.
-   Use Antigravity's available editor, terminal, and preview/browser
    capabilities to implement and verify the application.
-   Make changes in small, coherent steps. After each major feature
    group, run relevant checks and inspect the rendered application.
-   Diagnose and fix command, dependency, type, runtime, and build
    failures. Do not hide failures or fabricate successful output.
-   Avoid duplicate dependencies and unnecessary configuration rewrites.
    If a requested package is incompatible, choose the closest stable
    compatible option and document the reason.
-   Make routine implementation decisions from this brief without
    repeatedly asking for approval. Ask only when a genuinely blocking
    ambiguity or unsafe destructive action cannot be resolved.
-   Keep the Phase 1 boundary strict: no real backend, database,
    authentication provider, external persistence, or production
    business logic.
-   Never describe mock persistence, demo login, or simulated
    concurrency as production security or database-level guarantees.

### Final instruction

Build **Snack Overflow**, not a generic inventory dashboard. The Member
experience should feel like a premium snack discovery product; the Admin
experience should feel like a calm, efficient operations workspace. Both
should share one coherent visual identity.

Prioritise a complete, cohesive, beautifully executed product over a
large collection of shallow screens. The result should feel worthy of a
real internal launch while remaining strictly within the frontend-only
Phase 1 boundary.
