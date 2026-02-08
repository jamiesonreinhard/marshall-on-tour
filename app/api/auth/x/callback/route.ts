import { NextRequest, NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

const PKCE_COOKIE = 'x_oauth2_pkce';

/**
 * OAuth 2.0 callback: exchange code for user access token, show token for .env.
 * GET /api/auth/x/callback?code=...&state=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error');

  if (errorParam) {
    return htmlResponse(
      `X authorization denied or error: ${errorParam}`,
      undefined,
      undefined,
      true
    );
  }
  if (!code || !state) {
    return htmlResponse('Missing code or state from X callback.', undefined, undefined, true);
  }

  const cookie = request.cookies.get(PKCE_COOKIE)?.value;
  if (!cookie) {
    return htmlResponse(
      'Cookie missing (session expired or blocked). Try Connect X again.',
      undefined,
      undefined,
      true
    );
  }

  let codeVerifier: string;
  try {
    const parsed = JSON.parse(cookie) as { state: string; codeVerifier: string };
    if (parsed.state !== state) {
      return htmlResponse('State mismatch. Try Connect X again.', undefined, undefined, true);
    }
    codeVerifier = parsed.codeVerifier;
  } catch {
    return htmlResponse('Invalid cookie. Try Connect X again.', undefined, undefined, true);
  }

  const clientId = process.env.X_OAUTH2_CLIENT_ID?.trim();
  const clientSecret = process.env.X_OAUTH2_CLIENT_SECRET?.trim();
  if (!clientId) {
    return htmlResponse('X_OAUTH2_CLIENT_ID not set.', undefined, undefined, true);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/x/callback`;

  const requestClient = new TwitterApi({ clientId, clientSecret });
  try {
    const { accessToken, refreshToken } = await requestClient.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri,
    });

    const res = htmlResponse(
      'X account connected. Add the token below to .env.local.',
      accessToken,
      refreshToken,
      false
    );
    // Clear the PKCE cookie
    res.cookies.set(PKCE_COOKIE, '', { maxAge: 0, path: '/' });
    return res;
  } catch (err: any) {
    console.error('[X OAuth2] Token exchange failed:', err?.message ?? err);
    return htmlResponse(
      `Token exchange failed: ${err?.message ?? String(err)}`,
      undefined,
      undefined,
      true
    );
  }
}

function htmlResponse(
  message: string,
  accessToken?: string,
  refreshToken?: string,
  isError?: boolean
): NextResponse {
  const adminUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')}/admin/connect-x`
    : '/admin/connect-x';
  const body = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>X Connect</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
    h1 { font-size: 1.25rem; }
    .msg { padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .error { background: #fef2f2; color: #991b1b; }
    .success { background: #f0fdf4; color: #166534; }
    code { background: #f1f5f9; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; }
    pre { background: #f1f5f9; padding: 1rem; border-radius: 8px; overflow-x: auto; font-size: 0.85rem; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <h1>X (Twitter) Connect</h1>
  <div class="msg ${isError ? 'error' : 'success'}">${message}</div>
  ${
    accessToken
      ? `
  <p>Add to <code>.env.local</code>:</p>
  <pre>X_OAUTH2_USER_ACCESS_TOKEN=${accessToken}</pre>
  ${
    refreshToken
      ? `<pre>X_OAUTH2_REFRESH_TOKEN=${refreshToken}</pre><p>(Optional; use for refreshing the access token later.)</p>`
      : ''
  }
  <p>Then restart your dev server. Posting to X will use OAuth 2.0 user context.</p>
  `
      : ''
  }
  <p><a href="${adminUrl}">← Back to Connect X</a></p>
</body>
</html>
`;
  return new NextResponse(body, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
