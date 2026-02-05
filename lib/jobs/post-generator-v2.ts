/**
 * Post Generator V2
 * 
 * New unified post generation system using type-specific handlers
 * Process:
 * 1. Handler gathers comprehensive data
 * 2. Builds rich Gemini prompt
 * 3. Gemini generates post
 * 4. Fact checker validates
 * 5. Editor refines
 * 6. Image generation
 */

import { createAdminSupabase } from '@/lib/supabase/server';
import { generatePostContent } from '@/lib/ai/gemini';
import { generatePostImage } from '@/lib/ai/images';
import { factCheckPost } from '@/lib/ai/fact-checker';
import { editPost } from '@/lib/ai/editor';
import { ContentOpportunity } from './scoring';
import {
  handleAnalysisPost,
  handleNostalgiaPost,
  handleGearPost,
  handleTravelPost,
  handleLifestylePost,
} from './post-handlers';
import { HandlerContext } from './post-handlers/types';
import {
  logHandlerData,
  logPromptInfo,
  logMissingData,
  logGenerationResult,
} from './content-logger';

export interface GeneratePostOptions {
  publish?: boolean;
  includeMarshall?: boolean;
  manualInstructions?: string; // For manual generation
}

/**
 * Generate a post from a content opportunity using type-specific handlers
 */
export async function generatePostFromOpportunityV2(
  opportunity: ContentOpportunity,
  options: GeneratePostOptions = {}
): Promise<{
  success: boolean;
  postId?: string;
  error?: string;
  dataSources?: string[];
}> {
  try {
    const { publish = false, includeMarshall, manualInstructions } = options;
    
    console.log(`\n[Post Generator V2] Generating ${opportunity.type} post: ${opportunity.topic}`);
    
    // 1. Route to appropriate handler based on opportunity type
    const handlerContext: HandlerContext = {
      opportunity,
      manualInstructions,
    };
    
    let handlerResult;
    let dataSources: string[] = [];
    
    switch (opportunity.type) {
      case 'match':
      case 'player':
      case 'news':
        handlerResult = await handleAnalysisPost(handlerContext);
        break;
      case 'blast-from-past':
        handlerResult = await handleNostalgiaPost(handlerContext);
        break;
      case 'gear':
        handlerResult = await handleGearPost(handlerContext);
        break;
      case 'tournament':
        // Tournament can be travel or analysis - check topic
        if (opportunity.topic.toLowerCase().includes('preview') ||
            opportunity.topic.toLowerCase().includes('guide')) {
          handlerResult = await handleTravelPost(handlerContext);
        } else {
          handlerResult = await handleAnalysisPost(handlerContext);
        }
        break;
      case 'lifestyle':
        handlerResult = await handleLifestylePost(handlerContext);
        break;
      default:
        // Fallback to analysis
        handlerResult = await handleAnalysisPost(handlerContext);
    }
    
    if (!handlerResult.success || !handlerResult.data) {
      throw new Error(handlerResult.error || 'Handler failed to gather data');
    }
    
    const { context, richData, dataSources: sources } = handlerResult.data;
    dataSources = sources;
    
    console.log(`[Post Generator V2] Data gathered from: ${dataSources.join(', ')}`);
    
    // Log handler data
    const handlerType = opportunity.type === 'tournament' 
      ? (opportunity.topic.toLowerCase().includes('preview') || opportunity.topic.toLowerCase().includes('guide') ? 'travel' : 'analysis')
      : opportunity.type;
    logHandlerData(handlerType, dataSources, richData);
    
    // 2. Generate post content with rich context
    console.log(`[Post Generator V2] Generating content with Gemini...`);
    
    // Get prompt length for logging (we'll need to estimate or get it from Gemini)
    const postContent = await generatePostContent(context);
    
    // Estimate prompt length (we'll log actual in a moment)
    const estimatedPromptLength = JSON.stringify(context).length;
    logPromptInfo(context, estimatedPromptLength);
    
    // Log missing data
    const missing: any = {};
    if (opportunity.type === 'analysis' && !richData.players) missing.player_stats = true;
    if (opportunity.type === 'analysis' && !richData.matches) missing.match_results = true;
    if (opportunity.type === 'travel' && !richData.weather) missing.weather_data = true;
    if (opportunity.type === 'blast-from-past' && !richData.historicalPlayer) missing.historical_context = true;
    if (opportunity.type === 'gear' && !richData.gearItems) missing.gear_specs = true;
    if (opportunity.type === 'travel' && !richData.hotels && !richData.restaurants) missing.location_info = true;
    
    if (Object.keys(missing).length > 0) {
      logMissingData(missing);
    }
    
    // 3. Fact check
    console.log(`[Post Generator V2] Fact-checking...`);
    const factCheckResult = await factCheckPost(postContent.content, context);
    
    // 4. Edit if needed
    let finalContent = postContent.content;
    let editorMadeChanges = false;
    if (factCheckResult.hasIssues) {
      console.log(`[Post Generator V2] Found ${factCheckResult.issues.length} fact-check issues, editing...`);
      const editResult = await editPost(
        postContent.content,
        postContent.title,
        postContent.excerpt,
        factCheckResult.issues,
        context
      );
      
      if (editResult.success && editResult.editedContent) {
        finalContent = editResult.editedContent;
        editorMadeChanges = true;
        console.log(`[Post Generator V2] Content edited successfully`);
      } else {
        console.warn(`[Post Generator V2] Edit failed: ${editResult.error}, using original content`);
      }
    }
    
    // 5. Determine post type and category
    const postTypeMap: Record<string, 'gear' | 'travel' | 'analysis' | 'lifestyle'> = {
      'preview': 'travel',
      'recap': 'analysis',
      'guide': context.type === 'gear' ? 'gear' : 'travel',
      'analysis': 'analysis',
      'gear': 'gear',
      'travel': 'travel',
      'lifestyle': 'lifestyle',
    };
    
    const geminiPostType = postContent.postType;
    const mappedType = postTypeMap[geminiPostType] || context.type;
    const dbCategory = mappedType.charAt(0).toUpperCase() + mappedType.slice(1) as 'Gear' | 'Travel' | 'Analysis' | 'Lifestyle';
    
    // 6. Generate image
    console.log(`[Post Generator V2] Generating image...`);
    const imageContext: any = {
      postType: mappedType,
      topic: opportunity.topic,
      tournament: context.tournament ? {
        name: context.tournament.name,
        location: context.tournament.location,
      } : undefined,
      isRecap: context.isRecap,
    };
    
    if (!context.isRecap && includeMarshall !== undefined) {
      imageContext.includeMarshall = includeMarshall;
    }
    
    const imageUrl = await generatePostImage(imageContext);
    
    // 7. Create slug
    const slug = postContent.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);
    
    // 8. Save to database
    const postData = {
      slug,
      title: postContent.title,
      excerpt: postContent.excerpt,
      content: finalContent,
      category: dbCategory,
      featured_image: imageUrl,
      meta_title: postContent.metaTitle || postContent.title,
      meta_description: postContent.metaDescription || postContent.excerpt,
      focus_keyword: postContent.focusKeyword || '',
      keywords: postContent.keywords || [],
      tags: postContent.tags || [],
      author_name: 'Marshall',
      reading_time: Math.ceil(finalContent.split(/\s+/).length / 200),
      published: publish,
      published_at: publish ? new Date().toISOString() : null,
      affiliate_links: [],
    };
    
    const supabase = createAdminSupabase();
    const { data: post, error: dbError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();
    
    if (dbError || !post) {
      throw new Error(dbError?.message || 'Failed to save post');
    }
    
    console.log(`[Post Generator V2] ✅ Post created: ${post.id} (${publish ? 'published' : 'draft'})`);
    
    // Log generation result
    logGenerationResult({
      success: true,
      post_id: post.id,
      title: postContent.title,
      content_length: finalContent.length,
      fact_check_issues: factCheckResult.hasIssues ? factCheckResult.issues.length : 0,
      editor_changes: editorMadeChanges,
    });
    
    return {
      success: true,
      postId: post.id,
      dataSources,
    };
  } catch (error: any) {
    console.error('[Post Generator V2] Error:', error);
    logGenerationResult({
      success: false,
      error: error.message,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}
