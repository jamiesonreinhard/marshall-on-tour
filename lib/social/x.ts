/**
 * X (Twitter) API client for posting blog promotions.
 * Requires OAuth 1.0a user tokens (access token + secret) to create tweets and upload media.
 * @see https://docs.x.com/x-api/posts/create-post
 */

import { TwitterApi, EUploadMimeType } from 'twitter-api-v2';

const MAX_TWEET_LENGTH = 280;

function getXClient(): TwitterApi | null {
  const appKey = process.env.X_CONSUMER_KEY;
  const appSecret = process.env.X_CONSUMER_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;
  if (!appKey || !appSecret || !accessToken || !accessTokenSecret) {
    return null;
  }
  return new TwitterApi({
    appKey,
    appSecret,
    accessToken,
    accessTokenSecret,
  });
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
export async function postBlogToX(params: PostBlogToXParams): Promise<PostBlogToXResult> {
  const client = getXClient();
  if (!client) {
    console.warn('[X] Skipping post to X: X_ACCESS_TOKEN and X_ACCESS_TOKEN_SECRET are required for posting. Set them in .env.local.');
    return { success: false, error: 'X posting not configured (missing user tokens)' };
  }

  const { blogUrl, title, excerpt, imageUrl } = params;
  const text = buildTweetText(title, blogUrl, excerpt);

  try {
    let mediaIds: string[] | undefined;
    if (imageUrl && imageUrl.trim()) {
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
        const uploadMsg = formatXError(uploadErr);
        console.warn('[X] Image upload failed, posting text-only:', uploadMsg);
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
    console.error('[X] Failed to post:', message);
    const hint =
      (err?.code === 403 || (err?.message && String(err.message).includes('403')))
        ? ' Fix: In X Developer Portal set your app to Read and Write, then regenerate Access Token and Secret.'
        : '';
    return { success: false, error: message + hint };
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
