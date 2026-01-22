# Analytics Event Taxonomy

This document defines all tracked events in Prompt Perfector.

## Event Categories

### Authentication Events

| Event | Properties | When Fired |
|-------|------------|------------|
| `user_signed_up` | `method`, `tier`, `referrer` | After successful signup |
| `user_logged_in` | `method`, `days_since_last_login` | After successful login |
| `user_logged_out` | - | After logout |
| `password_reset_requested` | - | When reset email sent |
| `password_reset_completed` | - | After password updated |

### Analysis Events (Core Product)

| Event | Properties | When Fired |
|-------|------------|------------|
| `prompt_analyzed` | `score`, `grade`, `analysis_method`, `platform`, `prompt_length`, `violations_count`, `user_tier` | After analysis completes |
| `improvement_copied` | `score`, `analysis_id` | When user copies improved prompt |
| `improvement_accepted` | `analysis_id` | When user clicks "use this" |
| `analysis_details_viewed` | `analysis_id`, `from_location` | When viewing full analysis |
| `analysis_rated` | `rating`, `analysis_id` | When user rates analysis |

### Conversion Events

| Event | Properties | When Fired |
|-------|------------|------------|
| `pricing_page_viewed` | `from_page`, `user_tier` | When pricing page loads |
| `upgrade_button_clicked` | `location`, `tier` | When upgrade CTA clicked |
| `checkout_started` | `plan`, `billing_frequency` | When Stripe checkout begins |
| `subscription_created` | `plan`, `amount`, `billing_frequency` | After successful payment |
| `subscription_canceled` | `plan`, `reason`, `days_active` | When subscription canceled |

### Engagement Events

| Event | Properties | When Fired |
|-------|------------|------------|
| `dashboard_viewed` | `section` | When dashboard section loads |
| `feature_discovered` | `feature_name`, `how_discovered` | When tooltip/feature found |
| `help_article_viewed` | `article_title`, `from_location` | When help content viewed |
| `feedback_submitted` | `type`, `sentiment` | When feedback form submitted |

### Error Events

| Event | Properties | When Fired |
|-------|------------|------------|
| `error_encountered` | `error_code`, `error_message`, `location`, `user_tier` | On client-side error |
| `api_error` | `endpoint`, `status_code`, `error_message` | On API failure |
| `rate_limit_hit` | `endpoint`, `user_tier`, `analyses_used` | When rate limit exceeded |

## User Properties

Set on login/signup, updated on key actions:

| Property | Type | Description |
|----------|------|-------------|
| `tier` | string | User's subscription tier (free/pro/enterprise) |
| `signup_date` | date | Account creation date |
| `total_analyses_count` | number | Lifetime analyses count |
| `avg_prompt_score` | number | Average score across analyses |
| `most_used_platform` | string | Most frequently analyzed platform |
| `last_analysis_date` | date | Date of most recent analysis |

## Super Properties

Included with every event:

| Property | Description |
|----------|-------------|
| `user_tier` | Current subscription tier |
| `timestamp` | Event timestamp (ISO 8601) |

## Privacy & Consent

- Analytics requires explicit user consent (GDPR compliant)
- Consent stored in `localStorage` as `analytics_consent`
- Users can opt out at any time via settings
- No PII tracked without consent
- IP addresses anonymized by PostHog

## Implementation

```typescript
import { useAnalytics } from "@/hooks/useAnalytics";

function MyComponent() {
  const { track, trackAnalysis, trackConversion } = useAnalytics();

  const handleAnalyze = (result) => {
    trackAnalysis("prompt_analyzed", {
      score: result.score,
      platform: "chatgpt",
      analysis_method: "template",
    });
  };
}
```

## Daily Aggregation

The `aggregate-analytics` edge function runs daily at midnight UTC via pg_cron to pre-calculate metrics and populate the `usage_analytics` table for fast admin dashboard queries.
