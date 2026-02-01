'use client';

import { useEffect } from 'react';
import mixpanel from 'mixpanel-browser';

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      mixpanel.init("3547c1ca28c3f62b92664cdad9f7d1f6", {
        debug: process.env.NODE_ENV === 'development',
        track_pageview: true,
        persistence: "localStorage",
        autocapture: true,
        // Skipping session recording for free plan
      });
    }
  }, []);

  return <>{children}</>;
}