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
    // Default: let the image strategy decide whether to include Marshall
    // Only override if explicitly set in options
    const { publish = false, includeMarshall } = options;
    
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
    
    // Check if this is a recap post (needs special handling to avoid making up match results)
    // Do this FIRST so we can use it in the type mapping
    let isRecap = opportunity.metadata?.isRecap === true || 
                  opportunity.topic.toLowerCase().includes('recap') ||
                  opportunity.topic.toLowerCase().includes('final') ||
                  opportunity.topic.toLowerCase().includes('champions crowned');
    
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
                 opportunity.topic.toLowerCase().includes('guide') ||
                 opportunity.topic.toLowerCase().includes('day update') ||
                 (opportunity.metadata?.tournament_id && !isRecap) // If it's a tournament post and not a recap, it's likely a preview
          ? 'travel'
          : 'analysis',
        category: opportunity.topic.toLowerCase().includes('preview') || 
                 opportunity.topic.toLowerCase().includes('guide') ||
                 opportunity.topic.toLowerCase().includes('day update') ||
                 (opportunity.metadata?.tournament_id && !isRecap)
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
      tournamentNews: tournamentNews || undefined, // Real news data from RSS feeds for recap posts (convert null to undefined)
      gearData: gearData || undefined, // Real gear data from database for gear posts (convert null to undefined)
    };
    
    // Generate post content
    const postContent = await generatePostContent(context);
    
    // Use explicit postType from Gemini instead of guessing
    // Map Gemini's postType to our context types
    const postTypeMap: Record<string, 'gear' | 'travel' | 'analysis' | 'lifestyle'> = {
      'preview': 'travel',
      'recap': 'analysis', // Recaps are analysis type but with isRecap flag
      'guide': contextType === 'gear' ? 'gear' : 'travel',
      'analysis': 'analysis',
      'gear': 'gear',
      'travel': 'travel',
      'lifestyle': 'lifestyle',
    };
    
    // Override contextType with Gemini's explicit postType
    const geminiPostType = postContent.postType;
    const mappedType = postTypeMap[geminiPostType] || contextType;
    
    // If Gemini says it's a recap, ensure isRecap is true
    if (geminiPostType === 'recap') {
      isRecap = true;
    }
    
    // If Gemini says it's a preview, ensure it's travel type
    if (geminiPostType === 'preview') {
      contextType = 'travel';
      dbCategory = 'Travel';
    } else if (mappedType !== contextType) {
      // Use Gemini's determination if it differs
      contextType = mappedType;
      dbCategory = mappedType.charAt(0).toUpperCase() + mappedType.slice(1) as 'Gear' | 'Travel' | 'Analysis' | 'Lifestyle';
    }
    
    console.log(`[Post Generator] Gemini determined postType: ${geminiPostType}, mapped to contextType: ${contextType}`);
    
    // Generate image (strategy will auto-determine if Marshall should be included)
    // Blast-from-past must use tennis/nostalgia imagery, not lifestyle (no Marshall with coffee)
    const isBlastFromPast = (opportunity.type as string) === 'blast-from-past';
    const imagePostType = isBlastFromPast ? 'blast-from-past' : contextType;
    const imageContext: any = {
      postType: imagePostType,
      topic: opportunity.topic,
      tournament: context.tournament ? {
        name: context.tournament.name,
        location: context.tournament.location,
      } : undefined,
      isRecap, // Pass recap flag for strategy
    };
    
    // Only pass includeMarshall if it's explicitly set AND it's not a recap post
    // Recap posts should never include Marshall (strategy will handle this)
    if (!isRecap && includeMarshall !== undefined) {
      imageContext.includeMarshall = includeMarshall;
      console.log(`[Post Generator] Using explicit includeMarshall: ${includeMarshall}`);
    } else if (isRecap) {
      console.log(`[Post Generator] Recap post detected - letting strategy decide (should exclude Marshall)`);
    } else {
      console.log(`[Post Generator] Letting image strategy decide whether to include Marshall`);
    }
    
    const imageResult = await generatePostImage(imageContext);
    const imageUrl = typeof imageResult === 'object' ? imageResult.url : imageResult;
    const imageAttribution = typeof imageResult === 'object' ? imageResult.attribution : null;
    const contentForDb = imageAttribution
      ? postContent.content.trimEnd() + '\n\n---\n\n*Featured image: ' + imageAttribution + '*'
      : postContent.content;

    // Create slug from title
    const slug = postContent.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);

    // Build post data object
    const postData = {
      slug,
      title: postContent.title,
      excerpt: postContent.excerpt,
      content: contentForDb,
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
    };
    
    // LOG: Full post JSON
    console.log('\n========== POST JSON ==========');
    console.log(JSON.stringify(postData, null, 2));
    console.log('===============================\n');
    
    // Save to Supabase
    const supabase = createAdminSupabase();
    const { data: post, error: dbError } = await supabase
      .from('posts')
      .insert(postData)
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
