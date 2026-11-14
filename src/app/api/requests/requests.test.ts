import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma, UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { POST as submitRequest } from "@/app/api/requests/route";
import { GET as getMyRequests } from "@/app/api/requests/me/route";

const mocks = vi.hoisted(() => ({
  findSession: vi.fn(),
  findMyRequests: vi.fn(),
  findGroup: vi.fn(),
  upsertGroup: vi.fn(),
  findMemberRequest: vi.fn(),
  createMemberRequest: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    session: { findUnique: mocks.findSession },
    productRequestGroup: {
      findUnique: mocks.findGroup,
      upsert: mocks.upsertGroup,
    },
    memberSnackRequest: {
      findMany: mocks.findMyRequests,
      findUnique: mocks.findMemberRequest,
      create: mocks.createMemberRequest,
    },
    $transaction: mocks.transaction,
  },
}));

const member = {
  id: "member-1",
  name: "Priya Sharma",
  email: "member@bipolarfactory.com",
  role: UserRole.MEMBER,
  isVerified: true,
};

const admin = { ...member, id: "admin-1", role: UserRole.ADMIN };

const groupRecord = {
  id: "group-1",
  productName: "Masala Puffs",
  status: "REQUESTED",
  decisionNote: null,
  reviewedAt: null,
  purchasedAt: null,
  availableAt: null,
  linkedSnackId: null,
};

const requestRecord = {
  id: "member-request-1",
  groupId: "group-1",
  expectedPriceInr: new Prisma.Decimal("40.00"),
  note: "Good evening snack.",
  createdAt: new Date("2026-11-14T05:30:00.000Z"),
  group: groupRecord,
};

function request(
  path: string,
  method = "GET",
  body?: unknown,
  includeOrigin = true,
  includeSession = true
) {
  const headers: Record<string, string> = {};
  if (includeSession) {
    headers.cookie = "snackoverflow_session=valid-session-token";
  }
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

beforeEach(() => {
  vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
  mocks.findSession.mockReset();
  mocks.findMyRequests.mockReset();
  mocks.findGroup.mockReset();
  mocks.upsertGroup.mockReset();
  mocks.findMemberRequest.mockReset();
  mocks.createMemberRequest.mockReset();
  mocks.transaction.mockReset();

  const transactionClient = {
    productRequestGroup: {
      findUnique: mocks.findGroup,
      upsert: mocks.upsertGroup,
    },
    memberSnackRequest: {
      findUnique: mocks.findMemberRequest,
      create: mocks.createMemberRequest,
    },
  };
  mocks.transaction.mockImplementation(
    async (operation: (client: typeof transactionClient) => Promise<unknown>) =>
      operation(transactionClient)
  );
  mocks.findGroup.mockResolvedValue(null);
  mocks.upsertGroup.mockResolvedValue({
    id: groupRecord.id,
    productName: groupRecord.productName,
  });
  mocks.findMemberRequest.mockResolvedValue(null);
  mocks.createMemberRequest.mockResolvedValue(requestRecord);
  mocks.findSession.mockResolvedValue({
    expiresAt: new Date(Date.now() + 60_000),
    user: member,
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("private member snack request API", () => {
  it("returns only the signed-in member's requests and omits group requester data", async () => {
    mocks.findMyRequests.mockResolvedValue([requestRecord]);

    const response = await getMyRequests(request("/api/requests/me"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      requests: [
        {
          id: "member-request-1",
          productRequestId: "group-1",
          productName: "Masala Puffs",
          expectedPriceInr: 40,
          note: "Good evening snack.",
          createdAt: "2026-11-14T05:30:00.000Z",
          status: "requested",
        },
      ],
    });
    expect(mocks.findMyRequests).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: member.id },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      })
    );
  });

  it("creates a normalized product group request for the session member", async () => {
    const response = await submitRequest(
      request("/api/requests", "POST", {
        productName: "  Masala   Puffs ",
        expectedPriceInr: 42.5,
        note: "  Please add this  ",
      })
    );

    expect(response.status).toBe(201);
    expect((await response.json()).request).toMatchObject({
      productRequestId: "group-1",
      productName: "Masala Puffs",
      expectedPriceInr: 40,
      status: "requested",
    });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.upsertGroup).toHaveBeenCalledWith({
      where: { normalizedName: "masala puffs" },
      create: {
        normalizedName: "masala puffs",
        productName: "Masala   Puffs",
      },
      update: { updatedAt: expect.any(Date) },
      select: { id: true, productName: true },
    });
    const createData = mocks.createMemberRequest.mock.calls[0][0].data;
    expect(createData).toMatchObject({
      groupId: "group-1",
      userId: member.id,
      note: "Please add this",
    });
    expect(createData.expectedPriceInr.toString()).toBe("42.5");
  });

  it("adds a different member's request to the existing normalized product group", async () => {
    mocks.findGroup.mockResolvedValue({
      id: "group-1",
      productName: "Masala Puffs",
    });

    const response = await submitRequest(
      request("/api/requests", "POST", {
        productName: "masala puffs",
        expectedPriceInr: 39,
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.upsertGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { normalizedName: "masala puffs" },
      })
    );
    expect(mocks.createMemberRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          groupId: "group-1",
          userId: member.id,
        }),
      })
    );
  });

  it("rejects normalized duplicate requests without creating another member request", async () => {
    mocks.findGroup.mockResolvedValue({
      id: "group-1",
      productName: "Masala Puffs",
    });
    mocks.findMemberRequest.mockResolvedValue({ id: "existing-request" });

    const response = await submitRequest(
      request("/api/requests", "POST", {
        productName: "masala   puffs",
        expectedPriceInr: 40,
      })
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: { code: "DUPLICATE_REQUEST" },
    });
    expect(mocks.upsertGroup).not.toHaveBeenCalled();
    expect(mocks.createMemberRequest).not.toHaveBeenCalled();
  });

  it("validates payloads and restricts request access to authenticated members", async () => {
    const invalid = await submitRequest(
      request("/api/requests", "POST", {
        productName: " ",
        expectedPriceInr: 5_001,
        userId: "another-user",
      })
    );
    expect(invalid.status).toBe(400);

    const csrfDenied = await submitRequest(
      request(
        "/api/requests",
        "POST",
        { productName: "Trail Mix", expectedPriceInr: 40 },
        false
      )
    );
    expect(csrfDenied.status).toBe(403);

    mocks.findSession.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: admin,
    });
    const adminDenied = await getMyRequests(request("/api/requests/me"));
    expect(adminDenied.status).toBe(403);

    const unauthenticated = await getMyRequests(
      request("/api/requests/me", "GET", undefined, true, false)
    );
    expect(unauthenticated.status).toBe(401);
  });
});
