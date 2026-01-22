import { useCallback, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  trackEvent,
  trackPageView,
  trackAuth,
  trackAnalysis,
  trackConversion,
  trackError,
  identifyUser,
  setUserProperties,
  resetUser,
  isAnalyticsEnabled,
  type AnalyticsEvent,
  type AuthEvent,
  type AnalysisEvent,
  type ConversionEvent,
  type ErrorEvent,
  type EventProperties,
} from "@/lib/analytics";

/**
 * Hook for analytics tracking in React components
 * Automatically handles page views and user identification
 */
export function useAnalytics() {
  const location = useLocation();
  const { user, profile } = useAuth();
  const previousPath = useRef<string | null>(null);
  const pageStartTime = useRef<number>(Date.now());

  // Track page views on route change
  useEffect(() => {
    if (!isAnalyticsEnabled()) return;

    const currentPath = location.pathname;
    const timeOnPreviousPage = Date.now() - pageStartTime.current;

    // Track page view
    trackPageView(currentPath, {
      previous_url: previousPath.current ?? undefined,
      time_on_previous_page_ms: previousPath.current ? timeOnPreviousPage : undefined,
      user_tier: profile?.tier,
    });

    // Update refs
    previousPath.current = currentPath;
    pageStartTime.current = Date.now();
  }, [location.pathname, profile?.tier]);

  // Identify user when they log in
  useEffect(() => {
    if (!user) {
      resetUser();
      return;
    }

    identifyUser(user.id, {
      email: user.email,
      tier: profile?.tier,
      signup_date: profile?.created_at,
      total_analyses_count: profile?.total_analyses_count,
    });
  }, [user, profile]);

  // Wrapped tracking functions with user context
  const track = useCallback(
    (eventName: AnalyticsEvent | string, properties?: EventProperties) => {
      trackEvent(eventName, {
        ...properties,
        user_tier: profile?.tier,
      });
    },
    [profile?.tier]
  );

  const trackAuthEvent = useCallback(
    (event: AuthEvent, properties?: EventProperties) => {
      trackAuth(event, {
        ...properties,
        user_tier: profile?.tier,
      });
    },
    [profile?.tier]
  );

  const trackAnalysisEvent = useCallback(
    (event: AnalysisEvent, properties?: EventProperties) => {
      trackAnalysis(event, {
        ...properties,
        user_tier: profile?.tier,
      });
    },
    [profile?.tier]
  );

  const trackConversionEvent = useCallback(
    (event: ConversionEvent, properties?: EventProperties) => {
      trackConversion(event, {
        ...properties,
        user_tier: profile?.tier,
      });
    },
    [profile?.tier]
  );

  const trackErrorEvent = useCallback(
    (event: ErrorEvent, properties?: EventProperties) => {
      trackError(event, {
        ...properties,
        user_tier: profile?.tier,
      });
    },
    [profile?.tier]
  );

  const updateUserProps = useCallback(
    (properties: Record<string, string | number | boolean | undefined>) => {
      setUserProperties(properties);
    },
    []
  );

  return {
    track,
    trackAuth: trackAuthEvent,
    trackAnalysis: trackAnalysisEvent,
    trackConversion: trackConversionEvent,
    trackError: trackErrorEvent,
    setUserProperties: updateUserProps,
    isEnabled: isAnalyticsEnabled,
  };
}
