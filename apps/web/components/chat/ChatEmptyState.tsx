"use client";

import { BrandIcon } from "@/components/BrandIcon";

interface ChatEmptyStateProps {
  helpdeskName?: string;
  helpdeskDescription?: string;
}

export function ChatEmptyState({ helpdeskName, helpdeskDescription }: ChatEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-mint/10 shadow-inner">
        <BrandIcon className="h-12 w-12" />
      </div>

      <h2 className="text-xl font-bold tracking-tight text-stone-900 md:text-2xl">
        {helpdeskName || "Helpdesk Knowledge Assistant"}
      </h2>
      <p className="mt-2 max-w-md text-sm text-stone-500">
        {helpdeskDescription || "Trợ lý tri thức thông minh, tra cứu và trả lời chính xác dựa trên tài liệu nội bộ."}
      </p>
    </div>
  );
}
