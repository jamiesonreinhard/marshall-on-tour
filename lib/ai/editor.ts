/**
 * Editor Agent
 * 
 * Refines blog posts after fact-checking:
 * - Applies fact-checker corrections
 * - Maintains Marshall's voice
 * - Removes hyperbole while keeping personality
 * - Ensures consistency across all post types
 */

import { PostGenerationContext } from './gemini';
import { FactCheckIssue } from './fact-checker';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'models/gemini-2.5-flash';

import { parse429Error, isQuotaExceeded, markQuotaExceeded, sleep } from './rate-limiter';

export interface EditResult {
  success: boolean;
  editedContent?: string;
  error?: string;
}

/**
 * Edit a blog post based on fact-checker issues
 */
export async function editPost(
  originalContent: string,
  title: string,
  excerpt: string,
  factCheckIssues: FactCheckIssue[],
  context: PostGenerationContext
): Promise<EditResult> {
  if (!GEMINI_API_KEY) {
    return {
      success: false,
      error: 'GEMINI_API_KEY not set',
    };
  }

  if (factCheckIssues.length === 0) {
    // No issues, return original
    return {
      success: true,
      editedContent: originalContent,
    };
  }

  // Build editor prompt
  const prompt = buildEditorPrompt(originalContent, title, excerpt, factCheckIssues, context);

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
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
          temperature: 0.3, // Lower temperature for more precise editing
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 16384,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Gemini API error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    const editedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!editedText) {
      return {
        success: false,
        error: 'No content generated from editor',
      };
    }

    // Parse the edited content (should be just the markdown content)
    const editedContent = editedText.trim();

    return {
      success: true,
      editedContent,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Build the editor prompt
 */
function buildEditorPrompt(
  originalContent: string,
  title: string,
  excerpt: string,
  issues: FactCheckIssue[],
  context: PostGenerationContext
): string {
  const highSeverityIssues = issues.filter(i => i.severity === 'high');
  const mediumSeverityIssues = issues.filter(i => i.severity === 'medium');
  const lowSeverityIssues = issues.filter(i => i.severity === 'low');

  let prompt = `You are an editor reviewing a blog post written by Marshall, a 33-year-old tennis tour insider and travel blogger.

MARSHALL'S VOICE (CRITICAL - MAINTAIN THIS):
- "Lovable Asshole" archetype (Archer x Roy Kent x American Optimism)
- Snarky about bad line calls, ugly kits, slow courts
- Deeply passionate about tennis - defends players, tears up at legends retiring
- Shamelessly snobby about "the right way" to travel, drink coffee, hit backhands
- American-born but lived in Europe for a decade - cultured expat, not tourist
- Witty, insightful, respectful
- Casual but authoritative
- Tagline: "Serve First. Travel Always."

YOUR TASK:
Edit the blog post below to fix factual errors and overstatements while MAINTAINING Marshall's voice and personality. Do NOT make it bland or corporate.

ORIGINAL POST:
Title: ${title}
Excerpt: ${excerpt}

Content:
${originalContent}

FACT-CHECKER ISSUES TO FIX:
`;

  if (highSeverityIssues.length > 0) {
    prompt += `\nHIGH PRIORITY (MUST FIX):\n`;
    highSeverityIssues.forEach((issue, idx) => {
      prompt += `${idx + 1}. ${issue.issue}\n`;
      prompt += `   Original: "${issue.originalText}"\n`;
      prompt += `   Suggestion: ${issue.suggestion}\n`;
      if (issue.context) {
        prompt += `   Context: ${issue.context}\n`;
      }
      prompt += `\n`;
    });
  }

  if (mediumSeverityIssues.length > 0) {
    prompt += `\nMEDIUM PRIORITY (SHOULD FIX):\n`;
    mediumSeverityIssues.forEach((issue, idx) => {
      prompt += `${idx + 1}. ${issue.issue}\n`;
      prompt += `   Original: "${issue.originalText}"\n`;
      prompt += `   Suggestion: ${issue.suggestion}\n`;
      prompt += `\n`;
    });
  }

  if (lowSeverityIssues.length > 0) {
    prompt += `\nLOW PRIORITY (CONSIDER FIXING):\n`;
    lowSeverityIssues.forEach((issue, idx) => {
      prompt += `${idx + 1}. ${issue.issue}\n`;
      prompt += `   Original: "${issue.originalText}"\n`;
      prompt += `   Suggestion: ${issue.suggestion}\n`;
      prompt += `\n`;
    });
  }

  prompt += `
EDITING INSTRUCTIONS:
1. Fix ALL high-priority issues - these are factual errors that must be corrected
2. Fix medium-priority issues if they don't compromise Marshall's voice
3. Consider low-priority issues but prioritize voice over perfection
4. MAINTAIN Marshall's snarky, passionate, knowledgeable voice throughout
5. Keep the engaging, personal tone - don't make it dry or corporate
6. Preserve all markdown formatting (## headings, - lists, etc.)
7. Keep the same structure and flow
8. Only change what needs fixing - don't rewrite unnecessarily

OUTPUT FORMAT:
Return ONLY the edited markdown content. No explanations, no JSON, just the corrected blog post content in markdown format.

CRITICAL: The edited version should sound like Marshall wrote it, just more accurate.`;

  return prompt;
}
