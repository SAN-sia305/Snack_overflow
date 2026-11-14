import { NextRequest, NextResponse } from "next/server";
import { snackListQuerySchema } from "@/lib/api/snack-contracts";
import { requireUser } from "@/lib/server/auth";
import { apiError, apiErrorResponse } from "@/lib/server/api-response";
import { listSnacks } from "@/lib/server/services/snacks";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireUser(request);

    const query = snackListQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries())
    );
    if (!query.success) {
      return apiError(
        "INVALID_QUERY",
        "One or more query parameters are invalid.",
        400
      );
    }

    return NextResponse.json(await listSnacks(query.data), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
