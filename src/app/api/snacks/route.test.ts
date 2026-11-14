import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { GET } from "@/app/api/snacks/route";
import { GET as getSnack } from "@/app/api/snacks/[id]/route";

const mocks = vi.hoisted(() => ({
  findSession: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  findSnack: vi.fn(),
  lowStockThresholdField: { name: "lowStockThreshold" },
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    session: { findUnique: mocks.findSession },
    snack: {
      findMany: mocks.findMany,
      count: mocks.count,
      findUnique: mocks.findSnack,
      fields: { lowStockThreshold: mocks.lowStockThresholdField },
    },
  },
}));

const member = {
  id: "member-1",
  name: "Priya Sharma",
  email: "member@bipolarfactory.com",
  role: UserRole.MEMBER,
  isVerified: true,
};

const snack = {
  id: "snack_1",
  name: "Filter Coffee",
  normalizedName: "filter coffee",
  category: "DRINK",
  description: "Fresh coffee",
  imageUrl: "https://example.test/coffee.jpg",
  quantity: 3,
  lowStockThreshold: 5,
  priceInr: 30,
  arrivalUntil: null,
  createdAt: new Date("2026-11-10T10:00:00.000Z"),
  updatedAt: new Date("2026-11-13T10:00:00.000Z"),
  _count: { votes: 4 },
};

function request(path: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { cookie: "snackoverflow_session=valid-session-token" },
  });
}

beforeEach(() => {
  mocks.findSession.mockReset();
  mocks.findMany.mockReset();
  mocks.count.mockReset();
  mocks.findSnack.mockReset();
  mocks.findSession.mockResolvedValue({
    expiresAt: new Date(Date.now() + 60_000),
    user: member,
  });
});

describe("snack read API", () => {
  it("applies validated filters, stable sorting, pagination, and DTO mapping", async () => {
    mocks.findMany.mockResolvedValue([snack]);
    mocks.count.mockResolvedValue(21);

    const response = await GET(
      request(
        "/api/snacks?search=Coffee&category=drink&status=running_low&sortBy=votes-desc&page=2&limit=10"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items).toEqual([
      {
        id: "snack_1",
        name: "Filter Coffee",
        category: "drink",
        description: "Fresh coffee",
        imageUrl: "https://example.test/coffee.jpg",
        quantity: 3,
        lowStockThreshold: 5,
        voteCount: 4,
        createdAt: "2026-11-10T10:00:00.000Z",
        updatedAt: "2026-11-13T10:00:00.000Z",
        priceInr: 30,
      },
    ]);
    expect(body.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: expect.objectContaining({
          category: "DRINK",
          quantity: {
            gt: 0,
            lte: mocks.lowStockThresholdField,
          },
          OR: [
            { name: { contains: "Coffee", mode: "insensitive" } },
            { description: { contains: "Coffee", mode: "insensitive" } },
          ],
        }),
        orderBy: [
          { votes: { _count: "desc" } },
          { name: "asc" },
          { id: "asc" },
        ],
      })
    );
  });

  it("rejects invalid filters and unauthenticated requests using the API error shape", async () => {
    const invalidResponse = await GET(
      request("/api/snacks?limit=101&sortBy=unknown")
    );
    expect(invalidResponse.status).toBe(400);
    expect(await invalidResponse.json()).toEqual({
      error: {
        code: "INVALID_QUERY",
        message: "One or more query parameters are invalid.",
      },
    });
    expect(mocks.findMany).not.toHaveBeenCalled();

    mocks.findSession.mockResolvedValue(null);
    const unauthenticatedResponse = await GET(
      new NextRequest("http://localhost:3000/api/snacks")
    );
    expect(unauthenticatedResponse.status).toBe(401);
    expect(await unauthenticatedResponse.json()).toMatchObject({
      error: { code: "UNAUTHENTICATED" },
    });
  });

  it.each([
    ["gone", 0],
    ["running_low", { gt: 0, lte: mocks.lowStockThresholdField }],
    ["stocked", { gt: mocks.lowStockThresholdField }],
  ])("filters derived %s stock status in the database", async (status, quantity) => {
    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(request(`/api/snacks?status=${status}`));

    expect(response.status).toBe(200);
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ quantity }),
      })
    );
  });

  it("filters new arrivals and search terms together", async () => {
    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(0);

    const response = await GET(
      request("/api/snacks?newArrivals=true&search=coffee")
    );

    expect(response.status).toBe(200);
    const where = mocks.findMany.mock.calls[0][0].where;
    expect(where.AND).toHaveLength(2);
    expect(where.AND[0].OR).toEqual([
      { name: { contains: "coffee", mode: "insensitive" } },
      { description: { contains: "coffee", mode: "insensitive" } },
    ]);
    expect(where.AND[1].OR).toEqual([
      { arrivalUntil: { gte: expect.any(Date) } },
      {
        arrivalUntil: null,
        createdAt: { gte: expect.any(Date) },
      },
    ]);
  });

  it("returns a safe snack detail DTO or a standard not-found response", async () => {
    mocks.findSnack.mockResolvedValue(snack);
    const response = await getSnack(request("/api/snacks/snack_1"), {
      params: Promise.resolve({ id: "snack_1" }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      snack: { id: "snack_1", category: "drink", voteCount: 4 },
    });

    mocks.findSnack.mockResolvedValue(null);
    const missingResponse = await getSnack(request("/api/snacks/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(missingResponse.status).toBe(404);
    expect(await missingResponse.json()).toMatchObject({
      error: { code: "NOT_FOUND" },
    });
  });
});
