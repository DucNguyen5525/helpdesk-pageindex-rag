import { NextResponse } from "next/server";
import { isRequestAuthenticated } from "@/lib/server/auth";
import { getHelpdeskBySlug } from "@/lib/server/repository";
import { findSimilarQuestions } from "@/lib/server/similar-questions";

export const runtime = "nodejs";

// Lightweight lookup the chat UI calls BEFORE spending an AI answer: given the current
// helpdesk and the user's question, return past similar Q&A (BM25) so the user can reuse
// an existing answer. Returns an empty list (not an error) when the toggle is off.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const helpdeskSlug = searchParams.get("helpdeskSlug");
    const question = searchParams.get("q");

    if (!helpdeskSlug || !question || !question.trim()) {
      return NextResponse.json({ detail: "helpdeskSlug and q are required" }, { status: 422 });
    }

    const helpdesk = await getHelpdeskBySlug(helpdeskSlug);
    if (!helpdesk || !helpdesk.similarQuestions) {
      return NextResponse.json({ matches: [] });
    }
    if (helpdesk.isPrivate && !isRequestAuthenticated(request)) {
      return NextResponse.json({ detail: "Login required for this helpdesk" }, { status: 401 });
    }

    const matches = await findSimilarQuestions({ helpdeskSlug, question });
    return NextResponse.json({ matches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
