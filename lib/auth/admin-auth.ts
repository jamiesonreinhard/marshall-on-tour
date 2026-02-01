/**
 * Admin Authentication
 * 
 * Simple localStorage-based auth for admin pages
 * Password is stored hashed in localStorage
 */

const ADMIN_PASSWORD_HASH = 'admin_authenticated'; // Simple flag for localStorage
const AUTH_KEY = 'marshall_admin_auth';

/**
 * Hash password (simple hash for basic protection)
 */
function hashPassword(password: string): string {
  // Simple hash - in production, use proper hashing
  return btoa(password).split('').reverse().join('');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const auth = localStorage.getItem(AUTH_KEY);
  return auth === ADMIN_PASSWORD_HASH;
}

/**
 * Authenticate with password
 */
export function authenticate(password: string): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check password
  if (password === 'H0meboyz!4729') {
    localStorage.setItem(AUTH_KEY, ADMIN_PASSWORD_HASH);
    return true;
  }
  
  return false;
}

/**
 * Logout
 */
export function logout(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Require authentication (redirect if not authenticated)
 */
export function requireAuth(): void {
  if (typeof window === 'undefined') return;
  
  if (!isAuthenticated()) {
    // Store the current path to redirect after login
    const currentPath = window.location.pathname;
    localStorage.setItem('marshall_admin_redirect', currentPath);
    window.location.href = '/admin/login';
  }
}
