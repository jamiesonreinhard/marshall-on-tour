'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth/admin-auth';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Don't check auth on login page
    if (isLoginPage) {
      setChecking(false);
      return;
    }

    // Check authentication
    if (!isAuthenticated()) {
      // Store current path for redirect after login
      localStorage.setItem('marshall_admin_redirect', pathname);
      router.push('/admin/login');
    } else {
      setChecking(false);
    }
  }, [router, pathname, isLoginPage]);

  // Show loading state while checking (but not on login page)
  if (checking && !isLoginPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎾</div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
