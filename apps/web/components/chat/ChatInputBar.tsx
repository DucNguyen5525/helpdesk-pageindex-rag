"use client";

import { Send, Loader2, Sparkles } from "lucide-react";
import { FormEvent, KeyboardEvent, useRef, useEffect } from "react";

interface ChatInputBarProps {
  question: string;
  setQuestion: (val: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  models?: string[];
  selectedModel?: string;
  onSelectModel?: (model: string) => void;
}

export function ChatInputBar({
  question,
  setQuestion,
  onSubmit,
  isLoading,
  models,
  selectedModel,
  onSelectModel
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
        {models && models.length > 0 && onSelectModel ? (
          <div className="flex items-center px-1">
            <label className="flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <Sparkles size={12} className="text-emerald-600" />
              <select
                value={selectedModel}
                onChange={(event) => onSelectModel(event.target.value)}
                className="cursor-pointer bg-transparent text-[11px] font-medium text-emerald-700 outline-none"
                title="Chọn model AI trả lời"
              >
                {models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

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

        <div className="px-1 text-center text-[11px] text-stone-400">
          Trợ lý có thể sai sót — hãy kiểm tra lại thông tin quan trọng trong tài liệu gốc.
        </div>
      </div>
    </div>
  );
}
