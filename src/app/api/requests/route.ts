import { NextRequest, NextResponse } from "next/server";
import { submitSnackRequestSchema } from "@/lib/api/request-contracts";
import { requireAdmin, requireMember } from "@/lib/server/auth";
import { hasTrustedOrigin } from "@/lib/server/csrf";
import { apiError, apiErrorResponse } from "@/lib/server/api-response";
import {
  listAdminProductRequests,
  submitMyRequest,
} from "@/lib/server/services/requests";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") ?? undefined;

    const requests = await listAdminProductRequests(status);
    return NextResponse.json(
      { requests },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return apiError("ORIGIN_FORBIDDEN", "Request origin is not allowed.", 403);
  }

  try {
    const member = await requireMember(request);
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return apiError("INVALID_REQUEST", "Request body is invalid.", 400);
    }

    const parsed = submitSnackRequestSchema.safeParse(input);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "Snack request details are invalid.", 400);
    }

    const requestItem = await submitMyRequest(member.id, parsed.data);
    return NextResponse.json(
      { request: requestItem },
      {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
