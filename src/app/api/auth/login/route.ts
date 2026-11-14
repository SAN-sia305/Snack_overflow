import argon2 from "argon2";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  toAuthUser,
} from "@/lib/server/auth";
import { hasTrustedOrigin } from "@/lib/server/csrf";
import {
  getLoginRateLimitKeys,
  loginRateLimiter,
} from "@/lib/server/login-rate-limit";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(256),
});

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$N6WjEhpeSA0zO8xKPi5ehg$Xdrh+l22P+cr+ym5LsZV/h2dOWhNfqnKYrhkVYhgBh8";

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: "Request origin is not allowed." }, { status: 403 });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const rateLimitKeys = getLoginRateLimitKeys(request, email);
  if (loginRateLimiter.isLimited(rateLimitKeys)) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again later." },
      { status: 429 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = await argon2.verify(
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
    password
  );

  if (!user || !user.isVerified || !passwordMatches) {
    loginRateLimiter.recordFailure(rateLimitKeys);
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 }
    );
  }

  loginRateLimiter.clear(rateLimitKeys);
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId: user.id,
      expiresAt,
    },
  });

  const response = NextResponse.json({ user: toAuthUser(user) });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return response;
}
