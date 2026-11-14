import { NextRequest, NextResponse } from "next/server";
import { requireMember } from "@/lib/server/auth";
import { apiErrorResponse } from "@/lib/server/api-response";
import { getMyRequests } from "@/lib/server/services/requests";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const member = await requireMember(request);
    const requests = await getMyRequests(member.id);
    return NextResponse.json(
      { requests },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return apiErrorResponse(error);
  }
}
