/**
 * YouTube API Integration
 * 
 * Finds tennis highlights and classic match videos
 * Uses YouTube Data API v3
 */

import { YouTubeVideo, DataSourceResult, DataSourceConfig } from './types';

const DEFAULT_CONFIG: DataSourceConfig = {
  enabled: true,
  cacheDuration: 86400, // 24 hours (videos don't change)
  fallbackToMock: true,
};

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Search for tennis videos
 */
export async function searchTennisVideos(
  query: string,
  maxResults: number = 5,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<YouTubeVideo[]>> {
  if (!config.enabled) {
    return {
      success: false,
      data: null,
      error: 'YouTube integration is disabled',
      cached: false,
      source: 'youtube',
    };
  }
  
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.warn('YOUTUBE_API_KEY not set. Using mock data.');
    if (config.fallbackToMock) {
      return {
        success: true,
        data: getMockVideos(),
        cached: false,
        source: 'youtube-mock',
      };
    }
    return {
      success: false,
      data: null,
      error: 'YOUTUBE_API_KEY not set',
      cached: false,
      source: 'youtube',
    };
  }
  
  try {
    const url = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&order=relevance&key=${apiKey}`;
    
    const response = await fetch(url, {
      next: { revalidate: config.cacheDuration || 86400 },
    });
    
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Track API costs
    try {
      const { logCost, calculateYouTubeCost } = await import('@/lib/costs/tracker');
      const cost = calculateYouTubeCost(1);
      
      await logCost({
        service: 'youtube',
        endpoint: 'search',
        cost_usd: cost,
        request_count: 1,
        metadata: {
          query,
          maxResults,
        },
      });
    } catch (costError) {
      console.warn('Failed to track YouTube cost:', costError);
    }
    
    const videos: YouTubeVideo[] = (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      thumbnail_url: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
      channel: item.snippet.channelTitle,
      published_at: item.snippet.publishedAt,
      duration: 0, // Would need another API call to get duration
      view_count: 0, // Would need another API call to get views
    }));
    
    return {
      success: true,
      data: videos,
      cached: false,
      source: 'youtube',
    };
  } catch (error: any) {
    console.error('Error searching YouTube:', error);
    
    if (config.fallbackToMock) {
      return {
        success: true,
        data: getMockVideos(),
        cached: false,
        source: 'youtube-mock',
      };
    }
    
    return {
      success: false,
      data: null,
      error: error.message,
      cached: false,
      source: 'youtube',
    };
  }
}

/**
 * Find highlights for a specific match/player
 */
export async function findMatchHighlights(
  playerName: string,
  tournament: string,
  year: number,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<YouTubeVideo[]>> {
  const query = `${playerName} ${tournament} ${year} highlights`;
  return searchTennisVideos(query, 5, config);
}

/**
 * Find classic match videos
 */
export async function findClassicMatches(
  playerName?: string,
  tournament?: string,
  config: DataSourceConfig = DEFAULT_CONFIG
): Promise<DataSourceResult<YouTubeVideo[]>> {
  let query = 'tennis classic match highlights';
  if (playerName) {
    query = `${playerName} ${query}`;
  }
  if (tournament) {
    query = `${tournament} ${query}`;
  }
  
  return searchTennisVideos(query, 10, config);
}

/**
 * Mock videos (fallback)
 */
function getMockVideos(): YouTubeVideo[] {
  return [
    {
      id: 'mock-video-1',
      title: 'Federer vs Nadal - Wimbledon 2008 Final Highlights',
      description: 'The greatest match of all time',
      url: 'https://www.youtube.com/watch?v=mock1',
      thumbnail_url: 'https://example.com/thumb1.jpg',
      channel: 'ATP',
      published_at: '2008-07-06T00:00:00Z',
      duration: 600,
      view_count: 5000000,
    },
    {
      id: 'mock-video-2',
      title: 'Djokovic vs Alcaraz - 2023 Wimbledon Final',
      description: 'Epic 5-set thriller',
      url: 'https://www.youtube.com/watch?v=mock2',
      thumbnail_url: 'https://example.com/thumb2.jpg',
      channel: 'Wimbledon',
      published_at: '2023-07-16T00:00:00Z',
      duration: 720,
      view_count: 3000000,
    },
  ];
}
