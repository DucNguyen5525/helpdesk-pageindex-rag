"use client";

import type { SourceReference } from "@helpdesk/shared";
import { Send } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { loadSettings, parseTags } from "@/lib/settings";

interface UiMessage {
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [conversationId, setConversationId] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const settings = useMemo(() => loadSettings(), []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setQuestion("");
    setError(undefined);
    setIsLoading(true);

    try {
      const response = await apiClient.ask({
        question: trimmed,
        conversationId,
        topK: settings.topK,
        tags: parseTags(settings.tags)
      });
      setConversationId(response.conversationId);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: response.answer, sources: response.sources }
      ]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="flex min-h-screen flex-col">
      <header className="border-b border-stone-200 bg-white px-5 py-4">
        <h1 className="text-lg font-semibold text-ink">Chat</h1>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-8">
        {messages.length === 0 ? (
          <div className="rounded-md border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600">
            Ask a question about imported PageIndex knowledge.
          </div>
        ) : (
          messages.map((message, index) => (
            <article
              key={index}
              className={`max-w-3xl rounded-md px-4 py-3 text-sm leading-6 shadow-sm ${
                message.role === "user"
                  ? "ml-auto bg-mint text-white"
                  : "mr-auto border border-stone-200 bg-white text-stone-800"
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
              {message.sources && message.sources.length > 0 ? (
                <div className="mt-3 border-t border-stone-200 pt-3 text-xs text-stone-600">
                  <div className="mb-1 font-semibold">Sources</div>
                  <ul className="space-y-1">
                    {message.sources.map((source) => (
                      <li key={`${source.documentId}-${source.nodeId}`}>
                        {source.documentTitle} · {source.path.join(" > ") || source.nodeTitle}
                        {source.pageStart ? ` · pages ${source.pageStart}${source.pageEnd ? `-${source.pageEnd}` : ""}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ))
        )}
        {isLoading ? <div className="text-sm text-stone-500">Generating answer...</div> : null}
        {error ? <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-stone-200 bg-white p-4">
        <div className="mx-auto flex max-w-4xl gap-2">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={2}
            className="min-h-12 flex-1 resize-none rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-mint"
            placeholder="Nhập câu hỏi..."
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-coral text-white disabled:opacity-50"
            title="Send"
          >
            <Send size={18} aria-hidden="true" />
          </button>
        </div>
      </form>
    </section>
  );
}
