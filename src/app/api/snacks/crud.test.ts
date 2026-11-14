import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/snacks/route";
import {
  DELETE,
  PATCH,
} from "@/app/api/snacks/[id]/route";

const mocks = vi.hoisted(() => ({
  findSession: vi.fn(),
  createSnack: vi.fn(),
  updateSnack: vi.fn(),
  deleteSnack: vi.fn(),
  createActivity: vi.fn(),
  transaction: vi.fn(),
  findRequestGroup: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    session: { findUnique: mocks.findSession },
    snack: {
      create: mocks.createSnack,
      update: mocks.updateSnack,
      delete: mocks.deleteSnack,
    },
    activity: { create: mocks.createActivity },
    productRequestGroup: { findUnique: mocks.findRequestGroup },
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

const member = { ...admin, id: "member-1", role: UserRole.MEMBER };

const dbSnack = {
  id: "snack_new",
  name: "Masala Puffs",
  normalizedName: "masala puffs",
  category: "SWEET",
  description: "A crunchy pantry snack.",
  imageUrl: "https://example.test/masala-puffs.jpg",
  quantity: 12,
  lowStockThreshold: 4,
  priceInr: new Prisma.Decimal("12.50"),
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
    cookie: "snackoverflow_session=admin-session-token",
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
  mocks.createSnack.mockReset();
  mocks.updateSnack.mockReset();
  mocks.deleteSnack.mockReset();
  mocks.createActivity.mockReset();
  mocks.transaction.mockReset();
  mocks.findRequestGroup.mockReset();
  mocks.findRequestGroup.mockResolvedValue(null);

  const transactionClient = {
    snack: {
      create: mocks.createSnack,
      update: mocks.updateSnack,
      delete: mocks.deleteSnack,
    },
    activity: { create: mocks.createActivity },
  };
  mocks.transaction.mockImplementation(
    async (operation: (client: typeof transactionClient) => Promise<unknown>) =>
      operation(transactionClient)
  );
  mocks.findSession.mockResolvedValue({
    expiresAt: new Date(Date.now() + 60_000),
    user: admin,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Admin snack CRUD API", () => {
  it("creates snacks with normalized names and records initial stock atomically", async () => {
    mocks.createSnack.mockResolvedValue(dbSnack);
    mocks.createActivity.mockResolvedValue({});

    const response = await POST(
      request("/api/snacks", "POST", {
        name: "  Masala   Puffs ",
        category: "sweet",
        description: "A crunchy pantry snack.",
        imageUrl: "https://example.test/masala-puffs.jpg",
        quantity: 12,
        lowStockThreshold: 4,
        priceInr: 12.5,
      })
    );

    expect(response.status).toBe(201);
    expect((await response.json()).snack).toMatchObject({
      id: "snack_new",
      name: "Masala Puffs",
      category: "sweet",
      quantity: 12,
      voteCount: 0,
      priceInr: 12.5,
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.createSnack).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Masala   Puffs",
          normalizedName: "masala puffs",
          category: "SWEET",
          quantity: 12,
        }),
      })
    );
    expect(mocks.createActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actor: { connect: { id: admin.id } },
          action: "RESTOCKED",
          amount: 12,
          note: "Initial pantry inventory creation.",
        }),
      })
    );
  });

  it("rejects member access and invalid payloads before writing", async () => {
    mocks.findSession.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: member,
    });
    const forbidden = await POST(
      request("/api/snacks", "POST", {
        name: "Snack",
        category: "sweet",
        description: "Valid snack description.",
        imageUrl: "https://example.test/snack.jpg",
        quantity: 0,
        lowStockThreshold: 5,
      })
    );
    expect(forbidden.status).toBe(403);

    mocks.findSession.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: admin,
    });
    const invalid = await POST(
      request("/api/snacks", "POST", {
        name: " ",
        category: "unknown",
        quantity: -1,
      })
    );
    expect(invalid.status).toBe(400);

    const emptyUpdate = await PATCH(
      request("/api/snacks/snack_new", "PATCH", {}),
      context("snack_new")
    );
    expect(emptyUpdate.status).toBe(400);
    expect(mocks.createSnack).not.toHaveBeenCalled();
    expect(mocks.updateSnack).not.toHaveBeenCalled();
  });

  it("returns a conflict for a duplicate normalized name", async () => {
    mocks.transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique violation", {
        code: "P2002",
        clientVersion: "6.19.0",
      })
    );

    const response = await POST(
      request("/api/snacks", "POST", {
        name: "Masala Puffs",
        category: "sweet",
        description: "A crunchy pantry snack.",
        imageUrl: "https://example.test/masala-puffs.jpg",
        quantity: 0,
        lowStockThreshold: 4,
      })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "CONFLICT" },
    });
  });

  it("updates only supplied fields and allows clearing the optional price", async () => {
    mocks.updateSnack.mockResolvedValue({
      ...dbSnack,
      name: "New Masala Puffs",
      normalizedName: "new masala puffs",
      priceInr: null,
    });

    const response = await PATCH(
      request("/api/snacks/snack_new", "PATCH", {
        name: "New Masala Puffs",
        priceInr: null,
      }),
      context("snack_new")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.snack.name).toBe("New Masala Puffs");
    expect(body.snack).not.toHaveProperty("priceInr");
    expect(mocks.updateSnack).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "snack_new" },
        data: {
          name: "New Masala Puffs",
          normalizedName: "new masala puffs",
          priceInr: null,
        },
      })
    );
  });

  it("requires a trusted origin for writes and returns 204 on deletion", async () => {
    const csrfDenied = await PATCH(
      request("/api/snacks/snack_new", "PATCH", { quantity: 1 }, false),
      context("snack_new")
    );
    expect(csrfDenied.status).toBe(403);
    expect(mocks.updateSnack).not.toHaveBeenCalled();

    mocks.deleteSnack.mockResolvedValue(dbSnack);
    const response = await DELETE(
      request("/api/snacks/snack_new", "DELETE"),
      context("snack_new")
    );

    expect(response.status).toBe(204);
    expect(mocks.deleteSnack).toHaveBeenCalledWith({
      where: { id: "snack_new" },
    });
  });

  it("prevents deleting a snack linked to an available request", async () => {
    mocks.findRequestGroup.mockResolvedValue({ id: "request-group-1" });

    const response = await DELETE(
      request("/api/snacks/snack_new", "DELETE"),
      context("snack_new")
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "SNACK_LINKED_TO_REQUEST" },
    });
    expect(mocks.deleteSnack).not.toHaveBeenCalled();
  });

  it("returns not found when updating or deleting a missing snack", async () => {
    const missingRecord = () =>
      new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "6.19.0",
      });
    mocks.updateSnack.mockRejectedValueOnce(missingRecord());

    const updateResponse = await PATCH(
      request("/api/snacks/missing", "PATCH", { quantity: 3 }),
      context("missing")
    );
    expect(updateResponse.status).toBe(404);

    mocks.deleteSnack.mockRejectedValueOnce(missingRecord());
    const deleteResponse = await DELETE(
      request("/api/snacks/missing", "DELETE"),
      context("missing")
    );
    expect(deleteResponse.status).toBe(404);
  });
});
