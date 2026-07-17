import { NextResponse } from "next/server";
import { z } from "zod";
import { isRequestAdmin } from "@/lib/server/auth";
import { retrievePageIndexNodes, toRetrievalResponseItem } from "@/lib/server/retrieval";

export const runtime = "nodejs";

const retrievalSchema = z.object({
  query: z.string().min(1),
  tags: z.array(z.string()).optional(),
  topK: z.number().int().min(1).max(12).optional()
});

export async function POST(request: Request) {
  if (!isRequestAdmin(request)) {
    return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
  }

  try {
    const input = retrievalSchema.parse(await request.json());
    const nodes = await retrievePageIndexNodes(input);
    return NextResponse.json({ data: nodes.map(toRetrievalResponseItem) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ detail: "Validation failed", errors: error.flatten() }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
