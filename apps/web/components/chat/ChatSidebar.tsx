"use client";

import type { ChatSession } from "@helpdesk/shared";
import { Plus, Search, MessageSquare, Bug, Settings, ChevronLeft, ChevronRight, Trash2, X, Pin, PinOff, Calendar } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandIcon } from "@/components/BrandIcon";

interface ChatSidebarProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onTogglePin?: (sessionId: string, pinned: boolean) => void;
  canPin?: boolean;
  onNewChat: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileDrawer?: boolean;
  showAdminLinks?: boolean;
}

// Local calendar date (YYYY-MM-DD) for an ISO timestamp, to compare against a <input type="date"> value.
function toLocalDateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ChatSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onTogglePin,
  canPin = false,
  onNewChat,
  collapsed,
  onToggleCollapse,
  isMobileDrawer = false,
  showAdminLinks = false
}: ChatSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const pathname = usePathname();

  const filteredSessions = sessions.filter((s) => {
    if (!s.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (dateFilter && toLocalDateKey(s.createdAt) !== dateFilter) return false;
    return true;
  });

  const pinnedSessions = filteredSessions.filter((s) => s.pinned);
  const unpinnedSessions = filteredSessions.filter((s) => !s.pinned);

  function renderSession(session: ChatSession) {
    const isActive = session.id === activeSessionId;
    return (
      <div
        key={session.id}
        role="button"
        tabIndex={0}
        onClick={() => onSelectSession(session.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onSelectSession(session.id);
        }}
        className={`group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
          isActive
            ? "bg-stone-800 font-medium text-white"
            : "text-stone-400 hover:bg-stone-800/60 hover:text-stone-200"
        }`}
        title={session.title}
      >
        {session.pinned ? (
          <Pin size={15} className="shrink-0 text-mint" fill="currentColor" />
        ) : (
          <MessageSquare size={15} className={`shrink-0 ${isActive ? "text-mint" : "text-stone-500"}`} />
        )}
        {!collapsed ? <span className="truncate flex-1">{session.title}</span> : null}
        {!collapsed && canPin && onTogglePin ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(session.id, !session.pinned);
            }}
            className="shrink-0 rounded p-1 text-stone-500 opacity-0 transition-opacity hover:bg-stone-700 hover:text-mint group-hover:opacity-100 focus:opacity-100"
            title={session.pinned ? "Bỏ ghim" : "Ghim lên đầu"}
          >
            {session.pinned ? <PinOff size={13} /> : <Pin size={13} />}
          </button>
        ) : null}
        {!collapsed && onDeleteSession ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSession(session.id);
            }}
            className="shrink-0 rounded p-1 text-stone-500 opacity-0 transition-opacity hover:bg-stone-700 hover:text-rose-400 group-hover:opacity-100 focus:opacity-100"
            title="Xóa đoạn chat"
          >
            <Trash2 size={13} />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <aside
      className={`flex flex-col border-r border-stone-200 bg-stone-900 text-stone-300 transition-all duration-300 ${
        collapsed ? "w-16" : "w-64 md:w-72"
      }`}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-stone-800 px-3">
        {!collapsed ? (
          <div className="flex items-center gap-2 font-semibold text-white">
            <BrandIcon />
            <span className="text-sm tracking-wide">Helpdesk RAG</span>
          </div>
        ) : null}

        <button
          onClick={onToggleCollapse}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-stone-800 text-stone-400 hover:text-white"
          title={isMobileDrawer ? "Đóng sidebar" : collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          {isMobileDrawer ? <X size={18} /> : collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className={`flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-3 py-2.5 text-sm font-medium text-white shadow-xs transition-all hover:bg-mint/90 active:scale-[0.98] ${
            collapsed ? "px-0" : ""
          }`}
          title="Tạo cuộc trò chuyện mới"
        >
          <Plus size={18} />
          {!collapsed ? <span>+ New Chat</span> : null}
        </button>
      </div>

      {/* Search Input */}
      {!collapsed ? (
        <div className="px-3 pb-2">
          <div className="relative flex items-center">
            <Search size={14} className="absolute left-2.5 text-stone-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm lịch sử chat..."
              className="w-full rounded-md border border-stone-800 bg-stone-950 py-1.5 pl-8 pr-3 text-xs text-stone-200 placeholder-stone-500 outline-none focus:border-stone-700"
            />
          </div>
        </div>
      ) : null}

      {/* Date Filter (day/month/year) */}
      {!collapsed ? (
        <div className="px-3 pb-2">
          <div className="relative flex items-center">
            <Calendar size={14} className="absolute left-2.5 text-stone-500" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-md border border-stone-800 bg-stone-950 py-1.5 pl-8 pr-7 text-xs text-stone-200 outline-none focus:border-stone-700 [color-scheme:dark]"
              title="Lọc theo ngày tạo"
            />
            {dateFilter ? (
              <button
                onClick={() => setDateFilter("")}
                className="absolute right-2 rounded p-0.5 text-stone-500 hover:text-stone-200"
                title="Xóa lọc ngày"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {filteredSessions.length === 0 ? (
          !collapsed ? (
            <div className="p-3 text-center text-xs text-stone-500">
              {dateFilter || searchTerm ? "Không có cuộc trò chuyện phù hợp" : "Chưa có lịch sử"}
            </div>
          ) : null
        ) : (
          <>
            {pinnedSessions.length > 0 ? (
              <>
                {!collapsed ? (
                  <div className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-mint">
                    <Pin size={11} fill="currentColor" />
                    Đã ghim
                  </div>
                ) : null}
                {pinnedSessions.map(renderSession)}
              </>
            ) : null}

            {!collapsed ? (
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                Lịch sử hội thoại
              </div>
            ) : null}
            {unpinnedSessions.length > 0
              ? unpinnedSessions.map(renderSession)
              : !collapsed && pinnedSessions.length > 0
                ? <div className="px-3 py-1 text-center text-[11px] text-stone-600">Không có mục nào khác</div>
                : null}
          </>
        )}
      </div>

      {showAdminLinks ? (
        <div className="border-t border-stone-800 p-2 space-y-1">
          {[
            { href: "/admin/debug", label: "Debug", icon: Bug },
            { href: "/settings", label: "Settings", icon: Settings }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-stone-800 text-white"
                    : "text-stone-400 hover:bg-stone-800/60 hover:text-stone-200"
                }`}
                title={item.label}
              >
                <Icon size={16} />
                {!collapsed ? <span>{item.label}</span> : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}
