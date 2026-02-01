import Link from "next/link";
import { ReactNode } from "react";
import { AdminNav } from "./components/AdminNav";
import { AdminAuthGuard } from "./components/AdminAuthGuard";
import { AdminHeader } from "./components/AdminHeader";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        {/* Admin Content */}
        <main className="max-w-[1600px] mx-auto px-6 sm:px-8 py-8">{children}</main>
      </div>
    </AdminAuthGuard>
  );
}
