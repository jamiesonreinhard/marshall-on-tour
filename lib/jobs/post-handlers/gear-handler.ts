/**
 * Gear Post Handler
 * 
 * Handles: gear guides, product reviews, equipment comparisons
 * Gathers: gear data from database, product specs, affiliate links
 */

import { HandlerContext, HandlerData, HandlerResult } from './types';
import { createAdminSupabase } from '@/lib/supabase/server';
import { analyzeRecentPosts } from '@/lib/data/processor';
import { getGearItems } from '@/lib/data/integrations/gear';

export async function handleGearPost(
  ctx: HandlerContext
): Promise<HandlerResult> {
  try {
    const { opportunity } = ctx;
    const richData: Record<string, any> = {};
    const dataSources: string[] = [];
    
    // 1. Get recent posts for context
    const recentPosts = await analyzeRecentPosts(5);
    const recentPostsContext = recentPosts.map((p: any) => ({
      title: p.title,
      category: p.category,
    }));
    
    // 2. Determine gear type from metadata or topic
    const guideType = opportunity.metadata?.guide_type || 'racket';
    const gearTypeMap: Record<string, string> = {
      'racket': 'racket',
      'clothing': 'apparel',
      'accessory': 'bag',
    };
    const gearType = gearTypeMap[guideType] || 'racket';
    
    // 3. Fetch gear data from database
    const supabase = createAdminSupabase();
    const { data: gearItems, error: gearError } = await supabase
      .from('gear_items')
      .select('*')
      .eq('type', gearType)
      .limit(10);
    
    if (!gearError && gearItems && gearItems.length > 0) {
      richData.gearItems = gearItems;
      dataSources.push(`Gear database: ${gearItems.length} items (${gearType})`);
    } else {
      // Try alternative: use gear integration
      const gearResult = await getGearItems(gearType);
      if (gearResult.success && gearResult.data) {
        richData.gearItems = gearResult.data;
        dataSources.push(`Gear integration: ${gearResult.data.length} items`);
      } else {
        console.warn(`[Gear Handler] No gear data found for type: ${gearType}`);
      }
    }
    
    // 4. Build context for Gemini
    const context: any = {
      type: 'gear' as const,
      topic: opportunity.topic,
      recentPosts: recentPostsContext,
      gearData: richData.gearItems || undefined,
    };
    
    return {
      success: true,
      data: {
        context,
        richData,
        dataSources,
      },
    };
  } catch (error: any) {
    console.error('[Gear Handler] Error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
