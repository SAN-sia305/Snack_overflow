import { NextRequest, NextResponse } from "next/server";
import {
  hashSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/server/auth";
import { hasTrustedOrigin } from "@/lib/server/csrf";
import { prisma } from "@/lib/server/prisma";
import { apiError, apiErrorResponse } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!hasTrustedOrigin(request)) {
      return apiError(
        "ORIGIN_FORBIDDEN",
        "Request origin is not allowed.",
        403
      );
    }

    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      await prisma.session.deleteMany({
        where: { tokenHash: hashSessionToken(token) },
      });
    }

    const response = new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: new Date(0),
    });
    return response;
  } catch (error) {
    return apiErrorResponse(error);
  }
}
