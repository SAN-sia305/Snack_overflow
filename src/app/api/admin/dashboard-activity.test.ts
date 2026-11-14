import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { GET as getAdminSummary } from "@/app/api/admin/summary/route";
import { GET as getAdminAlerts } from "@/app/api/admin/alerts/route";
import { GET as getActivities } from "@/app/api/activity/route";

const mocks = vi.hoisted(() => ({
  findSession: vi.fn(),
  findManySnacks: vi.fn(),
  countGroups: vi.fn(),
  countVotes: vi.fn(),
  findManyGroups: vi.fn(),
  findManyActivities: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    session: { findUnique: mocks.findSession },
    snack: { findMany: mocks.findManySnacks },
    productRequestGroup: {
      count: mocks.countGroups,
      findMany: mocks.findManyGroups,
    },
    vote: { count: mocks.countVotes },
    activity: { findMany: mocks.findManyActivities },
  },
}));

const adminUser = {
  id: "admin-1",
  name: "Arun Kumar",
  email: "admin@bipolarfactory.com",
  role: UserRole.ADMIN,
  isVerified: true,
};

const memberUser = {
  id: "member-1",
  name: "Priya Sharma",
  email: "priya@bipolarfactory.com",
  role: UserRole.MEMBER,
  isVerified: true,
};

function makeRequest(path: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: {
      cookie: "snackoverflow_session=valid-session-token",
    },
  });
}

describe("Admin Dashboard, Alerts & Activity APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function authenticateAs(user: typeof adminUser | typeof memberUser) {
    mocks.findSession.mockResolvedValue({
      id: "sess-1",
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });
  }

  describe("GET /api/admin/summary", () => {
    it("returns 403 when accessed by member", async () => {
      authenticateAs(memberUser);
      const res = await getAdminSummary(makeRequest("/api/admin/summary"));
      expect(res.status).toBe(403);
    });

    it("returns accurate counts for stocked, running-low, and gone", async () => {
      authenticateAs(adminUser);

      mocks.findManySnacks.mockResolvedValue([
        { quantity: 10, lowStockThreshold: 5 }, // stocked
        { quantity: 3, lowStockThreshold: 5 },  // running_low
        { quantity: 0, lowStockThreshold: 5 },  // gone
      ]);
      mocks.countGroups.mockResolvedValue(4);
      mocks.countVotes.mockResolvedValue(15);

      const res = await getAdminSummary(makeRequest("/api/admin/summary"));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toEqual({
        totalSnacks: 3,
        stockedCount: 1,
        runningLowCount: 1,
        goneCount: 1,
        pendingRequestsCount: 4,
        totalVotes: 15,
      });
    });
  });

  describe("GET /api/admin/alerts", () => {
    it("returns low-stock snacks and pending requests", async () => {
      authenticateAs(adminUser);

      mocks.findManySnacks.mockResolvedValue([
        {
          id: "snack-1",
          name: "Chai Biscuits",
          category: "SWEET",
          description: "Crispy tea biscuits",
          imageUrl: "https://example.com/biscuit.png",
          quantity: 2,
          lowStockThreshold: 5,
          createdAt: new Date("2026-01-01T00:00:00Z"),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
          arrivalUntil: null,
          priceInr: null,
          _count: { votes: 8 },
        },
      ]);

      mocks.findManyGroups.mockResolvedValue([
        {
          id: "group-1",
          normalizedName: "dark chocolate",
          productName: "Dark Chocolate",
          status: "REQUESTED",
          reviewedBy: null,
          reviewedAt: null,
          decisionNote: null,
          purchasedAt: null,
          availableAt: null,
          actualQuantityAdded: null,
          linkedSnackId: null,
          createdAt: new Date("2026-01-01T00:00:00Z"),
          updatedAt: new Date("2026-01-01T00:00:00Z"),
          requests: [
            {
              id: "req-1",
              groupId: "group-1",
              userId: "u-1",
              expectedPriceInr: 100,
              note: null,
              createdAt: new Date("2026-01-01T00:00:00Z"),
              user: { id: "u-1", name: "User 1", isVerified: true },
            },
          ],
        },
      ]);

      const res = await getAdminAlerts(makeRequest("/api/admin/alerts"));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.lowStockAlert.count).toBe(1);
      expect(data.lowStockAlert.items[0].name).toBe("Chai Biscuits");
      expect(data.pendingRequestsAlert.count).toBe(1);
      expect(data.pendingRequestsAlert.items[0].productName).toBe("Dark Chocolate");
    });
  });

  describe("GET /api/activity", () => {
    it("returns formatted activities for admin", async () => {
      authenticateAs(adminUser);

      mocks.findManyActivities.mockResolvedValue([
        {
          id: "act-1",
          actorUserId: "u-1",
          action: "CONSUMED",
          snackId: "s-1",
          groupId: null,
          snackName: "Almonds",
          amount: 1,
          note: null,
          createdAt: new Date("2026-03-01T10:00:00Z"),
          actor: { id: "u-1", name: "Arun Kumar", role: "ADMIN" },
        },
      ]);

      const res = await getActivities(makeRequest("/api/activity"));
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.activities).toHaveLength(1);
      expect(data.activities[0].snackName).toBe("Almonds");
      expect(data.activities[0].action).toBe("consumed");
      expect(data.activities[0].userName).toBe("Arun Kumar");
    });
  });
});

