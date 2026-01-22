-- Fix migration: Postgres does not support CREATE POLICY IF NOT EXISTS
-- We'll DROP POLICY IF EXISTS first, then CREATE POLICY.

begin;

create extension if not exists pgcrypto;

-- -------------------------------------------------------------------
-- Shared updated_at trigger
-- -------------------------------------------------------------------
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -------------------------------------------------------------------
-- Roles: enum + user_roles table + has_role() helper
-- -------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role' and typnamespace = 'public'::regnamespace) then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_role on public.user_roles(role);

alter table public.user_roles enable row level security;

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

drop policy if exists "Users can view own roles" on public.user_roles;
create policy "Users can view own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can manage roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------------------
-- Profiles (tier/usage)
-- -------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_tier' and typnamespace = 'public'::regnamespace) then
    create type public.app_tier as enum ('free', 'pro', 'enterprise');
  end if;

  if not exists (select 1 from pg_type where typname = 'subscription_status' and typnamespace = 'public'::regnamespace) then
    create type public.subscription_status as enum ('active', 'inactive', 'trialing', 'canceled', 'past_due');
  end if;
end $$;

create table if not exists public.profiles (
  id uuid primary key,
  email text unique,
  full_name text,

  tier public.app_tier not null default 'free',
  subscription_status public.subscription_status not null default 'inactive',
  stripe_customer_id text unique,
  stripe_subscription_id text,

  daily_usage_count integer not null default 0,
  last_usage_reset_date date not null default current_date,
  total_analyses_count integer not null default 0,

  trial_ends_at timestamptz,
  is_trial_active boolean not null default false,

  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_tier on public.profiles(tier);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_stripe_customer on public.profiles(stripe_customer_id);
create index if not exists idx_profiles_usage_reset on public.profiles(last_usage_reset_date);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Admins can manage all profiles" on public.profiles;
create policy "Admins can manage all profiles"
on public.profiles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.profiles_protect_tier_fields()
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
      or new.trial_ends_at is distinct from old.trial_ends_at
      or new.is_trial_active is distinct from old.is_trial_active
    then
      raise exception 'Not allowed to change billing/tier fields';
    end if;
  end if;
  return new;
end;
$$;

-- triggers (idempotent)
do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_profiles_protect_tier_fields') then
    create trigger trg_profiles_protect_tier_fields
    before update on public.profiles
    for each row
    execute function public.profiles_protect_tier_fields();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_profiles_updated_at') then
    create trigger trg_profiles_updated_at
    before update on public.profiles
    for each row
    execute function public.update_updated_at_column();
  end if;
end $$;

create or replace function public.get_user_tier(_user_id uuid)
returns public.app_tier
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select tier from public.profiles where id = _user_id), 'free'::public.app_tier)
$$;

-- -------------------------------------------------------------------
-- Framework principles
-- -------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'severity_level' and typnamespace = 'public'::regnamespace) then
    create type public.severity_level as enum ('critical', 'major', 'minor');
  end if;
end $$;

create table if not exists public.framework_principles (
  id bigserial primary key,
  section_number integer not null,
  section_name text not null,
  principle text not null,
  what_to_avoid text,
  why_matters text not null,
  better_practice text not null,
  example_vague text,
  example_clear text,
  severity_level public.severity_level not null default 'minor',
  default_penalty integer not null default 1,
  detection_keywords text[] not null default '{}'::text[],
  tier_required public.app_tier not null default 'free',
  is_active boolean not null default true,
  display_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_principles_section on public.framework_principles(section_number);
create index if not exists idx_principles_tier on public.framework_principles(tier_required);
create index if not exists idx_principles_active on public.framework_principles(is_active, tier_required);
create index if not exists idx_principles_display on public.framework_principles(section_number, display_order);

alter table public.framework_principles enable row level security;

drop policy if exists "Principles viewable by tier" on public.framework_principles;
create policy "Principles viewable by tier"
on public.framework_principles
for select
to authenticated
using (
  is_active = true
  and (
    tier_required = 'free'::public.app_tier
    or (
      public.get_user_tier(auth.uid()) = 'pro'::public.app_tier
      and tier_required in ('free'::public.app_tier, 'pro'::public.app_tier)
    )
    or (public.get_user_tier(auth.uid()) = 'enterprise'::public.app_tier)
  )
);

drop policy if exists "Admins manage principles" on public.framework_principles;
create policy "Admins manage principles"
on public.framework_principles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- trigger updated_at

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_framework_principles_updated_at') then
    create trigger trg_framework_principles_updated_at
    before update on public.framework_principles
    for each row
    execute function public.update_updated_at_column();
  end if;
end $$;

-- -------------------------------------------------------------------
-- Prompt analysis log
-- -------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'ai_platform' and typnamespace = 'public'::regnamespace) then
    create type public.ai_platform as enum ('chatgpt', 'claude', 'gemini', 'perplexity', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'analysis_method' and typnamespace = 'public'::regnamespace) then
    create type public.analysis_method as enum ('template', 'llm');
  end if;
  if not exists (select 1 from pg_type where typname = 'letter_grade' and typnamespace = 'public'::regnamespace) then
    create type public.letter_grade as enum ('A', 'B', 'C', 'D', 'F');
  end if;
end $$;

create table if not exists public.prompt_analysis_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  original_prompt text not null,
  prompt_length integer not null,
  ai_platform public.ai_platform,
  score integer not null,
  max_score integer not null default 10,
  grade public.letter_grade,
  violations jsonb not null default '[]'::jsonb,
  analysis_method public.analysis_method not null,
  llm_model text,
  llm_reasoning text,
  improved_prompt text not null,
  improvement_explanation text,
  processing_time_ms integer,
  llm_tokens_input integer not null default 0,
  llm_tokens_output integer not null default 0,
  llm_cost_cents numeric(10,4) not null default 0,
  user_rating integer,
  user_feedback text,
  improvement_accepted boolean,
  created_at timestamptz not null default now()
);

create index if not exists idx_analysis_user on public.prompt_analysis_log(user_id, created_at desc);
create index if not exists idx_analysis_date on public.prompt_analysis_log(created_at desc);
create index if not exists idx_analysis_score on public.prompt_analysis_log(score);
create index if not exists idx_analysis_method on public.prompt_analysis_log(analysis_method);
create index if not exists idx_analysis_platform on public.prompt_analysis_log(ai_platform);

alter table public.prompt_analysis_log enable row level security;

drop policy if exists "Users view own analyses" on public.prompt_analysis_log;
create policy "Users view own analyses"
on public.prompt_analysis_log
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users insert own analyses" on public.prompt_analysis_log;
create policy "Users insert own analyses"
on public.prompt_analysis_log
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users update own analysis feedback" on public.prompt_analysis_log;
create policy "Users update own analysis feedback"
on public.prompt_analysis_log
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Admins view all analyses" on public.prompt_analysis_log;
create policy "Admins view all analyses"
on public.prompt_analysis_log
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------------------
-- Tier features
-- -------------------------------------------------------------------
create table if not exists public.tier_features (
  id bigserial primary key,
  tier_name public.app_tier not null,
  feature_slug text not null,
  feature_name text not null,
  feature_description text,
  is_enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tier_name, feature_slug)
);

create index if not exists idx_tier_features_tier on public.tier_features(tier_name);
create index if not exists idx_tier_features_slug on public.tier_features(feature_slug);

alter table public.tier_features enable row level security;

drop policy if exists "Features viewable by authenticated" on public.tier_features;
create policy "Features viewable by authenticated"
on public.tier_features
for select
to authenticated
using (true);

drop policy if exists "Admins manage features" on public.tier_features;
create policy "Admins manage features"
on public.tier_features
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- trigger updated_at

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_tier_features_updated_at') then
    create trigger trg_tier_features_updated_at
    before update on public.tier_features
    for each row
    execute function public.update_updated_at_column();
  end if;
end $$;

-- -------------------------------------------------------------------
-- Usage analytics
-- -------------------------------------------------------------------
create table if not exists public.usage_analytics (
  id bigserial primary key,
  date date not null unique,
  total_users integer not null default 0,
  free_users integer not null default 0,
  pro_users integer not null default 0,
  enterprise_users integer not null default 0,
  new_users integer not null default 0,
  active_users integer not null default 0,
  total_analyses integer not null default 0,
  template_analyses integer not null default 0,
  llm_analyses integer not null default 0,
  avg_score numeric(3,1),
  total_llm_cost_cents numeric(10,2) not null default 0,
  avg_cost_per_analysis_cents numeric(10,4) not null default 0,
  chatgpt_analyses integer not null default 0,
  claude_analyses integer not null default 0,
  gemini_analyses integer not null default 0,
  other_analyses integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_analytics_date on public.usage_analytics(date desc);

alter table public.usage_analytics enable row level security;

drop policy if exists "Admins view analytics" on public.usage_analytics;
create policy "Admins view analytics"
on public.usage_analytics
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- -------------------------------------------------------------------
-- Usage / tier helper functions
-- -------------------------------------------------------------------
create or replace function public.reset_daily_usage()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set daily_usage_count = 0,
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
  set daily_usage_count = daily_usage_count + 1,
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
  user_tier public.app_tier;
  user_usage integer;
  daily_limit integer;
begin
  select tier, daily_usage_count
  into user_tier, user_usage
  from public.profiles
  where id = user_uuid;

  if user_tier in ('pro'::public.app_tier, 'enterprise'::public.app_tier) then
    return query select true, 'unlimited', coalesce(user_usage,0), null::integer;
    return;
  end if;

  select nullif(config->>'limit','')::integer
  into daily_limit
  from public.tier_features
  where tier_name = 'free'::public.app_tier
    and feature_slug = 'daily_limit'
    and is_enabled = true
  limit 1;

  if daily_limit is null then
    daily_limit := 10;
  end if;

  if coalesce(user_usage,0) < daily_limit then
    return query select true, 'within_limit', coalesce(user_usage,0), daily_limit;
  else
    return query select false, 'limit_exceeded', coalesce(user_usage,0), daily_limit;
  end if;
end;
$$;

create or replace function public.get_user_tier_info(user_uuid uuid)
returns table(
  tier public.app_tier,
  features jsonb,
  daily_usage integer,
  total_usage integer,
  subscription_status public.subscription_status
)
language sql
stable
security definer
set search_path = public
as $$
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
    on tf.tier_name = p.tier
   and tf.is_enabled = true
  where p.id = user_uuid
  group by p.id, p.tier, p.daily_usage_count, p.total_analyses_count, p.subscription_status;
$$;

commit;