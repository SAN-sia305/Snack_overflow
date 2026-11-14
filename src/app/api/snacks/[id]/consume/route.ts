import { NextRequest, NextResponse } from "next/server";
import { hasTrustedOrigin } from "@/lib/server/csrf";
import { requireUser } from "@/lib/server/auth";
import { apiError, apiErrorResponse } from "@/lib/server/api-response";
import { consumeSnack } from "@/lib/server/services/snacks";

export const runtime = "nodejs";

const snackIdPattern = /^[A-Za-z0-9_-]{1,64}$/;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!hasTrustedOrigin(request)) {
    return apiError("ORIGIN_FORBIDDEN", "Request origin is not allowed.", 403);
  }

  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    if (!snackIdPattern.test(id)) {
      return apiError("INVALID_ID", "Snack ID is invalid.", 400);
    }

    const snack = await consumeSnack(id, user.id);
    return NextResponse.json(
      { snack },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
