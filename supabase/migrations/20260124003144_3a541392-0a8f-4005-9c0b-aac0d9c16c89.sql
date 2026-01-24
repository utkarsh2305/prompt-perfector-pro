-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  analysis_mode TEXT NOT NULL DEFAULT 'realtime' CHECK (analysis_mode IN ('realtime', 'manual')),
  active_platforms TEXT[] NOT NULL DEFAULT ARRAY['chatgpt', 'claude', 'gemini'],
  primary_ai_platform TEXT NOT NULL DEFAULT 'claude-sonnet',
  show_score_badge BOOLEAN NOT NULL DEFAULT true,
  show_hover_suggestions BOOLEAN NOT NULL DEFAULT true,
  auto_replace_on_rewrite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_weak_rules table
CREATE TABLE public.user_weak_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_id UUID NOT NULL REFERENCES public.framework_rules(id) ON DELETE CASCADE,
  fail_count INTEGER NOT NULL DEFAULT 0,
  last_failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, rule_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX idx_user_weak_rules_user_id ON public.user_weak_rules(user_id);
CREATE INDEX idx_user_weak_rules_rule_id ON public.user_weak_rules(rule_id);
CREATE INDEX idx_user_weak_rules_fail_count ON public.user_weak_rules(user_id, fail_count DESC);

-- Enable RLS on both tables
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_weak_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
CREATE POLICY "Users can view own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_weak_rules (users can read, service role can write)
CREATE POLICY "Users can view own weak rules"
ON public.user_weak_rules
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage weak rules"
ON public.user_weak_rules
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger for updated_at on user_preferences
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on user_weak_rules
CREATE TRIGGER update_user_weak_rules_updated_at
BEFORE UPDATE ON public.user_weak_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get or create user preferences
CREATE OR REPLACE FUNCTION public.get_or_create_user_preferences(p_user_id UUID)
RETURNS SETOF public.user_preferences
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try to insert, ignore if exists
  INSERT INTO public.user_preferences (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Return the preferences
  RETURN QUERY
  SELECT * FROM public.user_preferences WHERE user_id = p_user_id;
END;
$$;

-- Function to increment weak rule fail count
CREATE OR REPLACE FUNCTION public.increment_weak_rule(
  p_user_id UUID,
  p_rule_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_weak_rules (user_id, rule_id, fail_count, last_failed_at)
  VALUES (p_user_id, p_rule_id, 1, now())
  ON CONFLICT (user_id, rule_id) 
  DO UPDATE SET 
    fail_count = user_weak_rules.fail_count + 1,
    last_failed_at = now(),
    updated_at = now();
END;
$$;