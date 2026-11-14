import { NextRequest, NextResponse } from "next/server";
import { updateProductRequestStatusSchema } from "@/lib/api/request-contracts";
import { requireAdmin } from "@/lib/server/auth";
import { hasTrustedOrigin } from "@/lib/server/csrf";
import { apiError, apiErrorResponse } from "@/lib/server/api-response";
import { updateAdminProductRequestStatus } from "@/lib/server/services/requests";

export const runtime = "nodejs";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!hasTrustedOrigin(request)) {
    return apiError("ORIGIN_FORBIDDEN", "Request origin is not allowed.", 403);
  }

  try {
    const admin = await requireAdmin(request);
    const { id } = await context.params;

    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return apiError("INVALID_REQUEST", "Request body is invalid.", 400);
    }

    const parsed = updateProductRequestStatusSchema.safeParse(input);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "Request status update is invalid.", 400);
    }

    const group = await updateAdminProductRequestStatus(
      id,
      admin.id,
      parsed.data
    );

    return NextResponse.json(
      { request: group },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

