"use client";

import type { Helpdesk } from "@helpdesk/shared";
import { Lock, LogOut, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandIcon } from "@/components/BrandIcon";
import { apiClient, getErrorMessage } from "@/lib/api-client";

export default function ChatPage() {
  const [helpdesks, setHelpdesks] = useState<Helpdesk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let isMounted = true;
    apiClient
      .listHelpdesks()
      .then((response) => {
        if (isMounted) setHelpdesks(response.data);
      })
      .catch((err) => {
        if (isMounted) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    try {
      await apiClient.logout();
    } catch {
      // ignore logout errors
    }
    window.location.href = "/login";
  }

  return (
    <div className="min-h-[100dvh] bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold text-stone-900">
            <BrandIcon />
            <span>Helpdesk Chat</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut size={14} />
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">Chọn helpdesk để chat</h1>
        <p className="mt-1 text-sm text-stone-500">Tài khoản của bạn chỉ có quyền sử dụng các trang chat.</p>

        {error ? (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        ) : null}

        {isLoading ? (
          <div className="mt-10 flex items-center justify-center gap-3 text-sm text-stone-400">
            <div className="h-2 w-2 animate-ping rounded-full bg-mint" />
            Đang tải helpdesk...
          </div>
        ) : helpdesks.length === 0 ? (
          <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
            Chưa có helpdesk nào khả dụng cho tài khoản này.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {helpdesks.map((helpdesk) => (
              <Link
                key={helpdesk.id}
                href={`/chat/${helpdesk.slug}`}
                className="group rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-mint/40 hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-stone-900 group-hover:text-mint">{helpdesk.name}</h2>
                    <p className="mt-0.5 font-mono text-xs text-stone-400">/{helpdesk.slug}</p>
                  </div>
                  {helpdesk.isPrivate ? <Lock size={15} className="text-stone-400" /> : null}
                </div>
                {helpdesk.description ? (
                  <p className="mt-3 line-clamp-2 text-sm text-stone-500">{helpdesk.description}</p>
                ) : null}
                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-mint">
                  <MessageSquare size={14} />
                  Mở chat
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
