/**
 * RSS Feed Aggregator for Tennis News
 * 
 * Aggregates news from multiple tennis RSS feeds
 * No API keys required - RSS feeds are public
 */

interface RSSItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
}

interface RSSFeed {
  title: string;
  items: RSSItem[];
}

// RSS Feed URLs (can be overridden with env vars)
const RSS_FEEDS = {
  espn: process.env.RSS_ESPN_TENNIS || 'https://www.espn.com/espn/rss/tennis/news',
  bbc: process.env.RSS_BBC_TENNIS || 'https://feeds.bbci.co.uk/sport/tennis/rss.xml',
  tennisCom: process.env.RSS_TENNIS_COM || 'https://www.tennis.com/news/rss',
};

/**
 * Parse RSS XML to JSON
 */
function parseRSS(xml: string, source: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  try {
    // Simple RSS parser (for production, consider using a library like 'rss-parser')
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const matches = xml.match(itemRegex);

    if (!matches) return items;

    matches.forEach((itemXml) => {
      const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/);
      const descriptionMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/);
      const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);

      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim(),
          description: descriptionMatch
            ? descriptionMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim()
            : '',
          link: linkMatch[1].trim(),
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
          source,
        });
      }
    });
  } catch (error) {
    console.error(`Error parsing RSS from ${source}:`, error);
  }

  return items;
}

/**
 * Fetch and parse a single RSS feed
 */
async function fetchRSSFeed(url: string, source: string): Promise<RSSItem[]> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 1800 }, // Cache for 30 minutes
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MarshallBot/1.0)',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch RSS from ${source}:`, response.statusText);
      return [];
    }

    const xml = await response.text();
    return parseRSS(xml, source);
  } catch (error) {
    console.error(`Error fetching RSS from ${source}:`, error);
    return [];
  }
}

/**
 * Get all tennis news from aggregated RSS feeds
 */
export async function getTennisNews(limit: number = 20): Promise<RSSItem[]> {
  const feeds = await Promise.all([
    fetchRSSFeed(RSS_FEEDS.espn, 'ESPN'),
    fetchRSSFeed(RSS_FEEDS.bbc, 'BBC Sport'),
    fetchRSSFeed(RSS_FEEDS.tennisCom, 'Tennis.com'),
  ]);

  // Combine all feeds
  const allItems = feeds.flat();

  // Sort by date (newest first)
  allItems.sort((a, b) => {
    const dateA = new Date(a.pubDate).getTime();
    const dateB = new Date(b.pubDate).getTime();
    return dateB - dateA;
  });

  // Remove duplicates (by title similarity)
  const uniqueItems = removeDuplicates(allItems);

  // Return limited results
  return uniqueItems.slice(0, limit);
}

/**
 * Get news from a specific source
 */
export async function getNewsFromSource(source: 'espn' | 'bbc' | 'tennisCom', limit: number = 10): Promise<RSSItem[]> {
  const url = RSS_FEEDS[source];
  const sourceName = source === 'espn' ? 'ESPN' : source === 'bbc' ? 'BBC Sport' : 'Tennis.com';
  
  const items = await fetchRSSFeed(url, sourceName);
  return items.slice(0, limit);
}

/**
 * Get recent news (last 24 hours)
 */
export async function getRecentNews(hours: number = 24): Promise<RSSItem[]> {
  const allNews = await getTennisNews(50);
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

  return allNews.filter((item) => {
    const itemDate = new Date(item.pubDate);
    return itemDate >= cutoffTime;
  });
}

/**
 * Remove duplicate news items (by title similarity)
 */
function removeDuplicates(items: RSSItem[]): RSSItem[] {
  const seen = new Set<string>();
  const unique: RSSItem[] = [];

  items.forEach((item) => {
    // Normalize title for comparison
    const normalizedTitle = item.title.toLowerCase().trim();
    
    // Check if we've seen a similar title
    let isDuplicate = false;
    for (const seenTitle of seen) {
      if (normalizedTitle.includes(seenTitle) || seenTitle.includes(normalizedTitle)) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.add(normalizedTitle);
      unique.push(item);
    }
  });

  return unique;
}

/**
 * Search news by keyword
 */
export async function searchNews(keyword: string, limit: number = 10): Promise<RSSItem[]> {
  const allNews = await getTennisNews(50);
  const keywordLower = keyword.toLowerCase();

  return allNews
    .filter(
      (item) =>
        item.title.toLowerCase().includes(keywordLower) ||
        item.description.toLowerCase().includes(keywordLower)
    )
    .slice(0, limit);
}
