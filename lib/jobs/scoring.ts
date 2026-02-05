/**
 * Content Opportunity Scoring System
 * 
 * Ranks content opportunities to determine what Marshall should post about
 */

import { getContentHistory, hasPostedAboutTopic, hasPostedInCategory } from './variety-tracker';

export interface ContentOpportunity {
  id: string;
  type: 'tournament' | 'match' | 'player' | 'gear' | 'lifestyle' | 'news' | 'blast-from-past';
  topic: string;
  description: string;
  timeliness: number; // 0-30 points
  affiliatePotential: number; // 0-25 points
  seoValue: number; // 0-20 points
  contentVariety: number; // 0-15 points
  socialEngagement: number; // 0-10 points
  totalScore: number;
  metadata?: Record<string, any>;
}

/**
 * Score a content opportunity
 */
export async function scoreOpportunity(
  opportunity: Omit<ContentOpportunity, 'totalScore' | 'contentVariety'>
): Promise<ContentOpportunity> {
  // Check content variety (penalize if we've posted about this recently)
  let contentVariety = 15; // Start with max points
  
  // Check if we've posted about the exact topic recently
  if (await hasPostedAboutTopic(opportunity.topic, 3)) {
    contentVariety -= 15; // Heavy penalty for recent topic (increased from 10)
  } else if (await hasPostedAboutTopic(opportunity.topic, 7)) {
    contentVariety -= 8; // Medium penalty for somewhat recent topic (increased from 5)
  }
  
  // Check if we've posted about the same tournament recently (for tournament/lifestyle posts)
  if (opportunity.metadata?.tournament_id) {
    const { hasPostedAboutTournament } = await import('./variety-tracker');
    // Extract tournament name from topic or metadata
    const tournamentName = opportunity.metadata.tournament_name || 
                          opportunity.topic.split(' ').slice(0, -2).join(' '); // Remove "Preview" or "Day Update"
    
    if (tournamentName && await hasPostedAboutTournament(tournamentName, 7)) {
      contentVariety -= 12; // Heavy penalty for same tournament (NEW)
      console.log(`[Scoring] Heavy variety penalty: Posted about ${tournamentName} recently (-12 points)`);
    }
  }
  
  // Penalize if we've posted in this category recently
  const categoryMap: Record<string, string> = {
    tournament: 'analysis',
    match: 'analysis',
    player: 'analysis',
    gear: 'gear',
    lifestyle: 'travel',
    news: 'analysis',
    'blast-from-past': 'lifestyle',
  };
  
  const category = categoryMap[opportunity.type] || 'analysis';
  
  // Stronger penalties for travel/lifestyle (most repetitive category)
  if (category === 'travel') {
    if (await hasPostedInCategory(category, 4)) {
      contentVariety -= 8; // Increased from 3 for travel
      console.log(`[Scoring] Travel category penalty: Posted travel content recently (-8 points)`);
    } else if (await hasPostedInCategory(category, 7)) {
      contentVariety -= 5; // Medium penalty for travel in last week
    }
  } else {
    if (await hasPostedInCategory(category, 4)) {
      contentVariety -= 5; // Increased from 3 for other categories
    }
  }
  
  contentVariety = Math.max(0, contentVariety); // Don't go negative
  
  const totalScore =
    opportunity.timeliness +
    opportunity.affiliatePotential +
    opportunity.seoValue +
    contentVariety +
    opportunity.socialEngagement;
  
  return {
    ...opportunity,
    contentVariety,
    totalScore,
  };
}

/**
 * Score timeliness (0-30 points)
 */
export function scoreTimeliness(
  eventDate: Date | null,
  isLive: boolean = false,
  hoursUntilEvent: number | null = null
): number {
  if (isLive) {
    return 30; // Live events are most timely
  }
  
  if (hoursUntilEvent !== null) {
    if (hoursUntilEvent <= 3) return 28; // Very soon
    if (hoursUntilEvent <= 12) return 25; // Today
    if (hoursUntilEvent <= 24) return 20; // Tomorrow
    if (hoursUntilEvent <= 48) return 15; // This week
    if (hoursUntilEvent <= 168) return 10; // This month
    return 5; // Future
  }
  
  if (eventDate) {
    const now = new Date();
    const hoursAgo = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursAgo <= 2) return 28; // Just happened
    if (hoursAgo <= 6) return 25; // Today
    if (hoursAgo <= 24) return 20; // Yesterday
    if (hoursAgo <= 48) return 15; // This week
    if (hoursAgo <= 168) return 10; // This month
    return 5; // Older
  }
  
  return 10; // Default moderate timeliness
}

/**
 * Score affiliate potential (0-25 points)
 */
export function scoreAffiliatePotential(
  type: ContentOpportunity['type'],
  hasAffiliateLinks: boolean = false
): number {
  const baseScores: Record<ContentOpportunity['type'], number> = {
    gear: 25, // Highest affiliate potential
    lifestyle: 20, // Travel, hotels
    tournament: 15, // Travel guides
    match: 5, // Low affiliate potential
    player: 5, // Low affiliate potential
    news: 5, // Low affiliate potential
    'blast-from-past': 3, // Very low affiliate potential
  };
  
  let score = baseScores[type] || 5;
  
  if (hasAffiliateLinks) {
    score += 5; // Bonus for confirmed affiliate links
  }
  
  return Math.min(25, score);
}

/**
 * Score SEO value (0-20 points)
 */
export function scoreSEOValue(
  topic: string,
  searchVolume: 'high' | 'medium' | 'low' = 'medium',
  isEvergreen: boolean = false
): number {
  let score = 10; // Base score
  
  if (searchVolume === 'high') score += 8;
  else if (searchVolume === 'medium') score += 5;
  else score += 2;
  
  if (isEvergreen) {
    score += 2; // Evergreen content has long-term SEO value
  }
  
  return Math.min(20, score);
}

/**
 * Score social engagement potential (0-10 points)
 */
export function scoreSocialEngagement(
  type: ContentOpportunity['type'],
  hasViralPotential: boolean = false
): number {
  const baseScores: Record<ContentOpportunity['type'], number> = {
    match: 10, // Match content is highly engaging
    player: 8, // Player content engages fans
    tournament: 7, // Tournament content is engaging
    news: 6, // News is timely and engaging
    gear: 5, // Gear is moderately engaging
    lifestyle: 4, // Lifestyle is less engaging
    'blast-from-past': 6, // Nostalgia is engaging
  };
  
  let score = baseScores[type] || 5;
  
  if (hasViralPotential) {
    score += 2; // Bonus for viral potential
  }
  
  return Math.min(10, score);
}

/**
 * Rank opportunities by score
 */
export async function rankOpportunities(
  opportunities: Omit<ContentOpportunity, 'totalScore' | 'contentVariety'>[]
): Promise<ContentOpportunity[]> {
  const scored = await Promise.all(
    opportunities.map(opp => scoreOpportunity(opp))
  );
  
  return scored.sort((a, b) => b.totalScore - a.totalScore);
}
