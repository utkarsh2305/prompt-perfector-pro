-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage all savings stats" ON public.user_savings_stats;

-- The edge function will use service_role key which bypasses RLS entirely,
-- so we don't need an explicit policy for it. The existing user policies 
-- combined with service_role access is sufficient.