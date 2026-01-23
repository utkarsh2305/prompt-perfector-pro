-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Service role can update effectiveness" ON public.rule_effectiveness;
DROP POLICY IF EXISTS "Service role can insert effectiveness" ON public.rule_effectiveness;

-- The update_rule_effectiveness function is already SECURITY DEFINER,
-- so it can bypass RLS when called. No additional policies needed for service role.
-- The function handles all inserts/updates internally.