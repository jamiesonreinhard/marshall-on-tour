/**
 * Data Processing Utilities
 * 
 * Analyzes data to help Marshall decide what to write about
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { getUpcomingTournamentsFromDB, getCurrentTournamentsFromDB } from './tournaments-from-db';
import { getRecentNews, getTennisNews } from './rss';

export interface ContentOpportunity {
  type: 'tournament' | 'news' | 'gear' | 'travel';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  affiliateOpportunity?: boolean;
  data?: any;
}

/**
 * Analyze recent blog posts to see what we've written about
 */
export async function analyzeRecentPosts(limit: number = 10) {
  const supabase = await createServerSupabase();

  const { data: posts, error } = await supabase
    .from('posts')
    .select('title, category, tags, created_at, published_at')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent posts:', error);
    return [];
  }

  return posts || [];
}

/**
 * Find content gaps (what we haven't written about recently)
 */
export async function findContentGaps(): Promise<ContentOpportunity[]> {
  const recentPosts = await analyzeRecentPosts(20);
  const opportunities: ContentOpportunity[] = [];

  // Check what categories we've covered recently
  const categoryCounts = recentPosts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // If we haven't written about Gear recently, suggest it
  if (!categoryCounts['Gear'] || categoryCounts['Gear'] < 2) {
    opportunities.push({
      type: 'gear',
      title: 'Gear Review Opportunity',
      description: "Haven't written about gear recently. High affiliate potential.",
      priority: 'high',
      affiliateOpportunity: true,
    });
  }

  // If we haven't written about Travel recently, suggest it
  if (!categoryCounts['Travel'] || categoryCounts['Travel'] < 2) {
    opportunities.push({
      type: 'travel',
      title: 'Travel Guide Opportunity',
      description: "Haven't written about travel recently. High affiliate potential.",
      priority: 'high',
      affiliateOpportunity: true,
    });
  }

  return opportunities;
}

/**
 * Find upcoming tournaments that need coverage
 */
export async function findUpcomingTournamentOpportunities(): Promise<ContentOpportunity[]> {
  const upcoming = await getUpcomingTournamentsFromDB();
  const opportunities: ContentOpportunity[] = [];

  // Get tournaments in the next 7 days (high priority)
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  upcoming.forEach((tournament) => {
    const startDate = new Date(tournament.start_date);
    const isHighPriority = startDate <= nextWeek;

    opportunities.push({
      type: 'tournament',
      title: `${tournament.name} - Preview Guide`,
      description: `Tournament starts ${startDate.toLocaleDateString()}. Opportunity for travel guide and gear content.`,
      priority: isHighPriority ? 'high' : 'medium',
      affiliateOpportunity: true, // Travel guides have affiliate potential
      data: tournament,
    });
  });

  return opportunities;
}

/**
 * Find current tournaments that need match analysis
 */
export async function findCurrentTournamentOpportunities(): Promise<ContentOpportunity[]> {
  const current = await getCurrentTournamentsFromDB();
  const opportunities: ContentOpportunity[] = [];

  current.forEach((tournament) => {
    opportunities.push({
      type: 'tournament',
      title: `${tournament.name} - Match Analysis`,
      description: `Tournament is currently happening. Opportunity for real-time analysis.`,
      priority: 'high',
      affiliateOpportunity: false,
      data: tournament,
    });
  });

  return opportunities;
}

/**
 * Find news stories worth covering
 */
export async function findNewsOpportunities(limit: number = 5): Promise<ContentOpportunity[]> {
  const recentNews = await getRecentNews(24); // Last 24 hours
  const opportunities: ContentOpportunity[] = [];

  // Filter for high-impact news (mentions top players, major events, etc.)
  const topPlayers = ['Alcaraz', 'Djokovic', 'Sinner', 'Medvedev', 'Zverev', 'Nadal', 'Federer'];
  
  recentNews.slice(0, limit).forEach((news) => {
    const mentionsTopPlayer = topPlayers.some((player) =>
      news.title.toLowerCase().includes(player.toLowerCase())
    );

    if (mentionsTopPlayer || news.title.toLowerCase().includes('grand slam')) {
      opportunities.push({
        type: 'news',
        title: `Analysis: ${news.title}`,
        description: `Recent news story with high engagement potential. Source: ${news.source}`,
        priority: mentionsTopPlayer ? 'high' : 'medium',
        affiliateOpportunity: false,
        data: news,
      });
    }
  });

  return opportunities;
}

/**
 * Get all content opportunities ranked by priority
 */
export async function getAllContentOpportunities(): Promise<ContentOpportunity[]> {
  const [
    contentGaps,
    upcomingTournaments,
    currentTournaments,
    newsOpportunities,
  ] = await Promise.all([
    findContentGaps(),
    findUpcomingTournamentOpportunities(),
    findCurrentTournamentOpportunities(),
    findNewsOpportunities(),
  ]);

  // Combine and sort by priority
  const all = [
    ...contentGaps,
    ...upcomingTournaments,
    ...currentTournaments,
    ...newsOpportunities,
  ];

  // Sort: high priority first, then by type
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  all.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.type.localeCompare(b.type);
  });

  return all;
}

/**
 * Analyze affiliate opportunities
 */
export async function analyzeAffiliateOpportunities(): Promise<ContentOpportunity[]> {
  const opportunities: ContentOpportunity[] = [];

  // Check upcoming tournaments for travel guide opportunities
  const upcoming = await getUpcomingTournamentsFromDB();
  upcoming.slice(0, 3).forEach((tournament) => {
    opportunities.push({
      type: 'travel',
      title: `Where to Stay for ${tournament.name}`,
      description: `Travel guide with hotel affiliate links. Tournament: ${tournament.location.city}, ${tournament.location.country}`,
      priority: 'high',
      affiliateOpportunity: true,
      data: tournament,
    });
  });

  // Suggest gear reviews (high affiliate potential)
  opportunities.push({
    type: 'gear',
    title: 'Tennis Gear Review',
    description: 'Gear reviews have high affiliate conversion rates. Consider reviewing: rackets, bags, shoes, or accessories.',
    priority: 'high',
    affiliateOpportunity: true,
  });

  return opportunities;
}
