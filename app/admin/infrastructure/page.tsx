'use client';

import { useState, useEffect } from 'react';

interface TableInfo {
  name: string;
  description: string;
  columns: Array<{
    name: string;
    type: string;
    nullable: boolean;
    description?: string;
  }>;
}

interface APIInfo {
  path: string;
  method: string;
  description: string;
  status: 'active' | 'planned';
}

interface IntegrationInfo {
  name: string;
  type: 'api' | 'service';
  description: string;
  when: string;
  why: string;
  status: 'active' | 'configured' | 'planned' | 'trial';
  envVar?: string;
  notes?: string;
}

interface BackgroundJob {
  name: string;
  description: string;
  schedule: string;
  status: 'active' | 'planned';
  endpoint?: string;
}

interface SocialPlatform {
  name: string;
  handle?: string;
  status: 'active' | 'planned';
  postingSchedule?: string;
  lastPost?: string;
}

interface AffiliatePartner {
  name: string;
  type: string;
  status: 'active' | 'pending' | 'planned';
  commission?: string;
}

export default function InfrastructurePage() {
  const [activeTab, setActiveTab] = useState('database');
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDatabaseSchema();
  }, []);

  const loadDatabaseSchema = async () => {
    try {
      // We'll define the schema manually since we can't easily query Supabase schema
      const schema: TableInfo[] = [
        {
          name: 'posts',
          description: 'Blog posts for Marshall\'s tennis blog. Stores all published and draft posts with SEO metadata, affiliate links, and publishing status.',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, description: 'Primary key' },
            { name: 'slug', type: 'text', nullable: false, description: 'URL-friendly post identifier' },
            { name: 'title', type: 'text', nullable: false, description: 'Post title' },
            { name: 'excerpt', type: 'text', nullable: false, description: 'Short description for previews' },
            { name: 'content', type: 'text', nullable: false, description: 'Full post content (markdown)' },
            { name: 'category', type: 'text', nullable: false, description: 'Gear, Travel, Analysis, or Lifestyle' },
            { name: 'featured_image', type: 'text', nullable: false, description: 'URL to featured image' },
            { name: 'meta_title', type: 'text', nullable: true, description: 'SEO meta title' },
            { name: 'meta_description', type: 'text', nullable: true, description: 'SEO meta description' },
            { name: 'focus_keyword', type: 'text', nullable: true, description: 'Primary SEO keyword' },
            { name: 'keywords', type: 'text[]', nullable: true, description: 'Array of SEO keywords' },
            { name: 'tags', type: 'text[]', nullable: true, description: 'Content tags' },
            { name: 'published', type: 'boolean', nullable: false, description: 'Whether post is published' },
            { name: 'published_at', type: 'timestamp', nullable: true, description: 'Publication timestamp' },
            { name: 'affiliate_links', type: 'jsonb', nullable: true, description: 'Array of affiliate link objects' },
            { name: 'created_at', type: 'timestamp', nullable: false, description: 'Creation timestamp' },
            { name: 'updated_at', type: 'timestamp', nullable: false, description: 'Last update timestamp' },
          ],
        },
        {
          name: 'atp_calendar',
          description: 'ATP tournament schedule synced from Sportradar API. Source of truth for tournament dates, locations, and details.',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, description: 'Primary key' },
            { name: 'tournament_id', type: 'text', nullable: false, description: 'Sportradar tournament ID (unique)' },
            { name: 'name', type: 'text', nullable: false, description: 'Tournament name' },
            { name: 'start_date', type: 'date', nullable: false, description: 'Tournament start date' },
            { name: 'end_date', type: 'date', nullable: false, description: 'Tournament end date' },
            { name: 'location', type: 'jsonb', nullable: false, description: 'City, country, venue info' },
            { name: 'category', type: 'text', nullable: true, description: 'ATP 250, 500, 1000, or Grand Slam' },
            { name: 'surface', type: 'text', nullable: true, description: 'Hard, Clay, or Grass' },
            { name: 'prize_money', type: 'text', nullable: true, description: 'Prize money information' },
            { name: 'last_synced_at', type: 'timestamp', nullable: true, description: 'Last sync from Sportradar' },
            { name: 'created_at', type: 'timestamp', nullable: false, description: 'Creation timestamp' },
            { name: 'updated_at', type: 'timestamp', nullable: false, description: 'Last update timestamp' },
          ],
        },
        {
          name: 'content_calendar',
          description: 'Content planning calendar. Stores planned blog posts, social media posts, and multi-channel content schedules.',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, description: 'Primary key' },
            { name: 'scheduled_date', type: 'date', nullable: false, description: 'Date content should be published' },
            { name: 'scheduled_time', type: 'time', nullable: true, description: 'Specific time to publish' },
            { name: 'atp_tournament_id', type: 'uuid', nullable: true, description: 'Linked tournament (FK to atp_calendar)' },
            { name: 'events', type: 'text[]', nullable: true, description: 'Array of events (e.g., "Australian Open Final")' },
            { name: 'content_brief', type: 'text', nullable: false, description: 'Description of what to write' },
            { name: 'post_type', type: 'text', nullable: true, description: 'blog, instagram, x, or all' },
            { name: 'category', type: 'text', nullable: true, description: 'Gear, Travel, Analysis, or Lifestyle' },
            { name: 'blog_schedule', type: 'jsonb', nullable: true, description: 'Blog publishing schedule config' },
            { name: 'instagram_schedule', type: 'jsonb', nullable: true, description: 'Instagram posting schedule' },
            { name: 'x_schedule', type: 'jsonb', nullable: true, description: 'Twitter/X posting schedule' },
            { name: 'attitude', type: 'text', nullable: true, description: 'Marshall\'s tone (stoked, analytical, etc.)' },
            { name: 'status', type: 'text', nullable: false, description: 'planned, approved, in_progress, published, cancelled' },
            { name: 'generated_post_id', type: 'uuid', nullable: true, description: 'Link to generated post (FK to posts)' },
            { name: 'created_at', type: 'timestamp', nullable: false, description: 'Creation timestamp' },
            { name: 'updated_at', type: 'timestamp', nullable: false, description: 'Last update timestamp' },
          ],
        },
        {
          name: 'marshall_state',
          description: 'Tracks Marshall\'s current state (gear, location, preferences) for authentic content generation and website display. Singleton table (only one row).',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, description: 'Primary key' },
            { name: 'current_racket', type: 'text', nullable: true, description: 'Racket Marshall is currently using' },
            { name: 'current_racket_affiliate_link', type: 'text', nullable: true, description: 'Affiliate link for current racket' },
            { name: 'current_shoes', type: 'text', nullable: true, description: 'Shoes Marshall is currently wearing' },
            { name: 'current_shoes_affiliate_link', type: 'text', nullable: true, description: 'Affiliate link for current shoes' },
            { name: 'other_gear', type: 'jsonb', nullable: true, description: 'Other gear (bag, strings, grip, etc.)' },
            { name: 'current_city', type: 'text', nullable: true, description: 'City Marshall is currently in' },
            { name: 'current_country', type: 'text', nullable: true, description: 'Country Marshall is currently in' },
            { name: 'current_hotel', type: 'text', nullable: true, description: 'Hotel Marshall is staying at' },
            { name: 'current_hotel_affiliate_link', type: 'text', nullable: true, description: 'Affiliate link for current hotel' },
            { name: 'current_coffee_shop', type: 'text', nullable: true, description: 'Coffee shop Marshall is frequenting' },
            { name: 'arrived_at', type: 'timestamp', nullable: true, description: 'When Marshall arrived at current location' },
            { name: 'leaving_at', type: 'timestamp', nullable: true, description: 'When Marshall is leaving current location' },
            { name: 'next_city', type: 'text', nullable: true, description: 'Next city Marshall is traveling to' },
            { name: 'next_country', type: 'text', nullable: true, description: 'Next country Marshall is traveling to' },
            { name: 'next_tournament_id', type: 'uuid', nullable: true, description: 'Next tournament (FK to atp_calendar)' },
            { name: 'traveling_to_at', type: 'timestamp', nullable: true, description: 'When Marshall is traveling to next location' },
            { name: 'favorite_players', type: 'text[]', nullable: true, description: 'Array of Marshall\'s favorite players' },
            { name: 'up_and_coming_player_watching', type: 'text', nullable: true, description: 'Rising star Marshall is keeping an eye on' },
            { name: 'favorite_tournaments', type: 'text[]', nullable: true, description: 'Array of Marshall\'s favorite tournaments' },
            { name: 'current_interests', type: 'text[]', nullable: true, description: 'Current topics Marshall is interested in' },
            { name: 'updated_at', type: 'timestamp', nullable: false, description: 'Last update timestamp' },
            { name: 'updated_by', type: 'text', nullable: false, description: 'Who updated this (system or manual)' },
            { name: 'notes', type: 'text', nullable: true, description: 'Additional context' },
          ],
        },
        {
          name: 'gear_items',
          description: 'Product database for gear guides and quizzes. Stores rackets, apparel, and accessories with specifications, pros/cons, affiliate links, and "best for" recommendations.',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, description: 'Primary key' },
            { name: 'name', type: 'text', nullable: false, description: 'Product name (e.g., "Blade 98")' },
            { name: 'brand', type: 'text', nullable: false, description: 'Brand name (e.g., "Wilson")' },
            { name: 'type', type: 'text', nullable: false, description: 'racket, apparel, bag, strings, grip, or shoes' },
            { name: 'category', type: 'text', nullable: true, description: 'racket-control, racket-power, shorts, shoes, etc.' },
            { name: 'specifications', type: 'jsonb', nullable: true, description: 'Flexible specs (head_size, weight, string_pattern, etc.)' },
            { name: 'price_range', type: 'text', nullable: true, description: 'Price range (e.g., "$200-250")' },
            { name: 'amazon_affiliate_link', type: 'text', nullable: true, description: 'Amazon Associates affiliate link' },
            { name: 'description', type: 'text', nullable: true, description: 'Product description' },
            { name: 'pros', type: 'text[]', nullable: true, description: 'Array of pros/advantages' },
            { name: 'cons', type: 'text[]', nullable: true, description: 'Array of cons/disadvantages' },
            { name: 'best_for', type: 'text', nullable: true, description: 'Who this product suits (e.g., "control players", "beginners")' },
            { name: 'created_at', type: 'timestamp', nullable: false, description: 'Creation timestamp' },
            { name: 'updated_at', type: 'timestamp', nullable: false, description: 'Last update timestamp' },
          ],
        },
        {
          name: 'api_costs',
          description: 'Tracks API spending across all services (Gemini, Google Maps, Replicate, etc.) for budget monitoring. Budget: $20/week.',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, description: 'Primary key' },
            { name: 'service', type: 'text', nullable: false, description: 'Service name (gemini, google-maps, replicate, etc.)' },
            { name: 'operation', type: 'text', nullable: false, description: 'Operation type (generate-post, generate-image, etc.)' },
            { name: 'cost', type: 'numeric', nullable: false, description: 'Cost in USD' },
            { name: 'metadata', type: 'jsonb', nullable: true, description: 'Additional context (tokens, model, etc.)' },
            { name: 'created_at', type: 'timestamp', nullable: false, description: 'When cost was incurred' },
          ],
        },
        {
          name: 'job_logs',
          description: 'Execution logs for all background jobs. Tracks runs, status, duration, and results for debugging and monitoring.',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, description: 'Primary key' },
            { name: 'job_name', type: 'text', nullable: false, description: 'Job name (content-intelligence, etc.)' },
            { name: 'job_type', type: 'text', nullable: false, description: 'scheduled, manual, or api' },
            { name: 'status', type: 'text', nullable: false, description: 'success, error, or skipped' },
            { name: 'started_at', type: 'timestamp', nullable: false, description: 'When job started' },
            { name: 'completed_at', type: 'timestamp', nullable: true, description: 'When job completed' },
            { name: 'duration_ms', type: 'integer', nullable: true, description: 'Duration in milliseconds' },
            { name: 'result', type: 'jsonb', nullable: true, description: 'Job result/output' },
            { name: 'error_message', type: 'text', nullable: true, description: 'Error message if failed' },
            { name: 'metadata', type: 'jsonb', nullable: true, description: 'Additional metadata (triggered_by, job_id, etc.)' },
          ],
        },
        {
          name: 'content_logs',
          description: 'Detailed content generation logs. Tracks opportunities found, data sources used, prompts, and generation results for comprehensive debugging and refinement.',
          columns: [
            { name: 'id', type: 'uuid', nullable: false, description: 'Primary key' },
            { name: 'job_id', type: 'text', nullable: false, description: 'Unique job identifier (links to job_logs metadata)' },
            { name: 'timestamp', type: 'timestamp', nullable: false, description: 'When log was created' },
            { name: 'log_data', type: 'jsonb', nullable: false, description: 'Full log data: opportunities, data sources, prompts, results' },
            { name: 'created_at', type: 'timestamp', nullable: false, description: 'Record creation timestamp' },
          ],
        },
      ];
      setTables(schema);
    } catch (error) {
      console.error('Failed to load schema:', error);
    } finally {
      setLoading(false);
    }
  };

  const apiRoutes: APIInfo[] = [
    {
      path: '/api/posts/generate',
      method: 'POST',
      description: 'Generate blog post using Gemini AI. Auto-selects topic or accepts manual type/topic/tournament. Supports post type selection (tournament, player, gear, lifestyle, etc.).',
      status: 'active',
    },
    {
      path: '/api/calendar/entries',
      method: 'GET, POST',
      description: 'Get or create content calendar entries. Supports date range and status filtering.',
      status: 'active',
    },
    {
      path: '/api/calendar/entries/[id]',
      method: 'PATCH, DELETE',
      description: 'Update or delete a specific calendar entry.',
      status: 'active',
    },
    {
      path: '/api/calendar/sync-atp',
      method: 'GET, POST',
      description: 'Sync ATP tournament calendar from Sportradar API. GET shows current tournaments, POST triggers sync.',
      status: 'active',
    },
    {
      path: '/api/revalidate',
      method: 'POST',
      description: 'On-demand ISR revalidation for blog posts. Triggers Next.js to regenerate static pages.',
      status: 'active',
    },
    {
      path: '/api/debug/data-sources',
      method: 'GET',
      description: 'Debug endpoint to view raw data from Sportradar and RSS feeds.',
      status: 'active',
    },
    {
      path: '/api/jobs/content-intelligence',
      method: 'GET, POST',
      description: 'Content Intelligence Job. GET evaluates opportunities, POST generates post from best opportunity. Runs daily at 6 AM CT via Vercel Cron.',
      status: 'active',
    },
    {
      path: '/api/cron/content-intelligence',
      method: 'GET',
      description: 'Cron endpoint for Content Intelligence job. Called by Vercel Cron daily at 12 PM UTC (6 AM CT).',
      status: 'active',
    },
    {
      path: '/api/jobs/logs',
      method: 'GET',
      description: 'Get job execution logs. Returns status, duration, and results for all background jobs.',
      status: 'active',
    },
    {
      path: '/api/jobs/content-logs',
      method: 'GET',
      description: 'Get detailed content generation logs. Returns comprehensive breakdown of opportunities, data sources, prompts, and results.',
      status: 'active',
    },
    {
      path: '/api/posts/[id]',
      method: 'DELETE',
      description: 'Delete a blog post by ID. Revalidates blog pages after deletion.',
      status: 'active',
    },
    {
      path: '/api/debug/posts',
      method: 'GET',
      description: 'Debug endpoint to check posts in database (published and unpublished).',
      status: 'active',
    },
    {
      path: '/api/debug/gemini-models',
      method: 'GET',
      description: 'Debug endpoint to test Gemini API model availability.',
      status: 'active',
    },
    {
      path: '/api/calendar/generate-scheduled',
      method: 'POST',
      description: 'Generate posts from approved calendar entries. Should run daily via cron.',
      status: 'planned',
    },
    {
      path: '/api/calendar/plan-week',
      method: 'POST',
      description: 'Weekly planning job that auto-generates calendar entries for upcoming tournaments.',
      status: 'planned',
    },
  ];

  const integrations: IntegrationInfo[] = [
    {
      name: 'Sportradar API',
      type: 'api',
      description: 'Tennis tournament data, schedules, rankings, match results (Trial: 1,000 quota, expires 03/02/2026)',
      when: 'On-demand (sync button) and weekly cron. Falls back to mock data when quota exhausted or USE_MOCK_DATA=true',
      why: 'Real tournament data for grounded content. Mock data available for development.',
      status: 'trial',
      envVar: 'SPORTRADAR_API_KEY',
      notes: 'Set USE_MOCK_DATA=true to preserve quota during development',
    },
    {
      name: 'Google Gemini AI',
      type: 'api',
      description: 'Content generation for blog posts',
      when: 'On-demand when generating posts',
      why: 'AI-powered content generation with Marshall\'s voice',
      status: 'active',
      envVar: 'GEMINI_API_KEY',
    },
    {
      name: 'Unsplash API',
      type: 'api',
      description: 'Free stock images for non-Marshall posts (recaps, previews, gear guides, player profiles). Reduces AI costs by 80-90%.',
      when: 'On-demand when generating posts (only if Marshall not included)',
      why: 'Authentic photography for tournament recaps and previews. Free alternative to AI generation.',
      status: 'active',
      envVar: 'UNSPLASH_ACCESS_KEY',
      notes: 'Free tier: 50 requests/hour. Used for recaps, previews, gear guides, player profiles. Falls back to AI if no match found.',
    },
    {
      name: 'Replicate/Flux',
      type: 'api',
      description: 'AI image generation for blog post featured images. Uses flux-pulid for face consistency when Marshall is included.',
      when: 'On-demand when generating posts (only if Marshall included or stock image unavailable)',
      why: 'Consistent Marshall visuals with face ID technology. Varied scene selection for lifestyle/analysis posts.',
      status: 'active',
      envVar: 'REPLICATE_API_TOKEN',
      notes: 'Face reference image stored in Supabase Storage. Strategy-based image generation with scene variety (8 lifestyle scenes, 5 analysis scenes). Only used when Marshall needs to appear.',
    },
    {
      name: 'RSS Feeds',
      type: 'service',
      description: 'Tennis news from ESPN, BBC, Tennis.com. Parses RSS feeds for breaking news.',
      when: 'Content Intelligence job (daily)',
      why: 'Real news data for timely content',
      status: 'active',
      notes: 'Cached 1 hour. Falls back to mock data if feeds unavailable.',
    },
    {
      name: 'Open-Meteo API',
      type: 'api',
      description: 'Weather data for tournament locations (temperature, conditions, forecast). Free, no API key required.',
      when: 'When generating travel/tournament posts or lifestyle content',
      why: 'Real weather data for grounded content',
      status: 'active',
      notes: 'Cached 6 hours. Free tier, no API key needed. Falls back to mock data.',
    },
    {
      name: 'Google Maps API',
      type: 'api',
      description: 'Hotel locations, coffee shops, restaurants, walking routes near tournaments',
      when: 'When generating lifestyle posts (hotels, coffee, walks)',
      why: 'Real location data for grounded content and affiliate links',
      status: 'active',
      envVar: 'GOOGLE_MAPS_API_KEY',
      notes: 'Cached 24 hours. Uses Places API and Directions API. Falls back to mock data.',
    },
    {
      name: 'YouTube Data API',
      type: 'api',
      description: 'Find tennis highlights and classic match videos for "Blast from the Past" posts',
      when: 'When generating historical/classic match content',
      why: 'Embed YouTube videos in posts for engagement',
      status: 'active',
      envVar: 'YOUTUBE_API_KEY',
      notes: 'Cached 24 hours. Free tier: 10,000 units/day. Falls back to mock data.',
    },
    {
      name: 'Sportradar Match Data',
      type: 'api',
      description: 'Match schedules and results (extends existing Sportradar integration)',
      when: 'Match Monitor job (every 30 min during tournaments)',
      why: 'Real-time match data for match-timed posts',
      status: 'trial',
      envVar: 'SPORTRADAR_API_KEY',
      notes: 'Trial expires 03/02/2026. Free alternatives: ATP website scraping, FlashScore scraping, RSS parsing, or manual entry. See free-tennis-data-strategy.md',
    },
    {
      name: 'Player Data',
      type: 'api',
      description: 'Player rankings, profiles, head-to-head records',
      when: 'When generating player spotlights or match previews',
      why: 'Accurate player data for analysis',
      status: 'planned',
      notes: 'Will use ATP website scraping (weekly rankings) or manual entry. Free alternative to Sportradar. Cached 1 hour. Falls back to mock data.',
    },
    {
      name: 'Gear Data',
      type: 'service',
      description: 'Product database (gear_items table) for gear guides and quizzes. Sourced from existing web guides.',
      when: 'When generating gear comparison guides (infrequent: 45-day minimum)',
      why: 'Accurate product data for gear guides, affiliate links, and future quizzes',
      status: 'configured',
      notes: 'Database created. Need to source and populate product data from existing guides (Tennis Warehouse, Tennis Express, etc.).',
    },
    {
      name: 'Booking.com API',
      type: 'api',
      description: 'Hotel prices and availability (optional, for real-time pricing)',
      when: 'When generating hotel guides',
      why: 'Real pricing data for affiliate links',
      status: 'planned',
      notes: 'May not be needed if using static affiliate links.',
    },
  ];

  const backgroundJobs: BackgroundJob[] = [
    {
      name: 'Content Intelligence',
      description: 'Evaluates content opportunities and generates the highest-value post. Checks active tournaments, calendar entries, Marshall\'s state, and scores opportunities.',
      schedule: 'Daily at 6 AM CT (12 PM UTC)',
      status: 'active',
      endpoint: '/api/jobs/content-intelligence',
    },
    {
      name: 'ATP Calendar Sync',
      description: 'Sync tournament schedule from Sportradar API or static calendar to atp_calendar table',
      schedule: 'Weekly (Sunday 12:00 AM UTC) or manual',
      status: 'active',
      endpoint: '/api/calendar/sync-atp',
    },
    {
      name: 'Match Monitor',
      description: 'Monitors big matches and posts before, during, and after. Detects finals, semis, top player matchups.',
      schedule: 'Every 30 minutes during active tournaments',
      status: 'planned',
      endpoint: '/api/jobs/match-monitor',
    },
    {
      name: 'Weekly Content Planning',
      description: 'Auto-generate content calendar entries for upcoming week based on ATP schedule',
      schedule: 'Weekly (Sunday 9:00 PM UTC)',
      status: 'planned',
      endpoint: '/api/calendar/plan-week',
    },
    {
      name: 'Daily Content Generation',
      description: 'Generate posts from approved calendar entries that are due today',
      schedule: 'Daily (6 AM UTC)',
      status: 'planned',
      endpoint: '/api/calendar/generate-scheduled',
    },
    {
      name: 'Social Post Scheduler',
      description: 'Auto-creates and schedules social posts from blog posts. Also creates standalone social posts.',
      schedule: 'Triggered after blog post creation',
      status: 'planned',
      endpoint: '/api/social/schedule',
    },
  ];

  const socialPlatforms: SocialPlatform[] = [
    {
      name: 'Instagram',
      handle: '@marshallontour',
      status: 'planned',
      postingSchedule: '5-7 posts/week',
    },
    {
      name: 'Twitter/X',
      handle: '@marshallontour',
      status: 'planned',
      postingSchedule: '5-8 posts/week',
    },
    {
      name: 'TikTok',
      status: 'planned',
      postingSchedule: 'Optional (defer until validated)',
    },
  ];

  const affiliatePartners: AffiliatePartner[] = [
    {
      name: 'Amazon Associates',
      type: 'Gear, Tech, Travel Accessories',
      status: 'planned',
      commission: '1-10% (varies by category)',
    },
    {
      name: 'Booking.com',
      type: 'Hotels',
      status: 'planned',
      commission: '25-40% per booking',
    },
    {
      name: 'Skyscanner',
      type: 'Flights',
      status: 'planned',
    },
    {
      name: 'Wilson',
      type: 'Tennis Racquets',
      status: 'planned',
    },
    {
      name: 'Babolat',
      type: 'Tennis Racquets',
      status: 'planned',
    },
  ];

  const tabs = [
    { id: 'database', label: 'Database Schema', icon: '🗄️' },
    { id: 'apis', label: 'API Routes', icon: '🔌' },
    { id: 'integrations', label: 'Third Party APIs', icon: '🔗' },
    { id: 'jobs', label: 'Background Jobs', icon: '⏰' },
    { id: 'social', label: 'Social Media', icon: '📱' },
    { id: 'future', label: 'Future Data Sources', icon: '🔮' },
    { id: 'affiliates', label: 'Affiliate Partners', icon: '💰' },
    { id: 'deployment', label: 'Deployment', icon: '🚀' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading infrastructure overview...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Infrastructure Overview</h1>
          <p className="text-lg text-gray-600">Track everything we've built. Updated as we add features.</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-semibold text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Database Schema Tab */}
        {activeTab === 'database' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Database Tables</h2>
              <p className="text-gray-600">All tables in Supabase with descriptions and columns</p>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {tables.map(table => (
                <div key={table.name} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{table.name}</h3>
                    <p className="text-gray-600">{table.description}</p>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Columns</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {table.columns.map(column => (
                        <div key={column.name} className="bg-gray-50 rounded p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-sm font-semibold text-gray-900">{column.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              column.nullable ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {column.nullable ? 'nullable' : 'required'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 font-mono mb-1">{column.type}</div>
                          {column.description && (
                            <div className="text-xs text-gray-500 mt-1">{column.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Routes Tab */}
        {activeTab === 'apis' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">API Routes</h2>
              <p className="text-gray-600">All API endpoints in the application</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {apiRoutes.map(api => (
                <div key={api.path} className="bg-white rounded-lg shadow border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          api.method.includes('GET') ? 'bg-green-100 text-green-800' :
                          api.method.includes('POST') ? 'bg-blue-100 text-blue-800' :
                          api.method.includes('PATCH') ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {api.method}
                        </span>
                        <code className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                          {api.path}
                        </code>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          api.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {api.status}
                        </span>
                      </div>
                      <p className="text-gray-600">{api.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Third Party Integrations Tab */}
        {activeTab === 'integrations' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Third Party Integrations</h2>
              <p className="text-gray-600">External APIs and services we're using</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {integrations.map(integration => (
                <div key={integration.name} className="bg-white rounded-lg shadow border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{integration.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          integration.status === 'active' ? 'bg-green-100 text-green-800' :
                          integration.status === 'configured' ? 'bg-yellow-100 text-yellow-800' :
                          integration.status === 'trial' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {integration.status}
                        </span>
                        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {integration.type}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{integration.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">When:</span>
                          <span className="ml-2 text-gray-600">{integration.when}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-700">Why:</span>
                          <span className="ml-2 text-gray-600">{integration.why}</span>
                        </div>
                      </div>
                      {integration.envVar && (
                        <div className="mt-2 text-xs text-gray-500">
                          Env Var: <code className="bg-gray-100 px-1 py-0.5 rounded">{integration.envVar}</code>
                        </div>
                      )}
                      {integration.notes && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                          <span className="font-semibold">💡 Note:</span> {integration.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Background Jobs Tab */}
        {activeTab === 'jobs' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Background Jobs</h2>
              <p className="text-gray-600">Scheduled tasks and automation</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {backgroundJobs.map(job => (
                <div key={job.name} className="bg-white rounded-lg shadow border border-gray-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{job.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          job.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{job.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="font-semibold text-gray-700">Schedule:</span>
                          <span className="ml-2 text-gray-600">{job.schedule}</span>
                        </div>
                        {job.endpoint && (
                          <div>
                            <span className="font-semibold text-gray-700">Endpoint:</span>
                            <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{job.endpoint}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Media Tab */}
        {activeTab === 'social' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Social Media Platforms</h2>
              <p className="text-gray-600">Where Marshall posts and engagement strategy</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {socialPlatforms.map(platform => (
                <div key={platform.name} className="bg-white rounded-lg shadow border border-gray-200 p-5">
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{platform.name}</h3>
                    {platform.handle && (
                      <p className="text-sm text-gray-600">{platform.handle}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        platform.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {platform.status}
                      </span>
                    </div>
                    {platform.postingSchedule && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Schedule:</span> {platform.postingSchedule}
                      </div>
                    )}
                    {platform.lastPost && (
                      <div className="text-xs text-gray-500">
                        Last post: {platform.lastPost}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Future Data Sources Tab */}
        {activeTab === 'future' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Future Free Data Sources</h2>
              <p className="text-gray-600">Free alternatives to Sportradar for match data, player profiles, and schedules</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Sportradar trial expires 03/02/2026. These free alternatives will be implemented to replace paid API access.
              </p>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">ATP Website Scraping</h3>
                <p className="text-gray-600 mb-3">
                  Scrape official ATP website (atptour.com) for rankings, match schedules, and results. Only scrape during active tournaments to minimize requests.
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>What we can get:</strong> Player rankings (weekly), match schedules, live scores, player profiles</p>
                  <p><strong>Status:</strong> Stubbed (lib/data/integrations/atp-scraper.ts)</p>
                  <p><strong>See:</strong> docs/development/free-tennis-data-strategy.md</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">FlashScore Scraping</h3>
                <p className="text-gray-600 mb-3">
                  FlashScore has API-like JSON endpoints, making it easier to scrape. Good for live scores and match schedules.
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>What we can get:</strong> Live scores, match schedules, results, head-to-head records</p>
                  <p><strong>Status:</strong> Planned</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">RSS Result Parsing</h3>
                <p className="text-gray-600 mb-3">
                  Parse RSS feed headlines to extract match results. Example: "Alcaraz defeats Djokovic 6-4, 7-6"
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>What we can get:</strong> Match results from news headlines</p>
                  <p><strong>Status:</strong> Planned</p>
                  <p><strong>Sources:</strong> ESPN, BBC, Tennis.com RSS (already integrated)</p>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Manual Match Entry</h3>
                <p className="text-gray-600 mb-3">
                  Manual entry UI for key matches (finals, semis, top player matches). Most reliable, no API costs.
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>What we can get:</strong> Full control over match data</p>
                  <p><strong>Status:</strong> Planned</p>
                  <p><strong>Best for:</strong> Grand Slams (4/year) + ATP 1000 Masters (9/year)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Affiliate Partners Tab */}
        {activeTab === 'affiliates' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Affiliate Partners</h2>
              <p className="text-gray-600">Revenue partners and commission structures</p>
            </div>
            {affiliatePartners.length === 0 ? (
              <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
                <p className="text-lg text-gray-600 mb-2">No affiliate partners yet</p>
                <p className="text-sm text-gray-500">Add partners as you set them up</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {affiliatePartners.map(partner => (
                  <div key={partner.name} className="bg-white rounded-lg shadow border border-gray-200 p-5">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{partner.name}</h3>
                      <p className="text-sm text-gray-600">{partner.type}</p>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          partner.status === 'active' ? 'bg-green-100 text-green-800' :
                          partner.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {partner.status}
                        </span>
                      </div>
                      {partner.commission && (
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold">Commission:</span> {partner.commission}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deployment Tab */}
        {activeTab === 'deployment' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Deployment</h2>
              <p className="text-gray-600">Production deployment information</p>
            </div>
            
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Domain</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌐</span>
                    <div>
                      <p className="font-bold text-lg text-gray-900">marshallontour.com</p>
                      <p className="text-sm text-gray-600">Domain purchased and ready for deployment</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Deployment Checklist</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled />
                    <div>
                      <p className="font-semibold text-gray-900">Configure DNS</p>
                      <p className="text-sm text-gray-600">Point marshallontour.com to hosting provider</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled />
                    <div>
                      <p className="font-semibold text-gray-900">Set up SSL Certificate</p>
                      <p className="text-sm text-gray-600">Enable HTTPS (automatic with Vercel/Netlify)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled />
                    <div>
                      <p className="font-semibold text-gray-900">Configure Production Environment Variables</p>
                      <p className="text-sm text-gray-600">All API keys, database URLs, Supabase keys</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled />
                    <div>
                      <p className="font-semibold text-gray-900">Set up Production Database</p>
                      <p className="text-sm text-gray-600">Supabase production project, run migrations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled />
                    <div>
                      <p className="font-semibold text-gray-900">Configure Image Storage</p>
                      <p className="text-sm text-gray-600">Supabase Storage bucket for Marshall face reference and generated images</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled />
                    <div>
                      <p className="font-semibold text-gray-900">Set up Background Jobs</p>
                      <p className="text-sm text-gray-600">Cron jobs for Content Intelligence, ATP sync, etc.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" disabled />
                    <div>
                      <p className="font-semibold text-gray-900">Test Production Build</p>
                      <p className="text-sm text-gray-600">Verify all features work in production environment</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-bold text-gray-900 mb-2">⚠️ Pre-Deployment Requirements</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li>All background jobs tested and working</li>
                  <li>Content generation pipeline validated</li>
                  <li>API cost tracking configured</li>
                  <li>Admin authentication secured</li>
                  <li>Mixpanel analytics configured</li>
                  <li>Social media accounts created (Instagram, X/Twitter)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}