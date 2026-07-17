import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionCookie,
  REMEMBER_ME_MAX_AGE_SEC,
  SESSION_COOKIE_NAME,
  STANDARD_MAX_AGE_SEC,
  validateCredentials
} from "@/lib/server/auth";
import { validateChildCredentials } from "@/lib/server/repository";

export const runtime = "nodejs";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());

    const adminUsername = process.env.AUTH_USERNAME ?? "admin";
    const account = validateCredentials(input.username, input.password)
      ? { username: adminUsername, role: "admin" as const }
      : await validateChildCredentials(input.username, input.password);

    if (!account) {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const cookie = createSessionCookie({ username: account.username, role: account.role });
    const maxAge = input.rememberMe ? REMEMBER_ME_MAX_AGE_SEC : STANDARD_MAX_AGE_SEC;
    const response = NextResponse.json({ ok: true, username: account.username, role: account.role });

    response.cookies.set(SESSION_COOKIE_NAME, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ detail: "Validation failed", errors: error.flatten() }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
