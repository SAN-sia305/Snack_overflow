import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}
