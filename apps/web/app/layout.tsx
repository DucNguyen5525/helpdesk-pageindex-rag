import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Bug, FileText, MessageSquare, Settings } from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: "Personal Helpdesk RAG",
  description: "A lightweight personal helpdesk chatbot backed by uploaded documents."
};

const navItems = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/admin/documents", label: "Documents", icon: FileText },
  { href: "/admin/debug", label: "Debug", icon: Bug },
  { href: "/settings", label: "Settings", icon: Settings }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
          <aside className="border-b border-stone-200 bg-white lg:min-h-screen lg:border-b-0 lg:border-r">
            <div className="flex h-16 items-center border-b border-stone-200 px-5">
              <Link href="/chat" className="text-base font-semibold text-ink">
                Helpdesk RAG
              </Link>
            </div>
            <nav className="flex gap-1 overflow-x-auto p-3 lg:block">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-stone-700 hover:bg-stone-100"
                  >
                    <Icon size={18} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <main className="min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  );
}
