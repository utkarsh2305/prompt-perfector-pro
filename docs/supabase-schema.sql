-- Prompt Perfector - Supabase schema (run in Supabase SQL editor)
-- Notes:
-- - RLS enabled on all tables
-- - Roles stored in a separate table (user_roles) + SECURITY DEFINER helper to avoid RLS recursion

-- Required extension for gen_random_uuid()
create extension if not exists pgcrypto;

-- 0) Roles (CRITICAL: separate table)
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Allow users to read their own roles (optional but useful)
create policy "Users can view own roles"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

-- Helper to check roles without recursion
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- 1) Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,

  -- Tier Management
  tier text not null default 'free' check (tier in ('free', 'pro', 'enterprise')),
  subscription_status text default 'inactive' check (subscription_status in ('active', 'inactive', 'trialing', 'canceled', 'past_due')),
  stripe_customer_id text unique,
  stripe_subscription_id text,

  -- Usage Tracking
  daily_usage_count integer not null default 0,
  last_usage_reset_date date not null default current_date,
  total_analyses_count integer not null default 0,

  -- Trial Management
  trial_ends_at timestamp with time zone,
  is_trial_active boolean default false,

  -- Metadata
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_login_at timestamp with time zone
);

create index idx_profiles_tier on public.profiles(tier);
create index idx_profiles_email on public.profiles(email);
create index idx_profiles_stripe_customer on public.profiles(stripe_customer_id);
create index idx_profiles_usage_reset on public.profiles(last_usage_reset_date);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Users can update ONLY their own profile row.
-- IMPORTANT: to prevent privilege escalation (tier/subscription changes), we enforce a trigger below.
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Allow admins to manage profiles
create policy "Admins can manage profiles"
  on public.profiles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Prevent non-admins from changing privileged fields
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    if new.tier is distinct from old.tier
      or new.subscription_status is distinct from old.subscription_status
      or new.stripe_customer_id is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
      or new.daily_usage_count is distinct from old.daily_usage_count
      or new.last_usage_reset_date is distinct from old.last_usage_reset_date
      or new.total_analyses_count is distinct from old.total_analyses_count
      or new.is_trial_active is distinct from old.is_trial_active
      or new.trial_ends_at is distinct from old.trial_ends_at
    then
      raise exception 'Not allowed to modify billing/usage/tier fields';
    end if;
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row
  execute function public.prevent_profile_privilege_escalation();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 2) Framework Principles (55 rules)
create table public.framework_principles (
  id serial primary key,
  section_number integer not null check (section_number between 1 and 5),
  section_name text not null,
  principle text not null,
  what_to_avoid text,
  why_matters text not null,
  better_practice text not null,
  example_vague text,
  example_clear text,
  severity_level text not null default 'minor' check (severity_level in ('critical', 'major', 'minor')),
  default_penalty integer not null default 1 check (default_penalty between 1 and 5),
  detection_keywords text[] default '{}',
  tier_required text not null default 'free' check (tier_required in ('free', 'pro', 'enterprise')),
  is_active boolean default true,
  display_order integer,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index idx_principles_section on public.framework_principles(section_number);
create index idx_principles_tier on public.framework_principles(tier_required);
create index idx_principles_active on public.framework_principles(is_active, tier_required);
create index idx_principles_display on public.framework_principles(section_number, display_order);

alter table public.framework_principles enable row level security;

-- Readable by authenticated users; tier gating enforced via join to own profile.
create policy "Principles viewable by authenticated users"
  on public.framework_principles for select
  to authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          tier_required = 'free'
          or (tier_required = 'pro' and p.tier in ('pro','enterprise'))
          or (tier_required = 'enterprise' and p.tier = 'enterprise')
        )
    )
  );

create policy "Only admins can modify principles"
  on public.framework_principles for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- 3) Prompt Analysis Log
create table public.prompt_analysis_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,

  original_prompt text not null,
  prompt_length integer not null,
  ai_platform text check (ai_platform in ('chatgpt', 'claude', 'gemini', 'perplexity', 'other')),

  score integer not null check (score between 1 and 10),
  max_score integer default 10,
  grade text check (grade in ('A', 'B', 'C', 'D', 'F')),
  violations jsonb not null default '[]',

  analysis_method text not null check (analysis_method in ('template', 'llm')),
  llm_model text,
  llm_reasoning text,

  improved_prompt text not null,
  improvement_explanation text,

  processing_time_ms integer,
  llm_tokens_input integer default 0,
  llm_tokens_output integer default 0,
  llm_cost_cents decimal(10, 4) default 0,

  user_rating integer check (user_rating between 1 and 5),
  user_feedback text,
  improvement_accepted boolean,

  created_at timestamp with time zone default now()
);

create index idx_analysis_user on public.prompt_analysis_log(user_id, created_at desc);
create index idx_analysis_date on public.prompt_analysis_log(created_at desc);
create index idx_analysis_score on public.prompt_analysis_log(score);
create index idx_analysis_method on public.prompt_analysis_log(analysis_method);
create index idx_analysis_platform on public.prompt_analysis_log(ai_platform);

alter table public.prompt_analysis_log enable row level security;

create policy "Users view own analyses"
  on public.prompt_analysis_log for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users insert own analyses"
  on public.prompt_analysis_log for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users update own feedback"
  on public.prompt_analysis_log for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins view all analyses"
  on public.prompt_analysis_log for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- 4) Tier Features
create table public.tier_features (
  id serial primary key,
  tier_name text not null check (tier_name in ('free', 'pro', 'enterprise')),
  feature_slug text not null,
  feature_name text not null,
  feature_description text,
  is_enabled boolean default true,
  config jsonb default '{}',

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),

  unique(tier_name, feature_slug)
);

alter table public.tier_features enable row level security;

create policy "Features viewable by all authenticated"
  on public.tier_features for select
  to authenticated
  using (true);

create policy "Only admins can modify tier features"
  on public.tier_features for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Seed tier features
insert into public.tier_features (tier_name, feature_slug, feature_name, feature_description, config) values
  ('free', 'daily_limit', 'Daily Analysis Limit', 'Number of analyses per day', '{"limit": 10}'::jsonb),
  ('free', 'template_analysis', 'Template-Based Analysis', 'Fast rule-based improvements', '{}'::jsonb),
  ('free', 'basic_rules', 'Basic Rules Access', 'Access to 10 core rules', '{"rule_count": 10}'::jsonb),

  ('pro', 'daily_limit', 'Unlimited Analyses', 'No daily limits', '{"limit": null}'::jsonb),
  ('pro', 'llm_analysis', 'AI-Powered Analysis', 'Deep AI analysis', '{}'::jsonb),
  ('pro', 'all_rules', 'Full Framework', 'Access to all 55 rules', '{"rule_count": 55}'::jsonb),
  ('pro', 'realtime_mode', 'Real-Time Analysis', 'Analyze as you type', '{}'::jsonb),
  ('pro', 'priority_support', 'Priority Support', 'Faster response times', '{}'::jsonb),
  ('pro', 'analytics', 'Advanced Analytics', 'Detailed usage insights', '{}'::jsonb);

-- 5) Usage Analytics (admin only)
create table public.usage_analytics (
  id serial primary key,
  date date not null unique,

  total_users integer default 0,
  free_users integer default 0,
  pro_users integer default 0,
  enterprise_users integer default 0,
  new_users integer default 0,
  active_users integer default 0,

  total_analyses integer default 0,
  template_analyses integer default 0,
  llm_analyses integer default 0,
  avg_score decimal(3, 1),

  total_llm_cost_cents decimal(10, 2) default 0,
  avg_cost_per_analysis_cents decimal(10, 4) default 0,

  chatgpt_analyses integer default 0,
  claude_analyses integer default 0,
  gemini_analyses integer default 0,
  other_analyses integer default 0,

  created_at timestamp with time zone default now()
);

create index idx_analytics_date on public.usage_analytics(date desc);

alter table public.usage_analytics enable row level security;

create policy "Admins view analytics"
  on public.usage_analytics for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- 6) Functions for daily usage
create or replace function public.reset_daily_usage()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    daily_usage_count = 0,
    last_usage_reset_date = current_date
  where last_usage_reset_date < current_date;
end;
$$;

create or replace function public.increment_usage(user_uuid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    daily_usage_count = daily_usage_count + 1,
    total_analyses_count = total_analyses_count + 1,
    updated_at = now()
  where id = user_uuid;
end;
$$;

create or replace function public.can_user_analyze(user_uuid uuid)
returns table(can_analyze boolean, reason text, usage_count integer, usage_limit integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  user_tier text;
  user_usage integer;
  daily_limit integer;
begin
  select tier, daily_usage_count
    into user_tier, user_usage
  from public.profiles
  where id = user_uuid;

  if user_tier in ('pro', 'enterprise') then
    return query select true, 'unlimited', user_usage, null::integer;
    return;
  end if;

  select (config->>'limit')::integer
    into daily_limit
  from public.tier_features
  where tier_name = 'free' and feature_slug = 'daily_limit';

  if user_usage < daily_limit then
    return query select true, 'within_limit', user_usage, daily_limit;
  else
    return query select false, 'limit_exceeded', user_usage, daily_limit;
  end if;
end;
$$;

create or replace function public.get_user_tier_info(user_uuid uuid)
returns table(
  tier text,
  features jsonb,
  daily_usage integer,
  total_usage integer,
  subscription_status text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
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
  from public.profiles p
  left join public.tier_features tf
    on tf.tier_name = p.tier and tf.is_enabled = true
  where p.id = user_uuid
  group by p.id, p.tier, p.daily_usage_count, p.total_analyses_count, p.subscription_status;
end;
$$;
