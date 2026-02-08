import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

const PKCE_COOKIE = 'x_oauth2_pkce';
const PKCE_MAX_AGE = 600; // 10 min

/**
 * Start OAuth 2.0 PKCE flow: generate auth link, store code_verifier in cookie, redirect to X.
 * GET /api/auth/x/connect
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.X_OAUTH2_CLIENT_ID?.trim();
  const clientSecret = process.env.X_OAUTH2_CLIENT_SECRET?.trim();
  if (!clientId) {
    return NextResponse.json(
      { error: 'X_OAUTH2_CLIENT_ID not set in .env.local' },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/x/callback`;

  const requestClient = new TwitterApi({ clientId, clientSecret });
  const link = requestClient.generateOAuth2AuthLink(redirectUri, {
    scope: ['tweet.read', 'tweet.write', 'users.read', 'media.write'],
  });

  const cookiePayload = JSON.stringify({
    state: link.state,
    codeVerifier: link.codeVerifier,
  });
  const res = NextResponse.redirect(link.url);
  res.cookies.set(PKCE_COOKIE, cookiePayload, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: PKCE_MAX_AGE,
    path: '/',
  });
  return res;
}
