import { NextResponse } from "next/server";
import { z } from "zod";
import { isRequestAdmin } from "@/lib/server/auth";
import { deleteConversation, setConversationPinned } from "@/lib/server/repository";

export const runtime = "nodejs";

const pinSchema = z.object({ pinned: z.boolean() });

// Pin/unpin a conversation in the history sidebar. Restricted to admin accounts.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  try {
    const { pinned } = pinSchema.parse(await request.json());
    const data = await setConversationPinned(params.id, pinned);
    if (!data) {
      return NextResponse.json({ detail: "Conversation not found" }, { status: 404 });
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
