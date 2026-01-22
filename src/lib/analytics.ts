/**
 * Analytics utility for PostHog integration
 * Provides a consistent API for tracking events, page views, and user identification
 */

import posthog from "posthog-js";

// Configuration
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

let initialized = false;

/**
 * Initialize PostHog analytics
 * Call this once at app startup
 */
export function initAnalytics(): void {
  if (initialized || !POSTHOG_KEY) {
    if (!POSTHOG_KEY) {
      console.warn("[Analytics] PostHog key not configured. Analytics disabled.");
    }
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // We'll handle this manually for SPA
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    autocapture: false, // Disable autocapture for privacy
    disable_session_recording: false,
    loaded: () => {
      initialized = true;
      console.log("[Analytics] PostHog initialized");
    },
  });
}

/**
 * Check if analytics is enabled (has consent and key)
 */
export function isAnalyticsEnabled(): boolean {
  if (!POSTHOG_KEY) return false;
  const consent = localStorage.getItem("analytics_consent");
  return consent === "granted";
}

/**
 * Set analytics consent
 */
export function setAnalyticsConsent(granted: boolean): void {
  localStorage.setItem("analytics_consent", granted ? "granted" : "denied");
  if (granted && POSTHOG_KEY) {
    posthog.opt_in_capturing();
  } else {
    posthog.opt_out_capturing();
  }
}

/**
 * Get current consent status
 */
export function getAnalyticsConsent(): "granted" | "denied" | null {
  const consent = localStorage.getItem("analytics_consent");
  if (consent === "granted" || consent === "denied") return consent;
  return null;
}

// ============== Event Types ==============

export type AuthEvent =
  | "user_signed_up"
  | "user_logged_in"
  | "user_logged_out"
  | "password_reset_requested"
  | "password_reset_completed";

export type AnalysisEvent =
  | "prompt_analyzed"
  | "improvement_copied"
  | "improvement_accepted"
  | "analysis_details_viewed"
  | "analysis_rated";

export type ConversionEvent =
  | "pricing_page_viewed"
  | "upgrade_button_clicked"
  | "checkout_started"
  | "subscription_created"
  | "subscription_canceled";

export type EngagementEvent =
  | "dashboard_viewed"
  | "feature_discovered"
  | "help_article_viewed"
  | "feedback_submitted";

export type ErrorEvent =
  | "error_encountered"
  | "api_error"
  | "rate_limit_hit";

export type AnalyticsEvent =
  | AuthEvent
  | AnalysisEvent
  | ConversionEvent
  | EngagementEvent
  | ErrorEvent
  | "page_viewed";

export type EventProperties = Record<string, string | number | boolean | null | undefined>;

// ============== Core Functions ==============

/**
 * Track a custom event
 */
export function trackEvent(
  eventName: AnalyticsEvent | string,
  properties?: EventProperties
): void {
  if (!isAnalyticsEnabled()) return;

  posthog.capture(eventName, {
    ...properties,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track a page view
 */
export function trackPageView(
  pageName: string,
  properties?: EventProperties
): void {
  if (!isAnalyticsEnabled()) return;

  posthog.capture("$pageview", {
    $current_url: window.location.href,
    page_name: pageName,
    ...properties,
  });
}

/**
 * Identify a user (call after login/signup)
 */
export function identifyUser(
  userId: string,
  properties?: {
    email?: string;
    tier?: string;
    signup_date?: string;
    total_analyses_count?: number;
    [key: string]: string | number | boolean | undefined;
  }
): void {
  if (!POSTHOG_KEY) return;

  posthog.identify(userId, properties);
}

/**
 * Update user properties
 */
export function setUserProperties(
  properties: Record<string, string | number | boolean | undefined>
): void {
  if (!isAnalyticsEnabled()) return;

  posthog.people.set(properties);
}

/**
 * Reset user identity (call on logout)
 */
export function resetUser(): void {
  if (!POSTHOG_KEY) return;

  posthog.reset();
}

/**
 * Set a super property (included with every event)
 */
export function setSuperProperty(key: string, value: string | number | boolean): void {
  if (!isAnalyticsEnabled()) return;

  posthog.register({ [key]: value });
}

// ============== Convenience Wrappers ==============

/**
 * Track authentication events
 */
export function trackAuth(
  event: AuthEvent,
  properties?: EventProperties
): void {
  trackEvent(event, properties);
}

/**
 * Track analysis events
 */
export function trackAnalysis(
  event: AnalysisEvent,
  properties?: EventProperties
): void {
  trackEvent(event, properties);
}

/**
 * Track conversion events
 */
export function trackConversion(
  event: ConversionEvent,
  properties?: EventProperties
): void {
  trackEvent(event, properties);
}

/**
 * Track error events
 */
export function trackError(
  event: ErrorEvent,
  properties?: EventProperties
): void {
  trackEvent(event, {
    ...properties,
    error_timestamp: new Date().toISOString(),
  });
}

// ============== Feature Flags ==============

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flagName: string): boolean {
  if (!POSTHOG_KEY) return false;
  return posthog.isFeatureEnabled(flagName) ?? false;
}

/**
 * Get feature flag value
 */
export function getFeatureFlag(flagName: string): string | boolean | undefined {
  if (!POSTHOG_KEY) return undefined;
  return posthog.getFeatureFlag(flagName);
}

// Export PostHog instance for advanced usage
export { posthog };
