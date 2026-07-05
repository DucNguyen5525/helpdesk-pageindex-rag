import { NextResponse } from "next/server";
import { z } from "zod";
import { generateGroundedAnswer } from "@/lib/server/gemini";
import { addMessage, createConversation, getHelpdeskBySlug } from "@/lib/server/repository";
import { retrievePageIndexNodes, toSourceReference } from "@/lib/server/retrieval";

export const runtime = "nodejs";

const chatSchema = z.object({
  question: z.string().min(1),
  conversationId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  topK: z.number().int().min(1).max(12).optional(),
  helpdeskSlug: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const input = chatSchema.parse(await request.json());
    const conversation = input.conversationId
      ? { id: input.conversationId }
      : await createConversation(input.question.slice(0, 80));

    await addMessage({ conversationId: conversation.id, role: "user", content: input.question });

    let tags = input.tags;
    let topK = input.topK;
    let systemPrompt: string | undefined;

    if (input.helpdeskSlug) {
      const helpdesk = await getHelpdeskBySlug(input.helpdeskSlug);
      if (helpdesk) {
        const helpdeskTags = helpdesk.tags ?? [];
        const explicitTags = input.tags ?? [];
        const mergedTags = [...new Set([...helpdeskTags, ...explicitTags])];
        tags = mergedTags.length > 0 ? mergedTags : undefined;
        topK = input.topK ?? helpdesk.topK;
        systemPrompt = helpdesk.systemPrompt;
      }
    }

    const retrieved = await retrievePageIndexNodes({
      query: input.question,
      tags,
      topK
    });
    const answer = await generateGroundedAnswer(input.question, retrieved, systemPrompt);
    const sources = retrieved.map(toSourceReference);

    await addMessage({ conversationId: conversation.id, role: "assistant", content: answer, sources });

    return NextResponse.json({
      conversationId: conversation.id,
      answer,
      sources
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function handleApiError(error: unknown) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ detail: "Validation failed", errors: error.flatten() }, { status: 422 });
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ detail: message }, { status: 500 });
}
