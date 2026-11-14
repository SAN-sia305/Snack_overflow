import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import {
  getCurrentUser,
  hashSessionToken,
  requireAdmin,
  requireUser,
} from "@/lib/server/auth";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { LoginRateLimiter } from "@/lib/server/login-rate-limit";

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  findSession: vi.fn(),
  createSession: vi.fn(),
  deleteSessions: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("@/lib/server/prisma", () => ({
  prisma: {
    user: { findUnique: mocks.findUser },
    session: {
      findUnique: mocks.findSession,
      create: mocks.createSession,
      deleteMany: mocks.deleteSessions,
    },
  },
}));

vi.mock("argon2", () => ({
  default: { verify: mocks.verifyPassword },
}));

const member = {
  id: "member-1",
  name: "Priya Sharma",
  email: "member@bipolarfactory.com",
  role: UserRole.MEMBER,
  passwordHash: "argon-hash",
  isVerified: true,
  department: "Engineering",
  avatarUrl: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const admin = {
  ...member,
  id: "admin-1",
  name: "Arun Kumar",
  email: "admin@bipolarfactory.com",
  role: UserRole.ADMIN,
};

function request(
  url: string,
  options: ConstructorParameters<typeof NextRequest>[1] = {}
) {
  return new NextRequest(url, options);
}

function loginRequest(
  body: object,
  headers: Record<string, string> = {}
) {
  return request("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "content-type": "application/json",
      "x-real-ip": "198.51.100.10",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
  mocks.findUser.mockReset();
  mocks.findSession.mockReset();
  mocks.createSession.mockReset();
  mocks.deleteSessions.mockReset();
  mocks.verifyPassword.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("server authentication", () => {
  it("rejects unauthenticated requests and denies member access to admin guards", async () => {
    mocks.findSession.mockResolvedValue(null);
    await expect(
      requireUser(request("http://localhost:3000/api/private"))
    ).rejects.toMatchObject({ status: 401 });

    mocks.findSession.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: member,
    });
    const forgedRequest = request("http://localhost:3000/api/admin", {
      headers: {
        cookie: "snackoverflow_session=opaque-token",
        "x-role": "admin",
      },
    });
    await expect(requireAdmin(forgedRequest)).rejects.toMatchObject({
      status: 403,
    });
  });

  it("loads the role from the stored session user and rejects expired sessions", async () => {
    mocks.findSession.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: admin,
    });
    const adminRequest = request("http://localhost:3000/api/admin", {
      headers: { cookie: "snackoverflow_session=opaque-token" },
    });

    await expect(requireAdmin(adminRequest)).resolves.toMatchObject({
      id: admin.id,
      role: "admin",
    });
    expect(mocks.findSession).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tokenHash: hashSessionToken("opaque-token") },
      })
    );

    mocks.findSession.mockResolvedValue({
      expiresAt: new Date(Date.now() - 1),
      user: admin,
    });
    await expect(getCurrentUser(adminRequest)).resolves.toBeNull();
  });

  it("returns a generic login error for an unknown account", async () => {
    mocks.findUser.mockResolvedValue(null);
    mocks.verifyPassword.mockResolvedValue(false);

    const response = await login(
      loginRequest({
        email: "unknown@example.com",
        password: "wrong-password",
      })
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
    expect(mocks.verifyPassword).toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("creates an opaque session cookie and uses the database role", async () => {
    mocks.findUser.mockResolvedValue(admin);
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.createSession.mockResolvedValue({});

    const response = await login(
      loginRequest({
        email: " ADMIN@BIPOLARFACTORY.COM ",
        password: "correct-password",
        role: "member",
      })
    );
    const token = response.cookies.get("snackoverflow_session")?.value;
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toMatchObject({ id: admin.id, role: "admin" });
    expect(body.user.passwordHash).toBeUndefined();
    expect(body.user.isVerified).toBeUndefined();
    expect(token).toBeTruthy();
    expect(response.cookies.get("snackoverflow_session")).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    expect(mocks.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenHash: hashSessionToken(token ?? ""),
          userId: admin.id,
        }),
      })
    );
  });

  it("rejects login requests from an untrusted origin", async () => {
    const response = await login(
      loginRequest(
        { email: "admin@bipolarfactory.com", password: "password" },
        { origin: "https://attacker.example" }
      )
    );

    expect(response.status).toBe(403);
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it("requires a session for /me and invalidates it on logout", async () => {
    mocks.findSession.mockResolvedValue(null);
    expect(
      (await me(request("http://localhost:3000/api/auth/me"))).status
    ).toBe(401);

    mocks.findSession.mockResolvedValue({
      expiresAt: new Date(Date.now() + 60_000),
      user: member,
    });
    const meResponse = await me(
      request("http://localhost:3000/api/auth/me", {
        headers: { cookie: "snackoverflow_session=opaque-token" },
      })
    );
    expect(meResponse.status).toBe(200);
    expect(await meResponse.json()).toEqual({
      user: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: "member",
        department: member.department,
      },
    });

    mocks.deleteSessions.mockResolvedValue({ count: 1 });
    const response = await logout(
      request("http://localhost:3000/api/auth/logout", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          cookie: "snackoverflow_session=opaque-token",
        },
      })
    );

    expect(response.status).toBe(204);
    expect(mocks.deleteSessions).toHaveBeenCalledWith({
      where: { tokenHash: hashSessionToken("opaque-token") },
    });
    expect(response.cookies.get("snackoverflow_session")?.value).toBe("");
  });

  it("rate-limits repeated failed attempts and allows a new window", () => {
    const limiter = new LoginRateLimiter(2, 1_000);
    limiter.recordFailure(["account:member"], 100);
    expect(limiter.isLimited(["account:member"], 101)).toBe(false);
    limiter.recordFailure(["account:member"], 200);
    expect(limiter.isLimited(["account:member"], 201)).toBe(true);
    expect(limiter.isLimited(["account:member"], 1_101)).toBe(false);
  });

  it("bounds rate-limit memory when many distinct keys are attempted", () => {
    const limiter = new LoginRateLimiter(1, 1_000, 2);
    limiter.recordFailure(["account:first"], 100);
    limiter.recordFailure(["account:second"], 100);
    limiter.recordFailure(["account:third"], 100);

    expect(limiter.isLimited(["account:first"], 101)).toBe(false);
    expect(limiter.isLimited(["account:third"], 101)).toBe(true);
  });
});
