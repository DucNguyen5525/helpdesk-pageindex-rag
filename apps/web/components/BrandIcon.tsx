"use client";

import { Headset } from "lucide-react";

export function BrandIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-lg bg-mint text-white shadow-sm ${className}`}>
      <Headset size={18} strokeWidth={2.2} aria-hidden="true" />
    </span>
  );
}
