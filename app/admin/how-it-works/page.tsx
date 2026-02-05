'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function HowItWorksPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = [
    { id: 'overview', title: 'Overview', icon: '🎯' },
    { id: 'jobs', title: 'Background Jobs', icon: '⚙️' },
    { id: 'content-generation', title: 'Content Generation', icon: '✍️' },
    { id: 'data-sources', title: 'Data Sources', icon: '📊' },
    { id: 'posting-rules', title: 'Posting Rules', icon: '📅' },
    { id: 'technical', title: 'Technical Architecture', icon: '🔧' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">How Marshall Works</h1>
              <p className="text-lg text-gray-600">
                High-level overview and technical deep-dive into Marshall's content generation system
              </p>
            </div>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Back to Admin
            </Link>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex flex-wrap gap-2">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="mr-2">{section.icon}</span>
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Overview */}
          {(activeSection === null || activeSection === 'overview') && (
            <SectionCard title="🎯 High-Level Overview" id="overview">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">What is Marshall?</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Marshall is an AI tennis influencer that automatically creates blog posts and social media content
                    about ATP tennis. He writes in a unique voice, uses real data to ground his content, and posts
                    at realistic frequencies (1 blog/day, 3-4 social posts/day).
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">How Does He Work?</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                      <li><strong>Background jobs</strong> run daily to find the best content opportunities</li>
                      <li><strong>Scoring system</strong> ranks opportunities by timeliness, affiliate potential, SEO, variety, and engagement</li>
                      <li><strong>Data aggregator</strong> pulls real data from APIs (weather, news, matches, locations)</li>
                      <li><strong>Gemini AI</strong> generates posts using Marshall's voice and the aggregated data</li>
                      <li><strong>Posting rules</strong> ensure realistic frequency (max 1 blog/day, 12h between posts)</li>
                      <li><strong>Social automation</strong> creates 2-3 social posts per blog post</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Key Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FeatureCard
                      title="Match-Timed Posts"
                      description="Posts before, during, and after big matches (finals, semis, top player matchups)"
                    />
                    <FeatureCard
                      title="Standalone Social Posts"
                      description="Quick reactions, stream-of-consciousness posts on X/Twitter (no blog link needed)"
                    />
                    <FeatureCard
                      title="Lifestyle Content"
                      description="Hotels, coffee shops, city walks - all tied to tournament locations"
                    />
                    <FeatureCard
                      title="Up-and-Coming Players"
                      description="Deep dives on rising stars most people don't know about yet"
                    />
                    <FeatureCard
                      title="Blast from the Past"
                      description="Classic players, legendary matches, YouTube highlights (1-2/month)"
                    />
                    <FeatureCard
                      title="Content Variety"
                      description="Smart tracking ensures Marshall doesn't repeat topics"
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Background Jobs */}
          {(activeSection === null || activeSection === 'jobs') && (
            <SectionCard title="⚙️ Background Jobs" id="jobs">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Job 1: Content Intelligence</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm font-semibold text-gray-600">Schedule:</span>
                        <p className="text-gray-900">Daily at 6 AM CT (12 PM UTC)</p>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-600">Status:</span>
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">Active</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">
                      The main job that decides what Marshall should post about. It:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-2">
                      <li>Checks active tournaments (what's happening now?)</li>
                      <li>Checks upcoming tournaments (preview opportunities)</li>
                      <li>Checks content calendar (planned content)</li>
                      <li>Checks Marshall's state (gear, location, players he's watching)</li>
                      <li>Scores all opportunities (0-100 points)</li>
                      <li>Generates post from highest-scoring opportunity (if score &gt; 50)</li>
                    </ol>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">POST /api/jobs/content-intelligence</code>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Job 2: Match Monitor</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm font-semibold text-gray-600">Schedule:</span>
                        <p className="text-gray-900">Every 30 minutes during active tournaments</p>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-600">Status:</span>
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-semibold">Planned</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">
                      Monitors big matches and posts at the right times:
                    </p>
                    <div className="space-y-2 text-gray-700">
                      <TimingCard
                        time="3 hours before"
                        action="Generate preview blog post + social posts"
                      />
                      <TimingCard
                        time="1 hour before"
                        action="X/Twitter standalone post (quick thoughts)"
                      />
                      <TimingCard
                        time="During match"
                        action="1-2 X/Twitter standalone posts (live reactions)"
                      />
                      <TimingCard
                        time="Immediately after"
                        action="X/Twitter standalone post (quick reaction)"
                      />
                      <TimingCard
                        time="2 hours after"
                        action="Analysis blog post + social posts"
                      />
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Big Match Detection:</strong> Finals, semis, top 10 player matchups, Grand Slam matches
                      </p>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">POST /api/jobs/match-monitor</code>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Job 3: Calendar Post Generator</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm font-semibold text-gray-600">Schedule:</span>
                        <p className="text-gray-900">Daily (6 AM UTC)</p>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-600">Status:</span>
                        <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-semibold">Planned</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">
                      Generates posts from approved content calendar entries scheduled for today.
                      Calendar entries take priority over dynamic opportunities.
                    </p>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">POST /api/calendar/generate-scheduled</code>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Job 4: ATP Calendar Sync</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <span className="text-sm font-semibold text-gray-600">Schedule:</span>
                        <p className="text-gray-900">Weekly (Sunday 12 AM UTC) or manual</p>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-600">Status:</span>
                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">Active</span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">
                      Syncs tournament schedule from Sportradar API (or static calendar) to the database.
                      Currently uses static 2026 ATP calendar loaded from official PDF.
                    </p>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">POST /api/calendar/sync-atp</code>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Content Generation */}
          {(activeSection === null || activeSection === 'content-generation') && (
            <SectionCard title="✍️ Content Generation Flow" id="content-generation">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">How a Post is Created</h3>
                  
                  <div className="space-y-4">
                    <StepCard
                      number={1}
                      title="Find Opportunities"
                      description="Content Intelligence job finds opportunities from:"
                      items={[
                        'Active tournaments (what\'s happening now?)',
                        'Upcoming tournaments (preview opportunities)',
                        'Content calendar entries (planned content)',
                        'Marshall\'s state (gear, location, players)',
                        'Recent news (breaking tennis news)',
                      ]}
                    />

                    <StepCard
                      number={2}
                      title="Score Opportunities"
                      description="Each opportunity is scored (0-100 points) based on:"
                      items={[
                        'Timeliness (0-30 points) - How timely is this?',
                        'Affiliate Potential (0-25 points) - Can we monetize?',
                        'SEO Value (0-20 points) - Will this rank well?',
                        'Content Variety (0-15 points) - Have we posted about this recently?',
                        'Social Engagement (0-10 points) - Will this engage fans?',
                      ]}
                    />

                    <StepCard
                      number={3}
                      title="Check Posting Rules & Variety"
                      description="Verify we can post and haven't duplicated content:"
                      items={[
                        'Max 1 blog post per day',
                        'Max 3-4 social posts per day',
                        'Min 12 hours between blog posts',
                        'Haven\'t posted about this topic recently (variety check)',
                        'Haven\'t posted about this tournament recently (for recaps/previews)',
                        'Gear posts: 45-day minimum between any gear content',
                        'Tournament previews: Only 24 hours - 5 days before start',
                      ]}
                    />

                    <StepCard
                      number={4}
                      title="Aggregate Data"
                      description="Data aggregator pulls real data from all sources:"
                      items={[
                        'Tournament data (from ATP calendar)',
                        'Match schedules/results (Sportradar)',
                        'Weather (OpenWeatherMap)',
                        'News (RSS feeds)',
                        'Locations (Google Maps - hotels, coffee)',
                        'Player data (rankings, profiles)',
                        'Marshall\'s state (current gear, location)',
                      ]}
                    />

                    <StepCard
                      number={5}
                      title="Generate Post"
                      description="Gemini AI generates post using:"
                      items={[
                        'Marshall\'s voice and personality',
                        'Aggregated real data (prevents AI flagging)',
                        'Content opportunity context',
                        'SEO keywords and focus',
                        '2-agent pipeline: Fact-Checker → Editor (prevents misinformation, improves quality)',
                        'Gear data from database (for gear guides)',
                        'RSS news data (for tournament recaps - prevents fabricated results)',
                        'Label cleanup (removes embedded "Title:", "Excerpt:", "Content:" labels)',
                      ]}
                    />

                    <StepCard
                      number={5.5}
                      title="Generate Image"
                      description="Image generation strategy:"
                      items={[
                        'Stock images (Unsplash) for recaps, previews, gear guides, player profiles (free, authentic)',
                        'AI generation (Replicate/Flux) only when Marshall needs to appear',
                        'Face consistency (flux-pulid) for Marshall images with varied scenes',
                        '8 lifestyle scenes, 5 analysis scenes for visual variety',
                        'Cost savings: 80-90% reduction for non-Marshall posts',
                      ]}
                    />

                    <StepCard
                      number={6}
                      title="Create Social Posts"
                      description="Auto-generate 2-3 social posts:"
                      items={[
                        'Instagram: Teaser image + link',
                        'X/Twitter: Hook + link, key stat + link',
                        'Scheduled at different times same day',
                      ]}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                  <h4 className="font-bold text-gray-900 mb-2">Example Flow</h4>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p><strong>6 AM CT:</strong> Content Intelligence job runs (Vercel Cron)</p>
                    <p><strong>6:00:30 AM:</strong> Finds opportunity: "Dallas Open Preview" (score: 62)</p>
                    <p><strong>6:01 AM:</strong> Checks rules: ✅ Can post (no posts today yet)</p>
                    <p><strong>6:02 AM:</strong> Travel handler gathers: Tournament data, weather, hotels, coffee shops</p>
                    <p><strong>6:03 AM:</strong> Gemini generates post with comprehensive data</p>
                    <p><strong>6:04 AM:</strong> Fact-checker validates claims and Marshall's age</p>
                    <p><strong>6:05 AM:</strong> Editor refines based on fact-check issues</p>
                    <p><strong>6:06 AM:</strong> Image generated (stock image for preview post)</p>
                    <p><strong>6:07 AM:</strong> Post saved to database as draft, detailed log saved</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Data Sources */}
          {(activeSection === null || activeSection === 'data-sources') && (
            <SectionCard title="📊 Data Sources" id="data-sources">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">How Schedule is Kept Up to Date</h3>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    <h4 className="font-bold text-gray-900 mb-2">ATP Calendar Sync</h4>
                    <p className="text-gray-700 mb-3">
                      Tournament schedule is synced weekly (or manually) from:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                      <li><strong>Static Calendar:</strong> Official 2026 ATP calendar (loaded from PDF) - Default</li>
                      <li><strong>Sportradar API:</strong> Real-time tournament data (trial: 1,000 quota) - Optional</li>
                    </ul>
                    <p className="text-gray-700 mt-3">
                      When tournaments start, Marshall's location is automatically updated. When tournaments end,
                      next location is set to the next tournament.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">All Data Sources</h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <DataSourceCard
                      name="ATP Calendar"
                      status="Active"
                      source="Static 2026 calendar (PDF) or Sportradar API"
                      data="Tournament schedules, locations, dates, categories"
                      cache="24 hours"
                    />
                    <DataSourceCard
                      name="RSS Feeds"
                      status="Active"
                      source="ESPN, BBC Sport, Tennis.com"
                      data="Breaking tennis news, match results, player updates"
                      cache="1 hour"
                    />
                    <DataSourceCard
                      name="Weather API"
                      status="Active"
                      source="Open-Meteo (free, no API key)"
                      data="Temperature, conditions, forecast for tournament locations"
                      cache="6 hours"
                    />
                    <DataSourceCard
                      name="Google Maps"
                      status="Active"
                      source="Places API, Directions API"
                      data="Hotels, coffee shops, restaurants, walking routes"
                      cache="24 hours"
                    />
                    <DataSourceCard
                      name="YouTube"
                      status="Active"
                      source="YouTube Data API v3"
                      data="Tennis highlights, classic matches for 'Blast from the Past'"
                      cache="24 hours"
                    />
                    <DataSourceCard
                      name="Match Data"
                      status="Planned"
                      source="Sportradar API (needs implementation)"
                      data="Match schedules, results, scores, player matchups"
                      cache="15 minutes"
                    />
                    <DataSourceCard
                      name="Player Data"
                      status="Planned"
                      source="Sportradar API or ATP website"
                      data="Rankings, profiles, head-to-head records"
                      cache="1 hour"
                    />
                    <DataSourceCard
                      name="Gear Data"
                      status="Active"
                      source="gear_items database table (sourced from existing guides)"
                      data="Racket specs, reviews, pros/cons, affiliate links, best_for recommendations"
                      cache="24 hours"
                    />
                    <DataSourceCard
                      name="Stock Images"
                      status="Active"
                      source="Unsplash API (free, 50 requests/hour)"
                      data="Tournament action shots, location photography, product photos"
                      cache="Used directly (no cache needed)"
                    />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">💡 Data Grounding Strategy</h4>
                  <p className="text-gray-700 text-sm">
                    All AI-generated content is <strong>grounded in real data</strong> to prevent Google AI flagging.
                    Every post includes real weather, real locations, real match results, real news - making it
                    indistinguishable from human-written content.
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Posting Rules */}
          {(activeSection === null || activeSection === 'posting-rules') && (
            <SectionCard title="📅 Posting Rules & Frequency" id="posting-rules">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Frequency Limits</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <RuleCard
                      title="Blog Posts"
                      limit="Max 1 per day"
                      reason="Realistic frequency, not robotic"
                    />
                    <RuleCard
                      title="Social Posts"
                      limit="Max 3-4 per day"
                      reason="Mix of blog promotion + standalone"
                    />
                    <RuleCard
                      title="Time Between Posts"
                      limit="Min 12 hours"
                      reason="Avoids spam, feels natural"
                    />
                    <RuleCard
                      title="Topic Variety"
                      limit="No repeats in 3 days"
                      reason="Ensures content diversity"
                    />
                    <RuleCard
                      title="Gear Posts"
                      limit="45-day minimum"
                      reason="Infrequent strategy - gear guides are rare, high-value"
                    />
                    <RuleCard
                      title="Tournament Previews"
                      limit="24 hours - 5 days before"
                      reason="Not too early, not too late - optimal timing"
                    />
                    <RuleCard
                      title="Tournament Recaps"
                      limit="Within 48 hours of end"
                      reason="Fresh while still relevant"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Content Calendar Priority</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 mb-3">
                      Content calendar entries take <strong>priority</strong> over dynamic opportunities:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-2">
                      <li>If calendar entry exists for today → Generate from calendar</li>
                      <li>If no calendar entry → Use dynamic engine (highest-scoring opportunity)</li>
                      <li>Calendar entries are planned content (tournament previews, gear reviews)</li>
                      <li>Dynamic engine handles reactive content (match results, news, lifestyle)</li>
                    </ol>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Variety Tracking</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 mb-3">
                      System tracks recent content to ensure variety:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                      <li>Haven't posted about this player in 3 days</li>
                      <li>Haven't posted about this tournament in 2-3 days (recaps/previews)</li>
                      <li>Haven't posted gear content in 45 days (very infrequent)</li>
                      <li>Mix of categories (not all analysis)</li>
                      <li>Tournament previews only 24 hours - 5 days before start</li>
                    </ul>
                    <p className="text-gray-600 text-sm mt-3 italic">
                      This prevents Marshall from posting about Alcaraz 5 days in a row.
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Technical Architecture */}
          {(activeSection === null || activeSection === 'technical') && (
            <SectionCard title="🔧 Technical Architecture" id="technical">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">System Components</h3>
                  
                  <div className="space-y-4">
                    <TechCard
                      title="Content Intelligence Engine"
                      location="lib/jobs/content-intelligence.ts"
                      description="Main job that evaluates opportunities and generates posts"
                    />
                    <TechCard
                      title="Scoring System"
                      location="lib/jobs/scoring.ts"
                      description="Scores opportunities (0-100) based on 5 factors"
                    />
                    <TechCard
                      title="Posting Rules"
                      location="lib/jobs/posting-rules.ts"
                      description="Enforces frequency limits and variety checks"
                    />
                    <TechCard
                      title="Variety Tracker"
                      location="lib/jobs/variety-tracker.ts"
                      description="Tracks recent content to prevent repetition (tournaments, topics, categories)"
                    />
                    <TechCard
                      title="Post Generator V2"
                      location="lib/jobs/post-generator-v2.ts"
                      description="Unified post generation with type-specific handlers and comprehensive data gathering"
                    />
                    <TechCard
                      title="Type-Specific Handlers"
                      location="lib/jobs/post-handlers/"
                      description="Specialized handlers: analysis, nostalgia, gear, travel, lifestyle"
                    />
                    <TechCard
                      title="Content Logger"
                      location="lib/jobs/content-logger.ts"
                      description="Comprehensive logging: opportunities, data sources, prompts, generation results"
                    />
                    <TechCard
                      title="Data Aggregator"
                      location="lib/data/data-aggregator.ts"
                      description="Unified interface that pulls from all data sources"
                    />
                    <TechCard
                      title="Marshall State"
                      location="lib/marshall/state.ts"
                      description="Manages Marshall's current gear, location, preferences"
                    />
                    <TechCard
                      title="Social Post Types"
                      location="lib/social/types.ts"
                      description="Defines 10+ social post types with templates"
                    />
                    <TechCard
                      title="Fact-Checker Agent"
                      location="lib/ai/fact-checker.ts"
                      description="Validates claims, hyperbole, and Marshall's age consistency (born 1993, 33 years old)"
                    />
                    <TechCard
                      title="Editor Agent"
                      location="lib/ai/editor.ts"
                      description="Refines posts based on fact-check issues while maintaining Marshall's voice"
                    />
                    <TechCard
                      title="Stock Image Integration"
                      location="lib/ai/stock-images.ts"
                      description="Unsplash API for free stock images (recaps, previews, gear guides)"
                    />
                    <TechCard
                      title="Image Generation Strategy"
                      location="lib/ai/image-strategy.ts"
                      description="Determines stock vs AI images, scene variety for Marshall posts"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Data Integration Architecture</h3>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 mb-3">
                      Each data source has its own integration file:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm font-mono text-gray-600">
                      <div>• lib/data/integrations/rss.ts</div>
                      <div>• lib/data/integrations/weather.ts</div>
                      <div>• lib/data/integrations/google-maps.ts</div>
                      <div>• lib/data/integrations/youtube.ts</div>
                      <div>• lib/data/integrations/player-data.ts</div>
                      <div>• lib/data/integrations/sportradar-matches.ts</div>
                      <div>• lib/data/integrations/gear.ts</div>
                      <div>• lib/data/integrations/types.ts</div>
                    </div>
                    <p className="text-gray-600 text-sm mt-3">
                      All integrations use consistent <code className="bg-gray-100 px-1 rounded">DataSourceResult&lt;T&gt;</code> format,
                      support caching, and have mock data fallbacks.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Database Schema</h3>
                  
                  <div className="space-y-3">
                    <TableCard
                      name="atp_calendar"
                      purpose="Tournament schedule (source of truth)"
                      keyFields="tournament_id, start_date, end_date, location"
                    />
                    <TableCard
                      name="content_calendar"
                      purpose="Planned content entries"
                      keyFields="scheduled_date, content_brief, status, generated_post_id"
                    />
                    <TableCard
                      name="posts"
                      purpose="Generated blog posts"
                      keyFields="slug, title, content, published_at, category"
                    />
                    <TableCard
                      name="marshall_state"
                      purpose="Marshall's current state (singleton)"
                      keyFields="current_racket, current_city, up_and_coming_player_watching"
                    />
                    <TableCard
                      name="gear_items"
                      purpose="Product database for gear guides and quizzes"
                      keyFields="name, brand, type, specifications, amazon_affiliate_link"
                    />
                    <TableCard
                      name="api_costs"
                      purpose="API spending tracking ($20/week budget)"
                      keyFields="service, operation, cost, created_at"
                    />
                    <TableCard
                      name="job_logs"
                      purpose="Background job execution logs"
                      keyFields="job_name, status, started_at, duration_ms"
                    />
                    <TableCard
                      name="content_logs"
                      purpose="Detailed content generation logs (opportunities, data sources, prompts, results)"
                      keyFields="job_id, timestamp, log_data"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">API Endpoints</h3>
                  
                  <div className="space-y-2">
                    <EndpointCard
                      method="POST"
                      path="/api/jobs/content-intelligence"
                      description="Run content intelligence job (generates post if opportunity found)"
                    />
                    <EndpointCard
                      method="GET"
                      path="/api/jobs/content-intelligence"
                      description="Evaluate opportunities without generating (for debugging)"
                    />
                    <EndpointCard
                      method="POST"
                      path="/api/posts/generate"
                      description="Generate blog post using Gemini AI. Supports manual post type selection (tournament, player, gear, lifestyle, etc.) or auto-selection from opportunities"
                    />
                    <EndpointCard
                      method="POST"
                      path="/api/calendar/sync-atp"
                      description="Sync ATP tournament calendar (static or Sportradar API)"
                    />
                    <EndpointCard
                      method="GET"
                      path="/api/jobs/content-logs"
                      description="Get detailed content generation logs (opportunities, data sources, prompts)"
                    />
                    <EndpointCard
                      method="GET"
                      path="/api/jobs/logs"
                      description="Get job execution logs (status, duration, results)"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Caching Strategy</h3>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 mb-3">
                      All data sources use Next.js <code className="bg-gray-100 px-1 rounded">fetch</code> caching:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2">
                      <li><strong>Tournament data:</strong> 24 hours (doesn't change often)</li>
                      <li><strong>Match data:</strong> 15 minutes (changes frequently during tournaments)</li>
                      <li><strong>News:</strong> 1 hour (breaking news needs to be fresh)</li>
                      <li><strong>Weather:</strong> 6 hours (weather doesn't change that often)</li>
                      <li><strong>Locations:</strong> 24 hours (hotels, coffee shops don't move)</li>
                      <li><strong>YouTube:</strong> 24 hours (videos don't change)</li>
                    </ul>
                    <p className="text-gray-600 text-sm mt-3 italic">
                      Caching minimizes API calls and preserves quota (especially for Sportradar trial).
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Development & Deployment</h3>
                  
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">Pre-Build Checks</h4>
                      <p className="text-gray-700 mb-2">
                        TypeScript type checking and ESLint run before deployment to catch errors early:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2 text-sm">
                        <li><code className="bg-gray-100 px-1 rounded">npm run type-check</code> - TypeScript validation</li>
                        <li><code className="bg-gray-100 px-1 rounded">npm run lint</code> - Code quality checks</li>
                        <li><code className="bg-gray-100 px-1 rounded">npm run pre-build</code> - Full check before deploy</li>
                      </ul>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">Enhanced Logging</h4>
                      <p className="text-gray-700 mb-2">
                        Comprehensive logging system tracks every step of content generation:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2 text-sm">
                        <li>All opportunities found with full scoring breakdown</li>
                        <li>Selected opportunity and why it was chosen</li>
                        <li>Data sources accessed (players, weather, hotels, etc.)</li>
                        <li>Prompt information (context type, data included, token estimates)</li>
                        <li>Missing data (what Gemini had to figure out without context)</li>
                        <li>Generation results (post ID, fact-check issues, editor changes)</li>
                        <li>View detailed logs in admin jobs page under "Execution Logs"</li>
                      </ul>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">Cron Job Setup</h4>
                      <p className="text-gray-700 mb-2">
                        Content Intelligence runs automatically via Vercel Cron:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-gray-700 ml-2 text-sm">
                        <li><strong>Schedule:</strong> Daily at 6 AM CT (12 PM UTC)</li>
                        <li><strong>Configuration:</strong> <code className="bg-gray-100 px-1 rounded">vercel.json</code></li>
                        <li><strong>Security:</strong> Uses <code className="bg-gray-100 px-1 rounded">CRON_SECRET</code> environment variable</li>
                        <li><strong>Monitoring:</strong> View runs in Vercel dashboard and admin jobs page</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function SectionCard({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <div id={id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function TimingCard({ time, action }: { time: string; action: string }) {
  return (
    <div className="flex items-start gap-3 bg-gray-50 rounded p-3">
      <span className="font-semibold text-blue-600 min-w-[120px]">{time}</span>
      <span className="text-gray-700">{action}</span>
    </div>
  );
}

function StepCard({ number, title, description, items }: { number: number; title: string; description: string; items: string[] }) {
  return (
    <div className="border-l-4 border-blue-500 pl-4 py-2">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
          {number}
        </div>
        <h4 className="font-bold text-gray-900">{title}</h4>
      </div>
      <p className="text-gray-700 mb-2 ml-11">{description}</p>
      <ul className="list-disc list-inside space-y-1 text-gray-600 text-sm ml-11">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function DataSourceCard({ name, status, source, data, cache }: { name: string; status: string; source: string; data: string; cache: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-gray-900">{name}</h4>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {status}
        </span>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Source:</strong> {source}</p>
        <p><strong>Data:</strong> {data}</p>
        <p><strong>Cache:</strong> {cache}</p>
      </div>
    </div>
  );
}

function RuleCard({ title, limit, reason }: { title: string; limit: string; reason: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
      <p className="text-blue-600 font-semibold mb-2">{limit}</p>
      <p className="text-sm text-gray-600">{reason}</p>
    </div>
  );
}

function TechCard({ title, location, description }: { title: string; location: string; description: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-bold text-gray-900 mb-1">{title}</h4>
      <code className="text-xs text-gray-600 block mb-2">{location}</code>
      <p className="text-sm text-gray-700">{description}</p>
    </div>
  );
}

function TableCard({ name, purpose, keyFields }: { name: string; purpose: string; keyFields: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <code className="font-bold text-gray-900">{name}</code>
      </div>
      <p className="text-sm text-gray-700 mb-1">{purpose}</p>
      <p className="text-xs text-gray-600"><strong>Key fields:</strong> {keyFields}</p>
    </div>
  );
}

function EndpointCard({ method, path, description }: { method: string; path: string; description: string }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <div className="flex items-center gap-3 mb-1">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          method === 'POST' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
        }`}>
          {method}
        </span>
        <code className="text-sm text-gray-900">{path}</code>
      </div>
      <p className="text-sm text-gray-600 ml-16">{description}</p>
    </div>
  );
}
