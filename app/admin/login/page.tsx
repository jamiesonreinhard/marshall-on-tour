'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate, isAuthenticated } from '@/lib/auth/admin-auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already authenticated, redirect
    if (isAuthenticated()) {
      const redirectPath = localStorage.getItem('marshall_admin_redirect') || '/admin';
      localStorage.removeItem('marshall_admin_redirect');
      router.push(redirectPath);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Small delay to prevent brute force
    await new Promise(resolve => setTimeout(resolve, 500));

    if (authenticate(password)) {
      const redirectPath = localStorage.getItem('marshall_admin_redirect') || '/admin';
      localStorage.removeItem('marshall_admin_redirect');
      router.push(redirectPath);
    } else {
      setError('Incorrect password');
      setPassword('');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🎾</div>
            <h1 className="text-2xl font-bold text-gray-900">Marshall Admin</h1>
            <p className="text-gray-600 mt-2">Enter password to access admin panel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter admin password"
                autoFocus
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Authenticating...' : 'Login'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Protected admin area
        </p>
      </div>
    </div>
  );
}
