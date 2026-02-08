'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { logout } from "@/lib/auth/admin-auth";

// Primary navigation items (always visible)
const primaryNavItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/queue", label: "Queue", icon: "📋" },
  { href: "/admin/posts", label: "Posts", icon: "📝" },
  { href: "/admin/calendar", label: "Calendar", icon: "📅" },
  { href: "/admin/test-image-generation", label: "Test Images", icon: "🎨" },
];

// Secondary navigation items (in "More" dropdown)
const secondaryNavItems = [
  { href: "/admin/connect-x", label: "Connect X", icon: "𝕏" },
  { href: "/admin/marshall-state", label: "Marshall's State", icon: "👤" },
  { href: "/admin/marshall-face-upload", label: "Upload Face", icon: "🖼️" },
  { href: "/admin/board", label: "Project Board", icon: "📋" },
  { href: "/admin/jobs", label: "Jobs", icon: "⚙️" },
  { href: "/admin/costs", label: "Costs", icon: "💰" },
  { href: "/admin/infrastructure", label: "Infrastructure", icon: "⚙️" },
  { href: "/admin/how-it-works", label: "How It Works", icon: "❓" },
];

// All items combined (for mobile menu)
const allNavItems = [...primaryNavItems, ...secondaryNavItems];

// Shared state for mobile menu (needed across components)
let mobileMenuState: { isOpen: boolean; setIsOpen: (open: boolean) => void } | null = null;

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  // Close menus when route changes
  useEffect(() => {
    if (mobileMenuState) mobileMenuState.setIsOpen(false);
    setIsMoreMenuOpen(false);
  }, [pathname]);

  // Close more menu when clicking outside
  useEffect(() => {
    if (!isMoreMenuOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.more-menu-container')) {
        setIsMoreMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMoreMenuOpen]);
  
  const isActive = (href: string) => {
    return pathname === href || (href !== "/admin" && pathname?.startsWith(href));
  };

  return (
    <>
      {/* Desktop Nav - hidden on mobile */}
      <nav className="hidden lg:flex items-center gap-1">
        {/* Primary items */}
        {primaryNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              isActive(item.href)
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        
        {/* More dropdown */}
        <div className="relative more-menu-container">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMoreMenuOpen(!isMoreMenuOpen);
            }}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              secondaryNavItems.some(item => isActive(item.href))
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <span>⋯</span>
            <span>More</span>
          </button>
          
          {isMoreMenuOpen && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px]">
              <div className="py-1">
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

    </>
  );
}

// Mobile hamburger menu component (separate to avoid duplicate state)
export function AdminMobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Share state with parent
  useEffect(() => {
    mobileMenuState = { isOpen: isMobileMenuOpen, setIsOpen: setIsMobileMenuOpen };
    return () => { mobileMenuState = null; };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.mobile-menu-container')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen]);
  
  const isActive = (href: string) => {
    return pathname === href || (href !== "/admin" && pathname?.startsWith(href));
  };

  return (
    <div className="lg:hidden mobile-menu-container relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMobileMenuOpen(!isMobileMenuOpen);
        }}
        className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <nav className="py-2">
            {allNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            ))}
            <div className="border-t border-gray-200 my-1"></div>
            <button
              onClick={() => {
                handleLogout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            >
              <span className="text-lg">🚪</span>
              <span className="font-medium text-sm">Logout</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
