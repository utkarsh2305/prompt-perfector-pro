-- Drop the old framework_principles table and related dependencies
DROP TABLE IF EXISTS public.framework_principles CASCADE;

-- Create the new framework_rules table
CREATE TABLE public.framework_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_number INTEGER NOT NULL CHECK (rule_number >= 1 AND rule_number <= 55),
  rule_name TEXT NOT NULL,
  rule_description TEXT NOT NULL,
  category TEXT NOT NULL,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.00 CHECK (weight >= 1 AND weight <= 5),
  detection_keywords TEXT[] NOT NULL DEFAULT '{}',
  detection_patterns TEXT[] NOT NULL DEFAULT '{}',
  positive_examples TEXT[] NOT NULL DEFAULT '{}',
  negative_examples TEXT[] NOT NULL DEFAULT '{}',
  improvement_template TEXT,
  tier_required TEXT NOT NULL DEFAULT 'free' CHECK (tier_required IN ('free', 'pro')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rule_number)
);

-- Create indexes for common queries
CREATE INDEX idx_framework_rules_category ON public.framework_rules(category);
CREATE INDEX idx_framework_rules_tier ON public.framework_rules(tier_required);
CREATE INDEX idx_framework_rules_active ON public.framework_rules(is_active);
CREATE INDEX idx_framework_rules_number ON public.framework_rules(rule_number);

-- Enable RLS
ALTER TABLE public.framework_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Anyone can view active rules, admins can manage all
CREATE POLICY "Anyone can view active rules"
ON public.framework_rules
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage all rules"
ON public.framework_rules
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_framework_rules_updated_at
BEFORE UPDATE ON public.framework_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.framework_rules TO authenticated;
GRANT SELECT ON public.framework_rules TO anon;