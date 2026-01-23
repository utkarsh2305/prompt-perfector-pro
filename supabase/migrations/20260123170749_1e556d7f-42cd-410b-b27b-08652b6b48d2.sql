-- Initialize subscription and credits for existing users who don't have records
INSERT INTO public.user_subscriptions (user_id, tier_name, billing_cycle, status, current_period_start, current_period_end)
SELECT 
  p.id,
  CASE 
    WHEN p.tier = 'pro' THEN 'pro'
    WHEN p.tier = 'enterprise' THEN 'unlimited'
    ELSE 'free'
  END,
  'monthly',
  'active',
  now(),
  now() + interval '1 month'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_subscriptions us WHERE us.user_id = p.id
);

-- Initialize credits for existing users who don't have records
INSERT INTO public.rewrite_credits (user_id, credits_remaining, credits_used_this_period, rollover_credits)
SELECT 
  p.id,
  CASE 
    WHEN p.tier = 'enterprise' THEN -1
    WHEN p.tier = 'pro' THEN 200
    ELSE 10
  END,
  0,
  0
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.rewrite_credits rc WHERE rc.user_id = p.id
);

-- Grant service role access for edge functions to insert transactions
CREATE POLICY "Service role can insert transactions"
  ON public.rewrite_transactions FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Also allow service role to update credits
CREATE POLICY "Service role can update credits"
  ON public.rewrite_credits FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can update subscriptions"
  ON public.user_subscriptions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);