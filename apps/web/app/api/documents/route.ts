import { NextResponse } from "next/server";
import { isRequestAdmin } from "@/lib/server/auth";
import { listDocuments } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await listDocuments();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
