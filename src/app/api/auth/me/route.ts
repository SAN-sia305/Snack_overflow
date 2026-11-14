import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";
import { apiError, apiErrorResponse } from "@/lib/server/api-response";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required.", 401);
    }

    return NextResponse.json(
      { user },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
