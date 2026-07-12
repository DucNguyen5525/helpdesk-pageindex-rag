import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeImportCandidate } from "@/lib/server/import-analyzer";

export const runtime = "nodejs";

const analyzeSchema = z.object({
  indexJson: z.unknown()
});

export async function POST(request: Request) {
  try {
    const input = analyzeSchema.parse(await request.json());
    const suggestion = await analyzeImportCandidate(input.indexJson);
    return NextResponse.json({ data: suggestion });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ detail: "Validation failed", errors: error.flatten() }, { status: 422 });
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
