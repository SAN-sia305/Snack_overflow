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
import { apiError, apiErrorResponse } from "@/lib/server/api-response";

export const runtime = "nodejs";

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(1).max(256),
});

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$N6WjEhpeSA0zO8xKPi5ehg$Xdrh+l22P+cr+ym5LsZV/h2dOWhNfqnKYrhkVYhgBh8";

export async function POST(request: NextRequest) {
  try {
    if (!hasTrustedOrigin(request)) {
      return apiError(
        "ORIGIN_FORBIDDEN",
        "Request origin is not allowed.",
        403
      );
    }

    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return apiError("INVALID_REQUEST", "Request body is invalid.", 400);
    }

    const parsed = credentialsSchema.safeParse(input);
    if (!parsed.success) {
      return apiError("INVALID_REQUEST", "Request body is invalid.", 400);
    }

    const { email, password } = parsed.data;
    const rateLimitKeys = getLoginRateLimitKeys(request, email);
    if (loginRateLimiter.isLimited(rateLimitKeys)) {
      return apiError(
        "RATE_LIMITED",
        "Too many sign-in attempts. Try again later.",
        429
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const passwordMatches = await argon2.verify(
      user?.passwordHash ?? DUMMY_PASSWORD_HASH,
      password
    );

    if (!user || !user.isVerified || !passwordMatches) {
      loginRateLimiter.recordFailure(rateLimitKeys);
      return apiError("INVALID_CREDENTIALS", "Invalid email or password.", 401);
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

    const response = NextResponse.json(
      { user: toAuthUser(user) },
      { headers: { "Cache-Control": "no-store" } }
    );
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
  } catch (error) {
    return apiErrorResponse(error);
  }
}
