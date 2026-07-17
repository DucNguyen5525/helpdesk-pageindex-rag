import { NextResponse } from "next/server";
import { z } from "zod";
import { isRequestAdmin } from "@/lib/server/auth";
import { resetChildAccountPassword } from "@/lib/server/repository";

export const runtime = "nodejs";

const resetSchema = z.object({
  password: z.string().min(6).max(128)
});

export async function PATCH(request: Request, { params }: { params: Promise<{ username: string }> }) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  try {
    const { username } = await params;
    const input = resetSchema.parse(await request.json());
    const data = await resetChildAccountPassword(decodeURIComponent(username), input.password);
    if (!data) {
      return NextResponse.json({ detail: "Account not found" }, { status: 404 });
    }
    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ detail: "Validation failed", errors: error.flatten() }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
