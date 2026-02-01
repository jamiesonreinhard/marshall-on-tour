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
 * If no affiliate link exists, converts to regular product link (non-affiliate) so readers can still find products
 */
export function processAffiliateLinks(
  html: string,
  affiliateLinks: Array<{ text: string; url: string; brand: string }>
): string {
  let processed = html;

  // Replace [AFF:Product Name] with actual affiliate links (if configured)
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

  // For any remaining [AFF:...] patterns without affiliate links:
  // Convert to regular product links (non-affiliate) so readers can still find products
  // This provides value even before affiliate setup is complete
  processed = processed.replace(/\[AFF:([^\]]+)\]/g, (match, productName) => {
    // Generate a non-affiliate Amazon search link
    // When affiliate tracking is added later, these will automatically upgrade to affiliate links
    const searchQuery = encodeURIComponent(productName);
    const amazonUrl = `https://www.amazon.com/s?k=${searchQuery}`;
    
    return `<a href="${amazonUrl}" rel="nofollow" target="_blank" class="font-medium underline">${productName}</a>`;
  });

  return processed;
}
