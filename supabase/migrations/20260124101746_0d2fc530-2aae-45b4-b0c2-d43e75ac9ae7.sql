-- 1. Add snooze preference columns to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS default_snooze_minutes integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS auto_unsnooze_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS show_rewrite_confirmation boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS snooze_analytics_enabled boolean DEFAULT true;

-- 2. Create snooze_events table for analytics
CREATE TABLE public.snooze_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  snooze_type text NOT NULL CHECK (snooze_type IN ('snooze', 'unsnooze')),
  snooze_reason text CHECK (snooze_reason IN ('manual', 'timer_15', 'timer_30', 'timer_60', 'session', 'auto_expired')),
  platform text CHECK (platform IN ('chatgpt', 'claude', 'gemini', 'perplexity', 'other')),
  duration_minutes integer,
  actual_duration_minutes integer,
  session_id text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for analytics queries
CREATE INDEX idx_snooze_events_user_id ON public.snooze_events(user_id);
CREATE INDEX idx_snooze_events_created_at ON public.snooze_events(created_at);
CREATE INDEX idx_snooze_events_platform ON public.snooze_events(platform);
CREATE INDEX idx_snooze_events_session ON public.snooze_events(user_id, session_id, snooze_type);

-- 3. Create revert_events table to track revert usage
CREATE TABLE public.revert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  prompt_analysis_id uuid REFERENCES public.prompt_analysis_log(id),
  revert_reason text CHECK (revert_reason IN ('preferred_original', 'ai_changed_meaning', 'too_long', 'other')),
  score_before integer,
  score_after integer,
  platform text CHECK (platform IN ('chatgpt', 'claude', 'gemini', 'perplexity', 'other')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for analytics
CREATE INDEX idx_revert_events_user_id ON public.revert_events(user_id);
CREATE INDEX idx_revert_events_created_at ON public.revert_events(created_at);

-- 4. Enable RLS on new tables
ALTER TABLE public.snooze_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revert_events ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for snooze_events
CREATE POLICY "Users can insert own snooze events"
  ON public.snooze_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own snooze events"
  ON public.snooze_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all snooze events"
  ON public.snooze_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. RLS Policies for revert_events
CREATE POLICY "Users can insert own revert events"
  ON public.revert_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own revert events"
  ON public.revert_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all revert events"
  ON public.revert_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Create admin analytics views
CREATE OR REPLACE VIEW public.admin_snooze_analytics AS
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

CREATE OR REPLACE VIEW public.admin_revert_analytics AS
SELECT
  DATE(created_at) as date,
  platform,
  revert_reason,
  COUNT(*) as revert_count,
  AVG(score_before)::numeric(10,2) as avg_score_before,
  AVG(score_after)::numeric(10,2) as avg_score_after_reverted
FROM public.revert_events
GROUP BY DATE(created_at), platform, revert_reason;