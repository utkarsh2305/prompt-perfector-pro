-- Function to change user subscription tier (mock, no payment verification)
CREATE OR REPLACE FUNCTION public.change_user_tier(
  user_uuid UUID,
  new_tier TEXT,
  new_credit_package_id UUID DEFAULT NULL,
  new_billing_cycle TEXT DEFAULT 'monthly'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_sub RECORD;
  old_credits RECORD;
  new_credits_amount INTEGER;
  result jsonb;
BEGIN
  -- Get current subscription
  SELECT * INTO old_sub FROM user_subscriptions WHERE user_id = user_uuid;
  SELECT * INTO old_credits FROM rewrite_credits WHERE user_id = user_uuid;

  -- Determine new credits based on tier
  IF new_tier = 'free' THEN
    new_credits_amount := 10;
    new_credit_package_id := NULL;
  ELSIF new_tier = 'unlimited' THEN
    new_credits_amount := 999999; -- Effectively unlimited
    new_credit_package_id := NULL;
  ELSIF new_tier = 'pro' THEN
    -- Get credits from selected package or default
    IF new_credit_package_id IS NOT NULL THEN
      SELECT credits_amount INTO new_credits_amount 
      FROM credit_packages 
      WHERE id = new_credit_package_id AND is_active = true;
    ELSE
      -- Get default package
      SELECT id, credits_amount INTO new_credit_package_id, new_credits_amount 
      FROM credit_packages 
      WHERE is_default = true AND is_active = true
      LIMIT 1;
    END IF;
    
    IF new_credits_amount IS NULL THEN
      new_credits_amount := 200; -- Fallback
    END IF;
  END IF;

  -- Create subscription if not exists
  IF old_sub IS NULL THEN
    INSERT INTO user_subscriptions (
      user_id, tier_name, status, billing_cycle, credit_package_id,
      current_period_start, current_period_end
    ) VALUES (
      user_uuid, new_tier, 'active', new_billing_cycle, new_credit_package_id,
      now(), now() + CASE WHEN new_billing_cycle = 'yearly' THEN interval '1 year' ELSE interval '1 month' END
    );
  ELSE
    -- Update existing subscription
    UPDATE user_subscriptions SET
      tier_name = new_tier,
      status = 'active',
      billing_cycle = new_billing_cycle,
      credit_package_id = new_credit_package_id,
      current_period_start = now(),
      current_period_end = now() + CASE WHEN new_billing_cycle = 'yearly' THEN interval '1 year' ELSE interval '1 month' END,
      updated_at = now()
    WHERE user_id = user_uuid;
  END IF;

  -- Update profiles tier
  UPDATE profiles SET 
    tier = new_tier::app_tier,
    subscription_status = 'active',
    updated_at = now()
  WHERE id = user_uuid;

  -- Create or update rewrite credits
  IF old_credits IS NULL THEN
    INSERT INTO rewrite_credits (user_id, credits_remaining, credits_used_this_period, rollover_credits)
    VALUES (user_uuid, new_credits_amount, 0, 0);
  ELSE
    -- Calculate rollover for downgrades (max 200 for pro, 0 for free)
    DECLARE
      max_rollover INTEGER;
      actual_rollover INTEGER;
    BEGIN
      IF new_tier = 'pro' THEN
        max_rollover := 200;
      ELSE
        max_rollover := 0;
      END IF;
      
      actual_rollover := LEAST(GREATEST(old_credits.credits_remaining, 0), max_rollover);
      
      UPDATE rewrite_credits SET
        credits_remaining = new_credits_amount + actual_rollover,
        credits_used_this_period = 0,
        rollover_credits = actual_rollover,
        last_reset_at = now(),
        updated_at = now()
      WHERE user_id = user_uuid;
    END;
  END IF;

  -- Log the transaction
  INSERT INTO rewrite_transactions (
    user_id, transaction_type, credits_amount, balance_after, metadata
  ) VALUES (
    user_uuid, 
    'tier_change',
    new_credits_amount,
    new_credits_amount,
    jsonb_build_object(
      'old_tier', COALESCE(old_sub.tier_name, 'none'),
      'new_tier', new_tier,
      'billing_cycle', new_billing_cycle
    )
  );

  result := jsonb_build_object(
    'success', true,
    'new_tier', new_tier,
    'new_credits', new_credits_amount,
    'billing_cycle', new_billing_cycle
  );

  RETURN result;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.change_user_tier TO authenticated;

-- Function to change credit package within Pro tier
CREATE OR REPLACE FUNCTION public.change_credit_package(
  user_uuid UUID,
  new_package_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_sub RECORD;
  pkg RECORD;
  result jsonb;
BEGIN
  -- Get current subscription
  SELECT * INTO current_sub FROM user_subscriptions WHERE user_id = user_uuid;
  
  -- Verify user is on Pro tier
  IF current_sub IS NULL OR current_sub.tier_name != 'pro' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Must be on Pro tier to change packages');
  END IF;

  -- Get new package details
  SELECT * INTO pkg FROM credit_packages WHERE id = new_package_id AND is_active = true;
  
  IF pkg IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid package');
  END IF;

  -- Update subscription
  UPDATE user_subscriptions SET
    credit_package_id = new_package_id,
    updated_at = now()
  WHERE user_id = user_uuid;

  -- Update credits (add new package credits, reset used count)
  UPDATE rewrite_credits SET
    credits_remaining = pkg.credits_amount + LEAST(rollover_credits, 200),
    credits_used_this_period = 0,
    last_reset_at = now(),
    updated_at = now()
  WHERE user_id = user_uuid;

  -- Log transaction
  INSERT INTO rewrite_transactions (
    user_id, transaction_type, credits_amount, balance_after, metadata
  )
  SELECT 
    user_uuid,
    'package_change',
    pkg.credits_amount,
    rc.credits_remaining,
    jsonb_build_object('package_id', new_package_id, 'credits', pkg.credits_amount)
  FROM rewrite_credits rc WHERE rc.user_id = user_uuid;

  RETURN jsonb_build_object('success', true, 'new_credits', pkg.credits_amount);
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.change_credit_package TO authenticated;