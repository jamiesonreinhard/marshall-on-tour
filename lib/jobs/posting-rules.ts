/**
 * Posting Frequency Rules
 * 
 * Ensures Marshall posts at realistic, non-robotic frequencies
 */

import { createAdminSupabase } from '@/lib/supabase/server';

export interface PostingStatus {
  canPostBlog: boolean;
  canPostSocial: boolean;
  blogPostsToday: number;
  socialPostsToday: number;
  hoursSinceLastPost: number;
  reason?: string;
}

/**
 * Check if we can post a blog post today
 */
export async function canPostBlog(): Promise<PostingStatus> {
  const supabase = createAdminSupabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  // Get posts created today
  const { data: posts, count } = await supabase
    .from('posts')
    .select('id, published_at', { count: 'exact' })
    .gte('published_at', todayStr)
    .lt('published_at', new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  
  const blogPostsToday = count || 0;
  
  // TEMPORARILY DISABLED: Max 1 blog post per day restriction removed for testing
  // TODO: Re-enable after testing phase
  // if (blogPostsToday >= 1) {
  //   return {
  //     canPostBlog: false,
  //     canPostSocial: true, // Can still post social
  //     blogPostsToday,
  //     socialPostsToday: 0, // Will be calculated separately
  //     hoursSinceLastPost: 0,
  //     reason: `Already posted ${blogPostsToday} blog post(s) today (max 1/day)`,
  //   };
  // }
  
  // TEMPORARILY DISABLED: Min 12 hours between posts restriction removed for testing
  // TODO: Re-enable after testing phase
  // Check if we've posted recently (min 12 hours between posts)
  const { data: lastPost } = await supabase
    .from('posts')
    .select('published_at')
    .order('published_at', { ascending: false })
    .limit(1)
    .single();
  
  if (lastPost?.published_at) {
    const lastPostDate = new Date(lastPost.published_at);
    const hoursSinceLastPost = (today.getTime() - lastPostDate.getTime()) / (1000 * 60 * 60);
    
    // TEMPORARILY DISABLED: Min 12 hours restriction removed for testing
    // if (hoursSinceLastPost < 12) {
    //   return {
    //     canPostBlog: false,
    //     canPostSocial: true,
    //     blogPostsToday,
    //     socialPostsToday: 0,
    //     hoursSinceLastPost,
    //     reason: `Last post was ${hoursSinceLastPost.toFixed(1)} hours ago (min 12 hours between posts)`,
    //   };
    // }
    
    return {
      canPostBlog: true,
      canPostSocial: true,
      blogPostsToday,
      socialPostsToday: 0,
      hoursSinceLastPost,
    };
  }
  
  // No previous posts, can post
  return {
    canPostBlog: true,
    canPostSocial: true,
    blogPostsToday,
    socialPostsToday: 0,
    hoursSinceLastPost: 24, // Assume 24 hours if no previous posts
  };
}

/**
 * Check if we can post social media content today
 */
export async function canPostSocial(): Promise<PostingStatus> {
  const supabase = createAdminSupabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];
  
  // Get social posts created today (assuming we'll have a social_posts table)
  // For now, we'll use a placeholder - this will need to be implemented
  // TODO: Create social_posts table or track in posts table with a type field
  
  // For MVP, we'll just check blog posts and assume social posts are separate
  // Max 3-4 social posts per day
  const maxSocialPosts = 4;
  
  // Placeholder: In real implementation, query social_posts table
  const socialPostsToday = 0; // TODO: Implement actual query
  
  if (socialPostsToday >= maxSocialPosts) {
    return {
      canPostBlog: false,
      canPostSocial: false,
      blogPostsToday: 0,
      socialPostsToday,
      hoursSinceLastPost: 0,
      reason: `Already posted ${socialPostsToday} social post(s) today (max ${maxSocialPosts}/day)`,
    };
  }
  
  return {
    canPostBlog: false,
    canPostSocial: true,
    blogPostsToday: 0,
    socialPostsToday,
    hoursSinceLastPost: 0,
  };
}

/**
 * Get overall posting status
 */
export async function getPostingStatus(): Promise<PostingStatus> {
  const blogStatus = await canPostBlog();
  const socialStatus = await canPostSocial();
  
  return {
    canPostBlog: blogStatus.canPostBlog,
    canPostSocial: socialStatus.canPostSocial,
    blogPostsToday: blogStatus.blogPostsToday,
    socialPostsToday: socialStatus.socialPostsToday,
    hoursSinceLastPost: blogStatus.hoursSinceLastPost,
    reason: blogStatus.reason || socialStatus.reason,
  };
}
