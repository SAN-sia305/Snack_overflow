import { NextRequest, NextResponse } from "next/server";
import {
  createSnackSchema,
  snackListQuerySchema,
} from "@/lib/api/snack-contracts";
import { hasTrustedOrigin } from "@/lib/server/csrf";
import { requireAdmin, requireUser } from "@/lib/server/auth";
import { apiError, apiErrorResponse } from "@/lib/server/api-response";
import {
  createSnack,
  listSnacks,
} from "@/lib/server/services/snacks";

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

export async function POST(request: NextRequest) {
  if (!hasTrustedOrigin(request)) {
    return apiError("ORIGIN_FORBIDDEN", "Request origin is not allowed.", 403);
  }

  try {
    const admin = await requireAdmin(request);
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      return apiError("INVALID_REQUEST", "Request body is invalid.", 400);
    }

    const parsed = createSnackSchema.safeParse(input);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "Snack details are invalid.", 400);
    }

    const snack = await createSnack(parsed.data, admin.id);
    return NextResponse.json(
      { snack },
      {
        status: 201,
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
