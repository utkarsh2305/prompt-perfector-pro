-- Create user_savings_stats table
CREATE TABLE public.user_savings_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_prompts_analyzed integer NOT NULL DEFAULT 0,
  total_prompts_rewritten integer NOT NULL DEFAULT 0,
  total_tokens_saved integer NOT NULL DEFAULT 0,
  total_money_saved_cents integer NOT NULL DEFAULT 0,
  total_retries_avoided integer NOT NULL DEFAULT 0,
  total_time_saved_minutes integer NOT NULL DEFAULT 0,
  avg_score_before numeric NOT NULL DEFAULT 0,
  avg_score_after numeric NOT NULL DEFAULT 0,
  current_month_tokens_saved integer NOT NULL DEFAULT 0,
  current_month_money_saved_cents integer NOT NULL DEFAULT 0,
  preferred_ai_platform text NOT NULL DEFAULT 'claude-sonnet',
  last_calculated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add columns to prompt_analysis_log for savings tracking
ALTER TABLE public.prompt_analysis_log 
  ADD COLUMN IF NOT EXISTS estimated_tokens_original integer,
  ADD COLUMN IF NOT EXISTS estimated_tokens_rewritten integer,
  ADD COLUMN IF NOT EXISTS tokens_saved integer,
  ADD COLUMN IF NOT EXISTS money_saved_cents integer,
  ADD COLUMN IF NOT EXISTS retries_avoided integer;

-- Enable RLS on user_savings_stats
ALTER TABLE public.user_savings_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own savings stats
CREATE POLICY "Users can view own savings stats"
  ON public.user_savings_stats
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own preferred platform
CREATE POLICY "Users can update own preferred platform"
  ON public.user_savings_stats
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can insert their own stats (for initial creation)
CREATE POLICY "Users can insert own savings stats"
  ON public.user_savings_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role / edge functions can manage all stats
CREATE POLICY "Service role can manage all savings stats"
  ON public.user_savings_stats
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admins can view all savings stats
CREATE POLICY "Admins can view all savings stats"
  ON public.user_savings_stats
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_user_savings_stats_user_id ON public.user_savings_stats(user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_user_savings_stats_updated_at
  BEFORE UPDATE ON public.user_savings_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();