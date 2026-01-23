-- Drop the existing framework_rules table
DROP TABLE IF EXISTS public.framework_rules CASCADE;

-- ============================================================================
-- Table: rule_categories (must be created first for FK reference)
-- ============================================================================
CREATE TABLE public.rule_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rule_categories_active ON public.rule_categories(is_active);
CREATE INDEX idx_rule_categories_sort ON public.rule_categories(sort_order);

-- Enable RLS
ALTER TABLE public.rule_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active categories"
ON public.rule_categories FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage categories"
ON public.rule_categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Grants
GRANT SELECT ON public.rule_categories TO authenticated, anon;

-- ============================================================================
-- Table: framework_rules (updated schema, no hard limits)
-- ============================================================================
CREATE TABLE public.framework_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_number INTEGER NOT NULL UNIQUE,
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  category_id UUID REFERENCES public.rule_categories(id) ON DELETE SET NULL,
  weight DECIMAL(3,2) NOT NULL DEFAULT 3.00 CHECK (weight >= 1 AND weight <= 5),
  detection_keywords TEXT[] NOT NULL DEFAULT '{}',
  detection_patterns TEXT[] NOT NULL DEFAULT '{}',
  positive_examples TEXT[] NOT NULL DEFAULT '{}',
  negative_examples TEXT[] NOT NULL DEFAULT '{}',
  improvement_template TEXT,
  tier_required TEXT NOT NULL DEFAULT 'free',
  is_active BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'original',
  version INTEGER NOT NULL DEFAULT 1,
  parent_rule_id UUID REFERENCES public.framework_rules(id) ON DELETE SET NULL,
  effectiveness_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_framework_rules_category ON public.framework_rules(category_id);
CREATE INDEX idx_framework_rules_tier ON public.framework_rules(tier_required);
CREATE INDEX idx_framework_rules_active ON public.framework_rules(is_active);
CREATE INDEX idx_framework_rules_number ON public.framework_rules(rule_number);
CREATE INDEX idx_framework_rules_source ON public.framework_rules(source);
CREATE INDEX idx_framework_rules_parent ON public.framework_rules(parent_rule_id);

-- Enable RLS
ALTER TABLE public.framework_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active rules"
ON public.framework_rules FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage rules"
ON public.framework_rules FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_framework_rules_updated_at
BEFORE UPDATE ON public.framework_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Grants
GRANT SELECT ON public.framework_rules TO authenticated, anon;

-- ============================================================================
-- Table: rule_changelog (track rule evolution)
-- ============================================================================
CREATE TABLE public.rule_changelog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.framework_rules(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_rule_changelog_rule ON public.rule_changelog(rule_id);
CREATE INDEX idx_rule_changelog_type ON public.rule_changelog(change_type);
CREATE INDEX idx_rule_changelog_date ON public.rule_changelog(created_at DESC);

-- Enable RLS
ALTER TABLE public.rule_changelog ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view changelog"
ON public.rule_changelog FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert changelog"
ON public.rule_changelog FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Grants
GRANT SELECT, INSERT ON public.rule_changelog TO authenticated;

-- ============================================================================
-- Function: Auto-log rule changes
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_rule_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.rule_changelog (rule_id, changed_by, change_type, new_values)
    VALUES (NEW.id, auth.uid(), 'created', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.rule_changelog (rule_id, changed_by, change_type, old_values, new_values)
    VALUES (NEW.id, auth.uid(), 'updated', to_jsonb(OLD), to_jsonb(NEW));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-log changes
CREATE TRIGGER trigger_log_rule_change
AFTER INSERT OR UPDATE ON public.framework_rules
FOR EACH ROW
EXECUTE FUNCTION public.log_rule_change();

-- ============================================================================
-- Function: Get next rule number
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_next_rule_number()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(rule_number), 0) + 1 FROM public.framework_rules;
$$;

GRANT EXECUTE ON FUNCTION public.get_next_rule_number TO authenticated;