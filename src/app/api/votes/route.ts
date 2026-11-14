import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/server/auth";
import { apiErrorResponse } from "@/lib/server/api-response";
import { getUserVoteSnackIds } from "@/lib/server/services/snacks";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const snackIds = await getUserVoteSnackIds(user.id);
    return NextResponse.json(
      { snackIds },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
