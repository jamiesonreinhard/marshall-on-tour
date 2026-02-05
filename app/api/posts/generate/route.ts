import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/server';
import { generatePostContent } from '@/lib/ai/gemini';
import { generatePostImage } from '@/lib/ai/images';
import { getAllContentOpportunities, analyzeRecentPosts } from '@/lib/data/processor';
import { generatePostFromOpportunity } from '@/lib/jobs/post-generator';
import { generatePostFromOpportunityV2 } from '@/lib/jobs/post-generator-v2';
import { ContentOpportunity } from '@/lib/jobs/scoring';
import { generateTopic } from '@/lib/jobs/topic-generator';
import { scoreOpportunity } from '@/lib/jobs/scoring';
import { revalidatePath } from 'next/cache';

/**
 * API Route to Generate Blog Post
 * 
 * POST /api/posts/generate
 * 
 * Body (optional):
 * {
 *   "type": "gear" | "travel" | "analysis" | "lifestyle",
 *   "topic": "specific topic",
 *   "tournamentId": "optional tournament id",
 *   "newsItemId": "optional news item id",
 *   "publish": true/false (default: false - saves as draft)
 * }
 * 
 * If no body provided, uses content opportunities to auto-select topic
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      type,
      topic,
      tournamentId,
      newsItemId,
      publish = false,
      includeMarshall = true,
      category, // For gear posts: 'racket', 'clothing', 'accessory'
      manualInstructions, // Additional instructions for manual generation
      useV2 = true, // Use new V2 generator by default
    } = body;

    // Get recent posts for context (needed for both paths)
    const recentPosts = await analyzeRecentPosts(5);
    const recentPostsContext = recentPosts.map((p: any) => ({
      title: p.title,
      category: p.category,
    }));

    // If type is provided, create a ContentOpportunity and use post-generator
    // This ensures consistent handling with the content intelligence job
    if (type && type !== 'auto') {
      // Create a ContentOpportunity from the manual selection
      const opportunityId = `manual-${Date.now()}-${Math.random()}`;
      
      // Generate topic intelligently if not provided
      let finalTopic = topic;
      if (!finalTopic) {
        console.log(`[API] No topic provided, generating intelligently for type: ${type}`);
        finalTopic = await generateTopic({
          type: type as any,
          manualInstructions,
          tournamentId,
        });
        console.log(`[API] Generated topic: ${finalTopic}`);
      }
      
      // Get tournament data if tournamentId provided
      let tournamentMetadata: any = {};
      if (tournamentId) {
        const supabase = createAdminSupabase();
        const { data: tournamentData } = await supabase
          .from('atp_calendar')
          .select('*')
          .eq('id', tournamentId)
          .single();
        
        if (tournamentData) {
          tournamentMetadata.tournament_id = tournamentData.id;
          tournamentMetadata.isRecap = finalTopic.toLowerCase().includes('recap') || 
                                       finalTopic.toLowerCase().includes('final');
        }
      }
      
      // Add gear metadata
      if (type === 'gear' && category) {
        tournamentMetadata.guide_type = category;
      }
      
      // Create opportunity object (without totalScore - will be scored)
      const opportunityInput: Omit<ContentOpportunity, 'totalScore' | 'contentVariety'> = {
        id: opportunityId,
        type: type as ContentOpportunity['type'],
        topic: finalTopic,
        description: `Manual post generation: ${finalTopic}`,
        timeliness: 20,
        affiliatePotential: type === 'gear' || type === 'lifestyle' ? 20 : 10,
        seoValue: 15,
        socialEngagement: 8,
        metadata: tournamentMetadata,
      };
      
      // Score the opportunity (this checks for duplicates and variety)
      const opportunity = await scoreOpportunity(opportunityInput);
      
      // Check if this opportunity would be blocked due to recent posts
      if (opportunity.contentVariety < 0) {
        return NextResponse.json(
          { 
            error: 'This topic has been covered recently. Please try a different topic or wait a few days.',
            details: `Content variety score: ${opportunity.contentVariety}. Recent posts may have covered similar content.`,
          },
          { status: 400 }
        );
      }
      
      console.log(`[API] Opportunity scored: ${opportunity.totalScore} (variety: ${opportunity.contentVariety})`);
      
      // Use V2 generator (with handlers) or V1 (legacy)
      const result = useV2
        ? await generatePostFromOpportunityV2(opportunity, {
            publish,
            includeMarshall,
            manualInstructions,
          })
        : await generatePostFromOpportunity(opportunity, {
            publish,
            includeMarshall,
          });
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to generate post', details: result.error },
          { status: 500 }
        );
      }
      
      // Revalidate blog pages if published
      if (publish && result.postId) {
        const supabase = createAdminSupabase();
        const { data: post } = await supabase
          .from('posts')
          .select('slug')
          .eq('id', result.postId)
          .single();
        
        if (post) {
          revalidatePath('/blog');
          revalidatePath(`/blog/${post.slug}`);
          revalidatePath('/');
        }
      }
      
      return NextResponse.json({
        success: true,
        post: {
          id: result.postId,
          published: publish,
        },
        message: publish ? 'Post published successfully' : 'Post saved as draft',
      });
    }
    
    // Auto-select from opportunities (original behavior)
    let context;
    if (false) {
      // This branch is now unreachable but kept for structure
    } else {
      // Auto-select from opportunities
      const opportunities = await getAllContentOpportunities();
      if (opportunities.length === 0) {
        return NextResponse.json(
          { error: 'No content opportunities found' },
          { status: 400 }
        );
      }

      const opportunity = opportunities[0]; // Highest priority
      
      // Map opportunity type to PostGenerationContext type
      // 'tournament' -> 'travel' or 'analysis', 'news' -> 'analysis'
      let contextType: 'gear' | 'travel' | 'analysis' | 'lifestyle';
      if (opportunity.type === 'tournament') {
        // If title mentions "Preview" or "Guide", it's travel. Otherwise analysis.
        contextType = opportunity.title.toLowerCase().includes('preview') || 
                     opportunity.title.toLowerCase().includes('guide')
          ? 'travel'
          : 'analysis';
      } else if (opportunity.type === 'news') {
        contextType = 'analysis';
      } else {
        contextType = opportunity.type as 'gear' | 'travel' | 'lifestyle';
      }
      
      // Map opportunity data to context format
      let tournament;
      let newsItem;
      
      if (opportunity.type === 'tournament' && opportunity.data) {
        tournament = {
          name: opportunity.data.name || opportunity.data.title || '',
          location: opportunity.data.location?.city 
            ? `${opportunity.data.location.city}, ${opportunity.data.location.country}`
            : opportunity.data.location || '',
          startDate: opportunity.data.start_date || new Date().toISOString(),
        };
      } else if (opportunity.type === 'news' && opportunity.data) {
        newsItem = {
          title: opportunity.data.title || '',
          description: opportunity.data.description || '',
          source: opportunity.data.source || '',
        };
      }

      context = {
        type: contextType,
        topic: opportunity.title,
        tournament,
        newsItem,
        recentPosts: recentPostsContext,
      };
    }

    // Generate post content
    console.log('Generating post content...');
    const postContent = await generatePostContent(context);
    
    // Validate content before saving
    if (!postContent.content || typeof postContent.content !== 'string') {
      console.error('Invalid content received:', typeof postContent.content, postContent);
      return NextResponse.json(
        { error: 'Generated content is invalid', details: 'Content is not a string' },
        { status: 500 }
      );
    }
    
    // Ensure content is not a JSON object string
    if (postContent.content.trim().startsWith('{') && postContent.content.trim().endsWith('}')) {
      console.error('Content appears to be JSON object instead of markdown:', postContent.content.substring(0, 200));
      return NextResponse.json(
        { error: 'Generated content is invalid', details: 'Content appears to be JSON object, not markdown' },
        { status: 500 }
      );
    }
    
    console.log('Content validated:', {
      title: postContent.title,
      contentLength: postContent.content.length,
      contentPreview: postContent.content.substring(0, 100),
    });

    // Generate image
    console.log('Generating post image...');
    const imageUrl = await generatePostImage({
      postType: context.type,
      topic: context.topic,
      tournament: context.tournament ? {
        name: context.tournament.name,
        location: context.tournament.location,
      } : undefined,
      includeMarshall,
    });

    // Create slug from title
    const slug = postContent.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 100);

    // Save to Supabase
    const supabase = createAdminSupabase();
    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        slug,
        title: postContent.title,
        excerpt: postContent.excerpt,
        content: postContent.content,
        category: context.type.charAt(0).toUpperCase() + context.type.slice(1),
        featured_image: imageUrl,
        meta_title: postContent.metaTitle || postContent.title,
        meta_description: postContent.metaDescription || postContent.excerpt,
        focus_keyword: postContent.focusKeyword || '',
        keywords: postContent.keywords || [],
        tags: postContent.tags || [],
        author_name: 'Marshall',
        reading_time: Math.ceil(postContent.content.split(/\s+/).length / 200), // Markdown word count
        published: publish,
        published_at: publish ? new Date().toISOString() : null,
        affiliate_links: [], // Can be populated later
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving post:', error);
      return NextResponse.json(
        { error: 'Failed to save post', details: error.message },
        { status: 500 }
      );
    }

    // Revalidate blog pages if published
    if (publish) {
      revalidatePath('/blog');
      revalidatePath(`/blog/${slug}`);
      revalidatePath('/');
    }

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        slug: post.slug,
        title: post.title,
        published: post.published,
        url: publish ? `/blog/${post.slug}` : null,
      },
      message: publish ? 'Post published successfully' : 'Post saved as draft',
    });
  } catch (error: any) {
    console.error('Error generating post:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate post',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to see available content opportunities
 */
export async function GET() {
  try {
    const opportunities = await getAllContentOpportunities();
    return NextResponse.json({
      opportunities: opportunities.slice(0, 10), // Top 10
      message: 'POST to /api/posts/generate to create a post from these opportunities',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch opportunities', details: error.message },
      { status: 500 }
    );
  }
}
