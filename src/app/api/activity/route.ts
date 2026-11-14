import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { apiErrorResponse } from "@/lib/server/api-response";
import { listActivities } from "@/lib/server/services/activity";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") ?? undefined;
    const snackId = searchParams.get("snackId") ?? undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const activities = await listActivities({ action, snackId, limit });
    return NextResponse.json(
      { activities },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}

