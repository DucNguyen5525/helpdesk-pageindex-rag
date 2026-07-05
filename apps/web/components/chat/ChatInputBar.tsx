"use client";

import { Send, Loader2, Sliders } from "lucide-react";
import { FormEvent, KeyboardEvent, useRef, useEffect } from "react";

interface ChatInputBarProps {
  question: string;
  setQuestion: (val: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  topK?: number;
  tags?: string;
}

export function ChatInputBar({
  question,
  setQuestion,
  onSubmit,
  isLoading,
  topK,
  tags
}: ChatInputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [question]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && question.trim()) {
        onSubmit(e);
      }
    }
  }

  return (
    <div className="border-t border-stone-200/80 bg-white/80 p-4 backdrop-blur-md">
      <div className="mx-auto max-w-4xl space-y-2">
        <form onSubmit={onSubmit} className="relative flex items-end rounded-xl border border-stone-300 bg-white shadow-xs focus-within:border-mint focus-within:ring-2 focus-within:ring-mint/20">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
            placeholder="Nhập câu hỏi... (Nhấn Enter để gửi, Shift+Enter để xuống dòng)"
            className="max-h-44 min-h-12 w-full resize-none bg-transparent py-3 pl-4 pr-12 text-sm text-stone-800 placeholder-stone-400 outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-lg bg-mint text-white transition-all hover:bg-mint/90 disabled:opacity-30 disabled:hover:bg-mint"
            title="Send Message"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </form>

        <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
          <div className="flex items-center gap-2">
            <Sliders size={12} className="text-stone-400" />
            <span>TopK: {topK ?? 10}</span>
            <span>·</span>
            <span>Tags: {tags || "All"}</span>
          </div>

          <span className="hidden sm:inline">PageIndex Vectorless RAG · Antigravity AI</span>
        </div>
      </div>
    </div>
  );
}
