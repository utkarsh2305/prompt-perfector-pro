-- Fix security definer views by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.admin_snooze_analytics;
DROP VIEW IF EXISTS public.admin_revert_analytics;

CREATE VIEW public.admin_snooze_analytics 
WITH (security_invoker = true) AS
SELECT 
  DATE(created_at) as date,
  platform,
  snooze_reason,
  COUNT(*) as snooze_count,
  AVG(duration_minutes)::numeric(10,2) as avg_planned_duration,
  AVG(actual_duration_minutes)::numeric(10,2) as avg_actual_duration
FROM public.snooze_events
WHERE snooze_type = 'snooze'
GROUP BY DATE(created_at), platform, snooze_reason;

CREATE VIEW public.admin_revert_analytics 
WITH (security_invoker = true) AS
SELECT
  DATE(created_at) as date,
  platform,
  revert_reason,
  COUNT(*) as revert_count,
  AVG(score_before)::numeric(10,2) as avg_score_before,
  AVG(score_after)::numeric(10,2) as avg_score_after_reverted
FROM public.revert_events
GROUP BY DATE(created_at), platform, revert_reason;