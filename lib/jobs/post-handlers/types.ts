/**
 * Types for post handlers
 */

import { ContentOpportunity } from '../scoring';
import { PostGenerationContext } from '@/lib/ai/gemini';

export interface HandlerContext {
  opportunity: ContentOpportunity;
  manualInstructions?: string; // For manual generation
}

export interface HandlerData {
  // Base context for Gemini
  context: PostGenerationContext;
  
  // Additional rich data gathered by handler
  richData: Record<string, any>;
  
  // Metadata about what was gathered
  dataSources: string[];
}

export interface HandlerResult {
  success: boolean;
  data?: HandlerData;
  error?: string;
}
