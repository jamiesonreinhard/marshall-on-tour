/**
 * Image Generation Strategy Guide
 * 
 * Determines what type of image to generate based on post type and content
 * Ensures images are engaging, relevant, and consistent
 */

export interface ImageStrategy {
  includeMarshall: boolean;
  imageType: 'marshall-portrait' | 'tournament-scene' | 'gear-showcase' | 'travel-location' | 'lifestyle-moment' | 'player-action' | 'abstract-tennis';
  sceneDescription: string;
  styleGuide: string;
  consistencyNotes: string;
}

/**
 * Determine image strategy based on post context
 */
export function getImageStrategy(
  postType: 'gear' | 'travel' | 'analysis' | 'lifestyle',
  topic: string,
  tournament?: { name: string; location: string },
  isRecap?: boolean
): ImageStrategy {
  const topicLower = topic.toLowerCase();
  
  // RECAP POSTS: Tournament-focused imagery, NOT Marshall's face
  if (isRecap || topicLower.includes('recap') || topicLower.includes('final') || topicLower.includes('champions crowned')) {
    if (tournament) {
      return {
        includeMarshall: false,
        imageType: 'tournament-scene',
        sceneDescription: `Professional tennis tournament scene at ${tournament.location}. ${tournament.name} championship moment. Tennis court, stadium atmosphere, celebration. Action shot of tennis players, crowd in background, trophy ceremony. Dynamic, cinematic composition.`,
        styleGuide: 'Professional sports photography, high-energy, vibrant colors, dramatic lighting, wide-angle composition showing stadium atmosphere',
        consistencyNotes: 'Tournament recaps should focus on the event, not Marshall. Use action shots, stadium views, or trophy moments.',
      };
    }
  }
  
  // PREVIEW POSTS: Tournament location/travel imagery
  if (topicLower.includes('preview') || topicLower.includes('guide')) {
    if (tournament) {
      return {
        includeMarshall: false,
        imageType: 'travel-location',
        sceneDescription: `Beautiful ${tournament.location} cityscape or landmark. Tennis tournament venue in background. Travel destination photography. Luxury travel aesthetic, golden hour lighting, iconic location.`,
        styleGuide: 'Travel photography, destination-focused, architectural details, local culture, aspirational luxury travel',
        consistencyNotes: 'Preview posts showcase the location, not Marshall. Focus on destination appeal.',
      };
    }
  }
  
  // GEAR POSTS: Comparison guides - showcase multiple products, Marshall optional
  if (postType === 'gear' || topicLower.includes('racket') || topicLower.includes('gear') || topicLower.includes('best') || topicLower.includes('guide')) {
    // Gear guides comparing multiple products - focus on products, Marshall optional
    if (topicLower.includes('guide') || topicLower.includes('best') || topicLower.includes('complete')) {
      return {
        includeMarshall: false, // Gear guides focus on products, not Marshall
        imageType: 'gear-showcase',
        sceneDescription: `Professional product photography of multiple tennis equipment items arranged beautifully. Rackets, shoes, bags, or apparel displayed together. Clean, modern aesthetic, product photography style. Professional lighting, products in focus.`,
        styleGuide: 'Product photography, clean backgrounds, multiple products showcased, professional but approachable, e-commerce style',
        consistencyNotes: 'Gear guides should showcase products, not Marshall. Focus on the gear comparison.',
      };
    } else {
      // Single product review (rare) - Marshall with product
      return {
        includeMarshall: true,
        imageType: 'gear-showcase',
        sceneDescription: `Marshall holding or reviewing tennis equipment. High-end tennis gear prominently displayed. Clean, modern aesthetic, product photography style. Professional lighting, gear in focus.`,
        styleGuide: 'Product photography meets lifestyle. Clean backgrounds, gear is hero. Marshall is secondary but present. Professional but approachable.',
        consistencyNotes: 'Gear posts should show Marshall with the product. Use consistent face reference for Marshall.',
      };
    }
  }
  
  // PLAYER PROFILE POSTS: Player action shots, not Marshall
  if (topicLower.includes('rising star') || topicLower.includes('player') || topicLower.includes('profile')) {
    return {
      includeMarshall: false,
      imageType: 'player-action',
      sceneDescription: `Professional tennis player in action. Dynamic match photography. Player hitting forehand or backhand, intense focus, athletic movement. Court action, dramatic lighting.`,
      styleGuide: 'Sports action photography, player-focused, dynamic movement, professional tennis photography style',
      consistencyNotes: 'Player profiles should showcase the player, not Marshall. Use action shots or match photography.',
    };
  }
  
  // LIFESTYLE POSTS: Marshall in lifestyle settings
  if (postType === 'lifestyle' || topicLower.includes('coffee') || topicLower.includes('hotel') || topicLower.includes('travel')) {
    return {
      includeMarshall: true,
      imageType: 'lifestyle-moment',
      sceneDescription: `Marshall in a luxury lifestyle setting. Coffee shop, hotel lobby, or city walk. Casual but refined, quiet luxury aesthetic. Natural, candid moment.`,
      styleGuide: 'Lifestyle photography, candid moments, natural lighting, authentic social media style, quiet luxury vibe',
      consistencyNotes: 'Lifestyle posts should include Marshall. Use consistent face reference. Focus on authentic moments.',
    };
  }
  
  // ANALYSIS/MATCH POSTS: Tournament scene or player action
  if (postType === 'analysis') {
    if (topicLower.includes('match') || topicLower.includes('vs') || topicLower.includes('versus')) {
      return {
        includeMarshall: false,
        imageType: 'player-action',
        sceneDescription: `Professional tennis match action. Players in intense rally, dramatic court moment. Stadium atmosphere, crowd energy. Dynamic sports photography.`,
        styleGuide: 'Sports action photography, match-focused, high energy, professional tennis photography',
        consistencyNotes: 'Match analysis should show the match, not Marshall. Use action shots or court scenes.',
      };
    } else {
      // General analysis: Marshall courtside or tournament scene
      return {
        includeMarshall: true,
        imageType: 'tournament-scene',
        sceneDescription: `Marshall courtside at a tennis tournament. Professional tennis setting, stadium in background. Marshall observing, notebook or coffee in hand. Authentic insider moment.`,
        styleGuide: 'Documentary-style photography, Marshall as observer, tournament atmosphere, authentic insider perspective',
        consistencyNotes: 'Analysis posts can include Marshall as observer. Use consistent face reference.',
      };
    }
  }
  
  // DEFAULT: Marshall portrait (fallback)
  return {
    includeMarshall: true,
    imageType: 'marshall-portrait',
    sceneDescription: `Marshall, a handsome 33-year-old tennis tour insider. Candid portrait, authentic moment.`,
    styleGuide: 'Portrait photography, natural lighting, authentic social media style',
    consistencyNotes: 'Default to Marshall portrait. Use consistent face reference.',
  };
}
