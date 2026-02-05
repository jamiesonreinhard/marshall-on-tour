/**
 * Content Variety Tracker
 * 
 * Ensures Marshall doesn't post about the same topics repeatedly
 */

import { createAdminSupabase } from '@/lib/supabase/server';

export interface ContentHistory {
  lastPostDate: Date;
  topics: string[]; // ['alcaraz', 'indian-wells', 'gear']
  categories: string[]; // ['analysis', 'gear', 'travel']
  players: string[]; // Players mentioned in recent posts
  tournaments: string[]; // Tournaments covered recently
}

/**
 * Get recent content history to check variety
 */
export async function getContentHistory(days: number = 7): Promise<ContentHistory> {
  const supabase = createAdminSupabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  // Get both published posts AND drafts (to avoid duplicates)
  // Check created_at as fallback for drafts that don't have published_at
  const { data: posts } = await supabase
    .from('posts')
    .select('published_at, created_at, category, tags, title, content')
    .or(`published_at.gte.${cutoffDate.toISOString()},and(published_at.is.null,created_at.gte.${cutoffDate.toISOString()})`)
    .order('published_at', { ascending: false })
    .order('created_at', { ascending: false });
  
  if (!posts || posts.length === 0) {
    return {
      lastPostDate: new Date(0),
      topics: [],
      categories: [],
      players: [],
      tournaments: [],
    };
  }
  
  const topics: string[] = [];
  const categories: string[] = [];
  const players: string[] = [];
  const tournaments: string[] = [];
  
  // Extract topics, categories, players, tournaments from posts
  posts.forEach(post => {
    if (post.category) {
      categories.push(post.category.toLowerCase());
    }
    
    if (post.tags && Array.isArray(post.tags)) {
      topics.push(...post.tags.map((t: string) => t.toLowerCase()));
    }
    
    // Extract players from title/content (simple keyword matching)
    // TODO: Improve with better NLP or player database
    const topPlayers = [
      'alcaraz', 'djokovic', 'sinner', 'medvedev', 'rublev', 'tsitsipas',
      'rune', 'fritz', 'paul', 'de minaur', 'norrie', 'hurkacz', 'zverev',
      'auger-aliassime', 'tiafoe', 'musetti', 'dimitrov', 'khachanov',
    ];
    
    const text = `${post.title} ${post.content}`.toLowerCase();
    topPlayers.forEach(player => {
      if (text.includes(player) && !players.includes(player)) {
        players.push(player);
      }
    });
    
    // Extract tournaments from title/content
    // Method 1: Check for common tournament keywords
    const tournamentKeywords = [
      'australian open', 'french open', 'roland-garros', 'roland garros', 'wimbledon', 'us open',
      'indian wells', 'miami', 'monte carlo', 'madrid', 'rome', 'cincinnati',
      'canada', 'shanghai', 'paris', 'atp finals',
    ];
    
    tournamentKeywords.forEach(tournament => {
      if (text.includes(tournament) && !tournaments.includes(tournament)) {
        tournaments.push(tournament);
      }
    });
    
    // Method 2: Extract tournament names from title (for any tournament, not just keywords)
    // Pattern: "Tournament Name Preview/Recap/Guide" or "Tournament Name 2026"
    const titleLower = post.title.toLowerCase();
    
    // Check for tournament name patterns in title
    // Examples: "Open Occitanie Preview", "Montpellier Travel Guide", "ATP 250 Montpellier"
    const tournamentPatterns = [
      /(?:^|\s)([a-z]+(?:\s+[a-z]+)*)\s+(?:preview|recap|guide|travel|2026|day update)/i,
      /(?:^|\s)(open\s+[a-z]+)/i,
      /(?:^|\s)(atp\s+\d+\s+[a-z]+)/i,
    ];
    
    tournamentPatterns.forEach(pattern => {
      const match = titleLower.match(pattern);
      if (match && match[1]) {
        const tournamentName = match[1].trim().toLowerCase();
        if (tournamentName && !tournaments.includes(tournamentName)) {
          tournaments.push(tournamentName);
        }
      }
    });
    
    // Also check for tournament keywords in title
    tournamentKeywords.forEach(tournament => {
      if (titleLower.includes(tournament) && !tournaments.includes(tournament)) {
        tournaments.push(tournament);
      }
    });
    
    // Method 3: Extract city names that might be tournaments
    // If title contains city name + "travel guide" or "preview", it's likely a tournament post
    const cityTournamentPattern = /(?:guide to|preview|travel guide|at)\s+([a-z]+(?:\s+[a-z]+)*)/i;
    const cityMatch = titleLower.match(cityTournamentPattern);
    if (cityMatch && cityMatch[1]) {
      const cityName = cityMatch[1].trim().toLowerCase();
      // Check if this looks like a tournament-related post
      if (titleLower.includes('open') || titleLower.includes('atp') || titleLower.includes('tournament')) {
        if (!tournaments.includes(cityName)) {
          tournaments.push(cityName);
        }
      }
    }
  });
  
  return {
    lastPostDate: new Date(posts[0]?.published_at || posts[0]?.created_at || new Date()),
    topics: [...new Set(topics)],
    categories: [...new Set(categories)],
    players: [...new Set(players)],
    tournaments: [...new Set(tournaments)],
  };
}

/**
 * Check if we've posted about a topic recently
 */
export async function hasPostedAboutTopic(
  topic: string,
  days: number = 3
): Promise<boolean> {
  const history = await getContentHistory(days);
  const topicLower = topic.toLowerCase();
  
  return (
    history.topics.includes(topicLower) ||
    history.players.includes(topicLower) ||
    history.tournaments.some(t => t.includes(topicLower))
  );
}

/**
 * Check if we've posted in a category recently
 */
export async function hasPostedInCategory(
  category: string,
  days: number = 4
): Promise<boolean> {
  const history = await getContentHistory(days);
  return history.categories.includes(category.toLowerCase());
}

/**
 * Check if we've posted about a player recently
 */
export async function hasPostedAboutPlayer(
  playerName: string,
  days: number = 3
): Promise<boolean> {
  const history = await getContentHistory(days);
  return history.players.includes(playerName.toLowerCase());
}

/**
 * Check if we've posted about a tournament recently
 */
export async function hasPostedAboutTournament(
  tournamentName: string,
  days: number = 2
): Promise<boolean> {
  const history = await getContentHistory(days);
  const tournamentLower = tournamentName.toLowerCase();
  return history.tournaments.some(t => t.includes(tournamentLower));
}

/**
 * Get content variety score (higher = more variety)
 */
export async function getVarietyScore(): Promise<number> {
  const history = await getContentHistory(7);
  
  // More unique topics, players, tournaments = higher variety
  const uniqueTopics = history.topics.length;
  const uniquePlayers = history.players.length;
  const uniqueTournaments = history.tournaments.length;
  const uniqueCategories = history.categories.length;
  
  // Score: 0-100 (higher is better)
  const score = Math.min(
    (uniqueTopics * 5) +
    (uniquePlayers * 10) +
    (uniqueTournaments * 8) +
    (uniqueCategories * 15),
    100
  );
  
  return score;
}
