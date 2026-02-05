/**
 * RSS Feed Integration
 * 
 * Fetches tennis news from RSS feeds
 * Sources: ESPN Tennis, BBC Sport Tennis, Tennis.com, etc.
 */

import { NewsItem, DataSourceResult, DataSourceConfig } from './types';

const DEFAULT_CONFIG: DataSourceConfig = {
  enabled: true,
  cacheDuration: 3600, // 1 hour
  fallbackToMock: true,
};

// RSS Feed URLs
const RSS_FEEDS = [
  {
    name: 'ESPN Tennis',
    url: 'https://www.espn.com/tennis/rss.xml',
  },
  {
    name: 'BBC Sport Tennis',
    url: 'https://feeds.bbci.co.uk/sport/tennis/rss.xml',
  },
  {
    name: 'Tennis.com',
    url: 'https://www.tennis.com/news/rss',
  },
  // Add more feeds as needed
];

/**
 * Parse RSS feed XML
 */
function parseRSSFeed(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  
  // Simple RSS parser (for MVP - consider using a library like 'rss-parser' for production)
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of itemMatches) {
    const itemXml = match[1];
    
    const titleMatch = itemXml.match(/<title>(.*?)<\/title>/);
    const descriptionMatch = itemXml.match(/<description>(.*?)<\/description>/);
    const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
    const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
    const imageMatch = itemXml.match(/<enclosure url="(.*?)"/) || itemXml.match(/<media:content url="(.*?)"/);
    
    if (titleMatch && linkMatch) {
      items.push({
        id: `${source}-${Date.now()}-${Math.random()}`,
        title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim(),
        description: descriptionMatch?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim() || '',
        url: linkMatch[1].trim(),
        published_at: pubDateMatch?.[1] ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
        source,
        image_url: imageMatch?.[1],
        tags: extractTags(titleMatch[1] + ' ' + (descriptionMatch?.[1] || '')),
      });
    }
  }
  
  return items;
}

/**
 * Extract tags/keywords from news text
 */
function extractTags(text: string): string[] {
  const tags: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Player names
  const players = ['alcaraz', 'djokovic', 'sinner', 'medvedev', 'federer', 'nadal', 'murray'];
  players.forEach(player => {
    if (lowerText.includes(player)) {
      tags.push(player);
    }
  });
  
  // Tournament names
  const tournaments = ['australian open', 'wimbledon', 'french open', 'us open', 'roland-garros'];
  tournaments.forEach(tournament => {
    if (lowerText.includes(tournament)) {
      tags.push(tournament);
    }
  });
  
  return tags;
}

/**
 * Fetch news from RSS feeds
 */
export async function fetchTennisNews(
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<NewsItem[]>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'RSS feed integration is disabled',
      cached: false,
      source: 'rss',
    };
  }
  
  try {
    const allNews: NewsItem[] = [];
    
    // Fetch from all RSS feeds
    for (const feed of RSS_FEEDS) {
      try {
        const response = await fetch(feed.url, {
          next: { revalidate: config.cacheDuration || 3600 },
          headers: {
            'User-Agent': 'Marshall On Tour Bot 1.0',
          },
        });
        
        if (!response.ok) {
          console.warn(`Failed to fetch RSS feed ${feed.name}:`, response.status);
          continue;
        }
        
        const xml = await response.text();
        const items = parseRSSFeed(xml, feed.name);
        allNews.push(...items);
      } catch (error: any) {
        console.error(`Error fetching RSS feed ${feed.name}:`, error.message);
        continue;
      }
    }
    
    // Sort by published date (newest first)
    allNews.sort((a, b) => 
      new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );
    
    return {
      success: true,
      data: allNews,
      cached: false,
      source: 'rss',
    };
  } catch (error: any) {
    console.error('Error fetching tennis news:', error);
    
    if (config.fallbackToMock) {
      return {
        success: true,
        data: getMockNews(),
        cached: false,
        source: 'rss-mock',
      };
    }
    
    return {
      success: false,
      data: null,
      error: error.message,
      cached: false,
      source: 'rss',
    };
  }
}

/**
 * Get recent news (last 24 hours)
 */
export async function getRecentNews(
  hours: number = 24,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<NewsItem[]>> {
  const result = await fetchTennisNews(config);
  
  if (!result.success || !result.data) {
    return result;
  }
  
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hours);
  
  const recent = result.data.filter(item => 
    new Date(item.published_at) >= cutoff
  );
  
  return {
    ...result,
    data: recent,
  };
}

/**
 * Mock news data (fallback)
 */
function getMockNews(): NewsItem[] {
  return [
    {
      id: 'mock-news-1',
      title: 'Alcaraz Wins Australian Open',
      description: 'Carlos Alcaraz defeats Novak Djokovic in epic 5-set final',
      url: 'https://example.com/news/alcaraz-wins',
      published_at: new Date().toISOString(),
      source: 'Mock News',
      tags: ['alcaraz', 'djokovic', 'australian open'],
    },
    {
      id: 'mock-news-2',
      title: 'New Racket Technology Revolutionizes Tennis',
      description: 'Latest racket innovations promise to change the game',
      url: 'https://example.com/news/racket-tech',
      published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      source: 'Mock News',
      tags: ['gear', 'technology'],
    },
  ];
}
