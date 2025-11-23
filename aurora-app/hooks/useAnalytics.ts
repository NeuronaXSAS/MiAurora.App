/**
 * React Hook for Analytics Tracking
 * Provides easy-to-use analytics functions in React components
 */

import { useEffect, useRef, useCallback } from 'react';
import { analytics } from '@/lib/analytics';

export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    identify: analytics.identify.bind(analytics),
    page: analytics.page.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
    incrementUserProperty: analytics.incrementUserProperty.bind(analytics),
    reset: analytics.reset.bind(analytics),
  };
}

/**
 * Track page views automatically
 */
export function usePageTracking(pageName: string, properties?: Record<string, any>) {
  useEffect(() => {
    analytics.page(pageName, properties);
  }, [pageName, properties]);
}

/**
 * Track time spent on page
 */
export function useTimeOnPage(pageName: string) {
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      const duration = Date.now() - startTimeRef.current;
      analytics.trackTimeOnPage(pageName, duration);
    };
  }, [pageName]);
}

/**
 * Track scroll depth
 */
export function useScrollTracking() {
  useEffect(() => {
    let maxScrollDepth = 0;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollDepth = Math.round((window.scrollY / scrollHeight) * 100);

          if (scrollDepth > maxScrollDepth) {
            maxScrollDepth = scrollDepth;

            // Track at 25%, 50%, 75%, 100%
            if ([25, 50, 75, 100].includes(scrollDepth)) {
              analytics.trackScrollDepth(scrollDepth);
            }
          }

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
}

/**
 * Track user session
 */
export function useSessionTracking() {
  const sessionStartRef = useRef<number>(Date.now());

  useEffect(() => {
    analytics.startSession();
    sessionStartRef.current = Date.now();

    const handleBeforeUnload = () => {
      const duration = Date.now() - sessionStartRef.current;
      analytics.endSession(duration);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const duration = Date.now() - sessionStartRef.current;
      analytics.endSession(duration);
    };
  }, []);
}

/**
 * Track clicks on specific elements
 */
export function useClickTracking(elementName: string) {
  const handleClick = useCallback(() => {
    analytics.track('element_click', {
      elementName,
      timestamp: Date.now(),
    });
  }, [elementName]);

  return handleClick;
}

/**
 * Track form submissions
 */
export function useFormTracking(formName: string) {
  const startTimeRef = useRef<number | null>(null);

  const trackFormStart = useCallback(() => {
    startTimeRef.current = Date.now();
    analytics.track('form_start', { formName });
  }, [formName]);

  const trackFormSubmit = useCallback((success: boolean, errorMessage?: string) => {
    const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    
    analytics.track('form_submit', {
      formName,
      success,
      duration,
      errorMessage,
    });

    startTimeRef.current = null;
  }, [formName]);

  const trackFormAbandon = useCallback(() => {
    const duration = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    
    analytics.track('form_abandon', {
      formName,
      duration,
    });

    startTimeRef.current = null;
  }, [formName]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormAbandon,
  };
}

/**
 * Track video/media interactions
 */
export function useMediaTracking(mediaId: string, mediaType: 'video' | 'audio' | 'image') {
  const trackPlay = useCallback(() => {
    analytics.track('media_play', { mediaId, mediaType });
  }, [mediaId, mediaType]);

  const trackPause = useCallback((currentTime: number) => {
    analytics.track('media_pause', { mediaId, mediaType, currentTime });
  }, [mediaId, mediaType]);

  const trackComplete = useCallback((duration: number) => {
    analytics.track('media_complete', { mediaId, mediaType, duration });
  }, [mediaId, mediaType]);

  const trackProgress = useCallback((currentTime: number, duration: number) => {
    const progress = Math.round((currentTime / duration) * 100);
    
    // Track at 25%, 50%, 75%
    if ([25, 50, 75].includes(progress)) {
      analytics.track('media_progress', { mediaId, mediaType, progress });
    }
  }, [mediaId, mediaType]);

  return {
    trackPlay,
    trackPause,
    trackComplete,
    trackProgress,
  };
}

/**
 * Track search queries
 */
export function useSearchTracking() {
  const trackSearch = useCallback((query: string, resultsCount: number, filters?: Record<string, any>) => {
    analytics.track('search', {
      query,
      resultsCount,
      filters,
      queryLength: query.length,
    });
  }, []);

  const trackSearchResultClick = useCallback((query: string, resultId: string, position: number) => {
    analytics.track('search_result_click', {
      query,
      resultId,
      position,
    });
  }, []);

  return {
    trackSearch,
    trackSearchResultClick,
  };
}

/**
 * Track errors in components
 */
export function useErrorTracking() {
  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    analytics.trackError(error, context);
  }, []);

  return trackError;
}

/**
 * Track performance metrics
 */
export function usePerformanceTracking(componentName: string) {
  const renderStartRef = useRef<number>(Date.now());

  useEffect(() => {
    renderStartRef.current = Date.now();
  });

  useEffect(() => {
    const renderTime = Date.now() - renderStartRef.current;
    
    if (renderTime > 100) { // Only track slow renders
      analytics.trackPerformance(`${componentName}_render`, renderTime);
    }
  });

  const trackInteraction = useCallback((interactionName: string, duration: number) => {
    analytics.trackPerformance(`${componentName}_${interactionName}`, duration);
  }, [componentName]);

  return trackInteraction;
}
