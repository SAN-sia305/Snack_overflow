import { NextRequest, NextResponse } from "next/server";
import { addPurchasedToInventorySchema } from "@/lib/api/request-contracts";
import { requireAdmin } from "@/lib/server/auth";
import { hasTrustedOrigin } from "@/lib/server/csrf";
import { apiError, apiErrorResponse } from "@/lib/server/api-response";
import { addPurchasedToInventory } from "@/lib/server/services/requests";

export const runtime = "nodejs";

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

    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return apiError("INVALID_REQUEST", "Request body is invalid.", 400);
    }

    const parsed = addPurchasedToInventorySchema.safeParse(input);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "Inventory details are invalid.", 400);
    }

    const result = await addPurchasedToInventory(
      id,
      admin.id,
      parsed.data
    );

    return NextResponse.json(
      {
        productRequest: result.group,
        snackId: result.snackId,
      },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

