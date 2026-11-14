import { NextRequest, NextResponse } from "next/server";
import { updateSnackSchema } from "@/lib/api/snack-contracts";
import { requireAdmin, requireUser } from "@/lib/server/auth";
import { apiError, apiErrorResponse } from "@/lib/server/api-response";
import { hasTrustedOrigin } from "@/lib/server/csrf";
import {
  deleteSnack,
  getSnack,
  updateSnack,
} from "@/lib/server/services/snacks";

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!hasTrustedOrigin(request)) {
    return apiError("ORIGIN_FORBIDDEN", "Request origin is not allowed.", 403);
  }

  try {
    await requireAdmin(request);
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

    const parsed = updateSnackSchema.safeParse(input);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "Snack details are invalid.", 400);
    }

    const snack = await updateSnack(id, parsed.data);
    return NextResponse.json(
      { snack },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!hasTrustedOrigin(request)) {
    return apiError("ORIGIN_FORBIDDEN", "Request origin is not allowed.", 403);
  }

  try {
    await requireAdmin(request);
    const { id } = await context.params;
    if (!snackIdPattern.test(id)) {
      return apiError("INVALID_ID", "Snack ID is invalid.", 400);
    }

    await deleteSnack(id);
    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
