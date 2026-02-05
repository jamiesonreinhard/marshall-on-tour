'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminNav, AdminMobileNav } from "./AdminNav";

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
            {/* Desktop nav */}
            <div className="hidden lg:block flex-1">
              <AdminNav />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* View Site button - visible on all screens, positioned before hamburger on mobile */}
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <span>🌐</span>
              <span className="hidden sm:inline">View Site</span>
            </Link>
            {/* Mobile hamburger menu - positioned at far right */}
            <AdminMobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
