import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma, ProductRequestStatus, SnackCategory, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { GET as getAdminRequests } from "@/app/api/requests/route";
import { PATCH as updateRequestStatus } from "@/app/api/requests/[id]/route";
import { POST as addToInventory } from "@/app/api/requests/[id]/inventory/route";

const mocks = vi.hoisted(() => ({
  findSession: vi.fn(),
  findManyGroups: vi.fn(),
  findUniqueGroup: vi.fn(),
  updateGroup: vi.fn(),
  createActivity: vi.fn(),
  findUniqueSnack: vi.fn(),
  createSnack: vi.fn(),
  updateSnack: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    session: { findUnique: mocks.findSession },
    productRequestGroup: {
      findMany: mocks.findManyGroups,
      findUnique: mocks.findUniqueGroup,
      update: mocks.updateGroup,
    },
    snack: {
      findUnique: mocks.findUniqueSnack,
      create: mocks.createSnack,
      update: mocks.updateSnack,
    },
    activity: {
      create: mocks.createActivity,
    },
    $transaction: mocks.transaction,
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

function makeRequest(
  path: string,
  method = "GET",
  body?: unknown,
  includeOrigin = true
) {
  const headers: Record<string, string> = {
    cookie: "snackoverflow_session=valid-session-token",
  };
  if (includeOrigin) {
    headers.origin = "http://localhost:3000";
  }
  if (body !== undefined) {
    headers["content-type"] = "application/json";
  }

  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("Admin Request Workflow API", () => {
  beforeEach(() => {
    vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        productRequestGroup: {
          findUnique: mocks.findUniqueGroup,
          update: mocks.updateGroup,
        },
        snack: {
          findUnique: mocks.findUniqueSnack,
          create: mocks.createSnack,
          update: mocks.updateSnack,
        },
        activity: {
          create: mocks.createActivity,
        },
      })
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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

  describe("GET /api/requests (Admin list)", () => {
    it("returns 403 when accessed by non-admin member", async () => {
      authenticateAs(memberUser);

      const request = makeRequest("/api/requests");
      const response = await getAdminRequests(request);
      expect(response.status).toBe(403);
    });

    it("returns grouped product requests with distinct requester counts", async () => {
      authenticateAs(adminUser);

      mocks.findManyGroups.mockResolvedValue([
        {
          id: "group-1",
          normalizedName: "diet coke",
          productName: "Diet Coke",
          status: ProductRequestStatus.REQUESTED,
          reviewedById: null,
          reviewedAt: null,
          decisionNote: null,
          purchasedAt: null,
          availableAt: null,
          actualQuantityAdded: null,
          linkedSnackId: null,
          createdAt: new Date("2026-03-01T10:00:00Z"),
          updatedAt: new Date("2026-03-01T10:00:00Z"),
          reviewedBy: null,
          requests: [
            {
              id: "req-1",
              groupId: "group-1",
              userId: "user-1",
              expectedPriceInr: new Prisma.Decimal(40),
              note: "Need cold ones",
              createdAt: new Date("2026-03-01T10:00:00Z"),
              user: { id: "user-1", name: "User 1", isVerified: true },
            },
            {
              id: "req-2",
              groupId: "group-1",
              userId: "user-2",
              expectedPriceInr: new Prisma.Decimal(45),
              note: null,
              createdAt: new Date("2026-03-01T11:00:00Z"),
              user: { id: "user-2", name: "User 2", isVerified: true },
            },
          ],
        },
      ]);

      const request = makeRequest("/api/requests");
      const response = await getAdminRequests(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.requests).toHaveLength(1);
      expect(data.requests[0].productName).toBe("Diet Coke");
      expect(data.requests[0].distinctRequesterCount).toBe(2);
      expect(data.requests[0].requests).toHaveLength(2);
    });
  });

  describe("PATCH /api/requests/[id] (Status transitions)", () => {
    it("approves a requested product group", async () => {
      authenticateAs(adminUser);

      mocks.findUniqueGroup.mockResolvedValue({
        id: "group-1",
        status: ProductRequestStatus.REQUESTED,
        productName: "Diet Coke",
      });

      mocks.updateGroup.mockResolvedValue({
        id: "group-1",
        normalizedName: "diet coke",
        productName: "Diet Coke",
        status: ProductRequestStatus.APPROVED,
        reviewedById: adminUser.id,
        reviewedAt: new Date(),
        decisionNote: "Approved for Friday haul",
        purchasedAt: null,
        availableAt: null,
        actualQuantityAdded: null,
        linkedSnackId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        reviewedBy: { id: adminUser.id, name: adminUser.name },
        requests: [],
      });

      const request = makeRequest(
        "/api/requests/group-1",
        "PATCH",
        {
          status: "approved",
          decisionNote: "Approved for Friday haul",
        }
      );

      const response = await updateRequestStatus(request, {
        params: Promise.resolve({ id: "group-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.request.status).toBe("approved");
      expect(data.request.decisionNote).toBe("Approved for Friday haul");
      expect(mocks.createActivity).toHaveBeenCalledTimes(1);
    });

    it("rejects an invalid transition (requested -> purchased)", async () => {
      authenticateAs(adminUser);

      mocks.findUniqueGroup.mockResolvedValue({
        id: "group-1",
        status: ProductRequestStatus.REQUESTED,
        productName: "Diet Coke",
      });

      const request = makeRequest(
        "/api/requests/group-1",
        "PATCH",
        {
          status: "purchased",
        }
      );

      const response = await updateRequestStatus(request, {
        params: Promise.resolve({ id: "group-1" }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/requests/[id]/inventory (Purchase-to-inventory)", () => {
    it("adds purchased product to pantry inventory and marks as available", async () => {
      authenticateAs(adminUser);

      mocks.findUniqueGroup.mockResolvedValue({
        id: "group-1",
        status: ProductRequestStatus.PURCHASED,
        linkedSnackId: null,
        productName: "Diet Coke",
      });

      mocks.findUniqueSnack.mockResolvedValue(null);

      mocks.createSnack.mockResolvedValue({
        id: "snack-new-1",
        name: "Diet Coke",
        normalizedName: "diet coke",
        category: SnackCategory.DRINK,
        description: "Zero sugar cola",
        imageUrl: "https://example.com/coke.png",
        quantity: 24,
        lowStockThreshold: 5,
        priceInr: new Prisma.Decimal(40),
        arrivalUntil: new Date(),
      });

      mocks.updateGroup.mockResolvedValue({
        id: "group-1",
        normalizedName: "diet coke",
        productName: "Diet Coke",
        status: ProductRequestStatus.AVAILABLE,
        reviewedById: adminUser.id,
        reviewedAt: new Date(),
        decisionNote: null,
        purchasedAt: new Date(),
        availableAt: new Date(),
        actualQuantityAdded: 24,
        linkedSnackId: "snack-new-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        reviewedBy: { id: adminUser.id, name: adminUser.name },
        requests: [],
      });

      const request = makeRequest(
        "/api/requests/group-1/inventory",
        "POST",
        {
          name: "Diet Coke",
          category: "drink",
          description: "Zero sugar cola",
          quantity: 24,
          lowStockThreshold: 5,
          imageUrl: "https://example.com/coke.png",
          priceInr: 40,
        }
      );

      const response = await addToInventory(request, {
        params: Promise.resolve({ id: "group-1" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.productRequest.status).toBe("available");
      expect(data.snackId).toBe("snack-new-1");
      expect(mocks.createActivity).toHaveBeenCalledTimes(1);
    });
  });
});
