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
  
  const { data: posts } = await supabase
    .from('posts')
    .select('published_at, category, tags, title, content')
    .gte('published_at', cutoffDate.toISOString())
    .order('published_at', { ascending: false });
  
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
    const tournamentKeywords = [
      'australian open', 'french open', 'roland-garros', 'wimbledon', 'us open',
      'indian wells', 'miami', 'monte carlo', 'madrid', 'rome', 'cincinnati',
      'canada', 'shanghai', 'paris', 'atp finals',
    ];
    
    tournamentKeywords.forEach(tournament => {
      if (text.includes(tournament) && !tournaments.includes(tournament)) {
        tournaments.push(tournament);
      }
    });
  });
  
  return {
    lastPostDate: new Date(posts[0].published_at || posts[0].created_at),
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
