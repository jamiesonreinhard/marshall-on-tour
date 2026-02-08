/**
 * Content Opportunity Scoring System
 * 
 * Ranks content opportunities to determine what Marshall should post about
 */

import { getContentHistory, getRecentPostCategories, hasPostedAboutTopic, hasPostedInCategory } from './variety-tracker';
import { getMarshallState } from '@/lib/marshall/state';

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
 * Map opportunity to the category that would actually be saved in the DB.
 * Tournament previews and "Marshall's Guide to X" save as Travel; recaps as Analysis.
 */
export function getOutputCategory(opportunity: { type: string; topic?: string }): string {
  if (opportunity.type === 'gear') return 'gear';
  if (opportunity.type === 'blast-from-past') return 'lifestyle';
  if (opportunity.type === 'lifestyle') return 'travel';
  if (opportunity.type === 'tournament') {
    const t = (opportunity.topic || '').toLowerCase();
    if (t.includes('preview')) return 'travel';
    if (t.includes('guide')) return 'travel';
    if (t.includes('recap')) return 'analysis';
    if (t.includes('day update')) return 'analysis';
    return 'analysis';
  }
  return 'analysis'; // player, match, news
}

/**
 * Score a content opportunity
 */
export async function scoreOpportunity(
  opportunity: Omit<ContentOpportunity, 'totalScore' | 'contentVariety'>
): Promise<ContentOpportunity> {
  // Output category (what would be saved in DB) — use for all variety checks
  const outputCategory = getOutputCategory(opportunity);

  // Check content variety (penalize if we've posted about this recently)
  let contentVariety = 15; // Start with max points

  // "Act like a real person": strong penalty if this would be the SAME type as the last post/draft
  const recentCategories = await getRecentPostCategories(2);
  if (recentCategories.length > 0 && outputCategory === recentCategories[0]) {
    contentVariety -= 15; // Same type as most recent — max penalty so we pick something different
    console.log(`[Scoring] Same-as-last-post penalty: last post was ${recentCategories[0]}, this would also be ${outputCategory} (-15 variety)`);
  } else if (recentCategories.length > 1 && outputCategory === recentCategories[1]) {
    contentVariety -= 7; // Same as 2nd-to-last — avoid three in a row
    console.log(`[Scoring] Same-as-second-last penalty: would be ${outputCategory} again (-7 variety)`);
  }
  
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
  
  // Penalize if we've posted in this category recently (use output category for consistency)
  if (outputCategory === 'travel') {
    if (await hasPostedInCategory(outputCategory, 4)) {
      contentVariety -= 8; // Travel is most repetitive
      console.log(`[Scoring] Travel category penalty: Posted travel content recently (-8 points)`);
    } else if (await hasPostedInCategory(outputCategory, 7)) {
      contentVariety -= 5;
    }
  } else {
    if (await hasPostedInCategory(outputCategory, 4)) {
      contentVariety -= 5;
    }
  }
  
  contentVariety = Math.max(0, contentVariety); // Don't go negative  

  // Calendar-led bonus: prefer approved calendar entries when relevant
  let calendarBonus = opportunity.metadata?.from_calendar === true ? 8 : 0;
  const todayStr = new Date().toISOString().split('T')[0];
  if (opportunity.metadata?.from_calendar === true && opportunity.metadata?.scheduled_date === todayStr) {
    calendarBonus += 5; // Extra boost for "due today" so we stay timely
    console.log(`[Scoring] Calendar due-today bonus: +5 (scheduled_date is today)`);
  }
  if (calendarBonus > 0 && !opportunity.metadata?.scheduled_date) {
    console.log(`[Scoring] Calendar entry bonus: +${calendarBonus} (topic aligns with content calendar)`);
  }

  // Live-now bonus: real matches happening right now (real data = better content)
  const liveNowBonus = (opportunity.metadata?.liveEventsCount as number) > 0 ? 5 : 0;
  if (liveNowBonus > 0) {
    console.log(`[Scoring] Live-now bonus: +5 (real live events)`);
  }

  // Marshall on-site bonus: prefer the tournament where he actually is
  const marshallState = await getMarshallState();
  const isMarshallHere = opportunity.metadata?.isMarshallHere === true ||
    (opportunity.metadata?.tournament_id && marshallState?.current_tournament_id === opportunity.metadata.tournament_id);
  const marshallHereBonus = isMarshallHere ? 10 : 0;
  if (marshallHereBonus > 0) {
    console.log(`[Scoring] Marshall on-site bonus: +10 (writing from current tournament)`);
  }

  // Region preference: European tournaments over elsewhere on date conflict; American swing exception
  const EUROPEAN_COUNTRIES = new Set([
    'Albania', 'Andorra', 'Armenia', 'Austria', 'Belarus', 'Belgium', 'Bosnia and Herzegovina',
    'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia', 'Finland',
    'France', 'Georgia', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Ireland', 'Italy',
    'Kazakhstan', 'Kosovo', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta',
    'Moldova', 'Monaco', 'Montenegro', 'Netherlands', 'North Macedonia', 'Norway', 'Poland',
    'Portugal', 'Romania', 'Russia', 'San Marino', 'Serbia', 'Slovakia', 'Slovenia', 'Spain',
    'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'United Kingdom', 'UK', 'Vatican City',
  ]);
  const country = (opportunity.metadata?.location as { country?: string } | undefined)?.country;
  const isEuropean = country && EUROPEAN_COUNTRIES.has(country);
  const isUSA = country && (country === 'United States' || country === 'USA' || country === 'US');
  const now = new Date();
  const month = now.getMonth() + 1; // 1–12
  const americanSwing = month === 3 || month === 8 || month === 9; // March (IW/Miami), Aug–Sep (US Open)
  let regionBonus = 0;
  if (isEuropean && !americanSwing) {
    regionBonus = 5;
    console.log(`[Scoring] European tournament bonus: +5 (prefer Europe on date conflict)`);
  } else if (isUSA && americanSwing) {
    regionBonus = 3;
    console.log(`[Scoring] American swing bonus: +3 (US tournament during US swing)`);
  }

  // Timely-news bonus: hot news (just happened / today) should compete with evergreen affiliate content
  const timelyNewsBonus =
    opportunity.type === 'news' && opportunity.timeliness >= 20 ? 12 : 0;
  if (timelyNewsBonus > 0) {
    console.log(`[Scoring] Timely-news bonus: +12 (story is very fresh)`);
  }

  const totalScore =
    opportunity.timeliness +
    opportunity.affiliatePotential +
    opportunity.seoValue +
    contentVariety +
    opportunity.socialEngagement +
    calendarBonus +
    liveNowBonus +
    marshallHereBonus +
    regionBonus +
    timelyNewsBonus;
  
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
 * Rank opportunities by score. When scores are within 2 points, prefer variety (different type from last post).
 */
export async function rankOpportunities(
  opportunities: Omit<ContentOpportunity, 'totalScore' | 'contentVariety'>[]
): Promise<ContentOpportunity[]> {
  const scored = await Promise.all(
    opportunities.map(opp => scoreOpportunity(opp))
  );
  const recentCategories = await getRecentPostCategories(2);
  const lastCategory = recentCategories[0];

  return scored.sort((a, b) => {
    const scoreDiff = b.totalScore - a.totalScore;
    if (Math.abs(scoreDiff) > 2) return scoreDiff;
    // Tie-breaker: prefer opportunity type different from last post (variety)
    const categoryA = getOutputCategory(a);
    const categoryB = getOutputCategory(b);
    const aDifferent = lastCategory ? categoryA !== lastCategory : true;
    const bDifferent = lastCategory ? categoryB !== lastCategory : true;
    if (aDifferent && !bDifferent) return -1;
    if (!aDifferent && bDifferent) return 1;
    return scoreDiff;
  });
}
