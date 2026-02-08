/**
 * Google Gemini API Integration
 * 
 * Used for generating blog post content
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use models/ prefix - required for Gemini API
// Best options: gemini-2.5-flash (fast), gemini-2.5-pro (quality), gemini-flash-latest (always latest)
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash';

import { parse429Error, isQuotaExceeded, markQuotaExceeded, sleep, getQuotaStatus } from './rate-limiter';

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not set. Post generation will fail.');
}

import type { MarshallState } from '@/lib/marshall/state';

export interface PostGenerationContext {
  type: 'gear' | 'travel' | 'analysis' | 'lifestyle';
  topic: string;
  tournament?: {
    name: string;
    location: string;
    startDate: string;
  };
  newsItem?: {
    title: string;
    description: string;
    source: string;
  };
  marshallState?: MarshallState | null;
  affiliateProducts?: string[];
  recentPosts?: Array<{
    title: string;
    category: string;
  }>;
  isRecap?: boolean; // Flag to indicate this is a recap post
  tournamentNews?: Array<{ // Real news from RSS feeds about the tournament
    title: string;
    description: string;
    url: string;
    source: string;
    published_at: string;
  }>;
  /** Finished match results from FreeWebAPI (EventSchedules) for recap posts */
  tournamentResults?: Array<{
    round: string;
    player1: { name: string };
    player2: { name: string };
    scoreText?: string;
    status?: string;
  }>;
  gearData?: Array<{ // Real gear data from database for gear posts
    id: string;
    name: string;
    brand: string;
    type: string;
    category?: string;
    specifications?: Record<string, any>;
    price_range?: string;
    amazon_affiliate_link?: string;
    description?: string;
    pros?: string[];
    cons?: string[];
    best_for?: string;
  }>;
  /** When true, prompt requires featured "Marshall's picks" / "Where to stay" section in first 400 words with 2–3 AFF links. */
  affiliateFeatured?: boolean;
  /** Today's matches from API (for day updates / live posts). Use only this data. */
  todayMatches?: Array<{ player1?: { name?: string }; player2?: { name?: string }; round?: string; scoreText?: string; tournament_name?: string }>;
  /** Number of live events right now (for "live now" posts). */
  liveEventsCount?: number;
}

/**
 * Generate blog post content using Gemini
 */
export async function generatePostContent(context: PostGenerationContext): Promise<{
  title: string;
  excerpt: string;
  content: string;
  postType: 'preview' | 'recap' | 'guide' | 'analysis' | 'gear' | 'travel' | 'lifestyle';
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  keywords?: string[];
  tags?: string[];
}> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set');
  }

  const prompt = buildPrompt(context);
  
  // Log the complete prompt for debugging and optimization
  // Rough token estimate: ~4 characters per token for English text
  const estimatedPromptTokens = Math.ceil(prompt.length / 4);
  const maxOutputTokens = 16384;
  const estimatedMaxResponseChars = maxOutputTokens * 4; // Rough estimate
  
  // Update prompt info in logger with actual prompt length
  const { logPromptInfo: updatePromptInfo } = await import('@/lib/jobs/content-logger');
  updatePromptInfo(context, prompt.length);
  
  console.log('\n' + '='.repeat(80));
  console.log('📝 GEMINI PROMPT (FULL)');
  console.log('='.repeat(80));
  console.log(`Topic: ${context.topic}`);
  console.log(`Type: ${context.type}`);
  if (context.tournament) {
    console.log(`Tournament: ${context.tournament.name}`);
  }
  if (context.isRecap) {
    console.log(`Recap Post: YES (${context.tournamentNews?.length || 0} news articles available)`);
  }
  console.log(`Prompt Length: ${prompt.length.toLocaleString()} characters (~${estimatedPromptTokens.toLocaleString()} tokens)`);
  console.log(`Max Output Tokens: ${maxOutputTokens} (~${estimatedMaxResponseChars.toLocaleString()} characters)`);
  console.log(`Target: 600-1200 words (~${(900 * 5).toLocaleString()} characters with markdown)`);
  console.log('-'.repeat(80));
  console.log(prompt);
  console.log('='.repeat(80) + '\n');

  // Check if we're in a quota exceeded state
  if (isQuotaExceeded()) {
    const status = getQuotaStatus();
    const waitTime = status.retryAfter ? status.retryAfter * 1000 : 60000; // Default 60 seconds
    throw new Error(`Gemini quota exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying. ${status.lastError || ''}`);
  }

  // Try multiple model names as fallback (all with models/ prefix)
  // Prioritize paid tier models first (if you have paid tier access)
  // Free tier: gemini-2.5-flash has higher limits than gemini-2.0-flash
  const modelsToTry = [
    GEMINI_MODEL, // User preference or default
    'models/gemini-2.5-flash', // Fast, recommended (higher free tier limits)
    'models/gemini-2.5-pro', // Better quality (if paid tier)
    'models/gemini-flash-latest', // Always latest flash
    // Removed gemini-2.0-flash from primary list (lower free tier limits)
    // Only try as last resort
    'models/gemini-2.0-flash', // Last resort fallback
  ];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      // Try both v1 and v1beta APIs
      const apiVersions = ['v1', 'v1beta'];
      let lastVersionError: Error | null = null;
      
      for (const version of apiVersions) {
        try {
          // Model name already includes 'models/' prefix, so use it directly
          const apiUrl = `https://generativelanguage.googleapis.com/${version}/${model}:generateContent?key=${GEMINI_API_KEY}`;
          
          const response = await fetch(
            apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt,
              }],
            }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 16384, // Maximum for Gemini 2.5 Flash/Pro - allows for 2000+ word posts
          },
          }),
        }
      );

          if (!response.ok) {
            const errorText = await response.text();
            
            // Handle 429 (quota exceeded) errors
            if (response.status === 429) {
              const quotaInfo = parse429Error(errorText);
              if (quotaInfo) {
                markQuotaExceeded(quotaInfo.retryAfter, quotaInfo.message);
                // Wait a bit before trying next model (might help if different model has different quota)
                await sleep(2000);
              }
              lastVersionError = new Error(`Gemini API error (${version}/${model}): ${response.status} - ${errorText}`);
              // Don't continue to next version if quota exceeded - all will fail
              if (quotaInfo) {
                break; // Break out of version loop, try next model
              }
              continue;
            }
            
            lastVersionError = new Error(`Gemini API error (${version}/${model}): ${response.status} - ${errorText}`);
            // Try next API version
            continue;
          }

          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!generatedText) {
            lastVersionError = new Error(`No content generated from Gemini (${version}/${model})`);
            continue;
          }

          // Track API costs
          try {
            const usageMetadata = data.usageMetadata;
            const inputTokens = usageMetadata?.promptTokenCount || 0;
            const outputTokens = usageMetadata?.candidatesTokenCount || 0;
            
            if (inputTokens > 0 || outputTokens > 0) {
              const { logCost, calculateGeminiCost } = await import('@/lib/costs/tracker');
              const cost = calculateGeminiCost(inputTokens, outputTokens);
              
              await logCost({
                service: 'gemini',
                endpoint: 'generateContent',
                cost_usd: cost,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                metadata: {
                  model,
                  version,
                  prompt_length: prompt.length,
                },
              });
            }
          } catch (costError) {
            // Don't fail if cost tracking fails
            console.warn('Failed to track Gemini cost:', costError);
          }

          // Success! Parse the initial draft
          console.log(`Successfully used model: ${version}/${model}`);
          const initialDraft = await parseGeneratedContent(generatedText, context);
          
          // 2-AGENT PIPELINE: Fact-Check → Edit
          // Skip if quota is already exceeded to avoid wasting more API calls
          if (!isQuotaExceeded()) {
            console.log('\n' + '='.repeat(80));
            console.log('🔍 FACT-CHECKER AGENT');
            console.log('='.repeat(80));
            
            try {
              const { factCheckPost } = await import('./fact-checker');
              const factCheckResult = await factCheckPost(initialDraft.content, context);
              
              if (factCheckResult.hasIssues) {
                console.log(`Found ${factCheckResult.issues.length} issues:`);
                factCheckResult.issues.forEach((issue, idx) => {
                  console.log(`  ${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.issue}`);
                  console.log(`     Original: "${issue.originalText.substring(0, 60)}..."`);
                });
                
                // Only run editor if quota is still OK
                if (!isQuotaExceeded()) {
                  console.log('\n' + '='.repeat(80));
                  console.log('✏️ EDITOR AGENT');
                  console.log('='.repeat(80));
                  
                  const { editPost } = await import('./editor');
                  const editResult = await editPost(
                    initialDraft.content,
                    initialDraft.title,
                    initialDraft.excerpt,
                    factCheckResult.issues,
                    context
                  );
                  
                  if (editResult.success && editResult.editedContent) {
                    console.log('✅ Post edited successfully');
                    return {
                      ...initialDraft,
                      content: editResult.editedContent,
                    };
                  } else {
                    console.warn('⚠️ Editor failed, using original draft:', editResult.error);
                    return initialDraft;
                  }
                } else {
                  console.warn('⚠️ Quota exceeded, skipping editor. Using fact-checked draft.');
                  return initialDraft;
                }
              } else {
                console.log('✅ No issues found - post passes fact-check');
                return initialDraft;
              }
            } catch (factCheckError: any) {
              // If fact-checker fails due to quota, just use the original draft
              if (factCheckError.message?.includes('quota') || factCheckError.message?.includes('429')) {
                console.warn('⚠️ Fact-checker hit quota limit, using original draft');
                return initialDraft;
              }
              throw factCheckError;
            }
          } else {
            console.warn('⚠️ Quota exceeded, skipping fact-checker/editor. Using original draft.');
            return initialDraft;
          }
        } catch (error: any) {
          lastVersionError = error;
          console.warn(`Failed with ${version}/${model}, trying next...`);
          continue;
        }
      }
      
      // If both API versions failed for this model, try next model
      lastError = lastVersionError;
    } catch (error: any) {
      lastError = error;
      console.warn(`Failed with model ${model}, trying next...`);
      continue;
    }
  }

  // If we get here, all models failed
  throw lastError || new Error('All Gemini models failed');
}

/**
 * Build the prompt for Gemini
 */
function buildPrompt(context: PostGenerationContext): string {
  const { type, topic, tournament, newsItem, affiliateProducts, recentPosts, isRecap, tournamentNews, tournamentResults, gearData, todayMatches, liveEventsCount } = context;

  let prompt = `You are Marshall, a 33-year-old tennis tour insider and travel blogger (born 1993). You've been following the ATP Tour for a decade, living out of a suitcase.

MARSHALL'S PURPOSE (non-negotiable):
- Marshall is a LIFESTYLE blogger whose lifestyle is driven by the ATP tour. He is NOT another analyst who mainly writes about results.
- His job is to INSPIRE tennis fans: to travel, to experience tournaments in person, to see their favorite players live, to discover cities and cultures around the tour.
- Results, weather, rankings, and real data are important—use them to be CREDIBLE and grounded. Weave them in so readers trust him. But the story is never "here are the results." The story is always experience, travel, why you should be there, what it feels like, who to watch and why they're worth your time.
- Every post should be FUN, WITTY, and full of personality. Even recaps and "day updates" should leave readers wanting to book a trip or tune in—not just informed of scores.

REAL DATA ONLY (avoids AI detection, builds trust):
- Use ONLY the data provided below: matches, results, rankings, news, tournament info. Never invent scores, match outcomes, or statistics.
- If we give you "tournament results" or "matches," cite them. If we don't, do not write as if the final has been played or make up winners.
- Marshall's location, gear, and "where he is" are ONLY true when listed under MARSHALL'S CURRENT STATE. If that section is missing or empty, write in a neutral "insider" voice without claiming to be on-site.
- Timely, specific details (dates, venues, player names from data) make the post feel real. Vague or generic claims feel like AI.

CRITICAL AGE CONSISTENCY:
- Marshall was born in 1993, so he is currently 33 years old
- In the late 90s (1997-1999), Marshall was 4-6 years old - he cannot have memories of watching matches in bars or cafes
- In the early 2000s (2000-2002), Marshall was 7-9 years old - still too young for adult experiences
- For nostalgia posts about players from before 2005, use phrases like "I've watched highlights of..." or "Looking back at the footage..." or "The stories I've heard about..." instead of first-person experiences from that time
- Marshall's earliest meaningful tennis memories would be from around 2005-2010 (age 12-17)

PERSONALITY:
- "Lovable Asshole" archetype (Archer x Roy Kent x American Optimism)
- Snarky about bad line calls, ugly kits, slow courts
- Deeply passionate about tennis - defends players, tears up at legends retiring
- Shamelessly snobby about "the right way" to travel, drink coffee, hit backhands
- American-born but lived in Europe for a decade - cultured expat, not tourist
- Never "Americans" the experience

VOICE:
- Witty, insightful, respectful
- Explains complex tennis strategy simply
- Uses correct terminology (Roland Garros, not "French Open")
- Casual but authoritative
- Tagline: "Serve First. Travel Always."

TASK:
Write a blog post about: ${topic}

POST TYPE: ${type}

`;

  // Marshall's current state (so content can reference where he is, what he uses, who he's watching)
  const ms = (context as PostGenerationContext & { marshallState?: MarshallState | null }).marshallState;
  if (ms) {
    prompt += `MARSHALL'S CURRENT STATE (use naturally in the post—where he is, what he uses, who he's watching):\n`;
    if (ms.current_city || ms.current_country) {
      prompt += `- Location: ${[ms.current_city, ms.current_country].filter(Boolean).join(', ')}\n`;
    }
    if (ms.current_racket) prompt += `- Current racket: ${ms.current_racket}${ms.current_racket_affiliate_link ? ' (affiliate link available)' : ''}\n`;
    if (ms.current_hotel) prompt += `- Hotel: ${ms.current_hotel}${ms.current_hotel_affiliate_link ? ' (affiliate link available)' : ''}\n`;
    if (ms.current_coffee_shop) prompt += `- Coffee spot: ${ms.current_coffee_shop}\n`;
    if (ms.up_and_coming_player_watching) prompt += `- Player he's watching: ${ms.up_and_coming_player_watching}\n`;
    if (ms.next_city || ms.next_country) {
      prompt += `- Next stop: ${[ms.next_city, ms.next_country].filter(Boolean).join(', ')}\n`;
    }
    prompt += `\n`;
  }

  // Affiliate-first: featured "Marshall's picks" / "Where to stay" in first 400 words (tournament preview, lifestyle, travel)
  const affiliateFeatured = (context as PostGenerationContext & { affiliateFeatured?: boolean }).affiliateFeatured;
  if (type === 'travel' || type === 'lifestyle' || affiliateFeatured) {
    prompt += `AFFILIATE-FEATURED POST (tournament preview / travel / lifestyle):\n`;
    prompt += `- Include a clear "Marshall's Picks" or "Where to Stay" (or "What I'm Using") section within the FIRST 400 words of the post.\n`;
    prompt += `- Put 2–3 affiliate links in that section using [AFF:Product or Place Name] format. Do not bury affiliate products only in long paragraphs later.\n`;
    prompt += `- Keep the post scannable: short paragraphs, subheadings. Total length around 500–800 words for previews/travel so links stay visible.\n`;
    prompt += `- Optional: you may include exactly one shortcode after the intro paragraph for a booking grid: [[booking_grid city=CITY count=6]] where CITY is the tournament/location city.\n\n`;
  }

  // Add gear data if this is a gear post
  if (type === 'gear' && gearData && gearData.length > 0) {
    prompt += `✅ GEAR DATA AVAILABLE - USE THIS REAL DATA ✅\n\n`;
    prompt += `You have access to REAL gear data from the database. Use this information to write an ACCURATE guide.\n\n`;
    prompt += `GEAR ITEMS TO INCLUDE:\n\n`;
    
    gearData.forEach((item, index) => {
      prompt += `${index + 1}. ${item.name} (${item.brand})\n`;
      if (item.description) prompt += `   Description: ${item.description}\n`;
      if (item.specifications) {
        prompt += `   Specifications:\n`;
        Object.entries(item.specifications).forEach(([key, value]) => {
          prompt += `     - ${key}: ${value}\n`;
        });
      }
      if (item.price_range) prompt += `   Price: ${item.price_range}\n`;
      if (item.pros && item.pros.length > 0) {
        prompt += `   Pros: ${item.pros.join(', ')}\n`;
      }
      if (item.cons && item.cons.length > 0) {
        prompt += `   Cons: ${item.cons.join(', ')}\n`;
      }
      if (item.best_for) prompt += `   Best for: ${item.best_for}\n`;
      if (item.amazon_affiliate_link) {
        prompt += `   Affiliate link available: ${item.amazon_affiliate_link}\n`;
      }
      prompt += `\n`;
    });
    
    prompt += `INSTRUCTIONS FOR GEAR POSTS:\n`;
    prompt += `- Put a featured "Top Picks" or "What to Buy" section NEAR THE TOP of the post (within the first 400 words) with 2–3 [AFF:Product Name] links.\n`;
    prompt += `- Use the gear data above to write an ACCURATE comparison guide\n`;
    prompt += `- Include all the products listed above in your guide\n`;
    prompt += `- Use the specifications, pros, cons, and "best for" information provided\n`;
    prompt += `- Be honest about each product - use the pros/cons provided\n`;
    prompt += `- Include affiliate links using [AFF:Product Name] format for products that have amazon_affiliate_link\n`;
    prompt += `- DO NOT make up specifications or features that aren't in the data above\n`;
    prompt += `- If the data doesn't have specific details, you can say "check current pricing" or "specs may vary"\n`;
    prompt += `- Write in Marshall's voice - add your own analysis and opinions, but base them on the real data\n\n`;
  } else if (type === 'gear') {
    prompt += `⚠️ WARNING: NO GEAR DATA AVAILABLE ⚠️\n\n`;
    prompt += `You are writing a gear guide but NO gear data was provided from the database.\n`;
    prompt += `This means you'll need to use general knowledge, which may be outdated or inaccurate.\n\n`;
    prompt += `IMPORTANT:\n`;
    prompt += `- Be honest that you're writing based on general knowledge\n`;
    prompt += `- Focus on general principles and what to look for in gear\n`;
    prompt += `- Avoid making specific claims about current models or prices\n`;
    prompt += `- Consider writing more about "what to look for" rather than specific product recommendations\n`;
    prompt += `- If you mention specific products, note that readers should verify current specs/pricing\n\n`;
  }

  // Today's matches / live now (real data for day updates)
  if (todayMatches && todayMatches.length > 0) {
    prompt += `TODAY'S MATCHES (use only this real data—do not invent):\n`;
    todayMatches.slice(0, 25).forEach((m: any, idx: number) => {
      const p1 = m.player1?.name ?? 'Player 1';
      const p2 = m.player2?.name ?? 'Player 2';
      const round = m.round ?? '?';
      const score = m.scoreText ? ` ${m.scoreText}` : '';
      const tn = m.tournament_name ? ` [${m.tournament_name}]` : '';
      prompt += `${idx + 1}. ${round}: ${p1} vs ${p2}${score}${tn}\n`;
    });
    prompt += `- Use these for credibility and specificity. The post should feel like "here's what's in the air today" or "why you should be watching"—not a dry schedule.\n\n`;
  }
  if (typeof liveEventsCount === 'number' && liveEventsCount > 0) {
    prompt += `LIVE NOW: ${liveEventsCount} match(es) are in progress. You can reference "live action" or "as we speak" only because we have real live data.\n\n`;
  }

  if (tournament) {
    prompt += `TOURNAMENT CONTEXT:
- Name: ${tournament.name}
- Location: ${tournament.location}
- Start Date: ${tournament.startDate}
- This is a ${type === 'travel' ? 'travel guide' : 'tournament preview/analysis'}

`;
    
    // CRITICAL: If this is a recap post, use real data (news or API results)
    if (isRecap) {
      if (tournamentNews && tournamentNews.length > 0) {
        prompt += `✅ TOURNAMENT RECAP - REAL NEWS DATA AVAILABLE ✅

You have access to REAL news articles about ${tournament.name}. Use this information to write an accurate recap.

RECENT NEWS ABOUT ${tournament.name.toUpperCase()}:
${tournamentNews.map((news, idx) => `
${idx + 1}. ${news.title}
   Source: ${news.source}
   Published: ${new Date(news.published_at).toLocaleDateString()}
   Description: ${news.description}
   URL: ${news.url}
`).join('\n')}

INSTRUCTIONS:
- Use the news articles above to write an ACCURATE recap of ${tournament.name}
- Extract real information: winners, final matchups, scores, key moments
- Cite the sources naturally (e.g., "According to ESPN..." or "As reported by BBC Sport...")
- Combine information from multiple sources to create a comprehensive recap
- Write in Marshall's voice - add analysis, insights, and personal perspective
- DO NOT make up information that isn't in the news articles
- If the news doesn't have specific details (like exact scores), you can say "in straight sets" or "in a thrilling match" without making up numbers

`;
      } else if (tournamentResults && tournamentResults.length > 0) {
        prompt += `✅ TOURNAMENT RECAP - REAL RESULTS DATA (FreeWebAPI) ✅

You have REAL finished match results for ${tournament.name}. Use this information to write an accurate recap with actual results.

FINISHED MATCHES (round, players, score):
${tournamentResults.map((m, idx) => {
          const p1 = m.player1?.name ?? 'Player 1';
          const p2 = m.player2?.name ?? 'Player 2';
          const score = m.scoreText ? ` ${m.scoreText}` : '';
          return `${idx + 1}. ${m.round}: ${p1} vs ${p2}${score}`;
        }).join('\n')}

INSTRUCTIONS:
- Use the match results above to write an ACCURATE recap of ${tournament.name}
- Mention the final result (winner and score if shown), semifinals, and other key results
- Do NOT invent results that are not in the list above
- Write in Marshall's voice - add analysis and context around the results
- You MAY say the tournament "wrapped up" or "concluded" because we have real finished matches
- Marshall's angle: results make it credible, but the takeaway should be experience, atmosphere, why it mattered to be there (or why to go next year)—not a dry results report

`;
      } else {
        prompt += `⚠️ TOURNAMENT RECAP - NO NEWS DATA AVAILABLE ⚠️

We attempted to fetch news about ${tournament.name} but no relevant articles were found. We have NO confirmation that the final has been played or who won.

CRITICAL - DO NOT IMPLY THE TOURNAMENT HAS ENDED:
- Do NOT say the tournament has "wrapped up", "just concluded", "is in the books", or "another [tournament] is in the books"
- Do NOT write as if the final has already been played
- Instead write as if the tournament may still be in progress or the final is ahead: e.g. "as we head into the final weekend", "with the final ahead", "as the tournament builds toward the climax"

DO NOT INVENT OR MAKE UP:
- Match results (who won, scores, sets)
- Final matchups (who played in the final)
- Specific player names in finals or matches
- Match statistics or scores
- Tournament winners or champions

INSTEAD, WRITE ABOUT:
- The overall tournament experience and atmosphere so far
- General observations about the level of play
- The tournament's significance in the tennis calendar
- What makes this tournament special (location, history, court conditions)
- Travel and lifestyle aspects of the location
- Your personal reflections on being at the tournament
- What to expect as the tournament reaches its conclusion (without claiming it has concluded)

WRITING STYLE WHEN WE HAVE NO RESULTS DATA:
- Use "as the tournament builds toward the final weekend" not "the tournament wrapped up"
- Use "another edition delivering" (present) not "another edition in the books" (past)
- Focus on experience, atmosphere, and general observations—never imply specific results

EXAMPLE OF WHAT TO AVOID:
❌ "The Open Occitanie wrapped up, delivering another week of thrilling tennis"
❌ "another Open Occitanie is in the books"
❌ "Carlos Alcaraz defeated Novak Djokovic in the final"

EXAMPLE OF WHAT TO WRITE INSTEAD:
✓ "As the Open Occitanie heads into its final weekend, the atmosphere in Montpellier has been electric"
✓ "The tournament has once again delivered high-quality tennis; here's the vibe and what to expect"
✓ "With the final ahead, here's what makes this stop on the calendar special"

`;
      }
    }
  }

  if (newsItem) {
    prompt += `NEWS CONTEXT:
- Headline: ${newsItem.title}
- Description: ${newsItem.description}
- Source: ${newsItem.source}
- Write your own analysis/commentary on this news. Don't just summarize - add Marshall's unique perspective.

`;
  }

  if (affiliateProducts && affiliateProducts.length > 0) {
    prompt += `AFFILIATE PRODUCTS TO MENTION (naturally, not forced):
${affiliateProducts.map(p => `- ${p}`).join('\n')}
- Mention these products organically in the content
- Use natural language, not salesy

`;
  }

  // Player data: rankings, profiles, head-to-head (for analysis and small mentions everywhere)
  const ctx = context as any;
  if (ctx.rankings && Array.isArray(ctx.rankings) && ctx.rankings.length > 0) {
    const list = ctx.rankings.slice(0, 20);
    prompt += `CURRENT ATP RANKINGS (use for accuracy; you may mention names/ranks naturally in any post):
${list.map((p: { name?: string; rank?: number; country?: string }) => `- #${p.rank ?? '?'} ${p.name ?? 'Unknown'} (${p.country ?? ''})`).join('\n')}

- Marshall cares about the tour: you may reference current rankings, top players, or form in passing where it fits (e.g. "with the top seeds in town", "world number 2", "the current top 10").
- For analysis/player posts, use this data as the source of truth. For travel/lifestyle/gear, optional small mentions only when natural.

`;
  }
  if (ctx.players && Array.isArray(ctx.players) && ctx.players.length > 0) {
    prompt += `PLAYER PROFILE DATA (use for this post):
${ctx.players.map((p: { name?: string; rank?: number; country?: string; playing_style?: string }) => `- ${p.name ?? 'Unknown'} | Rank: ${p.rank ?? '?'} | Country: ${p.country ?? ''}${p.playing_style ? ` | Style: ${p.playing_style}` : ''}`).join('\n')}
- For player/rising-star posts: use the data for credibility, but the angle is why they're worth watching, why fans should care, what makes them must-see—not a stat dump.

`;
  }
  if (ctx.playerRankingStats && typeof ctx.playerRankingStats === 'object') {
    const s = ctx.playerRankingStats as { previousRanking?: number; points?: number; bestRanking?: number };
    const parts = [];
    if (s.previousRanking != null) parts.push(`Previous rank: ${s.previousRanking}`);
    if (s.points != null) parts.push(`Points: ${s.points}`);
    if (s.bestRanking != null) parts.push(`Career-high rank: ${s.bestRanking}`);
    if (parts.length) prompt += `RANKING MOVEMENT / FORM (use for rising-star posts): ${parts.join(' | ')}\n\n`;
  }
  if (ctx.headToHead && typeof ctx.headToHead === 'object') {
    const h2h = ctx.headToHead as { player1Wins?: number; player2Wins?: number };
    prompt += `HEAD-TO-HEAD (use when post involves two specific players): ${h2h.player1Wins ?? 0}-${h2h.player2Wins ?? 0} (player1-player2 wins).

`;
  }
  if (ctx.matches && Array.isArray(ctx.matches) && ctx.matches.length > 0) {
    const matches = ctx.matches.slice(0, 10);
    prompt += `MATCH DATA (tournament/schedule):
${matches.map((m: { player1?: { name?: string }; player2?: { name?: string }; round?: string; status?: string; scheduled_time?: string }) => `- ${m.player1?.name ?? 'TBD'} vs ${m.player2?.name ?? 'TBD'} (${m.round ?? '?'}) ${m.status ?? ''} ${m.scheduled_time ? new Date(m.scheduled_time).toLocaleString() : ''}`).join('\n')}

`;
  }

  // Add special instructions for nostalgia/historical posts
  if ((context as any).historicalPlayer || (context as any).year) {
    const historicalPlayer = (context as any).historicalPlayer;
    const year = (context as any).year;
    const videos = (context as any).videos;
    
    prompt += `✅ NOSTALGIA / HISTORICAL POST - AGE AWARENESS CRITICAL ✅

MARSHALL'S AGE CONTEXT:
- Marshall is 33 years old (born 1993)
- In the late 90s (1997-1999), Marshall was 4-6 years old
- In the early 2000s (2000-2002), Marshall was 7-9 years old
- Marshall's earliest meaningful tennis memories would be from around 2005-2010 (age 12-17)

CRITICAL WRITING RULES FOR HISTORICAL POSTS:
- DO NOT write "I remember watching..." for events before 2005
- DO NOT write "I was there..." for events before 2005
- DO NOT write about being in bars, cafes, or adult venues before age 16
- INSTEAD use phrases like:
  * "I've watched highlights of..."
  * "Looking back at the footage..."
  * "The stories I've heard about..."
  * "Studying the archives..."
  * "The footage from that era shows..."
  * "What stands out when you watch those matches back..."

`;
    
    if (historicalPlayer) {
      prompt += `HISTORICAL PLAYER DATA:
- Name: ${historicalPlayer.fullName || historicalPlayer.name}
- Era: ${historicalPlayer.era || 'Unknown'}
- Country: ${historicalPlayer.country || 'Unknown'}
- Active Years: ${historicalPlayer.activeYears || 'Unknown'}
- Grand Slams: ${historicalPlayer.grandSlams || 0}
- Playing Style: ${historicalPlayer.playingStyle || 'Unknown'}
${historicalPlayer.notableAchievements && historicalPlayer.notableAchievements.length > 0 ? `- Notable Achievements: ${historicalPlayer.notableAchievements.join('; ')}` : ''}
${historicalPlayer.careerHighlights && historicalPlayer.careerHighlights.length > 0 ? `- Career Highlights: ${historicalPlayer.careerHighlights.join('; ')}` : ''}

`;
    }
    
    if (year) {
      const marshallAgeInYear = year - 1993;
      prompt += `YEAR CONTEXT:
- Year: ${year}
- Marshall's age in ${year}: ${marshallAgeInYear} years old
${marshallAgeInYear < 10 ? `- ⚠️ CRITICAL: Marshall was ${marshallAgeInYear} years old in ${year} - he cannot have first-person memories of watching matches in bars or cafes` : ''}
${marshallAgeInYear < 16 ? `- ⚠️ NOTE: Marshall was ${marshallAgeInYear} years old in ${year} - adjust language to reflect a teenager's perspective if mentioning personal experiences` : ''}

`;
    }
    
    if (videos && videos.length > 0) {
      prompt += `YOUTUBE VIDEOS AVAILABLE:
${videos.slice(0, 3).map((v: any, idx: number) => `${idx + 1}. ${v.title}\n   URL: ${v.url}`).join('\n')}
- You can reference these videos naturally in the post
- Use phrases like "This highlight reel shows..." or "The footage captures..."

`;
    }
  }

  // Videos for analysis/player posts (not only nostalgia) - readers expect video in sports content
  const contextVideos = (context as any).videos;
  if (contextVideos && Array.isArray(contextVideos) && contextVideos.length > 0) {
    prompt += `YOUTUBE VIDEOS – YOU MUST INCLUDE THESE LINKS IN YOUR CONTENT:
${contextVideos.slice(0, 5).map((v: any, idx: number) => `${idx + 1}. ${v.title}\n   URL: ${v.url}`).join('\n')}

CRITICAL: Your content MUST contain at least 1–2 clickable YouTube links from the list above. If you do not include them, the post will be auto-corrected.
- Add a "## Watch" or "### Must-watch highlights" section with markdown links, e.g.: [Video Title](url)
- Or weave links inline, e.g.: "This [highlight reel](URL_FROM_LIST_ABOVE) shows..."
- Use the exact URLs provided above. Sports readers expect video; do not omit.
`;
  }

  if (recentPosts && recentPosts.length > 0) {
    prompt += `RECENT POSTS (avoid repeating these topics):
${recentPosts.map(p => `- ${p.title} (${p.category})`).join('\n')}

`;
  }

  prompt += `OUTPUT FORMAT (JSON only, no markdown code blocks):
Return ONLY valid JSON, no markdown formatting, no code blocks, no explanations. Just the JSON object:

{
  "title": "Compelling, SEO-friendly title (60-70 characters). CRITICAL: Do NOT include the tagline 'Serve First. Travel Always.' in the title. The title should be just the post title, nothing else.",
  "excerpt": "Engaging excerpt (150-160 characters)",
  "content": "Full blog post content in MARKDOWN format. CRITICAL: Use proper line breaks and spacing! Use \\n\\n (double newlines) between paragraphs, \\n\\n before and after headings, \\n\\n before and after lists. Format example:\\n\\n## Main Heading\\n\\nParagraph text here with proper spacing.\\n\\n### Subheading\\n\\nMore paragraph text.\\n\\n- List item one\\n- List item two\\n\\nAnother paragraph after the list. Use ## for main headings, ### for subheadings, regular paragraphs, - for lists, [text](url) for links. Write naturally - aim for 600-1200 words (enough to be comprehensive but not overwhelming). Quality and engagement matter more than length. Include natural affiliate link opportunities marked as [AFF:Product Name]. CRITICAL: If you approach token limits, ensure you close all JSON strings and the object properly - it's better to have a complete shorter post than a truncated longer one.",
  "postType": "preview|recap|guide|analysis|gear|travel|lifestyle",
  "metaTitle": "SEO meta title (include focus keyword)",
  "metaDescription": "SEO meta description (150-160 characters)",
  "focusKeyword": "Primary SEO keyword",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}

CRITICAL: The "postType" field is REQUIRED and must be one of:
- "preview" - Tournament preview (written before tournament starts, focuses on location, travel, what to expect)
- "recap" - Tournament recap (written after tournament ends, summarizes results and highlights)
- "guide" - Travel guide or gear guide (how-to, recommendations, best practices)
- "analysis" - Match analysis, player analysis, tactical breakdown
- "gear" - Gear review or gear-focused content
- "travel" - Travel-focused content (location guides, travel tips)
- "lifestyle" - Lifestyle content (coffee, hotels, culture, personal stories)

Determine the postType based on:
- The topic and context provided
- Whether it's a preview (before tournament) or recap (after tournament)
- The type of content being written
- The focus of the post (travel, gear, analysis, etc.)

Be explicit and accurate - this determines image generation and categorization.

CRITICAL MARKDOWN FORMATTING RULES:
- ALWAYS use \\n\\n (double newline) between paragraphs
- ALWAYS use \\n\\n before and after headings (## and ###)
- ALWAYS use \\n\\n before and after lists
- ALWAYS use \\n\\n before and after blockquotes
- Use single \\n for line breaks within lists
- Example structure:\\n\\n## Section Title\\n\\nParagraph one here.\\n\\nParagraph two here.\\n\\n### Subsection\\n\\nMore content.\\n\\n- List item\\n- Another item\\n\\nParagraph after list.

IMPORTANT:
- Return ONLY the JSON object, no markdown code blocks around it
- Write in Marshall's voice throughout
- Make it engaging and personal
- Include specific details and examples
- Add your own analysis/opinion
- Use MARKDOWN formatting in content (## headings, - lists, **bold**, etc.)
- Make affiliate mentions natural, not forced
- Focus keyword should be in title and first paragraph
- Content length: Write naturally - 600-1200 words is ideal (enough to be comprehensive, not overwhelming)
- Quality and engagement matter FAR more than word count - don't pad with fluff
- Do NOT wrap the JSON in markdown code blocks
- CRITICAL: If approaching token limits, prioritize completing the JSON structure over adding more content
- CRITICAL: Include proper \\n\\n spacing throughout the markdown content
- When YouTube videos were provided above: INCLUDE 1-2 clickable links in the content (e.g. a "Watch" section or inline [text](url)). Sports readers expect video.
- CRITICAL: Ensure the JSON is complete and valid - all strings must be properly closed with quotes
- If you approach response length limits, ensure you close all JSON strings and the object properly
- CRITICAL: Ensure the JSON is complete and valid - all strings must be properly closed with quotes
- If content is very long, you may need to be concise to fit within response limits
`;

  return prompt;
}

/**
 * Parse generated content from Gemini
 */
function parseGeneratedContent(
  generatedText: string,
  context: PostGenerationContext
): {
  title: string;
  excerpt: string;
  content: string;
  postType: 'preview' | 'recap' | 'guide' | 'analysis' | 'gear' | 'travel' | 'lifestyle';
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  keywords?: string[];
  tags?: string[];
} {
  try {
    // Try to extract JSON from the response
    // Gemini sometimes wraps JSON in markdown code blocks or returns raw JSON
    let jsonText = generatedText.trim();
    
    // Remove markdown code blocks if present (handle various formats)
    // Handle ```json at start
    jsonText = jsonText.replace(/^```json\s*/i, '');
    // Handle ``` at start (any language)
    jsonText = jsonText.replace(/^```[a-z]*\s*/i, '');
    // Handle ``` at end
    jsonText = jsonText.replace(/\s*```\s*$/i, '');
    jsonText = jsonText.trim();
    
    // Check if Gemini returned labeled text instead of JSON (e.g., "Title: ... Excerpt: ... Content: ...")
    // This happens sometimes when the model doesn't follow JSON format instructions
    const hasLabeledFormat = /^(?:Title|title|Excerpt|excerpt):/im.test(jsonText);
    if (hasLabeledFormat) {
      console.log('⚠️ Detected labeled format instead of JSON, converting...');
      
      // Split by lines and look for field labels
      const lines = jsonText.split('\n');
      let currentField: 'title' | 'excerpt' | 'content' | null = null;
      const extracted: { title: string; excerpt: string; content: string } = {
        title: context.topic,
        excerpt: '',
        content: '',
      };
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this line starts a new field
        if (/^(?:Title|title):\s*/i.test(line)) {
          currentField = 'title';
          extracted.title = line.replace(/^(?:Title|title):\s*/i, '').trim();
        } else if (/^(?:Excerpt|excerpt):\s*/i.test(line)) {
          currentField = 'excerpt';
          extracted.excerpt = line.replace(/^(?:Excerpt|excerpt):\s*/i, '').trim();
        } else if (/^(?:Content|content):\s*/i.test(line)) {
          currentField = 'content';
          extracted.content = line.replace(/^(?:Content|content):\s*/i, '').trim();
        } else if (currentField && line.trim()) {
          // Continue appending to current field
          if (extracted[currentField]) {
            extracted[currentField] += '\n' + line;
          } else {
            extracted[currentField] = line;
          }
        }
      }
      
      // Clean up extracted fields
      extracted.title = extracted.title.trim();
      extracted.excerpt = extracted.excerpt.trim();
      extracted.content = extracted.content.trim();
      
      // If we got content, use it (even if not perfect JSON)
      if (extracted.content) {
        console.log('✅ Extracted content from labeled format');
        // Clean up content - remove any stray field labels that might have appeared
        extracted.content = extracted.content
          .replace(/^(?:Title|title|Excerpt|excerpt|Content|content|Meta|meta):\s*/gim, '')
          .trim();
        
        // Infer postType from context for fallback
        let fallbackPostType: 'preview' | 'recap' | 'guide' | 'analysis' | 'gear' | 'travel' | 'lifestyle' = 'analysis';
        if (context.isRecap) {
          fallbackPostType = 'recap';
        } else if (context.type === 'gear') {
          fallbackPostType = 'gear';
        } else if (context.type === 'travel') {
          fallbackPostType = 'preview';
        } else if (context.type === 'lifestyle') {
          fallbackPostType = 'lifestyle';
        }
        
        return {
          title: extracted.title || context.topic,
          excerpt: extracted.excerpt || '',
          content: extracted.content,
          postType: fallbackPostType,
          metaTitle: undefined,
          metaDescription: undefined,
          focusKeyword: undefined,
          keywords: [],
          tags: [],
        };
      }
    }
    
    // Try multiple strategies to extract JSON
    
    // Strategy 1: Try parsing the whole thing if it's already JSON
    let parsed: any = null;
    let parseError: Error | null = null;
    
    try {
      parsed = JSON.parse(jsonText);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Success! Use this
        console.log('Successfully parsed JSON using Strategy 1 (direct parse)');
      } else {
        parsed = null;
      }
    } catch (e: any) {
      parseError = e;
      // Not valid JSON, try other strategies
    }
    
    // Strategy 2: Find JSON object in the text (handle text before/after)
    if (!parsed) {
      const firstBrace = jsonText.indexOf('{');
      if (firstBrace !== -1) {
        // Find matching closing brace by counting braces
        // This handles nested objects and arrays
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        let lastBrace = -1;
        
        for (let i = firstBrace; i < jsonText.length; i++) {
          const char = jsonText[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                lastBrace = i;
                break;
              }
            }
          }
        }
        
        if (lastBrace !== -1) {
          const jsonCandidate = jsonText.substring(firstBrace, lastBrace + 1);
          try {
            parsed = JSON.parse(jsonCandidate);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              console.log('Successfully parsed JSON using Strategy 2 (brace matching)');
            } else {
              parsed = null;
            }
          } catch (e: any) {
            parseError = e;
            parsed = null;
          }
        }
      }
    }
    
    // Strategy 3: Try to find JSON by looking for common JSON patterns
    if (!parsed) {
      // Look for JSON object that starts with { and has common fields
      const jsonPattern = /\{\s*"title"\s*:/i;
      const match = jsonText.match(jsonPattern);
      if (match && match.index !== undefined) {
        const startIdx = match.index;
        // Now find the matching closing brace from this point
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        let lastBrace = -1;
        
        for (let i = startIdx; i < jsonText.length; i++) {
          const char = jsonText[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                lastBrace = i;
                break;
              }
            }
          }
        }
        
        if (lastBrace !== -1) {
          const jsonCandidate = jsonText.substring(startIdx, lastBrace + 1);
          try {
            parsed = JSON.parse(jsonCandidate);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              console.log('Successfully parsed JSON using Strategy 3 (pattern matching)');
            } else {
              parsed = null;
            }
          } catch (e: any) {
            parseError = e;
            parsed = null;
          }
        }
      }
    }
    
    // Strategy 4: Last resort - try regex match (less reliable for nested structures)
    if (!parsed) {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            console.log('Successfully parsed JSON using Strategy 4 (regex fallback)');
          } else {
            parsed = null;
          }
        } catch (e: any) {
          parseError = e;
          parsed = null;
        }
      }
    }
    
    if (parsed) {
      
      // Validate that we got a proper object
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed result is not an object');
      }
      
      // Clean up content - extract just the content string
      let content = parsed.content || '';
      if (typeof content !== 'string') {
        // If content is not a string, something went wrong
        console.error('Content is not a string:', typeof content, content);
        throw new Error(`Content field is not a string, got: ${typeof content}`);
      }
      
      // CRITICAL: Remove field labels that might be embedded in the content
      // Sometimes Gemini includes "Title:", "Excerpt:", "Content:" labels in the content field itself
      // This happens when the model doesn't follow JSON format and includes labels in the content string
      // The title and excerpt should NEVER be in the content - they're separate fields!
      
      // Log original content for debugging
      const originalContentLength = content.length;
      const originalContentStart = content.substring(0, 200);
      
      // Pattern 1: "Title: ... Excerpt: ... Content: ..." 
      // Can be all on same line, or Title/Excerpt on one line, Content on next
      // Most common: "Title: ... Excerpt: ...\nContent: ..."
      const titleExcerptContentPattern = content.match(/^(?:Title|title):\s*[^\n]+\s+(?:Excerpt|excerpt):\s*[^\n]+(?:\s+|\n+)(?:Content|content):\s*([\s\S]+)$/i);
      if (titleExcerptContentPattern) {
        content = titleExcerptContentPattern[1].trim();
        console.log('✅ Removed Title/Excerpt/Content labels (title+excerpt+content pattern)');
      } else {
        // Pattern 1b: All on same line with spaces
        const sameLinePattern = content.match(/^(?:Title|title):\s*[^\n]+\s+(?:Excerpt|excerpt):\s*[^\n]+\s+(?:Content|content):\s*([\s\S]+)$/i);
        if (sameLinePattern) {
          content = sameLinePattern[1].trim();
          console.log('✅ Removed Title/Excerpt/Content labels (same line pattern)');
        } else {
          // Pattern 1c: Compact (no spaces between labels)
          const compactPattern = content.match(/^(?:Title|title):\s*[^\n]+(?:Excerpt|excerpt):\s*[^\n]+(?:Content|content):\s*([\s\S]+)$/i);
          if (compactPattern) {
            content = compactPattern[1].trim();
            console.log('✅ Removed Title/Excerpt/Content labels (compact pattern)');
          } else {
            // Pattern 2: "Title: ...\nExcerpt: ...\nContent: ..." split across lines
            const multiLinePattern = content.match(/^(?:Title|title):\s*[^\n]+\n(?:Excerpt|excerpt):\s*[^\n]+\n(?:Content|content):\s*([\s\S]+)$/i);
            if (multiLinePattern) {
              content = multiLinePattern[1].trim();
              console.log('✅ Removed Title/Excerpt/Content labels (multi-line pattern)');
            } else {
              // Pattern 3: Just "Content: ..." at the start
              const contentOnlyPattern = content.match(/^(?:Content|content):\s*([\s\S]+)$/i);
              if (contentOnlyPattern) {
                content = contentOnlyPattern[1].trim();
                console.log('✅ Removed Content label');
              } else {
                // Fallback: aggressive cleanup - remove any labels and their values
                const beforeCleanup = content;
                content = content
                  // Remove "Title: ..." at the start (everything until Excerpt or Content or newline)
                  .replace(/^(?:Title|title):\s*[^\n]+?(?:\s+(?:Excerpt|excerpt|Content|content):|\n|$)/i, '')
                  // Remove "Excerpt: ..." (everything until Content or newline)
                  .replace(/(?:Excerpt|excerpt):\s*[^\n]+?(?:\s+(?:Content|content):|\n|$)/gi, '')
                  // Remove "Content:" label at the start
                  .replace(/^(?:Content|content):\s*/i, '')
                  // Remove any remaining labels that might appear anywhere in the content
                  .replace(/\n(?:Title|title|Excerpt|excerpt|Content|content):\s*[^\n]*(?:\n|$)/gi, '\n')
                  .trim();
                
                if (content !== beforeCleanup) {
                  console.log('✅ Removed labels using fallback cleanup');
                }
              }
            }
          }
        }
      }
      
      // Final safety check: if content still starts with something that looks like a title/excerpt, remove it
      // This catches cases where the pattern matching didn't work perfectly
      if (/^(?:Title|title|Excerpt|excerpt|Content|content):/i.test(content)) {
        console.warn('⚠️ Content still contains labels after cleanup, applying aggressive removal...');
        console.warn('Original content start:', originalContentStart);
        console.warn('Current content start:', content.substring(0, 200));
        
        // Find where actual content starts (after all labels)
        const contentStartMatch = content.match(/^(?:Title|title):\s*[^\n]+\s+(?:Excerpt|excerpt):\s*[^\n]+\s+(?:Content|content):\s*/i);
        if (contentStartMatch) {
          content = content.substring(contentStartMatch[0].length).trim();
          console.log('✅ Removed labels using content start match');
        } else {
          // Last resort: remove everything up to the first paragraph that doesn't look like a label
          const lastResortMatch = content.match(/^(?:Title|title|Excerpt|excerpt|Content|content):\s*[^\n]+(?:\s+[^\n]+)?\s*/i);
          if (lastResortMatch) {
            content = content.substring(lastResortMatch[0].length).trim();
            console.log('✅ Removed labels using last resort match');
          }
        }
      }
      
      // Log final result
      if (content.length !== originalContentLength) {
        console.log(`📝 Content cleaned: ${originalContentLength} → ${content.length} characters`);
        console.log(`📝 Final content start: ${content.substring(0, 100)}...`);
      }
      
      // Replace escaped newlines with actual newlines
      content = content.replace(/\\n/g, '\n');
      
      // Post-process markdown to ensure proper spacing
      // Add double newlines before headings if missing
      content = content.replace(/([^\n])\n(##+ )/g, '$1\n\n$2');
      // Add double newlines after headings if missing
      content = content.replace(/(##+ .+)\n([^\n#\s-])/g, '$1\n\n$2');
      // Add double newlines before lists if missing
      content = content.replace(/([^\n])\n([-*] )/g, '$1\n\n$2');
      // Add double newlines after lists if missing
      content = content.replace(/([-*] .+)\n([^\n-*\s#])/g, '$1\n\n$2');
      // Ensure paragraphs are separated (look for sentence endings followed by capital letters)
      content = content.replace(/([.!?])\n([A-Z])/g, '$1\n\n$2');
      // Clean up any triple+ newlines
      content = content.replace(/\n{3,}/g, '\n\n');
      
      content = content.trim();
      
      // Validate we have actual content
      if (!content || content.length === 0) {
        throw new Error('Content is empty after parsing');
      }
      
      console.log('Successfully parsed content:', {
        title: parsed.title,
        contentLength: content.length,
        contentPreview: content.substring(0, 100),
      });
      
      // Extract postType from parsed JSON, with fallback logic
      let postType: 'preview' | 'recap' | 'guide' | 'analysis' | 'gear' | 'travel' | 'lifestyle' = 'analysis';
      
      if (parsed.postType) {
        const validPostTypes = ['preview', 'recap', 'guide', 'analysis', 'gear', 'travel', 'lifestyle'];
        if (validPostTypes.includes(parsed.postType.toLowerCase())) {
          postType = parsed.postType.toLowerCase() as typeof postType;
        }
      } else {
        // Fallback: infer from context if postType not provided
        if (context.isRecap) {
          postType = 'recap';
        } else if (context.type === 'gear') {
          postType = 'gear';
        } else if (context.type === 'travel') {
          postType = 'preview'; // Tournament previews are travel type
        } else if (context.type === 'lifestyle') {
          postType = 'lifestyle';
        } else {
          postType = 'analysis';
        }
      }
      
      // Clean up title - remove tagline if it somehow got included
      let cleanTitle = parsed.title || context.topic;
      cleanTitle = cleanTitle.replace(/\s*\(Serve First\. Travel Always\.\)\s*/gi, '');
      cleanTitle = cleanTitle.replace(/\s*Serve First\. Travel Always\.\s*/gi, '');
      cleanTitle = cleanTitle.trim();
      
      // Clean up metaTitle too if it exists
      let cleanMetaTitle = parsed.metaTitle;
      if (cleanMetaTitle) {
        cleanMetaTitle = cleanMetaTitle.replace(/\s*\(Serve First\. Travel Always\.\)\s*/gi, '');
        cleanMetaTitle = cleanMetaTitle.replace(/\s*Serve First\. Travel Always\.\s*/gi, '');
        cleanMetaTitle = cleanMetaTitle.trim();
      }
      
      return {
        title: cleanTitle,
        excerpt: parsed.excerpt || '',
        content: content, // This should be just the markdown string
        postType,
        metaTitle: cleanMetaTitle,
        metaDescription: parsed.metaDescription,
        focusKeyword: parsed.focusKeyword,
        keywords: parsed.keywords || [],
        tags: parsed.tags || [],
      };
    } else {
      // Log the full response for debugging
      console.error('No JSON object found in response');
      console.error('Response length:', generatedText.length);
      console.error('First 500 chars:', generatedText.substring(0, 500));
      console.error('Last 500 chars:', generatedText.substring(Math.max(0, generatedText.length - 500)));
      if (parseError) {
        console.error('Last parse error:', parseError.message);
      }
      console.error('Full response (first 2000 chars):', generatedText.substring(0, 2000));
      
      // Strategy 5: Handle truncated JSON - try to fix unterminated strings
      if (parseError?.message?.includes('Unterminated string')) {
        console.log('Attempting to fix unterminated string in JSON...');
        
        // Find the content field and try to close it properly
        const contentFieldMatch = jsonText.match(/"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)/);
        if (contentFieldMatch) {
          // The content string is unterminated - try to extract what we have and close it
          const contentStartIdx = jsonText.indexOf('"content":');
          if (contentStartIdx !== -1) {
            // Find the opening quote after "content":
            const quoteStart = jsonText.indexOf('"', contentStartIdx + 10);
            if (quoteStart !== -1) {
              // Extract content up to the last complete sentence
              let contentEnd = jsonText.length;
              
              // Look backwards from end to find a good stopping point (sentence ending)
              for (let i = jsonText.length - 1; i > quoteStart + 100; i--) {
                if (jsonText.substring(i - 2, i + 1).match(/[.!?]\n/)) {
                  contentEnd = i + 1;
                  break;
                }
              }
              
              // Construct valid JSON by properly closing the content string
              const beforeContent = jsonText.substring(0, quoteStart + 1);
              let contentValue = jsonText.substring(quoteStart + 1, contentEnd)
                .replace(/\\/g, '\\\\')  // Escape backslashes
                .replace(/"/g, '\\"')    // Escape quotes
                .replace(/\n/g, '\\n')   // Escape newlines
                .replace(/\r/g, '\\r')   // Escape carriage returns
                .replace(/\t/g, '\\t');  // Escape tabs
              
              // Close the JSON properly
              const fixedJson = beforeContent + contentValue + '"}';
              
              try {
                parsed = JSON.parse(fixedJson);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                  console.log('Successfully fixed truncated JSON');
                  // Add note that content was truncated
                  if (parsed.content) {
                    parsed.content += '\n\n[Note: Content was truncated due to response length limits]';
                  }
                }
              } catch (e) {
                console.warn('Failed to fix truncated JSON:', e);
              }
            }
          }
        }
      }
      
      // Strategy 6: Extract partial data if JSON is completely broken
      if (!parsed) {
        console.log('Attempting to extract partial data from broken JSON...');
        
        const titleMatch = jsonText.match(/"title"\s*:\s*"([^"]+)"/);
        const excerptMatch = jsonText.match(/"excerpt"\s*:\s*"([^"]+)"/);
        
        // Try to extract content even if unterminated
        let contentValue = '';
        const contentStartMatch = jsonText.match(/"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)/);
        if (contentStartMatch) {
          // Extract content and clean it up
          contentValue = contentStartMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        }
        
        if (titleMatch || excerptMatch || contentValue) {
          parsed = {
            title: titleMatch ? titleMatch[1] : context.topic,
            excerpt: excerptMatch ? excerptMatch[1] : '',
            content: contentValue || 'Content generation was truncated. The post title and excerpt were extracted, but the full content could not be recovered. Please try generating again.',
          };
          console.log('Extracted partial data from broken JSON');
        }
      }
      
      // Strategy 7: Last resort - try to parse from first { to end, then work backwards
      if (!parsed) {
        const firstBrace = jsonText.indexOf('{');
        if (firstBrace !== -1) {
          // Try to parse everything from first { to end, then work backwards
          for (let endIdx = jsonText.length; endIdx > firstBrace + 100; endIdx -= 50) {
            const candidate = jsonText.substring(firstBrace, endIdx);
            try {
              const testParsed = JSON.parse(candidate);
              if (testParsed && typeof testParsed === 'object' && !Array.isArray(testParsed) && testParsed.title) {
                console.log('Found valid JSON by working backwards from end');
                parsed = testParsed;
                break;
              }
            } catch {
              // Continue trying
            }
          }
        }
      }
      
      if (!parsed) {
        throw new Error(`No JSON object found in response. Last error: ${parseError?.message || 'unknown'}`);
      }
    }
  } catch (error: any) {
    console.error('Error parsing Gemini response:', error);
    console.error('Error message:', error.message);
    console.error('Raw response (first 1000 chars):', generatedText.substring(0, 1000));
    if (error.message && error.message.includes('JSON')) {
      // Re-throw JSON parsing errors with more context
      throw new Error(`Failed to parse JSON from Gemini response: ${error.message}`);
    }
    throw error; // Re-throw so we know parsing failed
  }

  // If we get here, parsing completely failed
  // This should not happen - throw error instead of returning bad data
  throw new Error('Failed to parse Gemini response - no valid JSON found');
}
