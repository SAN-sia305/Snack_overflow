import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { POST as consumeSnack } from "@/app/api/snacks/[id]/consume/route";
import { POST as restockSnack } from "@/app/api/snacks/[id]/restock/route";

const mocks = vi.hoisted(() => ({
  findSession: vi.fn(),
  updateMany: vi.fn(),
  findSnack: vi.fn(),
  createActivity: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    session: { findUnique: mocks.findSession },
    snack: { updateMany: mocks.updateMany },
    $transaction: mocks.transaction,
  },
}));

const admin = {
  id: "admin-1",
  name: "Arun Kumar",
  email: "admin@bipolarfactory.com",
  role: UserRole.ADMIN,
  isVerified: true,
};

const member = {
  ...admin,
  id: "member-1",
  name: "Priya Sharma",
  email: "member@bipolarfactory.com",
  role: UserRole.MEMBER,
};

const updatedSnack = {
  id: "snack_1",
  name: "Filter Coffee",
  normalizedName: "filter coffee",
  category: "DRINK",
  description: "Fresh coffee for the pantry.",
  imageUrl: "https://example.test/coffee.jpg",
  quantity: 4,
  lowStockThreshold: 5,
  priceInr: null,
  arrivalUntil: null,
  createdAt: new Date("2026-11-14T05:30:00.000Z"),
  updatedAt: new Date("2026-11-14T05:30:00.000Z"),
  _count: { votes: 0 },
};

function request(
  path: string,
  method: string,
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

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
  mocks.findSession.mockReset();
  mocks.updateMany.mockReset();
  mocks.findSnack.mockReset();
  mocks.createActivity.mockReset();
  mocks.transaction.mockReset();

  const transactionClient = {
    snack: {
      updateMany: mocks.updateMany,
      findUnique: mocks.findSnack,
    },
    activity: { create: mocks.createActivity },
  };
  mocks.transaction.mockImplementation(
    async (operation: (client: typeof transactionClient) => Promise<unknown>) =>
      operation(transactionClient)
  );
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.findSnack.mockResolvedValue(updatedSnack);
  mocks.createActivity.mockResolvedValue({});
  mocks.findSession.mockResolvedValue({
    expiresAt: new Date(Date.now() + 60_000),
    user: member,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("transactional snack stock APIs", () => {
  it("decrements stock and records the authenticated consumer in one transaction", async () => {
    const response = await consumeSnack(
      request("/api/snacks/snack_1/consume", "POST"),
      context("snack_1")
    );

    expect(response.status).toBe(200);
    expect((await response.json()).snack.quantity).toBe(4);
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "snack_1", quantity: { gt: 0 } },
      data: { quantity: { decrement: 1 } },
    });
    expect(mocks.createActivity).toHaveBeenCalledWith({
      data: {
        actor: { connect: { id: member.id } },
        action: "CONSUMED",
        snack: { connect: { id: "snack_1" } },
        snackName: "Filter Coffee",
        amount: 1,
      },
    });
  });

  it("returns a stock conflict for the last packet race and 404 for a missing snack", async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.findSnack.mockResolvedValueOnce({ id: "snack_1" });

    const conflict = await consumeSnack(
      request("/api/snacks/snack_1/consume", "POST"),
      context("snack_1")
    );
    expect(conflict.status).toBe(409);
    expect(await conflict.json()).toMatchObject({
      error: {
        code: "STOCK_CONFLICT",
        message:
          "Someone beat you to the last packet. Better luck next time.",
      },
    });
    expect(mocks.createActivity).not.toHaveBeenCalled();

    mocks.findSnack.mockResolvedValueOnce(null);
    const missing = await consumeSnack(
      request("/api/snacks/missing/consume", "POST"),
      context("missing")
    );
    expect(missing.status).toBe(404);
  });

  it("requires an Admin and validates restock requests", async () => {
    const forbidden = await restockSnack(
      request("/api/snacks/snack_1/restock", "POST", { quantity: 2 }),
      context("snack_1")
    );
    expect(forbidden.status).toBe(403);

    mocks.findSession.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: admin,
    });
    const invalid = await restockSnack(
      request("/api/snacks/snack_1/restock", "POST", {
        quantity: 0,
        unexpected: true,
      }),
      context("snack_1")
    );
    expect(invalid.status).toBe(400);
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("adds stock and records the Admin and normalized note atomically", async () => {
    mocks.findSession.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: admin,
    });
    mocks.findSnack.mockResolvedValue({ ...updatedSnack, quantity: 9 });

    const response = await restockSnack(
      request("/api/snacks/snack_1/restock", "POST", {
        quantity: 5,
        note: "  Weekly pantry restock  ",
      }),
      context("snack_1")
    );

    expect(response.status).toBe(200);
    expect((await response.json()).snack.quantity).toBe(9);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: "snack_1",
        quantity: { lte: 2_147_483_642 },
      },
      data: { quantity: { increment: 5 } },
    });
    expect(mocks.createActivity).toHaveBeenCalledWith({
      data: {
        actor: { connect: { id: admin.id } },
        action: "RESTOCKED",
        snack: { connect: { id: "snack_1" } },
        snackName: "Filter Coffee",
        amount: 5,
        note: "Weekly pantry restock",
      },
    });
  });

  it("rejects untrusted origins and restocks that would exceed the integer limit", async () => {
    const csrfDenied = await consumeSnack(
      request("/api/snacks/snack_1/consume", "POST", undefined, false),
      context("snack_1")
    );
    expect(csrfDenied.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();

    mocks.findSession.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: admin,
    });
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.findSnack.mockResolvedValue({ id: "snack_1" });

    const overflow = await restockSnack(
      request("/api/snacks/snack_1/restock", "POST", {
        quantity: 1,
      }),
      context("snack_1")
    );
    expect(overflow.status).toBe(409);
    expect(await overflow.json()).toMatchObject({
      error: { code: "QUANTITY_LIMIT_EXCEEDED" },
    });
    expect(mocks.createActivity).not.toHaveBeenCalled();
  });
});
