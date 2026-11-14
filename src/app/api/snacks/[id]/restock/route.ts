import { NextRequest, NextResponse } from "next/server";
import { restockSnackSchema } from "@/lib/api/snack-contracts";
import { hasTrustedOrigin } from "@/lib/server/csrf";
import { requireAdmin } from "@/lib/server/auth";
import { apiError, apiErrorResponse } from "@/lib/server/api-response";
import { restockSnack } from "@/lib/server/services/snacks";

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
    const admin = await requireAdmin(request);
    const { id } = await context.params;
    if (!snackIdPattern.test(id)) {
      return apiError("INVALID_ID", "Snack ID is invalid.", 400);
    }

    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return apiError("INVALID_REQUEST", "Request body is invalid.", 400);
    }

    const parsed = restockSnackSchema.safeParse(input);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "Restock details are invalid.", 400);
    }

    const snack = await restockSnack(id, parsed.data, admin.id);
    return NextResponse.json(
      { snack },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
