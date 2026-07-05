"use client";

import type { SourceReference } from "@helpdesk/shared";
import { Bot, Check, Copy, FileText, User } from "lucide-react";
import { useState } from "react";

interface ChatMessageItemProps {
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
}

export function ChatMessageItem({ role, content, sources }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(true);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  }

  const isUser = role === "user";

  return (
    <div className={`group py-5 transition-colors ${isUser ? "bg-transparent" : "bg-stone-100/60 border-y border-stone-200/60"}`}>
      <div className="mx-auto flex max-w-4xl gap-4 px-4 md:px-6">
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg text-sm font-semibold shadow-sm ${
            isUser ? "bg-mint text-white" : "bg-white text-emerald-700 border border-stone-200"
          }`}
        >
          {isUser ? <User size={16} aria-hidden="true" /> : <Bot size={18} aria-hidden="true" />}
        </div>

        {/* Message Body */}
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {isUser ? "You" : "Helpdesk Assistant"}
            </span>

            {!isUser ? (
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs text-stone-500 opacity-0 transition-opacity hover:text-stone-800 group-hover:opacity-100 focus:opacity-100"
                title="Copy response"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            ) : null}
          </div>

          <div className="prose prose-stone max-w-none text-sm leading-relaxed text-stone-800">
            <div className="whitespace-pre-wrap font-sans break-words">{content}</div>
          </div>

          {/* Sources Section */}
          {!isUser && sources && sources.length > 0 ? (
            <div className="mt-4 rounded-lg border border-stone-200 bg-white p-3 text-xs shadow-xs">
              <button
                onClick={() => setShowSources((prev) => !prev)}
                className="flex w-full items-center justify-between font-semibold text-stone-700 hover:text-mint"
              >
                <div className="flex items-center gap-1.5">
                  <FileText size={14} className="text-mint" />
                  <span>Trích dẫn nguồn từ PageIndex ({sources.length})</span>
                </div>
                <span className="text-[10px] uppercase text-stone-400">{showSources ? "Thu gọn ▲" : "Xem chi tiết ▼"}</span>
              </button>

              {showSources ? (
                <div className="mt-2.5 space-y-2 border-t border-stone-100 pt-2.5">
                  {sources.map((source, idx) => {
                    const breadcrumb = source.path.length > 0 ? source.path.join(" > ") : source.nodeTitle;
                    const pageText = source.pageStart ? `Trang ${source.pageStart}${source.pageEnd ? `-${source.pageEnd}` : ""}` : null;

                    return (
                      <div
                        key={`${source.documentId}-${source.nodeId}-${idx}`}
                        className="rounded border border-stone-100 bg-stone-50 p-2 transition-colors hover:bg-stone-100/80"
                      >
                        <div className="flex items-center justify-between font-medium text-stone-800">
                          <span className="truncate">{source.documentTitle}</span>
                          {pageText ? <span className="shrink-0 rounded bg-stone-200/70 px-1.5 py-0.5 text-[10px] text-stone-600">{pageText}</span> : null}
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-stone-500 truncate">{breadcrumb}</div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
