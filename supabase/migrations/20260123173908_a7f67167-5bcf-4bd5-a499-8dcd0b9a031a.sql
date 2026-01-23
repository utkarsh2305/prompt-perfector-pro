-- ============================================================================
-- Table: rule_effectiveness (track which rules help users)
-- ============================================================================
CREATE TABLE public.rule_effectiveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.framework_rules(id) ON DELETE CASCADE,
  times_triggered INTEGER NOT NULL DEFAULT 0,
  times_followed INTEGER NOT NULL DEFAULT 0,
  avg_score_improvement DECIMAL(5,2) NOT NULL DEFAULT 0,
  user_satisfaction_avg DECIMAL(3,2),
  last_calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rule_id)
);

-- Indexes
CREATE INDEX idx_rule_effectiveness_rule ON public.rule_effectiveness(rule_id);
CREATE INDEX idx_rule_effectiveness_triggered ON public.rule_effectiveness(times_triggered DESC);
CREATE INDEX idx_rule_effectiveness_followed ON public.rule_effectiveness(times_followed DESC);

-- Enable RLS
ALTER TABLE public.rule_effectiveness ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view effectiveness stats"
ON public.rule_effectiveness FOR SELECT
USING (true);

CREATE POLICY "Admins can manage effectiveness"
ON public.rule_effectiveness FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role needs to update stats from edge functions
CREATE POLICY "Service role can update effectiveness"
ON public.rule_effectiveness FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can insert effectiveness"
ON public.rule_effectiveness FOR INSERT
WITH CHECK (true);

-- Grants
GRANT SELECT ON public.rule_effectiveness TO authenticated, anon;

-- ============================================================================
-- Table: rule_suggestions (crowdsource new rules)
-- ============================================================================
CREATE TABLE public.rule_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggested_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rule_name TEXT NOT NULL,
  rule_description TEXT NOT NULL,
  category_id UUID REFERENCES public.rule_categories(id) ON DELETE SET NULL,
  example_prompt TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  admin_notes TEXT,
  converted_to_rule_id UUID REFERENCES public.framework_rules(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rule_suggestions_status ON public.rule_suggestions(status);
CREATE INDEX idx_rule_suggestions_user ON public.rule_suggestions(suggested_by);
CREATE INDEX idx_rule_suggestions_category ON public.rule_suggestions(category_id);
CREATE INDEX idx_rule_suggestions_date ON public.rule_suggestions(created_at DESC);

-- Enable RLS
ALTER TABLE public.rule_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own suggestions"
ON public.rule_suggestions FOR SELECT
USING (auth.uid() = suggested_by);

CREATE POLICY "Users can create suggestions"
ON public.rule_suggestions FOR INSERT
WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "Admins can view all suggestions"
ON public.rule_suggestions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage suggestions"
ON public.rule_suggestions FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Grants
GRANT SELECT, INSERT ON public.rule_suggestions TO authenticated;

-- ============================================================================
-- Function: Update rule effectiveness metrics
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_rule_effectiveness(
  p_rule_id UUID,
  p_was_triggered BOOLEAN DEFAULT false,
  p_was_followed BOOLEAN DEFAULT false,
  p_score_improvement DECIMAL DEFAULT NULL,
  p_user_satisfaction DECIMAL DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stats RECORD;
  new_avg_improvement DECIMAL;
  new_avg_satisfaction DECIMAL;
BEGIN
  -- Get or create effectiveness record
  SELECT * INTO current_stats FROM public.rule_effectiveness WHERE rule_id = p_rule_id;
  
  IF current_stats IS NULL THEN
    INSERT INTO public.rule_effectiveness (rule_id) VALUES (p_rule_id);
    SELECT * INTO current_stats FROM public.rule_effectiveness WHERE rule_id = p_rule_id;
  END IF;
  
  -- Calculate new averages
  IF p_score_improvement IS NOT NULL THEN
    new_avg_improvement := (
      (current_stats.avg_score_improvement * current_stats.times_followed) + p_score_improvement
    ) / NULLIF(current_stats.times_followed + 1, 0);
  ELSE
    new_avg_improvement := current_stats.avg_score_improvement;
  END IF;
  
  IF p_user_satisfaction IS NOT NULL AND current_stats.user_satisfaction_avg IS NOT NULL THEN
    new_avg_satisfaction := (
      (current_stats.user_satisfaction_avg * current_stats.times_followed) + p_user_satisfaction
    ) / NULLIF(current_stats.times_followed + 1, 0);
  ELSIF p_user_satisfaction IS NOT NULL THEN
    new_avg_satisfaction := p_user_satisfaction;
  ELSE
    new_avg_satisfaction := current_stats.user_satisfaction_avg;
  END IF;
  
  -- Update stats
  UPDATE public.rule_effectiveness SET
    times_triggered = times_triggered + CASE WHEN p_was_triggered THEN 1 ELSE 0 END,
    times_followed = times_followed + CASE WHEN p_was_followed THEN 1 ELSE 0 END,
    avg_score_improvement = COALESCE(new_avg_improvement, avg_score_improvement),
    user_satisfaction_avg = new_avg_satisfaction,
    last_calculated_at = now()
  WHERE rule_id = p_rule_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_rule_effectiveness TO authenticated;

-- ============================================================================
-- Function: Get top effective rules
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_top_effective_rules(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  rule_id UUID,
  rule_name TEXT,
  category_name TEXT,
  times_triggered INTEGER,
  times_followed INTEGER,
  follow_rate DECIMAL,
  avg_score_improvement DECIMAL,
  user_satisfaction_avg DECIMAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    fr.id as rule_id,
    fr.rule_name,
    rc.name as category_name,
    re.times_triggered,
    re.times_followed,
    CASE WHEN re.times_triggered > 0 
      THEN ROUND((re.times_followed::DECIMAL / re.times_triggered) * 100, 2)
      ELSE 0 
    END as follow_rate,
    re.avg_score_improvement,
    re.user_satisfaction_avg
  FROM public.rule_effectiveness re
  JOIN public.framework_rules fr ON fr.id = re.rule_id
  LEFT JOIN public.rule_categories rc ON rc.id = fr.category_id
  WHERE fr.is_active = true
  ORDER BY re.avg_score_improvement DESC, re.times_followed DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION public.get_top_effective_rules TO authenticated, anon;