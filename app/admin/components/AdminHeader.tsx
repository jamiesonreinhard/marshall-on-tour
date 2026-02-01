'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNav } from "./AdminNav";

export function AdminHeader() {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // Don't show header/nav on login page
  if (isLoginPage) {
    return null;
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8">
        <div className="flex items-center justify-between h-16 relative">
          <div className="flex items-center gap-8 flex-1">
            <Link href="/admin" className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>🎾</span>
              <span className="hidden sm:inline">Marshall Admin</span>
              <span className="sm:hidden">Admin</span>
            </Link>
            <div className="hidden lg:block">
              <AdminNav />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <span>🌐</span>
              <span className="hidden sm:inline">View Site</span>
            </Link>
            {/* Mobile Nav - Hamburger */}
            <div className="lg:hidden">
              <AdminNav />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
