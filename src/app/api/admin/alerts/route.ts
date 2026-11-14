import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { apiErrorResponse } from "@/lib/server/api-response";
import { getAdminAlerts } from "@/lib/server/services/admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    const alerts = await getAdminAlerts();
    return NextResponse.json(alerts, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

