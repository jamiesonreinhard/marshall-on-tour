/**
 * Canonical base URL for public links (blog, X posts, etc.).
 * Never returns localhost so shared links always point at production.
 */
const PRODUCTION_SITE = 'https://marshallontour.com';

export function getCanonicalSiteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!env) return PRODUCTION_SITE;
  const lower = env.toLowerCase();
  if (lower.startsWith('http://localhost') || lower.startsWith('https://localhost')) {
    return PRODUCTION_SITE;
  }
  return env.replace(/\/$/, '');
}
