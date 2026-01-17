import Link from "next/link";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Admin Header */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-xl font-semibold text-zinc-900">
                Admin
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/admin/posts"
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Posts
                </Link>
                <Link
                  href="/admin"
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Analytics
                </Link>
                <Link
                  href="/admin"
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  Settings
                </Link>
              </nav>
            </div>
            <Link
              href="/"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              View Site
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8">{children}</main>
    </div>
  );
}
