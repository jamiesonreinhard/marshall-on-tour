/**
 * Markdown Processing Utilities
 * 
 * Converts Markdown to HTML for blog posts
 * This is the standard approach for modern blogs
 */

import { remark } from 'remark';
import remarkHtml from 'remark-html';

/**
 * Convert Markdown to HTML
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  try {
    const result = await remark()
      .use(remarkHtml, {
        sanitize: false, // Allow HTML in markdown (for affiliate links, etc.)
      })
      .process(markdown);

    let html = String(result);
    
    // Ensure proper spacing between elements
    // Add spacing after headings
    html = html.replace(/<\/h([1-6])>/g, '</h$1>\n');
    // Add spacing after paragraphs
    html = html.replace(/<\/p>/g, '</p>\n');
    // Add spacing after lists
    html = html.replace(/<\/ul>/g, '</ul>\n');
    html = html.replace(/<\/ol>/g, '</ol>\n');
    
    return html;
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    // Fallback: return as-is (might already be HTML)
    return markdown;
  }
}

/**
 * Process affiliate links in markdown
 * Converts [AFF:Product Name] to proper affiliate links
 * If no affiliate link exists, removes the placeholder entirely (don't show product mentions we can't monetize)
 */
export function processAffiliateLinks(
  html: string,
  affiliateLinks: Array<{ text: string; url: string; brand: string }>
): string {
  let processed = html;

  // Replace [AFF:Product Name] with actual affiliate links
  affiliateLinks.forEach((link) => {
    const pattern = new RegExp(
      `\\[AFF:${link.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`,
      'gi'
    );
    processed = processed.replace(
      pattern,
      `<a href="${link.url}" rel="nofollow sponsored" target="_blank" class="font-medium underline">${link.text}</a>`
    );
  });

  // Remove any remaining [AFF:...] patterns entirely (no link = don't show the mention)
  // This ensures we only mention products when we can actually monetize them
  processed = processed.replace(/\[AFF:([^\]]+)\]/g, '');

  return processed;
}
