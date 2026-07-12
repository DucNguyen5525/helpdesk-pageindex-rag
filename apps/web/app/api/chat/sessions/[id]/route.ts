import { NextResponse } from "next/server";
import { deleteConversation } from "@/lib/server/repository";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const deleted = await deleteConversation(params.id);
    if (!deleted) {
      return NextResponse.json({ detail: "Conversation not found" }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
