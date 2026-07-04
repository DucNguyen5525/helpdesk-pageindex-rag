import { NextResponse } from "next/server";
import { listConversations } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = await listConversations();
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
