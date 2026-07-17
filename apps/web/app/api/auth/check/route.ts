import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = getRequestSession(request);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, username: session.username, role: session.role });
}
