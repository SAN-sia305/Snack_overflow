import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole } from "@prisma/client";
import { NextRequest } from "next/server";
import { GET as getVotes } from "@/app/api/votes/route";
import { POST as toggleVote } from "@/app/api/snacks/[id]/vote/route";

const mocks = vi.hoisted(() => ({
  findSession: vi.fn(),
  findUserVotes: vi.fn(),
  findSnack: vi.fn(),
  findVote: vi.fn(),
  createVote: vi.fn(),
  deleteVote: vi.fn(),
  countVotes: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    session: { findUnique: mocks.findSession },
    snack: { findUnique: mocks.findSnack },
    vote: {
      findMany: mocks.findUserVotes,
      findUnique: mocks.findVote,
      create: mocks.createVote,
      delete: mocks.deleteVote,
      count: mocks.countVotes,
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

function context(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
  mocks.findSession.mockReset();
  mocks.findUserVotes.mockReset();
  mocks.findSnack.mockReset();
  mocks.findVote.mockReset();
  mocks.createVote.mockReset();
  mocks.deleteVote.mockReset();
  mocks.countVotes.mockReset();
  mocks.transaction.mockReset();

  const transactionClient = {
    snack: { findUnique: mocks.findSnack },
    vote: {
      findUnique: mocks.findVote,
      create: mocks.createVote,
      delete: mocks.deleteVote,
      count: mocks.countVotes,
    },
  };
  mocks.transaction.mockImplementation(
    async (operation: (client: typeof transactionClient) => Promise<unknown>) =>
      operation(transactionClient)
  );
  mocks.findSession.mockResolvedValue({
    expiresAt: new Date(Date.now() + 60_000),
    user: member,
  });
  mocks.findSnack.mockResolvedValue({ id: "snack_1" });
  mocks.findVote.mockResolvedValue(null);
  mocks.createVote.mockResolvedValue({ id: "vote_1" });
  mocks.deleteVote.mockResolvedValue({ id: "vote_1" });
  mocks.countVotes.mockResolvedValue(1);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("member vote API", () => {
  it("returns only the authenticated user's voted snack IDs", async () => {
    mocks.findUserVotes.mockResolvedValue([
      { snackId: "snack_1" },
      { snackId: "snack_4" },
    ]);

    const response = await getVotes(request("/api/votes"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      snackIds: ["snack_1", "snack_4"],
    });
    expect(mocks.findUserVotes).toHaveBeenCalledWith({
      where: { userId: member.id },
      select: { snackId: true },
      orderBy: { snackId: "asc" },
    });
  });

  it("creates a vote using the session identity and returns the new count", async () => {
    mocks.countVotes.mockResolvedValue(5);

    const response = await toggleVote(
      request(
        "/api/snacks/snack_1/vote",
        "POST",
        { userId: "another-user" }
      ),
      context("snack_1")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ voted: true, newCount: 5 });
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.findVote).toHaveBeenCalledWith({
      where: {
        userId_snackId: { userId: member.id, snackId: "snack_1" },
      },
      select: { id: true },
    });
    expect(mocks.createVote).toHaveBeenCalledWith({
      data: { userId: member.id, snackId: "snack_1" },
    });
    expect(mocks.deleteVote).not.toHaveBeenCalled();
  });

  it("removes an existing vote and reports the resulting count", async () => {
    mocks.findVote.mockResolvedValue({ id: "vote_existing" });
    mocks.countVotes.mockResolvedValue(4);

    const response = await toggleVote(
      request("/api/snacks/snack_1/vote", "POST"),
      context("snack_1")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ voted: false, newCount: 4 });
    expect(mocks.deleteVote).toHaveBeenCalledWith({
      where: { id: "vote_existing" },
    });
    expect(mocks.createVote).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated, untrusted-origin, and missing-snack writes", async () => {
    const unauthenticated = await getVotes(
      request("/api/votes", "GET", undefined, true, false)
    );
    expect(unauthenticated.status).toBe(401);

    const csrfDenied = await toggleVote(
      request("/api/snacks/snack_1/vote", "POST", undefined, false),
      context("snack_1")
    );
    expect(csrfDenied.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();

    mocks.findSnack.mockResolvedValueOnce(null);
    const missing = await toggleVote(
      request("/api/snacks/missing/vote", "POST"),
      context("missing")
    );
    expect(missing.status).toBe(404);
    expect(mocks.createVote).not.toHaveBeenCalled();
  });
});
