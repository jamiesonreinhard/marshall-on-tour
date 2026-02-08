/**
 * Stock Image Integration (Unsplash)
 *
 * Follows Unsplash API guidelines:
 * - Hotlink: use image URLs from photo.urls (do not re-host)
 * - Trigger download when a photo is used (GET download_location)
 * - Attribute: "Photo by [Name] on Unsplash" with links
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export interface StockImageOptions {
  query: string;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  width?: number;
  height?: number;
}

/** Result when we use an Unsplash photo: hotlink URL + attribution + download trigger */
export interface StockImageResult {
  /** Hotlink URL from Unsplash (photo.urls.regular/full) - use this as image src */
  url: string;
  /** Markdown attribution: "Photo by [Name](profile) on [Unsplash](https://unsplash.com)" */
  attribution: string;
  /** Call GET this URL when the photo is "used" (e.g. set as featured image) */
  downloadLocation: string;
}

/**
 * Trigger Unsplash download event (required when your app uses a photo).
 * Call this when the image is selected for use (e.g. as post featured image).
 */
export async function triggerUnsplashDownload(downloadLocation: string): Promise<void> {
  if (!UNSPLASH_ACCESS_KEY || !downloadLocation) return;
  try {
    const sep = downloadLocation.includes('?') ? '&' : '?';
    const url = `${downloadLocation}${sep}client_id=${UNSPLASH_ACCESS_KEY}`;
    await fetch(url, { method: 'GET' });
  } catch {
    // Fire-and-forget; don't block or fail the flow
  }
}

/**
 * Search for stock images from Unsplash.
 * Returns hotlink URL + attribution + download_location (caller must trigger download when using the photo).
 */
export async function searchStockImage(options: StockImageOptions): Promise<StockImageResult | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('[Stock Images] UNSPLASH_ACCESS_KEY not set. Stock images will not be available.');
    return null;
  }

  try {
    const { orientation = 'landscape' } = options;
    const query = encodeURIComponent(options.query);
    const apiUrl = `https://api.unsplash.com/search/photos?query=${query}&orientation=${orientation}&per_page=5&client_id=${UNSPLASH_ACCESS_KEY}`;

    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error(`[Stock Images] Unsplash API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    if (!data.results || data.results.length === 0) {
      console.warn(`[Stock Images] No results found for query: "${options.query}"`);
      return null;
    }

    const photo = data.results[0];
    const user = photo.user || {};
    const name = user.name || 'Unknown';
    const username = user.username ? `https://unsplash.com/@${user.username}` : 'https://unsplash.com';
    const imageUrl = photo.urls?.regular || photo.urls?.full || photo.urls?.small;
    const downloadLocation = photo.links?.download_location;

    if (!imageUrl) return null;

    const attribution = `Photo by [${name}](${username}) on [Unsplash](https://unsplash.com)`;
    console.log(`[Stock Images] Found image for "${options.query}" (${name})`);

    return {
      url: imageUrl,
      attribution,
      downloadLocation: downloadLocation || '',
    };
  } catch (error: unknown) {
    console.error('[Stock Images] Error:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Get stock image for a specific post type and context.
 * Returns hotlink URL + attribution; caller must trigger download when using the photo.
 */
export async function getStockImageForPost(
  postType: 'gear' | 'travel' | 'analysis' | 'lifestyle' | 'blast-from-past',
  topic: string,
  tournament?: { name: string; location: string },
  isRecap?: boolean
): Promise<StockImageResult | null> {
  const topicLower = topic.toLowerCase();

  const tryQueries = async (queries: string[]): Promise<StockImageResult | null> => {
    for (const q of queries) {
      const image = await searchStockImage({ query: q, orientation: 'landscape' });
      if (image) return image;
    }
    return null;
  };

  // BLAST FROM PAST / NOSTALGIA
  if (postType === 'blast-from-past' || topicLower.includes('federer') || topicLower.includes('nostalgia') || topicLower.includes('unforgettable') || topicLower.includes('australian open') || topicLower.includes('blast from past')) {
    const result = await tryQueries([
      'tennis australian open stadium',
      'professional tennis match action',
      'tennis grand slam final',
      'tennis player championship',
    ]);
    if (result) return result;
  }

  // RECAP POSTS: Court/venue only
  if (isRecap || topicLower.includes('recap') || topicLower.includes('final')) {
    if (tournament) {
      const result = await tryQueries([
        `${tournament.location} indoor tennis arena`,
        `tennis court ${tournament.location}`,
        'indoor tennis court arena',
        'ATP tennis court indoor',
        'tennis stadium seating empty',
      ]);
      if (result) return result;
    }
    const result = await tryQueries([
      'indoor tennis court empty',
      'tennis arena seating',
      'ATP tennis court',
      'tennis court professional',
    ]);
    if (result) return result;
  }

  // PREVIEW POSTS: Location/travel
  if (topicLower.includes('preview') || topicLower.includes('guide')) {
    if (tournament) {
      const result = await tryQueries([
        `${tournament.location} cityscape`,
        `${tournament.location} landmark`,
        `${tournament.location} travel destination`,
        `${tournament.location} tennis venue`,
      ]);
      if (result) return result;
    }
    const result = await searchStockImage({ query: 'tennis tournament location travel', orientation: 'landscape' });
    if (result) return result;
  }

  // GEAR POSTS
  if (postType === 'gear' || topicLower.includes('racket') || topicLower.includes('gear')) {
    const result = await tryQueries([
      'tennis racket equipment professional',
      'tennis gear products arranged',
      'tennis equipment rackets shoes',
    ]);
    if (result) return result;
  }

  // PLAYER PROFILE / ANALYSIS
  const isPlayerFocus = topicLower.includes('rising star') || topicLower.includes('player') || topicLower.includes('profile') ||
    (postType === 'analysis' && /\b(sinner|alcaraz|djokovic|nadal|federer|rune|fils|shelton|medvedev|zverev)\b/.test(topicLower));
  if (isPlayerFocus) {
    const playerQuery = extractPlayerNameFromTopic(topic);
    if (playerQuery) {
      const result = await searchStockImage({ query: `${playerQuery} ATP tennis men`, orientation: 'landscape' });
      if (result) return result;
    }
    const result = await tryQueries([
      'ATP tennis stadium men',
      'men tennis court crowd',
      'tennis grand slam men stadium',
    ]);
    if (result) return result;
  }

  // MATCH ANALYSIS
  if (postType === 'analysis' && (topicLower.includes('match') || topicLower.includes('vs'))) {
    const result = await searchStockImage({ query: 'tennis match action players rally', orientation: 'landscape' });
    if (result) return result;
  }

  // DEFAULT
  return await searchStockImage({ query: 'tennis court professional tournament', orientation: 'landscape' });
}

/** Extract a likely player name from topic for image search (e.g. "Jannik Sinner: ..." or "...Jannik Sinner isn't..." -> "Jannik Sinner") */
function extractPlayerNameFromTopic(topic: string): string | null {
  // Try "FirstName LastName" pattern (known ATP names)
  const knownPairs: [string, string][] = [
    ['jannik', 'sinner'], ['carlos', 'alcaraz'], ['novak', 'djokovic'], ['rafael', 'nadal'],
    ['roger', 'federer'], ['holger', 'rune'], ['arthur', 'fils'], ['ben', 'shelton'],
    ['daniil', 'medvedev'], ['alexander', 'zverev'], ['stefanos', 'tsitsipas'],
  ];
  const lower = topic.toLowerCase();
  for (const [first, last] of knownPairs) {
    const idx = lower.indexOf(`${first} ${last}`);
    if (idx !== -1) {
      const slice = topic.slice(idx, idx + first.length + 1 + last.length);
      const words = slice.split(/\s+/);
      if (words.length >= 2) return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }
  // Fallback: text before colon if it looks like a name (2–4 words)
  const beforeColon = topic.split(':')[0].trim();
  const words = beforeColon.split(/\s+/).filter(Boolean);
  if (words.length >= 2 && words.length <= 4) return words.join(' ');
  return null;
}
