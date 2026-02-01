/**
 * Post Generator
 * 
 * Helper to generate posts from opportunities
 * Used by Content Intelligence job
 */

import { createAdminSupabase } from '@/lib/supabase/server';
import { generatePostContent } from '@/lib/ai/gemini';
import { generatePostImage } from '@/lib/ai/images';
import { analyzeRecentPosts } from '@/lib/data/processor';
import { ContentOpportunity } from './scoring';
import { getRecentNews } from '@/lib/data/integrations/rss';

export interface GeneratePostOptions {
  publish?: boolean;
  includeMarshall?: boolean;
}

/**
 * Generate a post from a content opportunity
 */
export async function generatePostFromOpportunity(
  opportunity: ContentOpportunity,
  options: GeneratePostOptions = {}
): Promise<{
  success: boolean;
  postId?: string;
  error?: string;
}> {
  try {
    const { publish = false, includeMarshall = true } = options;
    
    // Get recent posts for context
    const recentPosts = await analyzeRecentPosts(5);
    const recentPostsContext = recentPosts.map((p: any) => ({
      title: p.title,
      category: p.category,
    }));
    
    // Get tournament data if available
    let tournament;
    let tournamentNews = null;
    
    if (opportunity.metadata?.tournament_id) {
      const supabase = createAdminSupabase();
      const { data: tournamentData } = await supabase
        .from('atp_calendar')
        .select('*')
        .eq('id', opportunity.metadata.tournament_id)
        .single();
      
      if (tournamentData) {
        const location = tournamentData.location as { city?: string; country?: string };
        tournament = {
          name: tournamentData.name,
          location: location.city && location.country 
            ? `${location.city}, ${location.country}`
            : location.city || location.country || '',
          startDate: tournamentData.start_date,
        };
        
        // For recap posts, fetch recent news about this tournament
        if (opportunity.metadata?.isRecap) {
          console.log(`[Post Generator] Fetching RSS news for ${tournamentData.name} recap...`);
          const newsResult = await getRecentNews(48); // Last 48 hours
          
          if (newsResult.success && newsResult.data) {
            // Filter news for this specific tournament
            const tournamentNameLower = tournamentData.name.toLowerCase();
            tournamentNews = newsResult.data.filter(news => {
              const titleLower = news.title.toLowerCase();
              const descLower = news.description.toLowerCase();
              const combined = titleLower + ' ' + descLower;
              
              // Check if news mentions the tournament name or related keywords
              return combined.includes(tournamentNameLower) ||
                     combined.includes('australian open') && tournamentNameLower.includes('australian') ||
                     combined.includes('final') && (combined.includes(tournamentNameLower.split(' ')[0]) || combined.includes('melbourne'));
            });
            
            console.log(`[Post Generator] Found ${tournamentNews.length} relevant news items for ${tournamentData.name}`);
            
            // Log the news items for debugging
            if (tournamentNews.length > 0) {
              tournamentNews.forEach(news => {
                console.log(`  - ${news.title} (${news.source})`);
              });
            }
          } else {
            console.warn(`[Post Generator] Failed to fetch news for ${tournamentData.name}:`, newsResult.error);
          }
        }
      }
    }
    
    // Map opportunity type to PostGenerationContext type and database category
    // Database only accepts: 'Gear', 'Travel', 'Analysis', 'Lifestyle'
    let contextType: 'gear' | 'travel' | 'analysis' | 'lifestyle';
    let dbCategory: 'Gear' | 'Travel' | 'Analysis' | 'Lifestyle';
    
    // Map opportunity types to context types and database categories
    const typeMap: Record<string, { context: 'gear' | 'travel' | 'analysis' | 'lifestyle', category: 'Gear' | 'Travel' | 'Analysis' | 'Lifestyle' }> = {
      'gear': { context: 'gear', category: 'Gear' },
      'travel': { context: 'travel', category: 'Travel' },
      'lifestyle': { context: 'lifestyle', category: 'Lifestyle' },
      'tournament': { 
        context: opportunity.topic.toLowerCase().includes('preview') || 
                 opportunity.topic.toLowerCase().includes('guide')
          ? 'travel'
          : 'analysis',
        category: opportunity.topic.toLowerCase().includes('preview') || 
                 opportunity.topic.toLowerCase().includes('guide')
          ? 'Travel'
          : 'Analysis'
      },
      'match': { context: 'analysis', category: 'Analysis' },
      'player': { context: 'analysis', category: 'Analysis' },
      'news': { context: 'analysis', category: 'Analysis' },
      'blast-from-past': { context: 'lifestyle', category: 'Lifestyle' },
    };
    
    const mapping = typeMap[opportunity.type] || { context: 'analysis', category: 'Analysis' };
    contextType = mapping.context;
    dbCategory = mapping.category;
    
    // Check if this is a recap post (needs special handling to avoid making up match results)
    const isRecap = opportunity.metadata?.isRecap === true || 
                    opportunity.topic.toLowerCase().includes('recap') ||
                    opportunity.topic.toLowerCase().includes('final') ||
                    opportunity.topic.toLowerCase().includes('champions crowned');
    
    // Fetch gear data if this is a gear post
    let gearData = null;
    if (contextType === 'gear') {
      const supabase = createAdminSupabase();
      const guideType = opportunity.metadata?.guide_type || 'racket'; // 'racket', 'clothing', 'accessory'
      
      // Map guide type to gear type
      const gearTypeMap: Record<string, string> = {
        'racket': 'racket',
        'clothing': 'apparel',
        'accessory': 'bag', // or 'strings', 'grip', etc.
      };
      
      const gearType = gearTypeMap[guideType] || 'racket';
      
      // Try to fetch from gear_items table (if it exists)
      const { data: gearItems, error: gearError } = await supabase
        .from('gear_items')
        .select('*')
        .eq('type', gearType)
        .limit(10);
      
      if (!gearError && gearItems && gearItems.length > 0) {
        gearData = gearItems;
        console.log(`[Post Generator] Found ${gearItems.length} gear items for ${guideType} guide`);
      } else {
        console.warn(`[Post Generator] No gear data found in database. Gemini will use general knowledge (may be outdated). Error: ${gearError?.message || 'No gear_items table or no data'}`);
      }
    }
    
    // Build context for Gemini
    const context = {
      type: contextType,
      topic: opportunity.topic,
      tournament,
      recentPosts: recentPostsContext,
      isRecap, // Flag to indicate this is a recap post
      tournamentNews, // Real news data from RSS feeds for recap posts
      gearData, // Real gear data from database for gear posts
    };
    
    // Generate post content
    const postContent = await generatePostContent(context);
    
    // Generate image (strategy will auto-determine if Marshall should be included)
    const imageUrl = await generatePostImage({
      postType: contextType,
      topic: opportunity.topic,
      tournament: context.tournament ? {
        name: context.tournament.name,
        location: context.tournament.location,
      } : undefined,
      includeMarshall, // Can be overridden by strategy
      isRecap, // Pass recap flag for strategy
    });
    
    // Create slug from title
    const slug = postContent.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
    
    // Save to Supabase
    const supabase = createAdminSupabase();
    const { data: post, error: dbError } = await supabase
      .from('posts')
      .insert({
        slug,
        title: postContent.title,
        excerpt: postContent.excerpt,
        content: postContent.content,
        category: dbCategory,
        featured_image: imageUrl,
        meta_title: postContent.metaTitle || postContent.title,
        meta_description: postContent.metaDescription || postContent.excerpt,
        focus_keyword: postContent.focusKeyword || '',
        keywords: postContent.keywords || [],
        tags: postContent.tags || [],
        author_name: 'Marshall',
        reading_time: Math.ceil(postContent.content.split(/\s+/).length / 200),
        published: publish,
        published_at: publish ? new Date().toISOString() : null,
        affiliate_links: [],
      })
      .select()
      .single();
    
    if (dbError || !post) {
      throw new Error(dbError?.message || 'Failed to save post');
    }
    
    return {
      success: true,
      postId: post.id,
    };
  } catch (error: any) {
    console.error('Error generating post from opportunity:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
