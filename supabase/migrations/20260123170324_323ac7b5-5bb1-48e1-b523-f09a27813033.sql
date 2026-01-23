-- Subscription Tiers table
CREATE TABLE public.subscription_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  base_monthly_price decimal(10,2) NOT NULL DEFAULT 0,
  base_yearly_price decimal(10,2) NOT NULL DEFAULT 0,
  base_rewrite_credits integer NOT NULL DEFAULT 0,
  max_rollover integer NOT NULL DEFAULT 0,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Credit Packages table (Pro tier add-on options)
CREATE TABLE public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  credits_amount integer NOT NULL,
  monthly_price decimal(10,2) NOT NULL,
  yearly_price decimal(10,2) NOT NULL,
  cost_per_rewrite decimal(10,4) NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- User Subscriptions table
CREATE TABLE public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier_name text NOT NULL DEFAULT 'free',
  credit_package_id uuid REFERENCES public.credit_packages(id),
  billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start timestamp with time zone NOT NULL DEFAULT now(),
  current_period_end timestamp with time zone NOT NULL DEFAULT (now() + interval '1 month'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_subscription_id text,
  stripe_customer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Rewrite Credits table
CREATE TABLE public.rewrite_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  credits_remaining integer NOT NULL DEFAULT 10,
  credits_used_this_period integer NOT NULL DEFAULT 0,
  rollover_credits integer NOT NULL DEFAULT 0,
  last_reset_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Rewrite Transactions table
CREATE TABLE public.rewrite_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('usage', 'purchase', 'rollover', 'reset', 'bonus')),
  credits_amount integer NOT NULL,
  balance_after integer NOT NULL,
  prompt_analysis_id uuid REFERENCES public.prompt_analysis_log(id),
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewrite_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewrite_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_tiers (public read)
CREATE POLICY "Anyone can view active tiers"
  ON public.subscription_tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage tiers"
  ON public.subscription_tiers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for credit_packages (public read)
CREATE POLICY "Anyone can view active packages"
  ON public.credit_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage packages"
  ON public.credit_packages FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for user_subscriptions
CREATE POLICY "Users view own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own subscription"
  ON public.user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert own subscription"
  ON public.user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all subscriptions"
  ON public.user_subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rewrite_credits
CREATE POLICY "Users view own credits"
  ON public.rewrite_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own credits"
  ON public.rewrite_credits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users insert own credits"
  ON public.rewrite_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all credits"
  ON public.rewrite_credits FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rewrite_transactions
CREATE POLICY "Users view own transactions"
  ON public.rewrite_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all transactions"
  ON public.rewrite_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rewrite_credits_updated_at
  BEFORE UPDATE ON public.rewrite_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert seed data for subscription_tiers
INSERT INTO public.subscription_tiers (name, base_monthly_price, base_yearly_price, base_rewrite_credits, max_rollover, description) VALUES
  ('free', 0, 0, 10, 0, 'Get started with prompt mastery'),
  ('pro', 3, 30, 200, 200, 'For serious prompt engineers'),
  ('unlimited', 19, 190, -1, 0, 'Unlimited rewrites, zero limits');

-- Insert seed data for credit_packages
INSERT INTO public.credit_packages (credits_amount, monthly_price, yearly_price, cost_per_rewrite, is_default, sort_order) VALUES
  (200, 3, 30, 0.015, true, 1),
  (400, 5, 50, 0.0125, false, 2),
  (600, 7, 70, 0.0117, false, 3),
  (800, 9, 90, 0.0113, false, 4),
  (1000, 12, 120, 0.012, false, 5),
  (1500, 16, 160, 0.0107, false, 6),
  (2000, 20, 200, 0.01, false, 7);

-- Function to initialize credits for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create initial credits record
  INSERT INTO public.rewrite_credits (user_id, credits_remaining, credits_used_this_period, rollover_credits)
  VALUES (NEW.id, 10, 0, 0);
  
  -- Create initial subscription record
  INSERT INTO public.user_subscriptions (user_id, tier_name, billing_cycle, status)
  VALUES (NEW.id, 'free', 'monthly', 'active');
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create credits for new users
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_credits();

-- Function to check if user can rewrite
CREATE OR REPLACE FUNCTION public.check_rewrite_credits(user_uuid uuid)
RETURNS TABLE(can_rewrite boolean, credits_remaining integer, is_unlimited boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_tier text;
  user_credits integer;
BEGIN
  -- Get user's tier
  SELECT tier_name INTO user_tier
  FROM public.user_subscriptions
  WHERE user_id = user_uuid;
  
  -- If unlimited tier, always allow
  IF user_tier = 'unlimited' THEN
    RETURN QUERY SELECT true, -1, true;
    RETURN;
  END IF;
  
  -- Get credits
  SELECT rc.credits_remaining INTO user_credits
  FROM public.rewrite_credits rc
  WHERE rc.user_id = user_uuid;
  
  RETURN QUERY SELECT (COALESCE(user_credits, 0) > 0), COALESCE(user_credits, 0), false;
END;
$$;

-- Function to consume a rewrite credit
CREATE OR REPLACE FUNCTION public.consume_rewrite_credit(user_uuid uuid, analysis_id uuid DEFAULT NULL)
RETURNS TABLE(success boolean, new_balance integer, is_unlimited boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_tier text;
  current_credits integer;
  new_credits integer;
BEGIN
  -- Get user's tier
  SELECT tier_name INTO user_tier
  FROM public.user_subscriptions
  WHERE user_id = user_uuid;
  
  -- If unlimited tier, skip credit deduction
  IF user_tier = 'unlimited' THEN
    RETURN QUERY SELECT true, -1, true;
    RETURN;
  END IF;
  
  -- Get and update credits atomically
  UPDATE public.rewrite_credits
  SET credits_remaining = credits_remaining - 1,
      credits_used_this_period = credits_used_this_period + 1,
      updated_at = now()
  WHERE user_id = user_uuid AND credits_remaining > 0
  RETURNING credits_remaining INTO new_credits;
  
  IF new_credits IS NULL THEN
    RETURN QUERY SELECT false, 0, false;
    RETURN;
  END IF;
  
  -- Log transaction
  INSERT INTO public.rewrite_transactions (user_id, transaction_type, credits_amount, balance_after, prompt_analysis_id)
  VALUES (user_uuid, 'usage', -1, new_credits, analysis_id);
  
  RETURN QUERY SELECT true, new_credits, false;
END;
$$;

-- Function to get user subscription info
CREATE OR REPLACE FUNCTION public.get_user_subscription_info(user_uuid uuid)
RETURNS TABLE(
  tier_name text,
  billing_cycle text,
  credits_remaining integer,
  credits_used integer,
  rollover_credits integer,
  is_unlimited boolean,
  period_end timestamp with time zone,
  credit_package_credits integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.tier_name,
    us.billing_cycle,
    rc.credits_remaining,
    rc.credits_used_this_period,
    rc.rollover_credits,
    (us.tier_name = 'unlimited'),
    us.current_period_end,
    cp.credits_amount
  FROM public.user_subscriptions us
  LEFT JOIN public.rewrite_credits rc ON rc.user_id = us.user_id
  LEFT JOIN public.credit_packages cp ON cp.id = us.credit_package_id
  WHERE us.user_id = user_uuid;
END;
$$;