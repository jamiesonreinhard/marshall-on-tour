/**
 * Content Intelligence Job
 * 
 * Evaluates current opportunities and decides what Marshall should post about
 * Runs 2-3x/day to find the best content opportunities
 */

import { createAdminSupabase } from '@/lib/supabase/server';
import { getPostingStatus } from './posting-rules';
import { rankOpportunities, scoreTimeliness, scoreAffiliatePotential, scoreSEOValue, scoreSocialEngagement, ContentOpportunity } from './scoring';
import { getMarshallState, updateLocationForTournament, updateNextLocation, selectTournamentByRegionPreference } from '@/lib/marshall/state';
import { hasPostedAboutTournament, hasPostedAboutTopic, hasPostedInCategory } from './variety-tracker';
import {
  getRisingPlayers,
  getEventSchedules,
  getCalendarCategories,
  getLiveEvents,
} from '@/lib/data/integrations/freewebapi';
import { getRecentNews } from '@/lib/data/integrations/rss';

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
const TENNIS_API_CONFIG = { enabled: true, fallbackToMock: false };

export async function findContentOpportunities(): Promise<ContentOpportunityInput[]> {
  const opportunities: ContentOpportunityInput[] = [];
  const supabase = createAdminSupabase();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const [day, month, year] = today.split('-').map(Number).reverse(); // DD, MM, YYYY for API
  const marshallState = await getMarshallState();

  // 0. Fetch real data once (calendar, live events, today's matches) for timely, data-driven posts
  const [calendarRes, liveRes, schedulesRes] = await Promise.all([
    getCalendarCategories(day, month, year, TENNIS_API_CONFIG),
    getLiveEvents(TENNIS_API_CONFIG),
    getEventSchedules(today, TENNIS_API_CONFIG),
  ]);
  const calendarCategoriesToday = calendarRes.success ? (calendarRes.data?.categories ?? []) : [];
  const liveEvents = liveRes.success && Array.isArray(liveRes.data) ? liveRes.data : [];
  const todayMatches = schedulesRes.success && Array.isArray(schedulesRes.data) ? schedulesRes.data : [];
  const realData = {
    calendarCategoriesToday,
    liveEventsCount: liveEvents.length,
    todayMatches,
  };
  if (realData.liveEventsCount > 0 || todayMatches.length > 0) {
    console.log(`[Content Intelligence] Real data: ${realData.liveEventsCount} live events, ${todayMatches.length} matches today, ${calendarCategoriesToday.length} calendar categories`);
  }

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

    // Location update: only when he "arrives" — tournament started today AND (it's his next_tournament_id OR we're initializing)
    const startedToday = activeTournaments.filter((t) => t.start_date === today);
    for (const tournament of startedToday) {
      const isNext = marshallState?.next_tournament_id === tournament.id;
      const isInitializing = !marshallState?.current_tournament_id;
      if (isNext || isInitializing) {
        try {
          const updated = await updateLocationForTournament(tournament.id, tournament.name);
          if (updated) {
            console.log(`[Content Intelligence] Updated Marshall's location to ${(tournament.location as { city?: string })?.city} (${tournament.name})`);
            break; // Only one arrival per run
          }
        } catch (error) {
          console.error(`[Content Intelligence] Failed to update location for ${tournament.name}:`, error);
        }
      }
    }
    // If initializing and we didn't update (e.g. no "started today"), assign current with European preference
    if (!marshallState?.current_tournament_id && startedToday.length === 0 && activeTournaments.length > 0) {
      const pick = selectTournamentByRegionPreference(activeTournaments);
      if (pick) {
        try {
          const updated = await updateLocationForTournament(pick.id, pick.name);
          if (updated) {
            console.log(`[Content Intelligence] Initialized Marshall's location to ${(pick.location as { city?: string })?.city} (${pick.name}) [region preference applied]`);
          }
        } catch (error) {
          console.error(`[Content Intelligence] Failed to initialize location for ${pick.name}:`, error);
        }
      }
    }

    // Create lifestyle/day-update opportunities for all active tournaments; preference for Marshall's current location is applied in scoring
    const currentTournamentId = marshallState?.current_tournament_id;
    const currentCity = marshallState?.current_city;

    const tournamentsProcessed = new Set<string>();

    for (const tournament of activeTournaments) {
      const location = tournament.location as { city?: string; country?: string };
      const isMarshallHere = currentTournamentId === tournament.id || (currentCity && location.city?.toLowerCase() === currentCity.toLowerCase());
      if (isMarshallHere) {
        console.log(`[Content Intelligence] ${tournament.name}: Marshall is on-site (preference will be applied in scoring)`);
      } else {
        console.log(`[Content Intelligence] ${tournament.name}: creating opportunity (Marshall not on-site; lower preference in scoring)`);
      }

      const alreadyPostedAboutTournament = await hasPostedAboutTournament(tournament.name, 7);
      const alreadyPostedAboutCity = location.city ? await hasPostedAboutTopic(location.city, 7) : false;

      if (alreadyPostedAboutTournament || alreadyPostedAboutCity) {
        console.log(`[Content Intelligence] ⚠️ Skipping ${tournament.name} opportunities - already posted about this tournament in last 7 days`);
        continue;
      }

      if (tournamentsProcessed.has(tournament.id)) continue;
      tournamentsProcessed.add(tournament.id);

      const recentTravelPosts = await hasPostedInCategory('travel', 4);
      const tournamentNameLower = tournament.name.toLowerCase();
      const matchesForTournament = realData.todayMatches.filter(
        (m: { tournament_name?: string }) => (m.tournament_name ?? '').toLowerCase().includes(tournamentNameLower) || tournamentNameLower.includes((m.tournament_name ?? '').toLowerCase())
      );
      const hasLiveNow = realData.liveEventsCount > 0;
      const metadataWithReal = {
        tournament_id: tournament.id,
        tournament_name: tournament.name,
        location,
        isMarshallHere,
        todayMatchesCount: matchesForTournament.length,
        todayMatches: matchesForTournament.slice(0, 20),
        liveEventsCount: hasLiveNow ? realData.liveEventsCount : undefined,
      };

      if (!recentTravelPosts) {
        opportunities.push({
          type: 'lifestyle',
          topic: `Marshall's Guide to ${location.city}`,
          description: `Lifestyle content about ${location.city} during ${tournament.name}`,
          eventDate: new Date(tournament.start_date),
          hasAffiliateLinks: true,
          searchVolume: 'medium',
          metadata: metadataWithReal,
        });
        console.log(`[Content Intelligence] ✓ Created lifestyle guide opportunity for ${tournament.name} (${location.city})`);
      } else {
        opportunities.push({
          type: 'tournament',
          topic: `${tournament.name} Day Update`,
          description: `Daily update from ${tournament.name}`,
          eventDate: new Date(tournament.start_date),
          isLive: hasLiveNow,
          searchVolume: tournament.category === 'Grand Slam' ? 'high' : 'medium',
          hasViralPotential: tournament.category === 'Grand Slam',
          metadata: metadataWithReal,
        });
        console.log(`[Content Intelligence] ✓ Created tournament update opportunity for ${tournament.name}${hasLiveNow ? ' (live matches now)' : ''}`);
      }
    }

    // Live-now opportunity: when there are live events, add a match/live post (even if Marshall isn't on-site; preference for his tournament in scoring)
    if (realData.liveEventsCount > 0) {
      const currentTournament = marshallState?.current_tournament_id
        ? activeTournaments.find((t) => t.id === marshallState.current_tournament_id)
        : null;
      const alreadyPostedLive = currentTournament ? await hasPostedAboutTournament(currentTournament.name, 1) : false;
      if (!alreadyPostedLive) {
        if (currentTournament) {
          opportunities.push({
            type: 'match',
            topic: `Live at ${currentTournament.name}: What's Happening Now`,
            description: `Real-time update from ${currentTournament.name} with live matches`,
            eventDate: now,
            isLive: true,
            searchVolume: 'medium',
            hasViralPotential: currentTournament.category === 'Grand Slam',
            metadata: {
              tournament_id: currentTournament.id,
              tournament_name: currentTournament.name,
              location: currentTournament.location as { city?: string; country?: string },
              isMarshallHere: true,
              liveEventsCount: realData.liveEventsCount,
              todayMatches: realData.todayMatches.slice(0, 15),
            },
          });
          console.log(`[Content Intelligence] ✓ Created live-now opportunity at ${currentTournament.name} (${realData.liveEventsCount} live events)`);
        } else {
          // Marshall not at a current tournament; still create a generic live-now opportunity
          const fallbackTournament = activeTournaments[0];
          opportunities.push({
            type: 'match',
            topic: `Live Tennis Now: ${realData.liveEventsCount} matches in progress`,
            description: `What's happening in tennis right now – ${realData.liveEventsCount} live matches`,
            eventDate: now,
            isLive: true,
            searchVolume: 'medium',
            metadata: {
              tournament_id: fallbackTournament?.id,
              tournament_name: fallbackTournament?.name,
              location: fallbackTournament?.location as { city?: string; country?: string } | undefined,
              isMarshallHere: false,
              liveEventsCount: realData.liveEventsCount,
              todayMatches: realData.todayMatches.slice(0, 15),
            },
          });
          console.log(`[Content Intelligence] ✓ Created live-now opportunity (${realData.liveEventsCount} live events, Marshall not on-site)`);
        }
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
      
      // Create preview opportunity from now up until day of tournament start (inclusive)
      // Allow "tomorrow" and day-of previews; cap at 5 days out so we don't preview too early
      const hoursIn5Days = 5 * 24; // 120 hours
      
      if (hoursUntil > 0 && hoursUntil <= hoursIn5Days) {
        const location = tournament.location as { city?: string; country?: string } | undefined;
        opportunities.push({
          type: 'tournament',
          topic: `${tournament.name} Preview`,
          description: `Preview of upcoming ${tournament.name}`,
          hoursUntilEvent: hoursUntil,
          searchVolume: tournament.category === 'Grand Slam' ? 'high' : 'medium',
          metadata: {
            tournament_id: tournament.id,
            tournament_name: tournament.name,
            location: location ?? undefined,
          },
        });
        console.log(`[Content Intelligence] ✓ Created preview opportunity for ${tournament.name} (starts ${startDateOnly}, ${Math.round(hoursUntil)} hours until start)`);
      } else if (hoursUntil <= 0) {
        console.log(`[Content Intelligence] 🚫 BLOCKED: Skipping ${tournament.name} preview - tournament has already started (hoursUntil: ${Math.round(hoursUntil)})`);
      } else {
        console.log(`[Content Intelligence] Skipping ${tournament.name} preview - too far in advance (${Math.round(hoursUntil)} hours, max is ${hoursIn5Days} hours / 5 days)`);
      }
    }
  } else {
    console.log(`[Content Intelligence] No upcoming tournaments found for previews (today: ${today})`);
  }
  
  // 2b. Check recently ended tournaments (for recap posts)
  // CRITICAL: Only create recaps when end_date is BEFORE today. If end_date = today, the final may not have been played yet.
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: recentTournaments } = await supabase
    .from('atp_calendar')
    .select('*')
    .lt('end_date', today) // Tournament ended before today (final day has passed)
    .gte('end_date', twoDaysAgo) // Ended yesterday or the day before
    .order('end_date', { ascending: false })
    .limit(2);
  
  if (recentTournaments && recentTournaments.length > 0) {
    console.log(`[Content Intelligence] Found ${recentTournaments.length} recently ended tournaments for recaps (end_date < today: ${today})`);
    
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
      
      // Update next location only when this tournament is Marshall's current (he was here)
      const isMarshallCurrentTournament = marshallState?.current_tournament_id === tournament.id;
      if (isMarshallCurrentTournament && (endDateStr === today || (hoursSinceEnd >= 0 && hoursSinceEnd <= 24))) {
        try {
          const updated = await updateNextLocation(tournament.id);
          if (updated) {
            console.log(`[Content Intelligence] Updated Marshall's next location after ${tournament.name} ended`);
          }
        } catch (error) {
          console.error(`[Content Intelligence] Failed to update next location after ${tournament.name}:`, error);
        }
      }
      
      // Create recap only when tournament ended at least yesterday (we already filtered end_date < today)
      // Check if we've already posted about this tournament recently
      const alreadyPostedRecap = await hasPostedAboutTournament(tournament.name, 3);
      const alreadyPostedTopic = await hasPostedAboutTopic(tournament.name, 3);
      
      if (alreadyPostedRecap || alreadyPostedTopic) {
        console.log(`[Content Intelligence] ⚠️ Skipping ${tournament.name} recap - already posted about this tournament recently`);
      } else if (effectiveHoursSinceEnd >= 0 && effectiveHoursSinceEnd <= 48) {
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
            tournament_name: tournament.name,
            tournament_end_date: tournament.end_date,
            isRecap: true,
            hasMatchData: false,
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
  
  // 3. Content calendar: today + next 1–2 days (prioritized so calendar-driven posts are chosen when they exist)
  const nextTwoDays: string[] = [today];
  for (let d = 1; d <= 2; d++) {
    const d2 = new Date(now);
    d2.setDate(d2.getDate() + d);
    nextTwoDays.push(d2.toISOString().split('T')[0]);
  }
  const { data: calendarEntries } = await supabase
    .from('content_calendar')
    .select('*, atp_calendar(*)')
    .in('scheduled_date', nextTwoDays)
    .eq('status', 'approved')
    .is('generated_post_id', null)
    .order('scheduled_date', { ascending: true });
  
  if (calendarEntries && calendarEntries.length > 0) {
    console.log(`[Content Intelligence] Found ${calendarEntries.length} approved calendar entries (${nextTwoDays.join(', ')})`);
    for (const entry of calendarEntries) {
      const briefLower = (entry.content_brief || '').toLowerCase();
      const isRecapStyle = /\b(recap|wrap\s*up|wrap-up|final\s*takeaways|concluded|in the books)\b/.test(briefLower);
      if (isRecapStyle && entry.atp_tournament_id) {
        const { data: calTournament } = await supabase
          .from('atp_calendar')
          .select('end_date')
          .eq('id', entry.atp_tournament_id)
          .single();
        if (calTournament && calTournament.end_date && calTournament.end_date >= today) {
          console.log(`[Content Intelligence] Skipping calendar recap "${entry.content_brief?.slice(0, 40)}..." - tournament end_date ${calTournament.end_date} is not yet in the past (today: ${today})`);
          continue;
        }
      }
      opportunities.push({
        type: (entry.category?.toLowerCase() as ContentOpportunity['type']) || 'tournament',
        topic: entry.content_brief,
        description: entry.content_brief,
        eventDate: new Date(entry.scheduled_date),
        hasAffiliateLinks: !!entry.atp_tournament_id,
        searchVolume: 'medium',
        metadata: {
          calendar_entry_id: entry.id,
          tournament_id: entry.atp_tournament_id,
          from_calendar: true,
          scheduled_date: entry.scheduled_date,
          isRecap: isRecapStyle,
        },
      });
    }
  }
  
  // 4. Check Marshall's state for gear/lifestyle opportunities
  // NOTE: Marshall's state is optional - if not set, these opportunities won't be created
  // State can be managed manually via admin page or auto-updated when tournaments start/end
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
  
  // 5b. Player profiles - if we haven't posted player content recently
  const recentPlayerPosts = await hasPostedInCategory('analysis', 7); // Player posts map to analysis
  if (!recentPlayerPosts) {
    let playerName: string | null = null;
    let rankingStats: { previousRanking?: number; points?: number; bestRanking?: number } | undefined;
    const marshallStateForPlayer = await getMarshallState();
    if (marshallStateForPlayer?.up_and_coming_player_watching) {
      playerName = marshallStateForPlayer.up_and_coming_player_watching;
    }
    if (!playerName) {
      const risingResult = await getRisingPlayers(8);
      if (risingResult.success && risingResult.data?.length) {
        const notPostedAbout: typeof risingResult.data = [];
        for (const p of risingResult.data) {
          if (!(await hasPostedAboutTopic(p.name.toLowerCase(), 14))) notPostedAbout.push(p);
        }
        if (notPostedAbout.length > 0) {
          const pick = notPostedAbout[Math.floor(Math.random() * notPostedAbout.length)];
          playerName = pick.name;
          rankingStats = { previousRanking: pick.previousRanking, points: pick.points, bestRanking: pick.bestRanking };
          console.log(`[Content Intelligence] ✓ Picked rising player from API: ${playerName} (rank ${pick.rank}, previous ${pick.previousRanking ?? '?'})`);
        }
      }
    }
    if (!playerName) {
      const topPlayers = ['Carlos Alcaraz', 'Jannik Sinner', 'Novak Djokovic', 'Daniil Medvedev'];
      const candidate = topPlayers.find((p) => !hasPostedAboutTopic(p.toLowerCase(), 14));
      if (candidate) playerName = candidate;
    }
    if (playerName && !(await hasPostedAboutTopic(playerName.toLowerCase(), 14))) {
      opportunities.push({
        type: 'player',
        topic: `Rising Star: ${playerName}`,
        description: `Deep dive on ${playerName} - their game, recent form, and what makes them special`,
        searchVolume: 'medium',
        hasViralPotential: true,
        metadata: { player_name: playerName, ...rankingStats },
      });
      console.log(`[Content Intelligence] ✓ Created player profile opportunity for ${playerName}`);
    }
  }
  
  // 5c. News opportunities (from RSS feeds)
  const newsResult = await getRecentNews(24);
  if (newsResult.success && newsResult.data && newsResult.data.length > 0) {
    const topPlayerKeywords = ['alcaraz', 'sinner', 'djokovic', 'nadal', 'federer', 'medvedev', 'zverev', 'rune', 'shelton', 'fritz', 'australian open', 'wimbledon', 'roland garros', 'us open', 'atp', 'grand slam'];
    const relevantNews = newsResult.data.filter((item) => {
      const combined = (item.title + ' ' + (item.description || '')).toLowerCase();
      return topPlayerKeywords.some((k) => combined.includes(k));
    });
    let added = 0;
    for (const item of relevantNews.slice(0, 8)) {
      if (added >= 3) break;
      const topicSlug = item.title.slice(0, 60).toLowerCase().replace(/\s+/g, ' ');
      if (await hasPostedAboutTopic(topicSlug, 5)) continue;
      opportunities.push({
        type: 'news',
        topic: `Marshall's take: ${item.title}`,
        description: item.description || item.title,
        eventDate: new Date(item.published_at),
        hasViralPotential: true,
        searchVolume: 'medium',
        metadata: {
          newsItem: {
            title: item.title,
            description: item.description || '',
            source: item.source,
            url: item.url,
          },
        },
      });
      added++;
      console.log(`[Content Intelligence] ✓ Created news opportunity: ${item.title.slice(0, 50)}...`);
    }
  }

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
  
  console.log(`[Content Intelligence] Found ${opportunityInputs.length} raw opportunities`);
  
  if (opportunityInputs.length === 0) {
    console.log(`[Content Intelligence] No opportunities found`);
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
  
  const blockedCount = opportunityInputs.length - filteredOpportunities.length;
  if (blockedCount > 0) {
    console.log(`[Content Intelligence] Filtered out ${blockedCount} invalid/blocked opportunities`);
  }
  
  if (filteredOpportunities.length === 0) {
    console.log(`[Content Intelligence] All opportunities were filtered out`);
    return {
      bestOpportunity: null,
      allOpportunities: [],
      postingStatus,
    };
  }
  
  console.log(`[Content Intelligence] ${filteredOpportunities.length} valid opportunities remaining`);
  
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
  
  // Log ranking summary
  console.log(`\n[Content Intelligence] Opportunity Ranking Summary:`);
  console.log(`  Total opportunities: ${ranked.length}`);
  if (ranked.length > 0) {
    console.log(`  Top 5 opportunities:`);
    ranked.slice(0, 5).forEach((opp, idx) => {
      console.log(`    ${idx + 1}. [${opp.type}] ${opp.topic}`);
      console.log(`       Score: ${opp.totalScore} (Timeliness: ${opp.timeliness}, Affiliate: ${opp.affiliatePotential}, SEO: ${opp.seoValue}, Variety: ${opp.contentVariety}, Social: ${opp.socialEngagement})`);
    });
  }
  
  // Only return best opportunity if score is above threshold
  const threshold = 50; // Minimum score to generate post
  if (bestOpportunity && bestOpportunity.totalScore < threshold) {
    console.log(`\n[Content Intelligence] ⚠️  Best opportunity score (${bestOpportunity.totalScore}) below threshold (${threshold})`);
    return {
      bestOpportunity: null,
      allOpportunities: ranked,
      postingStatus,
    };
  }
  
  if (bestOpportunity) {
    console.log(`\n[Content Intelligence] ✅ Selected: [${bestOpportunity.type}] ${bestOpportunity.topic} (Score: ${bestOpportunity.totalScore})`);
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
  postId?: string;
  log?: any;
}> {
  // Start comprehensive logging
  const { startContentLog, logOpportunities, logSelectedOpportunity, logPostingStatus, saveContentLog, printLogSummary } = await import('./content-logger');
  const jobId = startContentLog();
  
  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[Content Intelligence] Job Started: ${jobId}`);
    console.log('='.repeat(80));
    
    const { bestOpportunity, allOpportunities, postingStatus } = await evaluateOpportunities();
    
    // Log opportunities found
    logOpportunities(allOpportunities);
    
    // Log posting status
    logPostingStatus(postingStatus);
    
    if (!bestOpportunity) {
      const log = await saveContentLog();
      printLogSummary();
      return {
        success: true,
        action: 'no_opportunity',
        reason: postingStatus.reason || 'No high-scoring opportunities found',
        log,
      };
    }
    
    // Log selected opportunity
    logSelectedOpportunity(bestOpportunity, `Highest scoring opportunity (${bestOpportunity.totalScore} points)`);
    
    if (!postingStatus.canPostBlog) {
      const log = await saveContentLog();
      printLogSummary();
      return {
        success: true,
        action: 'skipped',
        opportunity: bestOpportunity,
        reason: postingStatus.reason || 'Cannot post blog today',
        log,
      };
    }
    
    // Generate post from opportunity using V2 generator (with handlers)
    // Import and call post generation function directly
    try {
      const { generatePostFromOpportunityV2 } = await import('./post-generator-v2');
      const result = await generatePostFromOpportunityV2(bestOpportunity, {
        publish: false, // Always save as draft for review
      });
      
      if (result.success) {
        const log = await saveContentLog();
        printLogSummary();
        return {
          success: true,
          action: 'generated',
          opportunity: bestOpportunity,
          postId: result.postId,
          log,
        };
      } else {
        throw new Error(result.error || 'Failed to generate post');
      }
    } catch (error: any) {
      console.error('Error generating post:', error);
      const { logGenerationResult } = await import('./content-logger');
      logGenerationResult({
        success: false,
        error: error.message,
      });
      const log = await saveContentLog();
      printLogSummary();
      return {
        success: false,
        action: 'skipped',
        opportunity: bestOpportunity,
        reason: `Failed to generate post: ${error.message}`,
        log,
      };
    }
  } catch (error: any) {
    console.error('Content intelligence job error:', error);
    const { logGenerationResult } = await import('./content-logger');
    logGenerationResult({
      success: false,
      error: error.message,
    });
    const log = await saveContentLog();
    printLogSummary();
    return {
      success: false,
      action: 'skipped',
      reason: error.message,
      log,
    };
  }
}
