-- Create rate limits table for tracking request rates
CREATE TABLE public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- IP for anonymous, user_id for authenticated
  endpoint text NOT NULL, -- e.g., 'auth', 'admin', 'score-prompt', 'rewrite-prompt'
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  UNIQUE (identifier, endpoint)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage rate limits (edge functions use service_role)
CREATE POLICY "Service role can manage rate limits"
  ON public.rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create index for efficient lookups
CREATE INDEX idx_rate_limits_lookup ON public.rate_limits(identifier, endpoint, window_start);

-- Function to check and update rate limit
-- Returns true if request is allowed, false if rate limited
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_endpoint text,
  p_max_requests integer,
  p_window_minutes integer DEFAULT 1
)
RETURNS TABLE(allowed boolean, current_count integer, reset_at timestamptz) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_current record;
BEGIN
  -- Calculate window start time
  v_window_start := now() - (p_window_minutes || ' minutes')::interval;
  
  -- Try to get existing rate limit record
  SELECT * INTO v_current
  FROM public.rate_limits
  WHERE identifier = p_identifier AND endpoint = p_endpoint;
  
  IF v_current IS NULL THEN
    -- First request, create new record
    INSERT INTO public.rate_limits (identifier, endpoint, request_count, window_start)
    VALUES (p_identifier, p_endpoint, 1, now());
    
    RETURN QUERY SELECT true, 1, now() + (p_window_minutes || ' minutes')::interval;
    RETURN;
  END IF;
  
  IF v_current.window_start < v_window_start THEN
    -- Window expired, reset counter
    UPDATE public.rate_limits
    SET request_count = 1, window_start = now()
    WHERE identifier = p_identifier AND endpoint = p_endpoint;
    
    RETURN QUERY SELECT true, 1, now() + (p_window_minutes || ' minutes')::interval;
    RETURN;
  END IF;
  
  IF v_current.request_count >= p_max_requests THEN
    -- Rate limit exceeded
    RETURN QUERY SELECT false, v_current.request_count, 
      v_current.window_start + (p_window_minutes || ' minutes')::interval;
    RETURN;
  END IF;
  
  -- Increment counter
  UPDATE public.rate_limits
  SET request_count = request_count + 1
  WHERE identifier = p_identifier AND endpoint = p_endpoint;
  
  RETURN QUERY SELECT true, v_current.request_count + 1, 
    v_current.window_start + (p_window_minutes || ' minutes')::interval;
END;
$$;

-- Cleanup function to remove expired rate limit records (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';
END;
$$;

-- Update get_user_tier_info to validate user access
CREATE OR REPLACE FUNCTION public.get_user_tier_info(user_uuid uuid)
RETURNS TABLE(tier app_tier, features jsonb, daily_usage integer, total_usage integer, subscription_status subscription_status)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate user can only access their own data (or admin can access any)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != user_uuid AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: can only access your own tier info';
  END IF;

  RETURN QUERY
  SELECT
    p.tier,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'feature_slug', tf.feature_slug,
          'feature_name', tf.feature_name,
          'is_enabled', tf.is_enabled,
          'config', tf.config
        )
      ) filter (where tf.id is not null),
      '[]'::jsonb
    ) as features,
    p.daily_usage_count,
    p.total_analyses_count,
    p.subscription_status
  FROM public.profiles p
  LEFT JOIN public.tier_features tf
    ON tf.tier_name = p.tier
   AND tf.is_enabled = true
  WHERE p.id = user_uuid
  GROUP BY p.id, p.tier, p.daily_usage_count, p.total_analyses_count, p.subscription_status;
END;
$$;

-- Update increment_usage to validate user access
CREATE OR REPLACE FUNCTION public.increment_usage(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate user can only increment their own usage
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != user_uuid THEN
    RAISE EXCEPTION 'Unauthorized: can only increment your own usage';
  END IF;

  UPDATE public.profiles
  SET daily_usage_count = daily_usage_count + 1,
      total_analyses_count = total_analyses_count + 1,
      updated_at = now()
  WHERE id = user_uuid;
END;
$$;

-- Update can_user_analyze to validate user access
CREATE OR REPLACE FUNCTION public.can_user_analyze(user_uuid uuid)
RETURNS TABLE(can_analyze boolean, reason text, usage_count integer, usage_limit integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier public.app_tier;
  user_usage integer;
  daily_limit integer;
BEGIN
  -- Validate user can only check their own analysis permission
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  IF auth.uid() != user_uuid AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: can only check your own analysis permission';
  END IF;

  SELECT tier, daily_usage_count
  INTO user_tier, user_usage
  FROM public.profiles
  WHERE id = user_uuid;

  IF user_tier IN ('pro'::public.app_tier, 'enterprise'::public.app_tier) THEN
    RETURN QUERY SELECT true, 'unlimited', coalesce(user_usage,0), null::integer;
    RETURN;
  END IF;

  SELECT nullif(config->>'limit','')::integer
  INTO daily_limit
  FROM public.tier_features
  WHERE tier_name = 'free'::public.app_tier
    AND feature_slug = 'daily_limit'
    AND is_enabled = true
  LIMIT 1;

  IF daily_limit IS NULL THEN
    daily_limit := 10;
  END IF;

  IF coalesce(user_usage,0) < daily_limit THEN
    RETURN QUERY SELECT true, 'within_limit', coalesce(user_usage,0), daily_limit;
  ELSE
    RETURN QUERY SELECT false, 'limit_exceeded', coalesce(user_usage,0), daily_limit;
  END IF;
END;
$$;