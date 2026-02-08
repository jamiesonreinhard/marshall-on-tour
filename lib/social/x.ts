/**
 * X (Twitter) API client for posting blog promotions.
 * Supports both auth types from https://docs.x.com/x-api/posts/create-post:
 * - OAuth 2.0 User Context (preferred): X_OAUTH2_USER_ACCESS_TOKEN (Bearer).
 * - OAuth 1.0a User Context: X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET.
 */

import { TwitterApi, EUploadMimeType } from 'twitter-api-v2';

const MAX_TWEET_LENGTH = 280;

function getXClient(): TwitterApi | null {
  // OAuth 2.0 User Context (from "Connect X" flow) – preferred; X docs list it first
  const oauth2UserToken = process.env.X_OAUTH2_USER_ACCESS_TOKEN?.trim();
  if (oauth2UserToken) {
    console.log('[X] Using OAuth 2.0 user token for posting');
    return new TwitterApi(oauth2UserToken);
  }

  // OAuth 1.0a User Context (Keys and tokens → Access Token and Secret)
  // Library expects "accessSecret", not "accessTokenSecret" (see twitter-api-v2 request-maker.mixin)
  const appKey = process.env.X_CONSUMER_KEY?.trim();
  const appSecret = process.env.X_CONSUMER_SECRET?.trim();
  const accessToken = process.env.X_ACCESS_TOKEN?.trim();
  const accessSecret = process.env.X_ACCESS_TOKEN_SECRET?.trim();
  if (appKey && appSecret && accessToken && accessSecret) {
    console.log('[X] Using OAuth 1.0a user context for posting');
    return new TwitterApi({ appKey, appSecret, accessToken, accessSecret });
  }

  return null;
}

/**
 * Build tweet text: hook (title or excerpt) + space + url. Fits in 280 chars.
 */
function buildTweetText(title: string, blogUrl: string, excerpt?: string): string {
  let hook = (excerpt && excerpt.length ? excerpt.trim() : title.trim()) || title.trim();
  const suffix = ` ${blogUrl}`;
  const maxHook = MAX_TWEET_LENGTH - suffix.length;
  if (maxHook <= 0) return blogUrl;
  if (hook.length > maxHook) hook = hook.slice(0, maxHook - 1).trim() + '…';
  return (hook + suffix).slice(0, MAX_TWEET_LENGTH);
}

function mimeFromUrl(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('.png')) return EUploadMimeType.Png;
  if (u.includes('.gif')) return EUploadMimeType.Gif;
  if (u.includes('.webp')) return EUploadMimeType.Webp;
  return EUploadMimeType.Jpeg;
}

export interface PostBlogToXParams {
  blogUrl: string;
  title: string;
  excerpt?: string;
  /** Optional featured image URL (same as blog post). If omitted, tweet is text-only. */
  imageUrl?: string | null;
}

export interface PostBlogToXResult {
  success: boolean;
  tweetId?: string;
  error?: string;
}

/**
 * Post a blog promotion to X: short hook + link, optionally with the post's featured image.
 * No-op if X user credentials are not configured; logs and returns success: false.
 */
const X_403_HINT =
  'OAuth 2.0: Use Admin → Connect X to get a user token. OAuth 1.0a: developer.x.com → your app → Settings → User authentication → set to Read and Write → regenerate Access Token and Secret.';

function get403Hint(err: any): string {
  const type = err?.data?.type ?? err?.data?.errors?.[0]?.type ?? '';
  if (type.includes('oauth1-permissions'))
    return 'In X Developer Portal: open your app → Settings → User authentication settings → App permissions → set to "Read and Write" (not Read only). Then regenerate your Access Token and Secret under Keys and tokens and update X_ACCESS_TOKEN and X_ACCESS_TOKEN_SECRET in .env.local.';
  return X_403_HINT;
}

export async function postBlogToX(params: PostBlogToXParams): Promise<PostBlogToXResult> {
  const client = getXClient();
  if (!client) {
    console.warn(
      '[X] Skipping: set X_OAUTH2_USER_ACCESS_TOKEN (from Admin → Connect X) or all four OAuth 1.0a: X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET.'
    );
    return { success: false, error: 'X posting not configured (add OAuth 2.0 user token or OAuth 1.0a credentials)' };
  }

  const { blogUrl, title, excerpt, imageUrl } = params;
  const text = buildTweetText(title, blogUrl, excerpt);

  try {
    let mediaIds: string[] | undefined;
    if (imageUrl?.trim()) {
      try {
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());
        const mimeType = mimeFromUrl(imageUrl);
        const mediaId = await client.v2.uploadMedia(buffer, {
          media_type: mimeType as `${EUploadMimeType}`,
          media_category: 'tweet_image',
        });
        mediaIds = [mediaId];
      } catch (uploadErr: any) {
        logXError('[X] Image upload failed, posting text-only', uploadErr);
        const upload403 = uploadErr?.code === 403 || String(uploadErr?.message ?? '').includes('403');
        if (upload403) console.error(get403Hint(uploadErr));
      }
    }

    const payload = mediaIds?.length
      ? { text, media: { media_ids: mediaIds as [string] } }
      : { text };
    const result = await client.v2.tweet(payload);

    if (result.data?.id) {
      console.log(`[X] Posted tweet ${result.data.id}: ${text.slice(0, 50)}…`);
      return { success: true, tweetId: result.data.id };
    }
    return { success: false, error: 'No tweet id in response' };
  } catch (err: any) {
    const message = formatXError(err);
    const is403 = err?.code === 403 || String(err?.message ?? '').includes('403');
    const hint = is403 ? get403Hint(err) : '';
    logXError('[X] Failed to post', err);
    if (is403) console.error(hint);
    return {
      success: false,
      error: message + (hint ? '. ' + hint : ''),
    };
  }
}

function logXError(prefix: string, err: any): void {
  const msg = formatXError(err);
  console.error(prefix + ':', msg);
  if (err?.data && typeof err.data === 'object') {
    console.error('[X] API response:', JSON.stringify(err.data));
  }
}

function formatXError(err: any): string {
  const msg = err?.message ?? String(err);
  const data = err?.data;
  if (data?.errors?.[0]) {
    const e = data.errors[0];
    const detail = typeof e === 'object' && e.detail ? e.detail : e.title ?? JSON.stringify(e);
    return `${msg} (API: ${detail})`;
  }
  if (data?.detail) return `${msg} (API: ${data.detail})`;
  return msg;
}
