/**
 * Stock Image Integration
 * 
 * Uses free stock image APIs (Unsplash) for non-Marshall posts
 * Reduces AI generation costs and provides authentic photography
 */

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export interface StockImageOptions {
  query: string;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  width?: number;
  height?: number;
}

/**
 * Search for stock images from Unsplash
 */
export async function searchStockImage(options: StockImageOptions): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('[Stock Images] UNSPLASH_ACCESS_KEY not set. Stock images will not be available.');
    return null;
  }

  try {
    const { orientation = 'landscape', width = 1920, height = 1080 } = options;
    
    // Build search query
    const query = encodeURIComponent(options.query);
    const url = `https://api.unsplash.com/search/photos?query=${query}&orientation=${orientation}&per_page=5&client_id=${UNSPLASH_ACCESS_KEY}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[Stock Images] Unsplash API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.warn(`[Stock Images] No results found for query: "${options.query}"`);
      return null;
    }
    
    // Get the first result (best match)
    const photo = data.results[0];
    
    // Return the regular URL (Unsplash provides free usage)
    // For higher quality, we could use photo.urls.regular or photo.urls.full
    const imageUrl = photo.urls.regular || photo.urls.small;
    
    console.log(`[Stock Images] Found image for "${options.query}": ${imageUrl}`);
    
    return imageUrl;
  } catch (error: any) {
    console.error('[Stock Images] Error fetching stock image:', error.message);
    return null;
  }
}

/**
 * Get stock image for a specific post type and context
 */
export async function getStockImageForPost(
  postType: 'gear' | 'travel' | 'analysis' | 'lifestyle',
  topic: string,
  tournament?: { name: string; location: string },
  isRecap?: boolean
): Promise<string | null> {
  const topicLower = topic.toLowerCase();
  
  // RECAP POSTS: Tournament action shots
  if (isRecap || topicLower.includes('recap') || topicLower.includes('final')) {
    if (tournament) {
      // Try tournament-specific queries
      const queries = [
        `${tournament.name} tennis tournament`,
        `tennis tournament ${tournament.location}`,
        `tennis match action ${tournament.location}`,
        'professional tennis match action',
        'tennis tournament stadium',
      ];
      
      for (const query of queries) {
        const image = await searchStockImage({ query, orientation: 'landscape' });
        if (image) return image;
      }
    }
    
    // Fallback to generic tennis action
    return await searchStockImage({ 
      query: 'professional tennis match action stadium', 
      orientation: 'landscape' 
    });
  }
  
  // PREVIEW POSTS: Location/travel imagery
  if (topicLower.includes('preview') || topicLower.includes('guide')) {
    if (tournament) {
      const queries = [
        `${tournament.location} cityscape`,
        `${tournament.location} landmark`,
        `${tournament.location} travel destination`,
        `${tournament.location} tennis venue`,
      ];
      
      for (const query of queries) {
        const image = await searchStockImage({ query, orientation: 'landscape' });
        if (image) return image;
      }
    }
    
    return await searchStockImage({ 
      query: 'tennis tournament location travel', 
      orientation: 'landscape' 
    });
  }
  
  // GEAR POSTS: Product photography
  if (postType === 'gear' || topicLower.includes('racket') || topicLower.includes('gear')) {
    const queries = [
      'tennis racket equipment professional',
      'tennis gear products arranged',
      'tennis equipment rackets shoes',
    ];
    
    for (const query of queries) {
      const image = await searchStockImage({ query, orientation: 'landscape' });
      if (image) return image;
    }
  }
  
  // PLAYER PROFILE POSTS: Player action shots
  if (topicLower.includes('rising star') || topicLower.includes('player') || topicLower.includes('profile')) {
    return await searchStockImage({ 
      query: 'professional tennis player action shot', 
      orientation: 'landscape' 
    });
  }
  
  // MATCH ANALYSIS: Match action
  if (postType === 'analysis' && (topicLower.includes('match') || topicLower.includes('vs'))) {
    return await searchStockImage({ 
      query: 'tennis match action players rally', 
      orientation: 'landscape' 
    });
  }
  
  // DEFAULT: Generic tennis scene
  return await searchStockImage({ 
    query: 'tennis court professional tournament', 
    orientation: 'landscape' 
  });
}
