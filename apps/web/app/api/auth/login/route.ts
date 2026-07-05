import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createSessionCookie,
  REMEMBER_ME_MAX_AGE_SEC,
  SESSION_COOKIE_NAME,
  STANDARD_MAX_AGE_SEC,
  validateCredentials
} from "@/lib/server/auth";

export const runtime = "nodejs";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());

    if (!validateCredentials(input.username, input.password)) {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const cookie = createSessionCookie();
    const maxAge = input.rememberMe ? REMEMBER_ME_MAX_AGE_SEC : STANDARD_MAX_AGE_SEC;
    const response = NextResponse.json({ ok: true });

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
