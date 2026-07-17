import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteAllConversations, deleteConversations, listConversations } from "@/lib/server/repository";

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

const bulkDeleteSchema = z
  .object({
    ids: z.array(z.string().min(1)).optional(),
    all: z.boolean().optional()
  })
  .refine((value) => value.all === true || (value.ids?.length ?? 0) > 0, {
    message: "Provide `ids` to delete or `all: true`"
  });

// Bulk-delete chat history: either a list of conversation ids, or every conversation when `all` is true.
export async function DELETE(request: Request) {
  try {
    const body = bulkDeleteSchema.parse(await request.json().catch(() => ({})));
    const deleted = body.all ? await deleteAllConversations() : await deleteConversations(body.ids ?? []);
    return NextResponse.json({ deleted });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ detail: "Validation failed", errors: error.flatten() }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
