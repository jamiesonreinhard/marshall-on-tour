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
        sceneDescription: `Marshall actively testing or reviewing tennis equipment in a natural setting. High-end tennis gear prominently displayed. Marshall engaged with the product - testing it, examining it, or using it. Candid moment, not posed. Professional lighting, gear in focus.`,
        styleGuide: 'Product photography meets lifestyle. Clean backgrounds, gear is hero. Marshall is secondary but present, actively engaging with the product. Professional but approachable. Candid, action-oriented composition.',
        consistencyNotes: 'Gear posts should show Marshall actively engaging with the product. Use consistent face reference for Marshall. Candid, not posed.',
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
  
  // LIFESTYLE POSTS: Marshall in lifestyle settings (candid, face not visible)
  if (postType === 'lifestyle' || topicLower.includes('coffee') || topicLower.includes('hotel') || topicLower.includes('travel')) {
      // Select a random lifestyle scene for variety - all candid, face not visible or looking away
      const lifestyleScenes = [
        'Marshall walking through a European city, cobblestone streets, tennis bag over shoulder, exploring the area, seen from behind or side profile, face not visible',
        'Marshall having coffee at an outdoor cafe, looking out at the street scene, people walking by, completely absorbed in the moment, unaware of camera, NOT looking at camera',
        'Marshall exploring a new city neighborhood, tennis racket visible, taking photos, travel aesthetic, seen from behind or side, face not clearly visible',
        'Marshall at a coffee shop, laptop open, tennis tournament on screen, working, head down looking at screen, face not visible',
        'Marshall walking through tournament grounds, observing players practice, notebook in hand, seen from behind or side, face not visible',
        'Marshall at a local market or street, discovering local food, tennis bag visible, travel exploration, looking away from camera, face not clearly visible',
        'Marshall at a rooftop bar overlooking a tennis venue, golden hour, seen from behind looking at the view, face not visible',
      ];
      
      const randomScene = lifestyleScenes[Math.floor(Math.random() * lifestyleScenes.length)];
      
      return {
        includeMarshall: true,
        imageType: 'lifestyle-moment',
        sceneDescription: `${randomScene}. Casual but refined, quiet luxury aesthetic. Natural, candid moment. Marshall engaged in the activity, not posing. Environmental portraiture - show Marshall in context doing something authentic. Face not visible or looking away from camera.`,
        styleGuide: 'Lifestyle photography, candid moments, natural lighting, authentic social media style, quiet luxury vibe. Candid, action-oriented composition. Marshall should be doing something, not just looking at camera. Face should not be clearly visible.',
        consistencyNotes: 'Lifestyle posts should include Marshall in candid, authentic moments. Face should not be visible to avoid consistency issues. Focus on body language and environment.',
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
      // General analysis: Marshall in candid, natural moments (face not visible or looking away)
      // Select a random analysis scene for variety - all very candid, face not clearly visible
      // FIRST SCENE is the French cafe scene the user specifically wants
      const analysisScenes = [
        'Marshall sitting at an outdoor French cafe table on a Parisian or Montpellier street, small espresso cup in hand, looking out at the street scene, people walking by, cars passing, completely absorbed in the moment, unaware of camera, natural relaxed posture, candid street photography, NOT looking at camera, NOT posing, face looking away from camera',
        'Marshall at a small bistro table, coffee cup in hand, reading something on his phone or newspaper, completely absorbed, head down looking at phone/newspaper, face not visible, unaware of camera, authentic moment, natural body language',
        'Marshall walking through a European city street, tennis bag slung over shoulder, looking at architecture or signs, natural walking pose, seen from behind or side profile, face not visible, candid street photography, NOT looking at camera',
        'Marshall sitting on a park bench near tennis courts, coffee beside him, watching players practice in distance, seen from behind or side, face not visible, relaxed, natural body language, documentary style, unaware of camera',
        'Marshall at a local market or street cafe, talking with a local or vendor, seen from behind or side, face not clearly visible, genuine interaction, not posed, natural conversation moment, NOT looking at camera',
      ];
      
      const randomScene = analysisScenes[Math.floor(Math.random() * analysisScenes.length)];
      
      return {
        includeMarshall: true,
        imageType: 'tournament-scene',
        sceneDescription: `${randomScene}. Completely candid, unposed moment. Marshall is NOT aware of the camera, NOT looking at camera, NOT posing. Natural body language, authentic behavior. Documentary street photography style. Face should not be clearly visible.`,
        styleGuide: 'Street photography, candid documentary style, natural unposed moments, Marshall unaware of camera, authentic behavior, environmental context clearly visible. NOT staged, NOT posed, NOT looking at camera. Face should not be clearly visible to avoid consistency issues.',
        consistencyNotes: 'Analysis posts should show Marshall in completely candid, natural moments. Face should not be visible or should be looking away to avoid consistency issues. Focus on body language and environment.',
      };
    }
  }
  
  // DEFAULT: Marshall in candid moment (fallback) - face not visible
  return {
    includeMarshall: true,
    imageType: 'lifestyle-moment',
    sceneDescription: `Marshall in a candid, authentic moment - walking through a city, having coffee, exploring a location, or engaging in a natural activity. Environmental portraiture, not a centered portrait. Marshall doing something, not posing. Seen from behind or side, face not clearly visible, or looking away from camera.`,
    styleGuide: 'Lifestyle photography, candid moments, natural lighting, authentic social media style. Candid, action-oriented composition. Marshall should be doing something authentic. Face should not be clearly visible.',
    consistencyNotes: 'Default to Marshall in candid moment. Face should not be visible to avoid consistency issues. Focus on body language and environment.',
  };
}
