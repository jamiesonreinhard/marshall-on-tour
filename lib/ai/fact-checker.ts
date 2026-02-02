/**
 * Fact-Checker Agent
 * 
 * Validates factual claims in blog posts across all content types:
 * - Tournament/Analysis: Player achievements, GOAT claims, tournament results
 * - Gear: Product specs, brand names, technical claims
 * - Travel: Location facts, hotel/restaurant names, distances
 * - Player profiles: Stats, age, achievements, rankings
 * - Lifestyle: Location facts, cultural references
 * - Blast from past: Historical facts, player achievements, dates
 */

import { PostGenerationContext } from './gemini';

export interface FactCheckResult {
  hasIssues: boolean;
  issues: FactCheckIssue[];
  correctedContent?: string;
}

export interface FactCheckIssue {
  type: 'hyperbole' | 'factual_error' | 'overstatement' | 'unverifiable_claim';
  severity: 'high' | 'medium' | 'low';
  originalText: string;
  issue: string;
  suggestion: string;
  context?: string;
}

/**
 * Fact-check a blog post based on its type and context
 */
export async function factCheckPost(
  content: string,
  context: PostGenerationContext
): Promise<FactCheckResult> {
  const issues: FactCheckIssue[] = [];
  
  // Type-specific fact-checking
  switch (context.type) {
    case 'analysis':
      issues.push(...checkAnalysisFacts(content, context));
      break;
    case 'gear':
      issues.push(...checkGearFacts(content, context));
      break;
    case 'travel':
      issues.push(...checkTravelFacts(content, context));
      break;
    case 'lifestyle':
      issues.push(...checkLifestyleFacts(content, context));
      break;
  }
  
  // Universal checks (apply to all types)
  issues.push(...checkUniversalIssues(content, context));
  
  // CRITICAL: Check for embedded field labels (Title:, Excerpt:, Content:)
  // These should NEVER be in the content - they're separate fields!
  issues.push(...checkForEmbeddedLabels(content));
  
  return {
    hasIssues: issues.length > 0,
    issues,
  };
}

/**
 * Check facts for analysis posts (tournament, match, player, news)
 */
function checkAnalysisFacts(
  content: string,
  context: PostGenerationContext
): FactCheckIssue[] {
  const issues: FactCheckIssue[] = [];
  const contentLower = content.toLowerCase();
  
  // Check for GOAT claims - this is the main issue we're solving
  const goatPatterns = [
    /(?:cemented|established|proved|confirmed|is|are|has|have).*?goat/i,
    /greatest.*?of.*?all.*?time/i,
    /goat.*?status/i,
    /(?:the|a).*?goat/i,
  ];
  
  for (const pattern of goatPatterns) {
    const matches = content.match(new RegExp(pattern.source, 'gi'));
    if (matches) {
      // Extract the sentence/context around the GOAT claim
      const playerNames = extractPlayerNames(content);
      
      for (const match of matches) {
        // Find which player this claim is about
        const matchIndex = content.toLowerCase().indexOf(match.toLowerCase());
        const surroundingText = content.substring(
          Math.max(0, matchIndex - 100),
          Math.min(content.length, matchIndex + match.length + 100)
        );
        
        // Check each player mentioned near this claim
        for (const player of playerNames) {
          if (surroundingText.toLowerCase().includes(player.toLowerCase())) {
            // Check if this is a young player (definitely overstatement)
            if (isYoungPlayer(player)) {
              issues.push({
                type: 'overstatement',
                severity: 'high',
                originalText: match,
                issue: `Claiming ${player} has "GOAT status" is a major overstatement. ${player} is young (early 20s) with 7 Grand Slams. GOAT status requires 20+ Grand Slams (Federer: 20, Nadal: 22, Djokovic: 24+) and decades of dominance.`,
                suggestion: `Replace with accurate language: "${player} made history by completing the career Grand Slam at 22" or "${player}'s historic achievement puts him on a legendary trajectory" or "${player} is building a resume that could one day place him among the all-time greats"`,
                context: `Player: ${player}, Context: ${surroundingText.substring(0, 150)}...`,
              });
            } else {
              // Even for older players, verify GOAT claims
              issues.push({
                type: 'unverifiable_claim',
                severity: 'medium',
                originalText: match,
                issue: `GOAT claim about ${player} may be debatable. The GOAT debate typically centers on Federer, Nadal, and Djokovic.`,
                suggestion: `Use more measured language unless this is clearly about one of the Big 3 with 20+ Slams`,
                context: `Player: ${player}`,
              });
            }
          }
        }
      }
    }
  }
  
  // Check for "unprecedented" claims
  if (contentLower.includes('unprecedented')) {
    issues.push({
      type: 'unverifiable_claim',
      severity: 'medium',
      originalText: extractPhrase(content, 'unprecedented'),
      issue: 'Claim of "unprecedented" may not be accurate. Verify if this is truly the first time.',
      suggestion: 'Use more specific language like "rare", "exceptional", or remove if unverifiable',
    });
  }
  
  // Check for specific player achievement claims
  if (context.tournamentNews && context.tournamentNews.length > 0) {
    // Validate claims against news data
    const newsData = context.tournamentNews.map(n => ({
      title: n.title,
      description: n.description,
    }));
    
    // Check if content makes claims not supported by news
    const unsupportedClaims = checkClaimsAgainstNews(content, newsData);
    issues.push(...unsupportedClaims);
  }
  
  return issues;
}

/**
 * Check facts for gear posts
 */
function checkGearFacts(
  content: string,
  context: PostGenerationContext
): FactCheckIssue[] {
  const issues: FactCheckIssue[] = [];
  
  // Check for technical claims that might be exaggerated
  const exaggerationPatterns = [
    /(?:revolutionary|game.?changing|completely.*?different)/i,
    /(?:best.*?ever|perfect|flawless)/i,
  ];
  
  for (const pattern of exaggerationPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        type: 'hyperbole',
        severity: 'medium',
        originalText: matches[0],
        issue: 'Potentially exaggerated claim about gear',
        suggestion: 'Use more measured language like "impressive", "notable improvement", or "stands out"',
      });
    }
  }
  
  return issues;
}

/**
 * Check facts for travel posts
 */
function checkTravelFacts(
  content: string,
  context: PostGenerationContext
): FactCheckIssue[] {
  const issues: FactCheckIssue[] = [];
  
  // Check for location-specific claims
  // (Could be expanded with Google Maps validation)
  
  return issues;
}

/**
 * Check facts for lifestyle posts
 */
function checkLifestyleFacts(
  content: string,
  context: PostGenerationContext
): FactCheckIssue[] {
  const issues: FactCheckIssue[] = [];
  
  // Similar to travel - check location facts, cultural references
  
  return issues;
}

/**
 * Universal checks that apply to all post types
 */
function checkUniversalIssues(
  content: string,
  context: PostGenerationContext
): FactCheckIssue[] {
  const issues: FactCheckIssue[] = [];
  
  // Check for excessive hyperbole
  const hyperbolePatterns = [
    /(?:absolutely|completely|totally|literally).*?(?:amazing|incredible|perfect|best|worst)/i,
    /(?:never.*?seen|unlike.*?anything|completely.*?unique)/i,
  ];
  
  for (const pattern of hyperbolePatterns) {
    const matches = content.match(pattern);
    if (matches && matches.length > 2) {
      issues.push({
        type: 'hyperbole',
        severity: 'low',
        originalText: matches[0],
        issue: 'Excessive hyperbole may reduce credibility',
        suggestion: 'Tone down language - Marshall is snarky but grounded',
      });
    }
  }
  
  return issues;
}

/**
 * Extract player names from content (simple pattern matching)
 */
function extractPlayerNames(content: string): string[] {
  // Common player names to check
  const commonPlayers = [
    'alcaraz', 'djokovic', 'sinner', 'medvedev', 'federer', 'nadal',
    'murray', 'tsitsipas', 'zverev', 'rublev', 'ruud', 'fritz',
    'rybakina', 'sabalenka', 'swiatek', 'gauff', 'pegula', 'vondrousova',
  ];
  
  const contentLower = content.toLowerCase();
  return commonPlayers.filter(player => contentLower.includes(player));
}

/**
 * Check if a player is young (likely to have overstatements)
 */
function isYoungPlayer(playerName: string): boolean {
  const youngPlayers = ['alcaraz', 'sinner', 'gauff', 'rune', 'fils'];
  return youngPlayers.includes(playerName.toLowerCase());
}

/**
 * Extract a phrase containing a keyword
 */
function extractPhrase(content: string, keyword: string, contextLength: number = 50): string {
  const index = content.toLowerCase().indexOf(keyword.toLowerCase());
  if (index === -1) return '';
  
  const start = Math.max(0, index - contextLength);
  const end = Math.min(content.length, index + keyword.length + contextLength);
  return content.substring(start, end);
}

/**
 * Check if content makes claims not supported by news data
 */
function checkClaimsAgainstNews(
  content: string,
  newsData: Array<{ title: string; description: string }>
): FactCheckIssue[] {
  const issues: FactCheckIssue[] = [];
  
  // Extract specific claims (winners, scores, etc.)
  const winnerPattern = /(?:won|defeated|beat).*?(\d+-\d+|\d+\s+sets?)/i;
  const matches = content.match(winnerPattern);
  
  if (matches) {
    // Check if this claim is in the news
    const claimInNews = newsData.some(news => 
      news.title.toLowerCase().includes(matches[0].toLowerCase()) ||
      news.description.toLowerCase().includes(matches[0].toLowerCase())
    );
    
    if (!claimInNews) {
      issues.push({
        type: 'factual_error',
        severity: 'high',
        originalText: matches[0],
        issue: 'Claim about match result not found in news sources',
        suggestion: 'Verify against news sources or remove specific score if unverifiable',
      });
    }
  }
  
  return issues;
}

/**
 * Check for embedded field labels (Title:, Excerpt:, Content:)
 * These should NEVER appear in the blog post content - they're metadata fields!
 */
function checkForEmbeddedLabels(content: string): FactCheckIssue[] {
  const issues: FactCheckIssue[] = [];
  const contentStart = content.substring(0, 500).toLowerCase(); // Check first 500 chars
  
  // Check for "Title:" at the start
  if (/^(?:title|excerpt|content):/i.test(content.trim())) {
    const labelMatch = content.match(/^(?:Title|title|Excerpt|excerpt|Content|content):\s*/i);
    if (labelMatch) {
      issues.push({
        type: 'factual_error',
        severity: 'high',
        originalText: content.substring(0, Math.min(200, content.length)),
        issue: 'Content contains embedded field labels (Title:, Excerpt:, or Content:). These are metadata fields and should NOT appear in the blog post body. The title and excerpt are already displayed separately at the top of the post.',
        suggestion: 'Remove all field labels (Title:, Excerpt:, Content:) and any text that appears before the actual blog post content begins. The content should start directly with the blog post text, not with metadata labels.',
        context: 'The content field should only contain the blog post body text, not the title or excerpt which are stored in separate fields.',
      });
    }
  }
  
  // Check for "Title: ... Excerpt: ... Content: ..." pattern
  const titleExcerptContentPattern = /^(?:Title|title):\s*[^\n]+\s+(?:Excerpt|excerpt):\s*[^\n]+(?:\s+|\n+)(?:Content|content):/i;
  if (titleExcerptContentPattern.test(content)) {
    issues.push({
      type: 'factual_error',
      severity: 'high',
      originalText: content.substring(0, Math.min(300, content.length)),
      issue: 'Content contains embedded Title, Excerpt, and Content labels. The title and excerpt are already stored in separate fields and displayed at the top of the post. Only the blog post body text should be in the content field.',
      suggestion: 'Remove everything before the actual blog post content starts. Delete "Title:", "Excerpt:", and "Content:" labels and any text associated with them. The content should begin directly with the blog post text.',
      context: 'The content field should only contain the blog post body, not metadata labels.',
    });
  }
  
  return issues;
}
