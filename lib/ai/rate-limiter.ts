/**
 * Rate Limiter for Gemini API
 * 
 * Handles 429 (quota exceeded) errors with exponential backoff
 * Tracks quota status to avoid unnecessary API calls
 */

interface QuotaStatus {
  isExceeded: boolean;
  retryAfter?: number; // seconds
  lastError?: string;
  lastChecked: Date;
}

let quotaStatus: QuotaStatus = {
  isExceeded: false,
  lastChecked: new Date(0),
};

/**
 * Check if we should retry after a 429 error
 */
export function parse429Error(errorText: string): { retryAfter: number; message: string } | null {
  try {
    const error = JSON.parse(errorText);
    if (error.error?.code === 429 || error.error?.status === 'RESOURCE_EXHAUSTED') {
      // Extract retry delay from RetryInfo
      const retryInfo = error.error?.details?.find((d: any) => d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo');
      const retryAfter = retryInfo?.retryDelay ? parseFloat(retryInfo.retryDelay) : 60; // Default 60 seconds
      
      const message = error.error?.message || 'Quota exceeded';
      return { retryAfter, message };
    }
  } catch {
    // Not a JSON error or not a 429
  }
  return null;
}

/**
 * Check if we're currently in a quota exceeded state
 */
export function isQuotaExceeded(): boolean {
  if (!quotaStatus.isExceeded) return false;
  
  // Check if retry time has passed
  if (quotaStatus.retryAfter) {
    const now = new Date();
    const retryTime = new Date(quotaStatus.lastChecked.getTime() + quotaStatus.retryAfter * 1000);
    if (now >= retryTime) {
      // Quota should be reset, clear the flag
      quotaStatus = {
        isExceeded: false,
        lastChecked: new Date(),
      };
      return false;
    }
  }
  
  return true;
}

/**
 * Mark quota as exceeded
 */
export function markQuotaExceeded(retryAfter: number, message: string): void {
  quotaStatus = {
    isExceeded: true,
    retryAfter,
    lastError: message,
    lastChecked: new Date(),
  };
  
  console.warn(`⚠️ Gemini quota exceeded. Retry after ${retryAfter} seconds. Message: ${message}`);
}

/**
 * Clear quota exceeded status (for testing or manual reset)
 */
export function clearQuotaStatus(): void {
  quotaStatus = {
    isExceeded: false,
    lastChecked: new Date(),
  };
}

/**
 * Get current quota status
 */
export function getQuotaStatus(): QuotaStatus {
  return { ...quotaStatus };
}

/**
 * Import getQuotaStatus for use in gemini.ts
 */
export { getQuotaStatus };

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
