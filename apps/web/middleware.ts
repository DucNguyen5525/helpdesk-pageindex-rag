import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "helpdesk_session";

function isProtectedPath(pathname: string, method: string): boolean {
  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/admin/debug" ||
    pathname.startsWith("/admin/debug/") ||
    pathname === "/admin/documents" ||
    pathname.startsWith("/admin/documents/")
  ) {
    return true;
  }

  if (
    pathname.startsWith("/api/accounts") ||
    pathname.startsWith("/api/documents") ||
    pathname === "/api/chat/debug" ||
    pathname === "/api/chat/retrieve"
  ) {
    return true;
  }

  // Protect helpdesk modification APIs (POST, PUT, DELETE)
  if (pathname.startsWith("/api/helpdesks") && ["POST", "PUT", "DELETE"].includes(method)) {
    return true;
  }

  // Protect bulk chat-history deletion (GET stays public for the chat sidebar)
  if (pathname === "/api/chat/sessions" && method === "DELETE") {
    return true;
  }

  return false;
}

function hasValidCookieFormat(cookieValue: string): boolean {
  const parts = cookieValue.split(".");
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  // If path is not protected, allow access immediately
  if (!isProtectedPath(pathname, method)) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const isValid = session ? hasValidCookieFormat(session) : false;

  if (!isValid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
