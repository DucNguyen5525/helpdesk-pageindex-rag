"use client";

import type { RetrievalResponseItem } from "@helpdesk/shared";
import { Search } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { loadSettings, parseTags } from "@/lib/settings";

export default function DebugPage() {
  const [query, setQuery] = useState("");
  const [nodes, setNodes] = useState<RetrievalResponseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const settings = useMemo(() => loadSettings(), []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(undefined);
    try {
      const response = await apiClient.retrieve({
        query: query.trim(),
        topK: settings.topK,
        tags: parseTags(settings.tags)
      });
      setNodes(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="p-5 md:p-8">
      <h1 className="text-xl font-semibold text-ink">Retrieval Debug</h1>
      <form onSubmit={handleSubmit} className="mt-5 flex max-w-3xl gap-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-11 flex-1 rounded-md border border-stone-300 px-3 text-sm outline-none focus:border-mint"
          placeholder="Enter a PageIndex retrieval query"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-coral text-white disabled:opacity-50"
          title="Search"
        >
          <Search size={18} aria-hidden="true" />
        </button>
      </form>

      {error ? <div className="mt-4 rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}
      {isLoading ? <div className="mt-5 text-sm text-stone-500">Searching PageIndex nodes...</div> : null}

      <div className="mt-5 space-y-3">
        {nodes.map((node) => (
          <article key={`${node.documentId}-${node.nodeId}`} className="rounded-md border border-stone-200 bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span className="font-semibold text-stone-700">{node.documentTitle}</span>
              <span>{node.path.join(" > ") || node.nodeTitle}</span>
              {node.pageStart ? <span>pages {node.pageStart}{node.pageEnd ? `-${node.pageEnd}` : ""}</span> : null}
              {typeof node.score === "number" ? <span>score {node.score.toFixed(1)}</span> : null}
            </div>
            {node.summary ? <p className="mb-2 text-sm font-medium text-stone-700">{node.summary}</p> : null}
            <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700">{node.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
