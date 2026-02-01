/**
 * Google Gemini API Integration
 * 
 * Used for generating blog post content
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use models/ prefix - required for Gemini API
// Best options: gemini-2.5-flash (fast), gemini-2.5-pro (quality), gemini-flash-latest (always latest)
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash';

import { parse429Error, isQuotaExceeded, markQuotaExceeded, sleep, getQuotaStatus } from './rate-limiter';

if (!GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not set. Post generation will fail.');
}

export interface PostGenerationContext {
  type: 'gear' | 'travel' | 'analysis' | 'lifestyle';
  topic: string;
  tournament?: {
    name: string;
    location: string;
    startDate: string;
  };
  newsItem?: {
    title: string;
    description: string;
    source: string;
  };
  affiliateProducts?: string[];
  recentPosts?: Array<{
    title: string;
    category: string;
  }>;
  isRecap?: boolean; // Flag to indicate this is a recap post
  tournamentNews?: Array<{ // Real news from RSS feeds about the tournament
    title: string;
    description: string;
    url: string;
    source: string;
    published_at: string;
  }>;
  gearData?: Array<{ // Real gear data from database for gear posts
    id: string;
    name: string;
    brand: string;
    type: string;
    category?: string;
    specifications?: Record<string, any>;
    price_range?: string;
    amazon_affiliate_link?: string;
    description?: string;
    pros?: string[];
    cons?: string[];
    best_for?: string;
  }>;
}

/**
 * Generate blog post content using Gemini
 */
export async function generatePostContent(context: PostGenerationContext): Promise<{
  title: string;
  excerpt: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  keywords?: string[];
  tags?: string[];
}> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not set');
  }

  const prompt = buildPrompt(context);
  
  // Log the complete prompt for debugging and optimization
  // Rough token estimate: ~4 characters per token for English text
  const estimatedPromptTokens = Math.ceil(prompt.length / 4);
  const maxOutputTokens = 16384;
  const estimatedMaxResponseChars = maxOutputTokens * 4; // Rough estimate
  
  console.log('\n' + '='.repeat(80));
  console.log('📝 GEMINI PROMPT (FULL)');
  console.log('='.repeat(80));
  console.log(`Topic: ${context.topic}`);
  console.log(`Type: ${context.type}`);
  if (context.tournament) {
    console.log(`Tournament: ${context.tournament.name}`);
  }
  if (context.isRecap) {
    console.log(`Recap Post: YES (${context.tournamentNews?.length || 0} news articles available)`);
  }
  console.log(`Prompt Length: ${prompt.length} characters (~${estimatedPromptTokens} tokens)`);
  console.log(`Max Output Tokens: ${maxOutputTokens} (~${estimatedMaxResponseChars.toLocaleString()} characters)`);
  console.log(`Target: 600-1200 words (~${(900 * 5).toLocaleString()} characters with markdown)`);
  console.log('-'.repeat(80));
  console.log(prompt);
  console.log('='.repeat(80) + '\n');

  // Check if we're in a quota exceeded state
  if (isQuotaExceeded()) {
    const status = getQuotaStatus();
    const waitTime = status.retryAfter ? status.retryAfter * 1000 : 60000; // Default 60 seconds
    throw new Error(`Gemini quota exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying. ${status.lastError || ''}`);
  }

  // Try multiple model names as fallback (all with models/ prefix)
  // Prioritize paid tier models first (if you have paid tier access)
  // Free tier: gemini-2.5-flash has higher limits than gemini-2.0-flash
  const modelsToTry = [
    GEMINI_MODEL, // User preference or default
    'models/gemini-2.5-flash', // Fast, recommended (higher free tier limits)
    'models/gemini-2.5-pro', // Better quality (if paid tier)
    'models/gemini-flash-latest', // Always latest flash
    // Removed gemini-2.0-flash from primary list (lower free tier limits)
    // Only try as last resort
    'models/gemini-2.0-flash', // Last resort fallback
  ];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      // Try both v1 and v1beta APIs
      const apiVersions = ['v1', 'v1beta'];
      let lastVersionError: Error | null = null;
      
      for (const version of apiVersions) {
        try {
          // Model name already includes 'models/' prefix, so use it directly
          const apiUrl = `https://generativelanguage.googleapis.com/${version}/${model}:generateContent?key=${GEMINI_API_KEY}`;
          
          const response = await fetch(
            apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt,
              }],
            }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 16384, // Maximum for Gemini 2.5 Flash/Pro - allows for 2000+ word posts
          },
          }),
        }
      );

          if (!response.ok) {
            const errorText = await response.text();
            
            // Handle 429 (quota exceeded) errors
            if (response.status === 429) {
              const quotaInfo = parse429Error(errorText);
              if (quotaInfo) {
                markQuotaExceeded(quotaInfo.retryAfter, quotaInfo.message);
                // Wait a bit before trying next model (might help if different model has different quota)
                await sleep(2000);
              }
              lastVersionError = new Error(`Gemini API error (${version}/${model}): ${response.status} - ${errorText}`);
              // Don't continue to next version if quota exceeded - all will fail
              if (quotaInfo) {
                break; // Break out of version loop, try next model
              }
              continue;
            }
            
            lastVersionError = new Error(`Gemini API error (${version}/${model}): ${response.status} - ${errorText}`);
            // Try next API version
            continue;
          }

          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!generatedText) {
            lastVersionError = new Error(`No content generated from Gemini (${version}/${model})`);
            continue;
          }

          // Track API costs
          try {
            const usageMetadata = data.usageMetadata;
            const inputTokens = usageMetadata?.promptTokenCount || 0;
            const outputTokens = usageMetadata?.candidatesTokenCount || 0;
            
            if (inputTokens > 0 || outputTokens > 0) {
              const { logCost, calculateGeminiCost } = await import('@/lib/costs/tracker');
              const cost = calculateGeminiCost(inputTokens, outputTokens);
              
              await logCost({
                service: 'gemini',
                endpoint: 'generateContent',
                cost_usd: cost,
                input_tokens: inputTokens,
                output_tokens: outputTokens,
                metadata: {
                  model,
                  version,
                  prompt_length: prompt.length,
                },
              });
            }
          } catch (costError) {
            // Don't fail if cost tracking fails
            console.warn('Failed to track Gemini cost:', costError);
          }

          // Success! Parse the initial draft
          console.log(`Successfully used model: ${version}/${model}`);
          const initialDraft = await parseGeneratedContent(generatedText, context);
          
          // 2-AGENT PIPELINE: Fact-Check → Edit
          // Skip if quota is already exceeded to avoid wasting more API calls
          if (!isQuotaExceeded()) {
            console.log('\n' + '='.repeat(80));
            console.log('🔍 FACT-CHECKER AGENT');
            console.log('='.repeat(80));
            
            try {
              const { factCheckPost } = await import('./fact-checker');
              const factCheckResult = await factCheckPost(initialDraft.content, context);
              
              if (factCheckResult.hasIssues) {
                console.log(`Found ${factCheckResult.issues.length} issues:`);
                factCheckResult.issues.forEach((issue, idx) => {
                  console.log(`  ${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.issue}`);
                  console.log(`     Original: "${issue.originalText.substring(0, 60)}..."`);
                });
                
                // Only run editor if quota is still OK
                if (!isQuotaExceeded()) {
                  console.log('\n' + '='.repeat(80));
                  console.log('✏️ EDITOR AGENT');
                  console.log('='.repeat(80));
                  
                  const { editPost } = await import('./editor');
                  const editResult = await editPost(
                    initialDraft.content,
                    initialDraft.title,
                    initialDraft.excerpt,
                    factCheckResult.issues,
                    context
                  );
                  
                  if (editResult.success && editResult.editedContent) {
                    console.log('✅ Post edited successfully');
                    return {
                      ...initialDraft,
                      content: editResult.editedContent,
                    };
                  } else {
                    console.warn('⚠️ Editor failed, using original draft:', editResult.error);
                    return initialDraft;
                  }
                } else {
                  console.warn('⚠️ Quota exceeded, skipping editor. Using fact-checked draft.');
                  return initialDraft;
                }
              } else {
                console.log('✅ No issues found - post passes fact-check');
                return initialDraft;
              }
            } catch (factCheckError: any) {
              // If fact-checker fails due to quota, just use the original draft
              if (factCheckError.message?.includes('quota') || factCheckError.message?.includes('429')) {
                console.warn('⚠️ Fact-checker hit quota limit, using original draft');
                return initialDraft;
              }
              throw factCheckError;
            }
          } else {
            console.warn('⚠️ Quota exceeded, skipping fact-checker/editor. Using original draft.');
            return initialDraft;
          }
        } catch (error: any) {
          lastVersionError = error;
          console.warn(`Failed with ${version}/${model}, trying next...`);
          continue;
        }
      }
      
      // If both API versions failed for this model, try next model
      lastError = lastVersionError;
    } catch (error: any) {
      lastError = error;
      console.warn(`Failed with model ${model}, trying next...`);
      continue;
    }
  }

  // If we get here, all models failed
  throw lastError || new Error('All Gemini models failed');
}

/**
 * Build the prompt for Gemini
 */
function buildPrompt(context: PostGenerationContext): string {
  const { type, topic, tournament, newsItem, affiliateProducts, recentPosts, isRecap, tournamentNews, gearData } = context;

  let prompt = `You are Marshall, a 33-year-old tennis tour insider and travel blogger. You've been following the ATP Tour for a decade, living out of a suitcase.

PERSONALITY:
- "Lovable Asshole" archetype (Archer x Roy Kent x American Optimism)
- Snarky about bad line calls, ugly kits, slow courts
- Deeply passionate about tennis - defends players, tears up at legends retiring
- Shamelessly snobby about "the right way" to travel, drink coffee, hit backhands
- American-born but lived in Europe for a decade - cultured expat, not tourist
- Never "Americans" the experience

VOICE:
- Witty, insightful, respectful
- Explains complex tennis strategy simply
- Uses correct terminology (Roland Garros, not "French Open")
- Casual but authoritative
- Tagline: "Serve First. Travel Always."

TASK:
Write a blog post about: ${topic}

POST TYPE: ${type}

`;

  // Add gear data if this is a gear post
  if (type === 'gear' && gearData && gearData.length > 0) {
    prompt += `✅ GEAR DATA AVAILABLE - USE THIS REAL DATA ✅\n\n`;
    prompt += `You have access to REAL gear data from the database. Use this information to write an ACCURATE guide.\n\n`;
    prompt += `GEAR ITEMS TO INCLUDE:\n\n`;
    
    gearData.forEach((item, index) => {
      prompt += `${index + 1}. ${item.name} (${item.brand})\n`;
      if (item.description) prompt += `   Description: ${item.description}\n`;
      if (item.specifications) {
        prompt += `   Specifications:\n`;
        Object.entries(item.specifications).forEach(([key, value]) => {
          prompt += `     - ${key}: ${value}\n`;
        });
      }
      if (item.price_range) prompt += `   Price: ${item.price_range}\n`;
      if (item.pros && item.pros.length > 0) {
        prompt += `   Pros: ${item.pros.join(', ')}\n`;
      }
      if (item.cons && item.cons.length > 0) {
        prompt += `   Cons: ${item.cons.join(', ')}\n`;
      }
      if (item.best_for) prompt += `   Best for: ${item.best_for}\n`;
      if (item.amazon_affiliate_link) {
        prompt += `   Affiliate link available: ${item.amazon_affiliate_link}\n`;
      }
      prompt += `\n`;
    });
    
    prompt += `INSTRUCTIONS FOR GEAR POSTS:\n`;
    prompt += `- Use the gear data above to write an ACCURATE comparison guide\n`;
    prompt += `- Include all the products listed above in your guide\n`;
    prompt += `- Use the specifications, pros, cons, and "best for" information provided\n`;
    prompt += `- Be honest about each product - use the pros/cons provided\n`;
    prompt += `- Include affiliate links using [AFF:Product Name] format for products that have amazon_affiliate_link\n`;
    prompt += `- DO NOT make up specifications or features that aren't in the data above\n`;
    prompt += `- If the data doesn't have specific details, you can say "check current pricing" or "specs may vary"\n`;
    prompt += `- Write in Marshall's voice - add your own analysis and opinions, but base them on the real data\n\n`;
  } else if (type === 'gear') {
    prompt += `⚠️ WARNING: NO GEAR DATA AVAILABLE ⚠️\n\n`;
    prompt += `You are writing a gear guide but NO gear data was provided from the database.\n`;
    prompt += `This means you'll need to use general knowledge, which may be outdated or inaccurate.\n\n`;
    prompt += `IMPORTANT:\n`;
    prompt += `- Be honest that you're writing based on general knowledge\n`;
    prompt += `- Focus on general principles and what to look for in gear\n`;
    prompt += `- Avoid making specific claims about current models or prices\n`;
    prompt += `- Consider writing more about "what to look for" rather than specific product recommendations\n`;
    prompt += `- If you mention specific products, note that readers should verify current specs/pricing\n\n`;
  }

  if (tournament) {
    prompt += `TOURNAMENT CONTEXT:
- Name: ${tournament.name}
- Location: ${tournament.location}
- Start Date: ${tournament.startDate}
- This is a ${type === 'travel' ? 'travel guide' : 'tournament preview/analysis'}

`;
    
    // CRITICAL: If this is a recap post, use real news data from RSS feeds
    if (isRecap) {
      if (tournamentNews && tournamentNews.length > 0) {
        prompt += `✅ TOURNAMENT RECAP - REAL NEWS DATA AVAILABLE ✅

You have access to REAL news articles about ${tournament.name}. Use this information to write an accurate recap.

RECENT NEWS ABOUT ${tournament.name.toUpperCase()}:
${tournamentNews.map((news, idx) => `
${idx + 1}. ${news.title}
   Source: ${news.source}
   Published: ${new Date(news.published_at).toLocaleDateString()}
   Description: ${news.description}
   URL: ${news.url}
`).join('\n')}

INSTRUCTIONS:
- Use the news articles above to write an ACCURATE recap of ${tournament.name}
- Extract real information: winners, final matchups, scores, key moments
- Cite the sources naturally (e.g., "According to ESPN..." or "As reported by BBC Sport...")
- Combine information from multiple sources to create a comprehensive recap
- Write in Marshall's voice - add analysis, insights, and personal perspective
- DO NOT make up information that isn't in the news articles
- If the news doesn't have specific details (like exact scores), you can say "in straight sets" or "in a thrilling match" without making up numbers

`;
      } else {
        prompt += `⚠️ TOURNAMENT RECAP - NO NEWS DATA AVAILABLE ⚠️

We attempted to fetch news about ${tournament.name} but no relevant articles were found.

DO NOT INVENT OR MAKE UP:
- Match results (who won, scores, sets)
- Final matchups (who played in the final)
- Specific player names in finals or matches
- Match statistics or scores
- Tournament winners or champions

INSTEAD, WRITE ABOUT:
- The overall tournament experience and atmosphere
- General observations about the level of play
- The tournament's significance in the tennis calendar
- What makes this tournament special (location, history, court conditions)
- The tournament's impact on the season
- Travel and lifestyle aspects of the location
- Your personal reflections on being at the tournament

WRITING STYLE FOR RECAPS WITHOUT DATA:
- Use phrases like "the tournament delivered" or "another memorable edition"
- Focus on the experience, atmosphere, and general observations
- Write about what typically happens at this tournament
- Discuss the tournament's place in tennis history
- Share insights about the location, facilities, and overall vibe
- If you must mention players, only mention them in general terms (e.g., "the top seeds", "favorites", "contenders") without claiming specific results

EXAMPLE OF WHAT TO AVOID:
❌ "Carlos Alcaraz defeated Novak Djokovic in the final"
❌ "The men's final was between Sinner and Alcaraz"
❌ "Sabalenka won 6-4, 6-2"

EXAMPLE OF WHAT TO WRITE INSTEAD:
✓ "The tournament once again delivered high-quality tennis and memorable moments"
✓ "The final weekend at Rod Laver Arena showcased the incredible depth of talent on tour"
✓ "This tournament always brings out the best in players, and this year was no exception"

`;
      }
    }
  }

  if (newsItem) {
    prompt += `NEWS CONTEXT:
- Headline: ${newsItem.title}
- Description: ${newsItem.description}
- Source: ${newsItem.source}
- Write your own analysis/commentary on this news. Don't just summarize - add Marshall's unique perspective.

`;
  }

  if (affiliateProducts && affiliateProducts.length > 0) {
    prompt += `AFFILIATE PRODUCTS TO MENTION (naturally, not forced):
${affiliateProducts.map(p => `- ${p}`).join('\n')}
- Mention these products organically in the content
- Use natural language, not salesy

`;
  }

  if (recentPosts && recentPosts.length > 0) {
    prompt += `RECENT POSTS (avoid repeating these topics):
${recentPosts.map(p => `- ${p.title} (${p.category})`).join('\n')}

`;
  }

  prompt += `OUTPUT FORMAT (JSON only, no markdown code blocks):
Return ONLY valid JSON, no markdown formatting, no code blocks, no explanations. Just the JSON object:

{
  "title": "Compelling, SEO-friendly title (60-70 characters)",
  "excerpt": "Engaging excerpt (150-160 characters)",
  "content": "Full blog post content in MARKDOWN format. CRITICAL: Use proper line breaks and spacing! Use \\n\\n (double newlines) between paragraphs, \\n\\n before and after headings, \\n\\n before and after lists. Format example:\\n\\n## Main Heading\\n\\nParagraph text here with proper spacing.\\n\\n### Subheading\\n\\nMore paragraph text.\\n\\n- List item one\\n- List item two\\n\\nAnother paragraph after the list. Use ## for main headings, ### for subheadings, regular paragraphs, - for lists, [text](url) for links. Write naturally - aim for 600-1200 words (enough to be comprehensive but not overwhelming). Quality and engagement matter more than length. Include natural affiliate link opportunities marked as [AFF:Product Name]. CRITICAL: If you approach token limits, ensure you close all JSON strings and the object properly - it's better to have a complete shorter post than a truncated longer one.",
  "metaTitle": "SEO meta title (include focus keyword)",
  "metaDescription": "SEO meta description (150-160 characters)",
  "focusKeyword": "Primary SEO keyword",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}

CRITICAL MARKDOWN FORMATTING RULES:
- ALWAYS use \\n\\n (double newline) between paragraphs
- ALWAYS use \\n\\n before and after headings (## and ###)
- ALWAYS use \\n\\n before and after lists
- ALWAYS use \\n\\n before and after blockquotes
- Use single \\n for line breaks within lists
- Example structure:\\n\\n## Section Title\\n\\nParagraph one here.\\n\\nParagraph two here.\\n\\n### Subsection\\n\\nMore content.\\n\\n- List item\\n- Another item\\n\\nParagraph after list.

IMPORTANT:
- Return ONLY the JSON object, no markdown code blocks around it
- Write in Marshall's voice throughout
- Make it engaging and personal
- Include specific details and examples
- Add your own analysis/opinion
- Use MARKDOWN formatting in content (## headings, - lists, **bold**, etc.)
- Make affiliate mentions natural, not forced
- Focus keyword should be in title and first paragraph
- Content length: Write naturally - 600-1200 words is ideal (enough to be comprehensive, not overwhelming)
- Quality and engagement matter FAR more than word count - don't pad with fluff
- Do NOT wrap the JSON in markdown code blocks
- CRITICAL: If approaching token limits, prioritize completing the JSON structure over adding more content
- CRITICAL: Include proper \\n\\n spacing throughout the markdown content
- CRITICAL: Ensure the JSON is complete and valid - all strings must be properly closed with quotes
- If you approach response length limits, ensure you close all JSON strings and the object properly
- CRITICAL: Ensure the JSON is complete and valid - all strings must be properly closed with quotes
- If content is very long, you may need to be concise to fit within response limits
`;

  return prompt;
}

/**
 * Parse generated content from Gemini
 */
function parseGeneratedContent(
  generatedText: string,
  context: PostGenerationContext
): {
  title: string;
  excerpt: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  keywords?: string[];
  tags?: string[];
} {
  try {
    // Try to extract JSON from the response
    // Gemini sometimes wraps JSON in markdown code blocks or returns raw JSON
    let jsonText = generatedText.trim();
    
    // Remove markdown code blocks if present (handle various formats)
    // Handle ```json at start
    jsonText = jsonText.replace(/^```json\s*/i, '');
    // Handle ``` at start (any language)
    jsonText = jsonText.replace(/^```[a-z]*\s*/i, '');
    // Handle ``` at end
    jsonText = jsonText.replace(/\s*```\s*$/i, '');
    jsonText = jsonText.trim();
    
    // Try multiple strategies to extract JSON
    
    // Strategy 1: Try parsing the whole thing if it's already JSON
    let parsed: any = null;
    let parseError: Error | null = null;
    
    try {
      parsed = JSON.parse(jsonText);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Success! Use this
        console.log('Successfully parsed JSON using Strategy 1 (direct parse)');
      } else {
        parsed = null;
      }
    } catch (e: any) {
      parseError = e;
      // Not valid JSON, try other strategies
    }
    
    // Strategy 2: Find JSON object in the text (handle text before/after)
    if (!parsed) {
      const firstBrace = jsonText.indexOf('{');
      if (firstBrace !== -1) {
        // Find matching closing brace by counting braces
        // This handles nested objects and arrays
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        let lastBrace = -1;
        
        for (let i = firstBrace; i < jsonText.length; i++) {
          const char = jsonText[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                lastBrace = i;
                break;
              }
            }
          }
        }
        
        if (lastBrace !== -1) {
          const jsonCandidate = jsonText.substring(firstBrace, lastBrace + 1);
          try {
            parsed = JSON.parse(jsonCandidate);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              console.log('Successfully parsed JSON using Strategy 2 (brace matching)');
            } else {
              parsed = null;
            }
          } catch (e: any) {
            parseError = e;
            parsed = null;
          }
        }
      }
    }
    
    // Strategy 3: Try to find JSON by looking for common JSON patterns
    if (!parsed) {
      // Look for JSON object that starts with { and has common fields
      const jsonPattern = /\{\s*"title"\s*:/i;
      const match = jsonText.match(jsonPattern);
      if (match && match.index !== undefined) {
        const startIdx = match.index;
        // Now find the matching closing brace from this point
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        let lastBrace = -1;
        
        for (let i = startIdx; i < jsonText.length; i++) {
          const char = jsonText[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"') {
            inString = !inString;
            continue;
          }
          
          if (!inString) {
            if (char === '{') {
              braceCount++;
            } else if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                lastBrace = i;
                break;
              }
            }
          }
        }
        
        if (lastBrace !== -1) {
          const jsonCandidate = jsonText.substring(startIdx, lastBrace + 1);
          try {
            parsed = JSON.parse(jsonCandidate);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              console.log('Successfully parsed JSON using Strategy 3 (pattern matching)');
            } else {
              parsed = null;
            }
          } catch (e: any) {
            parseError = e;
            parsed = null;
          }
        }
      }
    }
    
    // Strategy 4: Last resort - try regex match (less reliable for nested structures)
    if (!parsed) {
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            console.log('Successfully parsed JSON using Strategy 4 (regex fallback)');
          } else {
            parsed = null;
          }
        } catch (e: any) {
          parseError = e;
          parsed = null;
        }
      }
    }
    
    if (parsed) {
      
      // Validate that we got a proper object
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed result is not an object');
      }
      
      // Clean up content - extract just the content string
      let content = parsed.content || '';
      if (typeof content !== 'string') {
        // If content is not a string, something went wrong
        console.error('Content is not a string:', typeof content, content);
        throw new Error(`Content field is not a string, got: ${typeof content}`);
      }
      
      // Replace escaped newlines with actual newlines
      content = content.replace(/\\n/g, '\n');
      
      // Post-process markdown to ensure proper spacing
      // Add double newlines before headings if missing
      content = content.replace(/([^\n])\n(##+ )/g, '$1\n\n$2');
      // Add double newlines after headings if missing
      content = content.replace(/(##+ .+)\n([^\n#\s-])/g, '$1\n\n$2');
      // Add double newlines before lists if missing
      content = content.replace(/([^\n])\n([-*] )/g, '$1\n\n$2');
      // Add double newlines after lists if missing
      content = content.replace(/([-*] .+)\n([^\n-*\s#])/g, '$1\n\n$2');
      // Ensure paragraphs are separated (look for sentence endings followed by capital letters)
      content = content.replace(/([.!?])\n([A-Z])/g, '$1\n\n$2');
      // Clean up any triple+ newlines
      content = content.replace(/\n{3,}/g, '\n\n');
      
      content = content.trim();
      
      // Validate we have actual content
      if (!content || content.length === 0) {
        throw new Error('Content is empty after parsing');
      }
      
      console.log('Successfully parsed content:', {
        title: parsed.title,
        contentLength: content.length,
        contentPreview: content.substring(0, 100),
      });
      
      return {
        title: parsed.title || context.topic,
        excerpt: parsed.excerpt || '',
        content: content, // This should be just the markdown string
        metaTitle: parsed.metaTitle,
        metaDescription: parsed.metaDescription,
        focusKeyword: parsed.focusKeyword,
        keywords: parsed.keywords || [],
        tags: parsed.tags || [],
      };
    } else {
      // Log the full response for debugging
      console.error('No JSON object found in response');
      console.error('Response length:', generatedText.length);
      console.error('First 500 chars:', generatedText.substring(0, 500));
      console.error('Last 500 chars:', generatedText.substring(Math.max(0, generatedText.length - 500)));
      if (parseError) {
        console.error('Last parse error:', parseError.message);
      }
      console.error('Full response (first 2000 chars):', generatedText.substring(0, 2000));
      
      // Strategy 5: Handle truncated JSON - try to fix unterminated strings
      if (parseError?.message?.includes('Unterminated string')) {
        console.log('Attempting to fix unterminated string in JSON...');
        
        // Find the content field and try to close it properly
        const contentFieldMatch = jsonText.match(/"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)/);
        if (contentFieldMatch) {
          // The content string is unterminated - try to extract what we have and close it
          const contentStartIdx = jsonText.indexOf('"content":');
          if (contentStartIdx !== -1) {
            // Find the opening quote after "content":
            const quoteStart = jsonText.indexOf('"', contentStartIdx + 10);
            if (quoteStart !== -1) {
              // Extract content up to the last complete sentence
              let contentEnd = jsonText.length;
              
              // Look backwards from end to find a good stopping point (sentence ending)
              for (let i = jsonText.length - 1; i > quoteStart + 100; i--) {
                if (jsonText.substring(i - 2, i + 1).match(/[.!?]\n/)) {
                  contentEnd = i + 1;
                  break;
                }
              }
              
              // Construct valid JSON by properly closing the content string
              const beforeContent = jsonText.substring(0, quoteStart + 1);
              let contentValue = jsonText.substring(quoteStart + 1, contentEnd)
                .replace(/\\/g, '\\\\')  // Escape backslashes
                .replace(/"/g, '\\"')    // Escape quotes
                .replace(/\n/g, '\\n')   // Escape newlines
                .replace(/\r/g, '\\r')   // Escape carriage returns
                .replace(/\t/g, '\\t');  // Escape tabs
              
              // Close the JSON properly
              const fixedJson = beforeContent + contentValue + '"}';
              
              try {
                parsed = JSON.parse(fixedJson);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                  console.log('Successfully fixed truncated JSON');
                  // Add note that content was truncated
                  if (parsed.content) {
                    parsed.content += '\n\n[Note: Content was truncated due to response length limits]';
                  }
                }
              } catch (e) {
                console.warn('Failed to fix truncated JSON:', e);
              }
            }
          }
        }
      }
      
      // Strategy 6: Extract partial data if JSON is completely broken
      if (!parsed) {
        console.log('Attempting to extract partial data from broken JSON...');
        
        const titleMatch = jsonText.match(/"title"\s*:\s*"([^"]+)"/);
        const excerptMatch = jsonText.match(/"excerpt"\s*:\s*"([^"]+)"/);
        
        // Try to extract content even if unterminated
        let contentValue = '';
        const contentStartMatch = jsonText.match(/"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)/);
        if (contentStartMatch) {
          // Extract content and clean it up
          contentValue = contentStartMatch[1]
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
        }
        
        if (titleMatch || excerptMatch || contentValue) {
          parsed = {
            title: titleMatch ? titleMatch[1] : context.topic,
            excerpt: excerptMatch ? excerptMatch[1] : '',
            content: contentValue || 'Content generation was truncated. The post title and excerpt were extracted, but the full content could not be recovered. Please try generating again.',
          };
          console.log('Extracted partial data from broken JSON');
        }
      }
      
      // Strategy 7: Last resort - try to parse from first { to end, then work backwards
      if (!parsed) {
        const firstBrace = jsonText.indexOf('{');
        if (firstBrace !== -1) {
          // Try to parse everything from first { to end, then work backwards
          for (let endIdx = jsonText.length; endIdx > firstBrace + 100; endIdx -= 50) {
            const candidate = jsonText.substring(firstBrace, endIdx);
            try {
              const testParsed = JSON.parse(candidate);
              if (testParsed && typeof testParsed === 'object' && !Array.isArray(testParsed) && testParsed.title) {
                console.log('Found valid JSON by working backwards from end');
                parsed = testParsed;
                break;
              }
            } catch {
              // Continue trying
            }
          }
        }
      }
      
      if (!parsed) {
        throw new Error(`No JSON object found in response. Last error: ${parseError?.message || 'unknown'}`);
      }
    }
  } catch (error: any) {
    console.error('Error parsing Gemini response:', error);
    console.error('Error message:', error.message);
    console.error('Raw response (first 1000 chars):', generatedText.substring(0, 1000));
    if (error.message && error.message.includes('JSON')) {
      // Re-throw JSON parsing errors with more context
      throw new Error(`Failed to parse JSON from Gemini response: ${error.message}`);
    }
    throw error; // Re-throw so we know parsing failed
  }

  // If we get here, parsing completely failed
  // This should not happen - throw error instead of returning bad data
  throw new Error('Failed to parse Gemini response - no valid JSON found');
}
