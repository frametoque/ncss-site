"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { usePathname } from "next/navigation";

export function AdminLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
