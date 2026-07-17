"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiClient
      .checkAuth()
      .then((auth) => {
        if (!isMounted) return;
        if (!auth.authenticated) {
          router.replace("/login");
          return;
        }
        if (auth.role !== "admin") {
          router.replace("/chat");
          return;
        }
        setIsAllowed(true);
      })
      .catch(() => {
        if (isMounted) router.replace("/login");
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (!isAllowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-sm text-stone-500">
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  return <>{children}</>;
}
