/**
 * Blog Post Utilities
 * 
 * Functions to fetch and manage blog posts from Supabase
 */

import { createServerSupabase } from '@/lib/supabase/server';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: "Gear" | "Travel" | "Analysis" | "Lifestyle";
  date: string;
  updatedDate?: string;
  featuredImage: string;
  author: {
    name: string;
    image?: string;
  };
  readingTime: number;
  tags: string[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    focusKeyword: string;
  };
  affiliateLinks?: {
    text: string;
    url: string;
    brand: string;
  }[];
}

/**
 * Fetch a single post by slug
 */
export async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error) {
    console.error('Error fetching post:', error);
    // If it's a "not found" error, that's expected
    if (error.code === 'PGRST116') {
      console.log(`Post not found with slug: ${slug}`);
    }
    return null;
  }

  if (!data) {
    console.log(`No data returned for slug: ${slug}`);
    return null;
  }

  console.log(`Found post: ${slug}`);
  return mapPostFromDB(data);
}

/**
 * Fetch all published posts
 */
export async function getAllPosts(limit?: number): Promise<BlogPost[]> {
  const supabase = await createServerSupabase();

  let query = supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.log('No published posts found in database');
    return [];
  }

  console.log(`Found ${data.length} published post(s)`);
  return data.map(mapPostFromDB);
}

/**
 * Fetch posts by category
 */
export async function getPostsByCategory(
  category: "Gear" | "Travel" | "Analysis" | "Lifestyle",
  limit?: number
): Promise<BlogPost[]> {
  const supabase = await createServerSupabase();

  let query = supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .eq('category', category)
    .order('published_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return data.map(mapPostFromDB);
}

/**
 * Get related posts (by tags or category)
 */
export async function getRelatedPosts(
  currentSlug: string,
  category: string,
  tags: string[],
  limit: number = 3
): Promise<BlogPost[]> {
  const supabase = await createServerSupabase();

  // First try to find posts with matching tags
  const { data: tagMatches } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .neq('slug', currentSlug)
    .overlaps('tags', tags)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (tagMatches && tagMatches.length >= limit) {
    return tagMatches.map(mapPostFromDB);
  }

  // Fall back to category matches
  const { data: categoryMatches } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .eq('category', category)
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (categoryMatches) {
    return categoryMatches.map(mapPostFromDB);
  }

  return [];
}

/**
 * Get all post slugs for static generation
 */
export async function getAllPostSlugs(): Promise<string[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from('posts')
    .select('slug')
    .eq('published', true);

  if (error || !data) {
    return [];
  }

  return data.map((post) => post.slug);
}

/**
 * Map database row to BlogPost interface
 */
function mapPostFromDB(row: any): BlogPost {
  // Parse affiliate links from JSONB
  const affiliateLinks = row.affiliate_links && Array.isArray(row.affiliate_links)
    ? row.affiliate_links
    : [];

  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    category: row.category,
    date: row.published_at || row.created_at,
    updatedDate: row.updated_at,
    featuredImage: row.featured_image,
    author: {
      name: row.author_name || 'Marshall',
      image: row.author_image,
    },
    readingTime: row.reading_time || 5,
    tags: row.tags || [],
    seo: {
      metaTitle: row.meta_title || row.title,
      metaDescription: row.meta_description || row.excerpt,
      keywords: row.keywords || [],
      focusKeyword: row.focus_keyword || '',
    },
    affiliateLinks,
  };
}
