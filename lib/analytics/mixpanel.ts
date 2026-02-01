/**
 * Mixpanel Analytics Utility
 * 
 * Centralized tracking functions for Marshall's analytics
 */

import mixpanel from 'mixpanel-browser';

/**
 * Identify a user in Mixpanel
 * Call this when a user logs in or when you have their user ID
 */
export function identifyUser(userId: string, properties?: {
  email?: string;
  name?: string;
  [key: string]: any;
}) {
  if (typeof window === 'undefined') return;
  
  mixpanel.identify(userId);
  
  if (properties) {
    mixpanel.people.set({
      '$name': properties.name,
      '$email': properties.email,
      ...properties,
    });
  }
}

/**
 * Track a custom event
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  mixpanel.track(eventName, properties);
}

/**
 * Track page views
 */
export function trackPageView(pageUrl: string, pageTitle?: string, userId?: string) {
  if (typeof window === 'undefined') return;
  
  trackEvent('Page View', {
    page_url: pageUrl,
    page_title: pageTitle,
    user_id: userId,
  });
}

/**
 * Track sign up events
 */
export function trackSignUp(data: {
  user_id: string;
  email?: string;
  signup_method?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}) {
  trackEvent('Sign Up', data);
}

/**
 * Track sign in events
 */
export function trackSignIn(data: {
  user_id: string;
  login_method?: string;
  success: boolean;
}) {
  trackEvent('Sign In', data);
}

/**
 * Track search events
 */
export function trackSearch(data: {
  search_query: string;
  user_id?: string;
  results_count?: number;
}) {
  trackEvent('Search', data);
}

/**
 * Track error events
 */
export function trackError(data: {
  error_type: string;
  error_message: string;
  error_code?: string;
  page_url?: string;
  user_id?: string;
}) {
  trackEvent('Error', data);
}

/**
 * Track purchase events (for affiliate conversions)
 */
export function trackPurchase(data: {
  user_id?: string;
  transaction_id: string;
  revenue: number;
  currency?: string;
}) {
  trackEvent('Purchase', {
    ...data,
    currency: data.currency || 'USD',
  });
}

/**
 * Track conversion events (affiliate clicks, etc.)
 */
export function trackConversion(data: {
  conversion_type: string;
  conversion_value?: number;
  [key: string]: any;
}) {
  trackEvent('Conversion', data);
}