-- Seed rule_categories with initial data
INSERT INTO public.rule_categories (name, description, color, icon, sort_order, is_active) VALUES
  ('Clarity', 'Rules ensuring prompts are clear and unambiguous', '#3B82F6', 'target', 1, true),
  ('Context', 'Rules about providing adequate background information', '#10B981', 'info', 2, true),
  ('Constraints', 'Rules defining boundaries and limitations', '#F59E0B', 'lock', 3, true),
  ('Format', 'Rules about output structure and formatting', '#8B5CF6', 'layout', 4, true),
  ('Persona', 'Rules for defining AI role and tone', '#EC4899', 'user', 5, true),
  ('Advanced', 'Advanced prompting techniques like chain-of-thought', '#6366F1', 'brain', 6, true)
ON CONFLICT DO NOTHING;