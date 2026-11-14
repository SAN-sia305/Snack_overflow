import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { apiError, apiErrorResponse } from "@/lib/server/api-response";
import { getSnack } from "@/lib/server/services/snacks";

export const runtime = "nodejs";

const snackIdPattern = /^[A-Za-z0-9_-]{1,64}$/;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser(request);

    const { id } = await context.params;
    if (!snackIdPattern.test(id)) {
      return apiError("INVALID_ID", "Snack ID is invalid.", 400);
    }

    const snack = await getSnack(id);
    if (!snack) {
      return apiError("NOT_FOUND", "Snack was not found.", 404);
    }

    return NextResponse.json({ snack }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
