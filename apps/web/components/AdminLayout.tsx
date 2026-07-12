"use client";

import { Bug, FileText, MessageSquare, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandIcon } from "@/components/BrandIcon";

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/debug", label: "Debug", icon: Bug },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-stone-50 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-stone-200 bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-14 items-center border-b border-stone-200 px-5 font-semibold text-stone-800">
          <Link href="/chat" className="flex items-center gap-2">
            <BrandIcon className="h-6 w-6" />
            <span>Helpdesk Admin</span>
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto p-3 lg:block lg:space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-mint text-white" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-h-screen bg-stone-50">{children}</main>
    </div>
  );
}
