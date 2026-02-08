/**
 * Content quality checks after generation.
 * If checks fail, mark post as needs_review instead of auto-publishing.
 */

import type { MarshallState } from '@/lib/marshall/state';

export interface ContentQualityResult {
  needsReview: boolean;
  reasons: string[];
}

/**
 * Run content quality gates:
 * 1. If context had videos, content must contain at least one YouTube link (we may have injected; still flag if we had to inject).
 * 2. If context had marshallState, content should contain at least one concrete Marshall detail (city, racket, or player).
 * 3. For gear/travel, at least one [AFF:...] or clear CTA.
 */
export function checkContentQuality(
  content: string,
  context: {
    videos?: Array<{ url: string }>;
    marshallState?: MarshallState | null;
    type?: string;
  },
  options?: { hadToInjectVideos?: boolean }
): ContentQualityResult {
  const reasons: string[] = [];

  if (context.videos && context.videos.length > 0) {
    const hasYoutube = /youtube\.com|youtu\.be/.test(content);
    if (!hasYoutube) {
      reasons.push('Context had videos but content has no YouTube link');
    } else if (options?.hadToInjectVideos) {
      reasons.push('Videos were injected (model omitted links)');
    }
  }

  if (context.marshallState) {
    const ms = context.marshallState;
    const hasCity = ms.current_city && content.toLowerCase().includes(ms.current_city.toLowerCase());
    const hasCountry = ms.current_country && content.toLowerCase().includes(ms.current_country.toLowerCase());
    const hasRacket = ms.current_racket && content.toLowerCase().includes(ms.current_racket.toLowerCase());
    const hasPlayer = ms.up_and_coming_player_watching && content.toLowerCase().includes(ms.up_and_coming_player_watching.toLowerCase());
    if (!hasCity && !hasCountry && !hasRacket && !hasPlayer) {
      reasons.push('Context had Marshall state but content does not mention his location, racket, or player he\'s watching');
    }
  }

  const isGearOrTravel = context.type === 'gear' || context.type === 'travel';
  const isFeaturedType = isGearOrTravel || context.type === 'lifestyle' || (context as { affiliateFeatured?: boolean }).affiliateFeatured;
  if (isGearOrTravel) {
    const hasAff = /\[AFF:[^\]]+\]/.test(content);
    if (!hasAff) {
      reasons.push('Gear/travel post has no [AFF:...] link');
    }
  }
  // For affiliate-featured types: at least one [AFF:...] or shortcode in first 400 words
  // Exception: gear posts with thin data (no/single item or no affiliate links) may not have AFF early
  const gearData = (context as { gearData?: Array<{ amazon_affiliate_link?: string | null }> }).gearData;
  const hasAffiliateGear = Array.isArray(gearData) && gearData.length > 0 &&
    gearData.some((item) => item?.amazon_affiliate_link);
  const thinGearPost = context.type === 'gear' && (!hasAffiliateGear || (Array.isArray(gearData) && gearData.length <= 1));
  if (isFeaturedType && !thinGearPost) {
    const first400 = content.slice(0, 400);
    const hasAffInFirst400 = /\[AFF:[^\]]+\]/.test(first400);
    const hasShortcodeInFirst400 = /\[\[[\w_]+\s+[^\]]+\]\]/.test(first400);
    if (!hasAffInFirst400 && !hasShortcodeInFirst400) {
      reasons.push('Featured affiliate post has no [AFF:...] or shortcode in first 400 words');
    }
  }

  return {
    needsReview: reasons.length > 0,
    reasons,
  };
}
