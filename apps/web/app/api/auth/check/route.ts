import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, validateSessionCookie } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    })
  );

  const session = cookies[SESSION_COOKIE_NAME];
  if (!session || !validateSessionCookie(session)) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true });
}
