/**
 * Social Media Post Types
 * 
 * Defines different types of social posts Marshall can create
 */

export type SocialPlatform = 'instagram' | 'x' | 'threads';

export type SocialPostType =
  | 'blog-promotion' // Promotes a blog post
  | 'match-reaction' // Quick reaction to a match (standalone)
  | 'stream-of-consciousness' // Quick thoughts, observations (standalone)
  | 'tournament-update' // Live tournament updates (standalone)
  | 'quick-tip' // Pro tips (standalone)
  | 'gear-recommendation' // Gear rec with affiliate link (standalone)
  | 'lifestyle' // Coffee shops, hotels, walks (standalone)
  | 'quote' // Player quotes, inspirational (standalone)
  | 'question' // Engaging questions to audience
  | 'behind-the-scenes'; // Behind the scenes content

export interface SocialPost {
  id?: string;
  platform: SocialPlatform;
  type: SocialPostType;
  content: string;
  image_url?: string;
  link_url?: string; // Link to blog post or affiliate
  scheduled_at?: string; // ISO timestamp
  published_at?: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  metadata?: {
    blog_post_id?: string;
    match_id?: string;
    tournament_id?: string;
    affiliate_link?: string;
    hashtags?: string[];
    mentions?: string[];
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Generate social post content based on type and context
 */
export interface SocialPostContext {
  blogPost?: {
    title: string;
    excerpt: string;
    url: string;
  };
  match?: {
    players: string[];
    result?: string;
    tournament: string;
  };
  tournament?: {
    name: string;
    location: string;
  };
  gear?: {
    name: string;
    affiliate_link: string;
  };
  lifestyle?: {
    type: 'hotel' | 'coffee' | 'walk' | 'restaurant';
    name: string;
    location: string;
  };
}

/**
 * Social post templates by type
 */
export const SOCIAL_POST_TEMPLATES: Record<
  SocialPostType,
  (context: SocialPostContext) => string
> = {
  'blog-promotion': (ctx) => {
    if (!ctx.blogPost) return '';
    return `${ctx.blogPost.title}\n\n${ctx.blogPost.excerpt}\n\nRead more: ${ctx.blogPost.url}`;
  },
  
  'match-reaction': (ctx) => {
    if (!ctx.match) return '';
    const { players, result } = ctx.match;
    if (result) {
      return `WHAT A MATCH. ${result}. That was tennis at its absolute best. 🏆`;
    }
    return `${players[0]} vs ${players[1]}. This is going to be 🔥`;
  },
  
  'stream-of-consciousness': (ctx) => {
    if (ctx.tournament) {
      return `Walking around ${ctx.tournament.location} before ${ctx.tournament.name}. The energy here is electric. 🎾`;
    }
    return 'Just had the best coffee. Perfect spot to watch the matches. ☕';
  },
  
  'tournament-update': (ctx) => {
    if (!ctx.tournament) return '';
    return `${ctx.tournament.name} starting in 30 minutes. Who you got? 🎾`;
  },
  
  'quick-tip': () => {
    return 'Pro tip: If you\'re going to a tournament, book hotels 2+ miles away. Way cheaper. 💡';
  },
  
  'gear-recommendation': (ctx) => {
    if (!ctx.gear) return '';
    return `Just switched to ${ctx.gear.name} and my game improved. Link in bio. 🔗`;
  },
  
  'lifestyle': (ctx) => {
    if (!ctx.lifestyle) return '';
    const { type, name, location } = ctx.lifestyle;
    if (type === 'coffee') {
      return `Found the best coffee in ${location}. ${name} is a must-visit. ☕`;
    }
    if (type === 'hotel') {
      return `Staying at ${name} in ${location}. Perfect spot for the tournament. 🏨`;
    }
    return `Exploring ${location}. This place is beautiful. 🚶`;
  },
  
  'quote': () => {
    return '"The ball doesn\'t know how old you are." - Some wisdom for today. 💭';
  },
  
  'question': () => {
    return 'Who\'s your pick to win this tournament? Drop your predictions below! 🎾';
  },
  
  'behind-the-scenes': () => {
    return 'Behind the scenes: Getting ready for today\'s matches. The prep never stops. 📸';
  },
};
