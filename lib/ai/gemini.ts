/**
 * Google Gemini API Integration
 * 
 * Used for generating blog post content
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use models/ prefix - required for Gemini API
// Best options: gemini-2.5-flash (fast), gemini-2.5-pro (quality), gemini-flash-latest (always latest)
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash';

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

  // Try multiple model names as fallback (all with models/ prefix)
  // Based on available models from your API key
  const modelsToTry = [
    GEMINI_MODEL, // User preference or default
    'models/gemini-2.5-flash', // Fast, recommended
    'models/gemini-2.5-pro', // Better quality
    'models/gemini-flash-latest', // Always latest flash
    'models/gemini-pro-latest', // Always latest pro
    'models/gemini-2.0-flash', // Fallback
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
            maxOutputTokens: 4096, // Increased for longer blog posts
          },
          }),
        }
      );

          if (!response.ok) {
            const errorText = await response.text();
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

          // Success! Parse and return
          console.log(`Successfully used model: ${version}/${model}`);
          return parseGeneratedContent(generatedText, context);
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
  const { type, topic, tournament, newsItem, affiliateProducts, recentPosts } = context;

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

  if (tournament) {
    prompt += `TOURNAMENT CONTEXT:
- Name: ${tournament.name}
- Location: ${tournament.location}
- Start Date: ${tournament.startDate}
- This is a ${type === 'travel' ? 'travel guide' : 'tournament preview/analysis'}

`;
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
  "content": "Full blog post content in MARKDOWN format. CRITICAL: Use proper line breaks and spacing! Use \\n\\n (double newlines) between paragraphs, \\n\\n before and after headings, \\n\\n before and after lists. Format example:\\n\\n## Main Heading\\n\\nParagraph text here with proper spacing.\\n\\n### Subheading\\n\\nMore paragraph text.\\n\\n- List item one\\n- List item two\\n\\nAnother paragraph after the list. Use ## for main headings, ### for subheadings, regular paragraphs, - for lists, [text](url) for links. Make it 1500-2500 words. Include natural affiliate link opportunities marked as [AFF:Product Name].",
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
- Content should be 1500-2500 words minimum
- Do NOT wrap the JSON in markdown code blocks
- CRITICAL: Include proper \\n\\n spacing throughout the markdown content
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
    // Gemini sometimes wraps JSON in markdown code blocks
    let jsonText = generatedText.trim();
    
    // Remove markdown code blocks if present (handle various formats)
    jsonText = jsonText
      .replace(/^```json\s*/i, '') // Remove opening ```json
      .replace(/^```\s*/i, '') // Remove opening ```
      .replace(/\s*```\s*$/i, '') // Remove closing ```
      .trim();
    
    // Try to find JSON object (greedy match to get full object)
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
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
      throw new Error('No JSON object found in response');
    }
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    console.error('Raw response (first 1000 chars):', generatedText.substring(0, 1000));
    throw error; // Re-throw so we know parsing failed
  }

  // If we get here, parsing completely failed
  // This should not happen - throw error instead of returning bad data
  throw new Error('Failed to parse Gemini response - no valid JSON found');
}
