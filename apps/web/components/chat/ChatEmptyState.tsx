"use client";

import { Sparkles, BookOpen, ShieldCheck, Wrench, HelpCircle } from "lucide-react";

interface ChatEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
  helpdeskName?: string;
  helpdeskDescription?: string;
}

const PROMPT_STARTERS = [
  {
    icon: ShieldCheck,
    title: "Chính sách bảo hành",
    prompt: "Chính sách bảo hành và điều kiện đổi trả sản phẩm quy định như thế nào?"
  },
  {
    icon: Wrench,
    title: "Hướng dẫn kỹ thuật",
    prompt: "Quy trình xử lý sự cố thiết bị và các bước khắc phục sự cố thường gặp?"
  },
  {
    icon: BookOpen,
    title: "Tài liệu vận hành",
    prompt: "Tóm tắt các hướng dẫn vận hành và quy định an toàn trong tài liệu?"
  },
  {
    icon: HelpCircle,
    title: "Câu hỏi phổ biến",
    prompt: "Những lưu ý quan trọng cần biết trước khi yêu cầu hỗ trợ kỹ thuật là gì?"
  }
];

export function ChatEmptyState({ onSelectPrompt, helpdeskName, helpdeskDescription }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-mint/10 text-mint shadow-inner">
        <Sparkles size={32} />
      </div>

      <h2 className="text-xl font-bold tracking-tight text-stone-900 md:text-2xl">
        {helpdeskName || "Helpdesk Knowledge Assistant"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-stone-500">
        {helpdeskDescription || <>Hệ thống trợ lý tri thức RAG thông minh, tra cứu dữ liệu chuẩn xác dựa trên cây chỉ mục <span className="font-semibold text-mint">PageIndex</span>.</>}
      </p>

      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {PROMPT_STARTERS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectPrompt(item.prompt)}
              className="flex flex-col items-start gap-2 rounded-xl border border-stone-200 bg-white p-4 text-left transition-all hover:border-mint hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-center gap-2 font-semibold text-stone-800 text-sm">
                <Icon size={16} className="text-mint" />
                <span>{item.title}</span>
              </div>
              <p className="line-clamp-2 text-xs text-stone-500">{item.prompt}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
