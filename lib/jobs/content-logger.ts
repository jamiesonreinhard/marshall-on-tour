/**
 * Content Intelligence Logger
 * 
 * Comprehensive logging for content generation process
 * Tracks opportunities, data sources, prompts, and decisions
 */

import { createAdminSupabase } from '@/lib/supabase/server';
import { ContentOpportunity } from './scoring';

export interface ContentGenerationLog {
  job_id: string;
  timestamp: string;
  
  // Opportunities
  opportunities_found: number;
  opportunities: Array<{
    type: string;
    topic: string;
    score: number;
    timeliness: number;
    affiliatePotential: number;
    seoValue: number;
    contentVariety: number;
    socialEngagement: number;
    metadata?: Record<string, any>;
  }>;
  selected_opportunity?: {
    type: string;
    topic: string;
    score: number;
    reason: string;
  };
  
  // Posting Status
  posting_status: {
    canPostBlog: boolean;
    canPostSocial: boolean;
    reason?: string;
  };
  
  // Handler Data Gathering
  handler_type?: string;
  data_sources?: string[];
  data_gathered?: {
    players?: number;
    matches?: number;
    news?: number;
    videos?: number;
    weather?: boolean;
    hotels?: number;
    restaurants?: number;
    coffee_shops?: number;
    historical_player?: string;
    gear_items?: number;
  };
  
  // Prompt Information
  prompt_info?: {
    context_type: string;
    topic: string;
    has_tournament: boolean;
    has_players: boolean;
    has_news: boolean;
    has_weather: boolean;
    has_historical_data: boolean;
    has_gear_data: boolean;
    prompt_length_chars: number;
    estimated_tokens: number;
  };
  
  // Generation Results
  generation_result?: {
    success: boolean;
    post_id?: string;
    title?: string;
    content_length?: number;
    fact_check_issues?: number;
    editor_changes?: boolean;
    error?: string;
  };
  
  // Missing Data (what Gemini had to figure out)
  missing_data?: {
    player_stats?: boolean;
    match_results?: boolean;
    weather_data?: boolean;
    historical_context?: boolean;
    gear_specs?: boolean;
    location_info?: boolean;
  };
}

let currentLog: ContentGenerationLog | null = null;

/**
 * Start a new content generation log
 */
export function startContentLog(): string {
  const jobId = `ci-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  currentLog = {
    job_id: jobId,
    timestamp: new Date().toISOString(),
    opportunities_found: 0,
    opportunities: [],
    posting_status: {
      canPostBlog: false,
      canPostSocial: false,
    },
  };
  
  return jobId;
}

/**
 * Log opportunities found
 */
export function logOpportunities(opportunities: ContentOpportunity[]) {
  if (!currentLog) return;
  
  currentLog.opportunities_found = opportunities.length;
  currentLog.opportunities = opportunities.map(opp => ({
    type: opp.type,
    topic: opp.topic,
    score: opp.totalScore,
    timeliness: opp.timeliness,
    affiliatePotential: opp.affiliatePotential,
    seoValue: opp.seoValue,
    contentVariety: opp.contentVariety,
    socialEngagement: opp.socialEngagement,
    metadata: opp.metadata,
  }));
}

/**
 * Log selected opportunity
 */
export function logSelectedOpportunity(opportunity: ContentOpportunity, reason: string) {
  if (!currentLog) return;
  
  currentLog.selected_opportunity = {
    type: opportunity.type,
    topic: opportunity.topic,
    score: opportunity.totalScore,
    reason,
  };
}

/**
 * Log posting status
 */
export function logPostingStatus(status: { canPostBlog: boolean; canPostSocial: boolean; reason?: string }) {
  if (!currentLog) return;
  
  currentLog.posting_status = status;
}

/**
 * Log handler data gathering
 */
export function logHandlerData(handlerType: string, dataSources: string[], dataGathered: Record<string, any>) {
  if (!currentLog) return;
  
  currentLog.handler_type = handlerType;
  currentLog.data_sources = dataSources;
  
  const data: any = {};
  if (dataGathered.players) data.players = Array.isArray(dataGathered.players) ? dataGathered.players.length : 1;
  if (dataGathered.matches) data.matches = Array.isArray(dataGathered.matches) ? dataGathered.matches.length : 1;
  if (dataGathered.news) data.news = Array.isArray(dataGathered.news) ? dataGathered.news.length : 1;
  if (dataGathered.videos) data.videos = Array.isArray(dataGathered.videos) ? dataGathered.videos.length : 1;
  if (dataGathered.weather) data.weather = true;
  if (dataGathered.hotels) data.hotels = Array.isArray(dataGathered.hotels) ? dataGathered.hotels.length : 1;
  if (dataGathered.restaurants) data.restaurants = Array.isArray(dataGathered.restaurants) ? dataGathered.restaurants.length : 1;
  if (dataGathered.coffeeShops) data.coffee_shops = Array.isArray(dataGathered.coffeeShops) ? dataGathered.coffeeShops.length : 1;
  if (dataGathered.historicalPlayer) data.historical_player = dataGathered.historicalPlayer.name || dataGathered.historicalPlayer.fullName;
  if (dataGathered.gearItems) data.gear_items = Array.isArray(dataGathered.gearItems) ? dataGathered.gearItems.length : 1;
  
  currentLog.data_gathered = data;
}

/**
 * Log prompt information
 */
export function logPromptInfo(context: any, promptLength: number) {
  if (!currentLog) return;
  
  currentLog.prompt_info = {
    context_type: context.type || 'unknown',
    topic: context.topic || 'unknown',
    has_tournament: !!context.tournament,
    has_players: !!(context.players && context.players.length > 0),
    has_news: !!(context.tournamentNews || context.recentNews),
    has_weather: !!context.weather,
    has_historical_data: !!context.historicalPlayer,
    has_gear_data: !!(context.gearData && context.gearData.length > 0),
    prompt_length_chars: promptLength,
    estimated_tokens: Math.ceil(promptLength / 4), // Rough estimate: 4 chars per token
  };
}

/**
 * Log missing data (what Gemini had to figure out)
 */
export function logMissingData(missing: {
  player_stats?: boolean;
  match_results?: boolean;
  weather_data?: boolean;
  historical_context?: boolean;
  gear_specs?: boolean;
  location_info?: boolean;
}) {
  if (!currentLog) return;
  
  currentLog.missing_data = missing;
}

/**
 * Log generation result
 */
export function logGenerationResult(result: {
  success: boolean;
  post_id?: string;
  title?: string;
  content_length?: number;
  fact_check_issues?: number;
  editor_changes?: boolean;
  error?: string;
}) {
  if (!currentLog) return;
  
  currentLog.generation_result = result;
}

/**
 * Save log to database and return it
 */
export async function saveContentLog(): Promise<ContentGenerationLog | null> {
  if (!currentLog) return null;
  
  const log = { ...currentLog };
  
  try {
    const supabase = createAdminSupabase();
    
    // Insert log into database
    const { error: insertError } = await supabase
      .from('content_logs')
      .insert({
        job_id: log.job_id,
        timestamp: log.timestamp,
        log_data: log,
      });
    
    if (insertError) {
      // Table might not exist, log to console for now
      console.warn('[Content Logger] Could not save to database:', insertError.message);
      console.log('[Content Logger] Full log:', JSON.stringify(log, null, 2));
    } else {
      console.log(`[Content Logger] ✅ Saved log: ${log.job_id}`);
    }
  } catch (error) {
    console.warn('[Content Logger] Error saving log:', error);
    console.log('[Content Logger] Full log:', JSON.stringify(log, null, 2));
  }
  
  // Reset current log
  currentLog = null;
  
  return log;
}

/**
 * Get current log (for debugging)
 */
export function getCurrentLog(): ContentGenerationLog | null {
  return currentLog;
}

/**
 * Print formatted log summary
 */
export function printLogSummary() {
  if (!currentLog) {
    console.log('[Content Logger] No active log');
    return;
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 CONTENT GENERATION LOG SUMMARY');
  console.log('='.repeat(80));
  console.log(`Job ID: ${currentLog.job_id}`);
  console.log(`Timestamp: ${currentLog.timestamp}`);
  console.log(`\nOpportunities Found: ${currentLog.opportunities_found}`);
  
  if (currentLog.opportunities.length > 0) {
    console.log('\nTop Opportunities:');
    currentLog.opportunities.slice(0, 5).forEach((opp, idx) => {
      console.log(`  ${idx + 1}. [${opp.type}] ${opp.topic} (Score: ${opp.score})`);
      console.log(`     Timeliness: ${opp.timeliness}, Affiliate: ${opp.affiliatePotential}, SEO: ${opp.seoValue}, Variety: ${opp.contentVariety}, Social: ${opp.socialEngagement}`);
    });
  }
  
  if (currentLog.selected_opportunity) {
    console.log(`\n✅ Selected: [${currentLog.selected_opportunity.type}] ${currentLog.selected_opportunity.topic}`);
    console.log(`   Score: ${currentLog.selected_opportunity.score}`);
    console.log(`   Reason: ${currentLog.selected_opportunity.reason}`);
  }
  
  console.log(`\nPosting Status: Blog=${currentLog.posting_status.canPostBlog}, Social=${currentLog.posting_status.canPostSocial}`);
  if (currentLog.posting_status.reason) {
    console.log(`   Reason: ${currentLog.posting_status.reason}`);
  }
  
  if (currentLog.handler_type) {
    console.log(`\nHandler: ${currentLog.handler_type}`);
    if (currentLog.data_sources && currentLog.data_sources.length > 0) {
      console.log(`Data Sources: ${currentLog.data_sources.join(', ')}`);
    }
    if (currentLog.data_gathered) {
      console.log('Data Gathered:');
      Object.entries(currentLog.data_gathered).forEach(([key, value]) => {
        console.log(`  - ${key}: ${value}`);
      });
    }
  }
  
  if (currentLog.prompt_info) {
    console.log('\nPrompt Info:');
    console.log(`  Type: ${currentLog.prompt_info.context_type}`);
    console.log(`  Length: ${currentLog.prompt_info.prompt_length_chars.toLocaleString()} chars (~${currentLog.prompt_info.estimated_tokens.toLocaleString()} tokens)`);
    console.log(`  Has Tournament: ${currentLog.prompt_info.has_tournament}`);
    console.log(`  Has Players: ${currentLog.prompt_info.has_players}`);
    console.log(`  Has News: ${currentLog.prompt_info.has_news}`);
    console.log(`  Has Weather: ${currentLog.prompt_info.has_weather}`);
    console.log(`  Has Historical Data: ${currentLog.prompt_info.has_historical_data}`);
    console.log(`  Has Gear Data: ${currentLog.prompt_info.has_gear_data}`);
  }
  
  if (currentLog.missing_data) {
    console.log('\n⚠️  Missing Data (Gemini had to figure out):');
    Object.entries(currentLog.missing_data).forEach(([key, value]) => {
      if (value) {
        console.log(`  - ${key.replace(/_/g, ' ')}`);
      }
    });
  }
  
  if (currentLog.generation_result) {
    console.log('\nGeneration Result:');
    const result = currentLog.generation_result;
    console.log(`  Success: ${result.success}`);
    if (result.post_id) {
      console.log(`  Post ID: ${result.post_id}`);
      console.log(`  Title: ${result.title}`);
      console.log(`  Content Length: ${result.content_length?.toLocaleString()} chars`);
    }
    if (result.fact_check_issues !== undefined) {
      console.log(`  Fact-Check Issues: ${result.fact_check_issues}`);
    }
    if (result.editor_changes) {
      console.log(`  Editor Made Changes: Yes`);
    }
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  }
  
  console.log('='.repeat(80) + '\n');
}
