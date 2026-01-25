-- Update handle_new_user_credits to initialize 7-day trial with 200 credits
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create initial credits record with 200 trial credits
  INSERT INTO public.rewrite_credits (user_id, credits_remaining, credits_used_this_period, rollover_credits)
  VALUES (NEW.id, 200, 0, 0);
  
  -- Create initial subscription record with trial status
  INSERT INTO public.user_subscriptions (user_id, tier_name, billing_cycle, status, current_period_start, current_period_end)
  VALUES (
    NEW.id, 
    'pro',  -- Start with pro tier during trial
    'monthly', 
    'trialing',
    now(),
    now() + interval '7 days'  -- Trial ends in 7 days
  );
  
  RETURN NEW;
END;
$$;

-- Create function to check and expire trials
CREATE OR REPLACE FUNCTION public.check_and_expire_trial(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_sub RECORD;
  result jsonb;
BEGIN
  -- Get user's current subscription
  SELECT * INTO user_sub
  FROM public.user_subscriptions
  WHERE user_id = user_uuid;
  
  -- If not on trial or trial hasn't expired, no action needed
  IF user_sub IS NULL OR user_sub.status != 'trialing' THEN
    RETURN jsonb_build_object('expired', false, 'reason', 'not_on_trial');
  END IF;
  
  IF user_sub.current_period_end > now() THEN
    RETURN jsonb_build_object(
      'expired', false, 
      'reason', 'trial_active',
      'expires_at', user_sub.current_period_end
    );
  END IF;
  
  -- Trial has expired - downgrade to free tier
  UPDATE public.user_subscriptions SET
    tier_name = 'free',
    status = 'active',
    current_period_start = now(),
    current_period_end = now() + interval '1 month',
    updated_at = now()
  WHERE user_id = user_uuid;
  
  -- Update profiles tier
  UPDATE public.profiles SET 
    tier = 'free'::app_tier,
    subscription_status = 'active',
    is_trial_active = false,
    updated_at = now()
  WHERE id = user_uuid;
  
  -- Reset credits to free tier (10)
  UPDATE public.rewrite_credits SET
    credits_remaining = 10,
    credits_used_this_period = 0,
    rollover_credits = 0,
    last_reset_at = now(),
    updated_at = now()
  WHERE user_id = user_uuid;
  
  -- Log the transition
  INSERT INTO public.rewrite_transactions (
    user_id, transaction_type, credits_amount, balance_after, metadata
  ) VALUES (
    user_uuid, 
    'tier_change',
    10,
    10,
    jsonb_build_object(
      'old_tier', 'pro',
      'new_tier', 'free',
      'reason', 'trial_expired',
      'expired_at', now()
    )
  );
  
  RETURN jsonb_build_object(
    'expired', true,
    'old_tier', 'pro',
    'new_tier', 'free',
    'new_credits', 10
  );
END;
$$;

-- Create function to get trial status
CREATE OR REPLACE FUNCTION public.get_trial_status(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_sub RECORD;
  days_remaining integer;
BEGIN
  SELECT * INTO user_sub
  FROM public.user_subscriptions
  WHERE user_id = user_uuid;
  
  IF user_sub IS NULL THEN
    RETURN jsonb_build_object('is_trial', false, 'status', 'no_subscription');
  END IF;
  
  IF user_sub.status != 'trialing' THEN
    RETURN jsonb_build_object('is_trial', false, 'status', user_sub.status, 'tier', user_sub.tier_name);
  END IF;
  
  days_remaining := GREATEST(0, EXTRACT(DAY FROM user_sub.current_period_end - now())::integer);
  
  RETURN jsonb_build_object(
    'is_trial', true,
    'status', 'trialing',
    'tier', user_sub.tier_name,
    'expires_at', user_sub.current_period_end,
    'days_remaining', days_remaining
  );
END;
$$;

-- Update change_user_tier to handle trial → paid upgrade properly
CREATE OR REPLACE FUNCTION public.change_user_tier(user_uuid uuid, new_tier text, new_credit_package_id uuid DEFAULT NULL::uuid, new_billing_cycle text DEFAULT 'monthly'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_sub RECORD;
  old_credits RECORD;
  new_credits_amount INTEGER;
  was_trial BOOLEAN;
  result jsonb;
BEGIN
  -- Get current subscription
  SELECT * INTO old_sub FROM user_subscriptions WHERE user_id = user_uuid;
  SELECT * INTO old_credits FROM rewrite_credits WHERE user_id = user_uuid;
  
  -- Check if upgrading from trial
  was_trial := old_sub IS NOT NULL AND old_sub.status = 'trialing';

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
    -- Update existing subscription - mark as active (no longer trialing)
    UPDATE user_subscriptions SET
      tier_name = new_tier,
      status = 'active',  -- Always active after tier change (ends trial if applicable)
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
    is_trial_active = false,  -- End trial on any tier change
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
      'billing_cycle', new_billing_cycle,
      'was_trial', was_trial
    )
  );

  result := jsonb_build_object(
    'success', true,
    'new_tier', new_tier,
    'new_credits', new_credits_amount,
    'billing_cycle', new_billing_cycle,
    'was_trial', was_trial
  );

  RETURN result;
END;
$$;