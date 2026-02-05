/**
 * Content Intelligence Job
 * 
 * Evaluates current opportunities and decides what Marshall should post about
 * Runs 2-3x/day to find the best content opportunities
 */

import { createAdminSupabase } from '@/lib/supabase/server';
import { getPostingStatus } from './posting-rules';
import { rankOpportunities, scoreTimeliness, scoreAffiliatePotential, scoreSEOValue, scoreSocialEngagement, ContentOpportunity } from './scoring';
import { getMarshallState, updateLocationForTournament, updateNextLocation } from '@/lib/marshall/state';
import { hasPostedAboutTournament, hasPostedAboutTopic, hasPostedInCategory } from './variety-tracker';

export interface ContentOpportunityInput {
  type: ContentOpportunity['type'];
  topic: string;
  description: string;
  eventDate?: Date | null;
  isLive?: boolean;
  hoursUntilEvent?: number | null;
  hasAffiliateLinks?: boolean;
  searchVolume?: 'high' | 'medium' | 'low';
  isEvergreen?: boolean;
  hasViralPotential?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Find content opportunities from various sources
 */
export async function findContentOpportunities(): Promise<ContentOpportunityInput[]> {
  const opportunities: ContentOpportunityInput[] = [];
  const supabase = createAdminSupabase();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  // 1. Check active tournaments (currently happening)
  // CRITICAL: A tournament is "active" only if end_date is AFTER today
  // If end_date = today, it's ended (not active) - should go to recap logic
  const { data: activeTournaments } = await supabase
    .from('atp_calendar')
    .select('*')
    .lte('start_date', today) // Tournament has started
    .gt('end_date', today); // Tournament hasn't ended yet (end_date must be AFTER today, not equal)
  
  if (activeTournaments && activeTournaments.length > 0) {
    console.log(`[Content Intelligence] Found ${activeTournaments.length} active tournaments (today: ${today})`);
    activeTournaments.forEach(t => {
      console.log(`  - ${t.name}: start=${t.start_date}, end=${t.end_date}`);
    });
    // Auto-update Marshall's location for active tournaments
    for (const tournament of activeTournaments) {
      // Check if we need to update location (tournament just started today)
      if (tournament.start_date === today) {
        try {
          await updateLocationForTournament(tournament.id, tournament.name);
          console.log(`[Content Intelligence] Updated Marshall's location to ${tournament.location}`);
        } catch (error) {
          console.error(`[Content Intelligence] Failed to update location for ${tournament.name}:`, error);
        }
      }
    }
    
    // Use for...of loop to handle async operations properly
    for (const tournament of activeTournaments) {
      const location = tournament.location as { city?: string; country?: string };
      
      // CRITICAL: Check if we've already posted about this tournament recently
      // Block both tournament updates AND lifestyle guides if we've posted about this tournament
      const alreadyPostedAboutTournament = await hasPostedAboutTournament(tournament.name, 7);
      
      if (alreadyPostedAboutTournament) {
        console.log(`[Content Intelligence] ⚠️ Skipping ${tournament.name} opportunities - already posted about this tournament in last 7 days`);
        continue; // Skip this tournament entirely
      }
      
      // Tournament update opportunity (only if we haven't posted about this tournament)
      opportunities.push({
        type: 'tournament',
        topic: `${tournament.name} Day Update`,
        description: `Daily update from ${tournament.name}`,
        eventDate: new Date(tournament.start_date),
        isLive: true,
        searchVolume: tournament.category === 'Grand Slam' ? 'high' : 'medium',
        hasViralPotential: tournament.category === 'Grand Slam',
        metadata: { tournament_id: tournament.id, tournament_name: tournament.name },
      });
      
      // Lifestyle opportunity (only if we haven't posted travel content recently)
      // Check if we've posted travel content in last 4 days
      const recentTravelPosts = await hasPostedInCategory('travel', 4);
      if (!recentTravelPosts) {
        opportunities.push({
          type: 'lifestyle',
          topic: `Marshall's Guide to ${location.city}`,
          description: `Lifestyle content about ${location.city} during ${tournament.name}`,
          eventDate: new Date(tournament.start_date),
          hasAffiliateLinks: true,
          searchVolume: 'medium',
          metadata: { tournament_id: tournament.id, tournament_name: tournament.name, location },
        });
      } else {
        console.log(`[Content Intelligence] ⚠️ Skipping ${tournament.name} lifestyle guide - posted travel content recently`);
      }
    }
  }
  
  // 2. Check upcoming tournaments (for previews)
  // CRITICAL: Only create previews if tournament start date is AFTER today
  // Use strict date comparison to ensure tournament hasn't started
  const { data: upcomingTournaments } = await supabase
    .from('atp_calendar')
    .select('*')
    .gt('start_date', today) // Tournament start date is AFTER today (hasn't started)
    .order('start_date', { ascending: true })
    .limit(3);
  
  if (upcomingTournaments && upcomingTournaments.length > 0) {
    console.log(`[Content Intelligence] Found ${upcomingTournaments.length} upcoming tournaments for previews (today: ${today})`);
    
    for (const tournament of upcomingTournaments) {
      const startDateOnly = tournament.start_date; // Just the date part (YYYY-MM-DD)
      
      // CRITICAL: Triple-check that tournament hasn't started
      // Compare date strings directly (YYYY-MM-DD format)
      // This is a safety check - Supabase query should already filter these out, but sometimes it doesn't
      if (!startDateOnly) {
        console.log(`[Content Intelligence] 🚫 BLOCKED: Skipping ${tournament.name} preview - invalid start_date (null/undefined)`);
        continue;
      }
      
      // Strict date string comparison (YYYY-MM-DD format)
      if (startDateOnly <= today) {
        console.log(`[Content Intelligence] 🚫 BLOCKED: Skipping ${tournament.name} preview - tournament already started (start_date: ${startDateOnly}, today: ${today}, comparison: ${startDateOnly} <= ${today})`);
        continue;
      }
      
      console.log(`[Content Intelligence] ✓ ${tournament.name} passed date check (start_date: ${startDateOnly}, today: ${today})`);
      
      // Parse dates for hour calculation (use UTC to avoid timezone issues)
      const startDate = new Date(startDateOnly + 'T00:00:00Z'); // Use UTC
      const nowUTC = new Date(now.toISOString().split('T')[0] + 'T00:00:00Z'); // Use UTC for comparison
      const hoursUntil = (startDate.getTime() - nowUTC.getTime()) / (1000 * 60 * 60);
      
      // Additional safety: if hoursUntil is negative or zero, tournament has started
      if (hoursUntil <= 0) {
        console.log(`[Content Intelligence] 🚫 BLOCKED: Skipping ${tournament.name} preview - tournament has already started (start_date: ${startDateOnly}, today: ${today}, hoursUntil: ${Math.round(hoursUntil)})`);
        continue;
      }
      
      // Check if we've already posted a preview for this tournament
      // Use longer window (7 days) to prevent multiple previews
      const alreadyPostedPreview = await hasPostedAboutTournament(tournament.name, 7); // Check last 7 days for previews
      if (alreadyPostedPreview) {
        console.log(`[Content Intelligence] ⚠️ Skipping ${tournament.name} preview - already posted about this tournament recently (last 7 days)`);
        continue;
      }
      
      // Also check if we've posted ANY content about this tournament (not just previews)
      const alreadyPostedAboutTournament = await hasPostedAboutTournament(tournament.name, 7);
      if (alreadyPostedAboutTournament) {
        console.log(`[Content Intelligence] ⚠️ Skipping ${tournament.name} preview - already posted about this tournament in any form recently`);
        continue;
      }
      
      console.log(`[Content Intelligence] ✓ ${tournament.name} is upcoming (starts ${startDateOnly}, ${Math.round(hoursUntil)} hours away)`);
      
      // Create preview opportunity if tournament is between 24 hours and 5 days away
      // Don't create previews more than 5 days before (too early) or less than 24 hours before (too late)
      const hoursIn5Days = 5 * 24; // 120 hours
      
      // Final validation: Only create preview if hoursUntil is positive and within range
      if (hoursUntil > 0 && hoursUntil > 24 && hoursUntil <= hoursIn5Days) {
        opportunities.push({
          type: 'tournament',
          topic: `${tournament.name} Preview`,
          description: `Preview of upcoming ${tournament.name}`,
          hoursUntilEvent: hoursUntil,
          searchVolume: tournament.category === 'Grand Slam' ? 'high' : 'medium',
          metadata: { tournament_id: tournament.id },
        });
        console.log(`[Content Intelligence] ✓ Created preview opportunity for ${tournament.name} (starts ${startDateOnly}, ${Math.round(hoursUntil)} hours until start)`);
      } else if (hoursUntil <= 0) {
        console.log(`[Content Intelligence] 🚫 BLOCKED: Skipping ${tournament.name} preview - tournament has already started (hoursUntil: ${Math.round(hoursUntil)})`);
      } else if (hoursUntil <= 24) {
        console.log(`[Content Intelligence] Skipping ${tournament.name} preview - too close to start (${Math.round(hoursUntil)} hours, need at least 24 hours)`);
      } else {
        console.log(`[Content Intelligence] Skipping ${tournament.name} preview - too far in advance (${Math.round(hoursUntil)} hours, max is ${hoursIn5Days} hours / 5 days)`);
      }
    }
  } else {
    console.log(`[Content Intelligence] No upcoming tournaments found for previews (today: ${today})`);
  }
  
  // 2b. Check recently ended tournaments (for recap posts)
  // CRITICAL: Include tournaments that ended TODAY (end_date = today) or within last 48 hours
  // This catches tournaments that just ended and should get recap posts, not previews
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: recentTournaments } = await supabase
    .from('atp_calendar')
    .select('*')
    .lte('end_date', today) // Tournament has ended (end_date is today or before)
    .gte('end_date', twoDaysAgo) // Ended today or within last 48 hours
    .order('end_date', { ascending: false })
    .limit(2);
  
  if (recentTournaments && recentTournaments.length > 0) {
    console.log(`[Content Intelligence] Found ${recentTournaments.length} recently ended tournaments for recaps (today: ${today})`);
    
    // Auto-update Marshall's next location when tournaments end
    for (const tournament of recentTournaments) {
      const endDateStr = tournament.end_date; // Just the date string (YYYY-MM-DD)
      const endDate = new Date(endDateStr + 'T23:59:59'); // End of that day
      
      // Calculate hours since tournament ended
      // If tournament ended today, hoursSinceEnd will be negative (we're earlier in the day)
      // If tournament ended yesterday, it will be positive
      const hoursSinceEnd = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60);
      
      // For tournaments ending today, treat as "just ended" (0 hours ago)
      const effectiveHoursSinceEnd = endDateStr === today ? 0 : hoursSinceEnd;
      
      console.log(`[Content Intelligence] ${tournament.name} ended (end_date: ${endDateStr}, today: ${today}, hoursSinceEnd: ${Math.round(hoursSinceEnd)}, effective: ${Math.round(effectiveHoursSinceEnd)})`);
      
      // Update next location if tournament ended today or yesterday
      if (endDateStr === today || (hoursSinceEnd >= 0 && hoursSinceEnd <= 24)) {
        try {
          await updateNextLocation(tournament.id);
          console.log(`[Content Intelligence] Updated Marshall's next location after ${tournament.name} ended`);
        } catch (error) {
          console.error(`[Content Intelligence] Failed to update next location after ${tournament.name}:`, error);
        }
      }
      
      // Create recap if tournament ended today OR within last 48 hours
      // BUT: Check if we've already posted about this tournament recently
      const alreadyPostedRecap = await hasPostedAboutTournament(tournament.name, 3); // Check last 3 days
      const alreadyPostedTopic = await hasPostedAboutTopic(tournament.name, 3);
      
      if (alreadyPostedRecap || alreadyPostedTopic) {
        console.log(`[Content Intelligence] ⚠️ Skipping ${tournament.name} recap - already posted about this tournament recently`);
      } else if (endDateStr === today || (effectiveHoursSinceEnd >= 0 && effectiveHoursSinceEnd <= 48)) {
        // Create a recap topic - but note we don't have match data
        // The post generator will add a warning to Gemini to NOT make up results
        opportunities.push({
          type: 'tournament',
          topic: `${tournament.name} 2026: Tournament Recap and Key Takeaways`,
          description: `Recap and analysis of ${tournament.name} - general observations, atmosphere, and what it means for the rest of the season. NOTE: No match data available - focus on experience and general insights.`,
          eventDate: endDate,
          searchVolume: tournament.category === 'Grand Slam' ? 'high' : 'medium',
          hasViralPotential: tournament.category === 'Grand Slam',
          metadata: { 
            tournament_id: tournament.id, 
            isRecap: true,
            hasMatchData: false, // Flag that we don't have match data
          },
        });
        console.log(`[Content Intelligence] ✓ Created recap opportunity for ${tournament.name} (ended ${endDateStr === today ? 'today' : Math.round(effectiveHoursSinceEnd) + ' hours ago'}) - NOTE: No match data available, will generate generic recap`);
      } else {
        console.log(`[Content Intelligence] Skipping ${tournament.name} recap - ended too long ago (${Math.round(effectiveHoursSinceEnd)} hours)`);
      }
    }
  } else {
    console.log(`[Content Intelligence] No recently ended tournaments found for recaps (today: ${today}, twoDaysAgo: ${twoDaysAgo})`);
  }
  
  // 3. Check content calendar (planned content takes priority)
  const { data: calendarEntries } = await supabase
    .from('content_calendar')
    .select('*, atp_calendar(*)')
    .eq('scheduled_date', today)
    .eq('status', 'approved')
    .is('generated_post_id', null);
  
  if (calendarEntries && calendarEntries.length > 0) {
    calendarEntries.forEach(entry => {
      opportunities.push({
        type: entry.category?.toLowerCase() as ContentOpportunity['type'] || 'tournament',
        topic: entry.content_brief,
        description: entry.content_brief,
        eventDate: new Date(entry.scheduled_date),
        hasAffiliateLinks: !!entry.atp_tournament_id,
        searchVolume: 'medium',
        metadata: {
          calendar_entry_id: entry.id,
          tournament_id: entry.atp_tournament_id,
        },
      });
    });
  }
  
  // 4. Check Marshall's state for gear/lifestyle opportunities
  // NOTE: Marshall's state is optional - if not set, these opportunities won't be created
  // State can be managed manually via admin page or auto-updated when tournaments start/end
  const marshallState = await getMarshallState();
  if (marshallState) {
    // Gear opportunity: INFREQUENT comparison guides, not single product reviews
    // Check if we've posted ANY gear content recently (45 days = very infrequent)
    const recentGearPosts = await hasPostedInCategory('gear', 45);
    
    if (!recentGearPosts) {
      // Determine gear guide type based on what Marshall has
      // Priority: Rackets (rarest) > Clothing > Accessories
      let gearGuideType: 'racket' | 'clothing' | 'accessory' | null = null;
      let gearGuideTopic = '';
      let gearGuideDescription = '';
      
      // Racket guides: Very infrequent (only if we haven't done one in 60+ days)
      const recentRacketGuide = await hasPostedAboutTopic('racket', 60);
      if (!recentRacketGuide && marshallState.current_racket) {
        gearGuideType = 'racket';
        gearGuideTopic = `Best Tennis Rackets for 2026: A Complete Guide`;
        gearGuideDescription = `Comprehensive guide comparing top rackets including ${marshallState.current_racket} and other top models. What to look for, who each racket suits, and honest recommendations.`;
      }
      // Clothing guides: Less frequent (30+ days)
      else if (!await hasPostedAboutTopic('clothing', 30) && !await hasPostedAboutTopic('apparel', 30)) {
        gearGuideType = 'clothing';
        gearGuideTopic = `Best Tennis Apparel for 2026: Shorts, Shirts, and More`;
        gearGuideDescription = `Complete guide to tennis clothing - what works, what doesn't, and what's worth the money.`;
      }
      // Accessory guides: Less frequent (30+ days)
      else if (!await hasPostedAboutTopic('accessory', 30) && !await hasPostedAboutTopic('bag', 30)) {
        gearGuideType = 'accessory';
        gearGuideTopic = `Essential Tennis Accessories: Bags, Grips, and More`;
        gearGuideDescription = `Complete guide to tennis accessories - what you actually need and what's just marketing.`;
      }
      
      if (gearGuideType) {
        opportunities.push({
          type: 'gear',
          topic: gearGuideTopic,
          description: gearGuideDescription,
          hasAffiliateLinks: true, // Gear guides will have multiple affiliate links
          searchVolume: 'medium',
          isEvergreen: true,
          metadata: {
            guide_type: gearGuideType,
            current_racket: marshallState.current_racket,
            affiliate_link: marshallState.current_racket_affiliate_link,
          },
        });
        console.log(`[Content Intelligence] ✓ Created ${gearGuideType} guide opportunity (infrequent - last gear post was 45+ days ago)`);
      } else {
        console.log(`[Content Intelligence] ⚠️ Skipping gear guide - already posted recently (within 30-60 day window)`);
      }
    } else {
      console.log(`[Content Intelligence] ⚠️ Skipping gear content - posted gear within last 45 days (infrequent strategy)`);
    }
    
    // Up-and-coming player opportunity
    if (marshallState.up_and_coming_player_watching) {
      opportunities.push({
        type: 'player',
        topic: `Rising Star: ${marshallState.up_and_coming_player_watching}`,
        description: `Deep dive on ${marshallState.up_and_coming_player_watching}`,
        searchVolume: 'low', // Unique content, lower search volume
        hasViralPotential: true, // Could go viral if player breaks through
        metadata: {
          player_name: marshallState.up_and_coming_player_watching,
        },
      });
    }
  }
  
  // 5. Add diverse opportunity sources to ensure variety
  
  // 5a. Blast-from-past (nostalgia posts) - 1-2 per month
  // Check if we've posted blast-from-past in last 14 days
  const recentBlastFromPast = await hasPostedInCategory('lifestyle', 14); // Blast-from-past maps to lifestyle
  const hasPostedBlastFromPast = await hasPostedAboutTopic('blast from past', 14) || 
                                  await hasPostedAboutTopic('nostalgia', 14);
  
  if (!hasPostedBlastFromPast) {
    // Create blast-from-past opportunity (low frequency, high engagement)
    opportunities.push({
      type: 'blast-from-past',
      topic: `Blast from the Past: [Classic Tennis Moment]`,
      description: `Nostalgia post about a classic tennis moment, player, or tournament from the past`,
      searchVolume: 'low',
      hasViralPotential: true, // Nostalgia can go viral
      isEvergreen: true,
      metadata: { isBlastFromPast: true },
    });
    console.log(`[Content Intelligence] ✓ Created blast-from-past opportunity (infrequent - last one was 14+ days ago)`);
  }
  
  // 5b. General player profiles (top players) - if we haven't posted player content recently
  const recentPlayerPosts = await hasPostedInCategory('analysis', 7); // Player posts map to analysis
  if (!recentPlayerPosts) {
    // Create player profile opportunity (not just up-and-coming)
    const topPlayers = ['Carlos Alcaraz', 'Jannik Sinner', 'Novak Djokovic', 'Daniil Medvedev'];
    const randomPlayer = topPlayers[Math.floor(Math.random() * topPlayers.length)];
    
    // Check if we've posted about this specific player recently
    const hasPostedAboutPlayer = await hasPostedAboutTopic(randomPlayer.toLowerCase(), 14);
    if (!hasPostedAboutPlayer) {
      opportunities.push({
        type: 'player',
        topic: `Rising Star: ${randomPlayer}`,
        description: `Deep dive on ${randomPlayer} - their game, recent form, and what makes them special`,
        searchVolume: 'medium',
        hasViralPotential: true,
        metadata: { player_name: randomPlayer },
      });
      console.log(`[Content Intelligence] ✓ Created player profile opportunity for ${randomPlayer}`);
    }
  }
  
  // 5c. News opportunities (from RSS feeds) - if we have news data
  // TODO: Implement when RSS feed is working properly
  
  // TODO: Add more opportunity sources:
  // - Match results (when we have match data)
  // - Weather-based travel tips
  // - Gear opportunities (already handled via Marshall's state)
  
  return opportunities;
}

/**
 * Evaluate opportunities and return the best one
 */
export async function evaluateOpportunities(): Promise<{
  bestOpportunity: ContentOpportunity | null;
  allOpportunities: ContentOpportunity[];
  postingStatus: Awaited<ReturnType<typeof getPostingStatus>>;
}> {
  // Check if we can post
  const postingStatus = await getPostingStatus();
  
  if (!postingStatus.canPostBlog && !postingStatus.canPostSocial) {
    return {
      bestOpportunity: null,
      allOpportunities: [],
      postingStatus,
    };
  }
  
  // Find all opportunities
  const opportunityInputs = await findContentOpportunities();
  
  if (opportunityInputs.length === 0) {
    return {
      bestOpportunity: null,
      allOpportunities: [],
      postingStatus,
    };
  }
  
  // CRITICAL: Filter out invalid preview opportunities
  // Double-check that any "Preview" opportunities are for tournaments that haven't started
  const todayStr = new Date().toISOString().split('T')[0];
  const validOpportunities = await Promise.all(
    opportunityInputs.map(async (input) => {
      // If this is a preview opportunity, verify the tournament hasn't started
      if (input.topic.toLowerCase().includes('preview') && input.metadata?.tournament_id) {
        const supabase = createAdminSupabase();
        const { data: tournament } = await supabase
          .from('atp_calendar')
          .select('start_date, end_date, name')
          .eq('id', input.metadata.tournament_id)
          .single();
        
        if (tournament) {
          // CRITICAL: Block preview if tournament has started (start_date <= today)
          // Use strict string comparison for date strings (YYYY-MM-DD format)
          if (!tournament.start_date || tournament.start_date <= todayStr) {
            console.log(`[Content Intelligence] 🚫 BLOCKED preview opportunity: "${input.topic}" for ${tournament.name} - tournament already started (start_date: ${tournament.start_date}, today: ${todayStr})`);
            return null;
          }
          // Block preview if tournament has ended (end_date <= today)
          if (tournament.end_date && tournament.end_date <= todayStr) {
            console.log(`[Content Intelligence] 🚫 BLOCKED preview opportunity: "${input.topic}" for ${tournament.name} - tournament already ended (end_date: ${tournament.end_date}, today: ${todayStr})`);
            return null;
          }
          console.log(`[Content Intelligence] ✓ Preview opportunity validated: "${input.topic}" for ${tournament.name} (starts ${tournament.start_date}, today: ${todayStr})`);
        } else {
          console.log(`[Content Intelligence] ⚠️ WARNING: Preview opportunity "${input.topic}" references tournament ID ${input.metadata.tournament_id} but tournament not found in database`);
        }
      }
      return input;
    })
  );
  
  // Filter out null values (blocked opportunities)
  const filteredOpportunities = validOpportunities.filter((opp): opp is ContentOpportunityInput => opp !== null);
  
  if (filteredOpportunities.length === 0) {
    console.log(`[Content Intelligence] All opportunities were filtered out`);
    return {
      bestOpportunity: null,
      allOpportunities: [],
      postingStatus,
    };
  }
  
  // Score and rank opportunities
  const scoredOpportunities = await Promise.all(
    filteredOpportunities.map(async (input) => {
      const timeliness = scoreTimeliness(
        input.eventDate || null,
        input.isLive,
        input.hoursUntilEvent || null
      );
      
      const affiliatePotential = scoreAffiliatePotential(
        input.type,
        input.hasAffiliateLinks
      );
      
      const seoValue = scoreSEOValue(
        input.topic,
        input.searchVolume || 'medium',
        input.isEvergreen
      );
      
      const socialEngagement = scoreSocialEngagement(
        input.type,
        input.hasViralPotential
      );
      
      return {
        id: `${input.type}-${Date.now()}-${Math.random()}`,
        type: input.type,
        topic: input.topic,
        description: input.description,
        timeliness,
        affiliatePotential,
        seoValue,
        socialEngagement,
        metadata: input.metadata,
      };
    })
  );
  
  const ranked = await rankOpportunities(scoredOpportunities);
  
  // Get best opportunity (highest score)
  const bestOpportunity = ranked.length > 0 ? ranked[0] : null;
  
  // Only return best opportunity if score is above threshold
  const threshold = 50; // Minimum score to generate post
  if (bestOpportunity && bestOpportunity.totalScore < threshold) {
    return {
      bestOpportunity: null,
      allOpportunities: ranked,
      postingStatus,
    };
  }
  
  return {
    bestOpportunity,
    allOpportunities: ranked,
    postingStatus,
  };
}

/**
 * Main content intelligence job
 * 
 * This is what gets called by the scheduled job
 */
export async function runContentIntelligenceJob(): Promise<{
  success: boolean;
  action: 'generated' | 'skipped' | 'no_opportunity';
  opportunity?: ContentOpportunity;
  reason?: string;
}> {
  try {
    const { bestOpportunity, postingStatus } = await evaluateOpportunities();
    
    if (!bestOpportunity) {
      return {
        success: true,
        action: 'no_opportunity',
        reason: postingStatus.reason || 'No high-scoring opportunities found',
      };
    }
    
    if (!postingStatus.canPostBlog) {
      return {
        success: true,
        action: 'skipped',
        opportunity: bestOpportunity,
        reason: postingStatus.reason || 'Cannot post blog today',
      };
    }
    
    // Generate post from opportunity
    // Import and call post generation function directly
    try {
      const { generatePostFromOpportunity } = await import('./post-generator');
      const result = await generatePostFromOpportunity(bestOpportunity, {
        publish: false, // Always save as draft for review
      });
      
      if (result.success) {
        return {
          success: true,
          action: 'generated',
          opportunity: bestOpportunity,
        };
      } else {
        throw new Error(result.error || 'Failed to generate post');
      }
    } catch (error: any) {
      console.error('Error generating post:', error);
      return {
        success: false,
        action: 'skipped',
        opportunity: bestOpportunity,
        reason: `Failed to generate post: ${error.message}`,
      };
    }
  } catch (error: any) {
    console.error('Content intelligence job error:', error);
    return {
      success: false,
      action: 'skipped',
      reason: error.message,
    };
  }
}
