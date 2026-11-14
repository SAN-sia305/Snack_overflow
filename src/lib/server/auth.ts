import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { User, UserRole } from "@prisma/client";
import { prisma } from "@/lib/server/prisma";
import { AuthUser } from "@/types";

export const SESSION_COOKIE_NAME = "snackoverflow_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function toAuthUser(user: User): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === UserRole.ADMIN ? "admin" : "member",
    avatarUrl: user.avatarUrl ?? undefined,
    department: user.department ?? undefined,
  };
}

async function findUserForToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });

  if (
    !session ||
    session.expiresAt <= new Date() ||
    !session.user.isVerified
  ) {
    return null;
  }

  return session.user;
}

export async function getCurrentUser(
  request?: NextRequest
): Promise<AuthUser | null> {
  const token = request
    ? request.cookies.get(SESSION_COOKIE_NAME)?.value
    : (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const user = await findUserForToken(token);
  return user ? toAuthUser(user) : null;
}

export async function requireUser(
  request?: NextRequest
): Promise<AuthUser> {
  const user = await getCurrentUser(request);
  if (!user) {
    throw new AuthenticationError("Authentication required.", 401);
  }
  return user;
}

export async function requireAdmin(
  request?: NextRequest
): Promise<AuthUser> {
  const user = await requireUser(request);
  if (user.role !== "admin") {
    throw new AuthenticationError("Admin access required.", 403);
  }
  return user;
}

