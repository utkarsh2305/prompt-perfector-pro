# ZeroRetry

**Get it right the first time.** Score your AI prompts and fix them before you send.

Works with ChatGPT, Claude, Gemini, and more.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Edge Functions](#edge-functions)
- [Security](#security)
- [Deployment](#deployment)

---

## Overview

ZeroRetry is a SaaS application and browser extension that analyzes AI prompts using a rule-based scoring engine and provides actionable improvements. Users can score prompts for free and use AI-powered rewrites with a credit-based subscription model.

### Value Proposition

- **Instant Scoring**: Get a 0-100 score with letter grade (A-F) based on prompt quality
- **Contextual Suggestions**: See exactly what's missing with slot-filled recommendations
- **AI Rewrites**: One-click prompt improvement using LLM models
- **Multi-Platform**: Works with ChatGPT, Claude, Gemini, and Perplexity

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TypeScript (strict mode) |
| **Styling** | Tailwind CSS, shadcn/ui components |
| **Routing** | React Router v6 |
| **State** | TanStack Query (React Query) |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **Payments** | Stripe (Checkout, Billing Portal, Webhooks) |
| **Analytics** | PostHog |
| **AI Gateway** | Lovable AI Gateway (multi-model: Gemini, GPT, Claude) |

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React SPA)                        │
├─────────────────────────────────────────────────────────────────┤
│  Landing Page │ Dashboard │ Admin Panel │ Auth Pages            │
│       ↓              ↓           ↓            ↓                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              React Query + Custom Hooks                  │   │
│  │  useAnalyzePrompt │ useSubscription │ useAuth │ etc.    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS                       │
├─────────────────────────────────────────────────────────────────┤
│  score-prompt    │ Scores prompts against framework rules       │
│  rewrite-prompt  │ AI-powered prompt improvement                │
│  stripe-webhook  │ Handles payment events                       │
│  admin-*         │ Admin panel operations                       │
│  create-checkout │ Stripe checkout session creation             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (PostgreSQL)                         │
├─────────────────────────────────────────────────────────────────┤
│  profiles          │ User data and tier info                    │
│  framework_rules   │ Scoring rules with weights                 │
│  prompt_analysis_log │ Analysis history                         │
│  user_subscriptions │ Stripe subscription mapping               │
│  rewrite_credits   │ Credit balances                            │
│  rewrite_transactions │ Credit usage history                    │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
src/
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── marketing/             # Landing page components
│   ├── prompt-analyzer/       # Core analyzer UI
│   ├── subscription/          # Billing & credits UI
│   └── admin/                 # Admin panel components
├── contexts/
│   ├── AuthContext.tsx        # Authentication state
│   └── AnalyticsContext.tsx   # PostHog tracking
├── hooks/
│   ├── useAnalyzePrompt.ts    # Score + rewrite logic
│   ├── useSubscription.ts     # Subscription management
│   └── useAuth.ts             # Auth helpers
├── pages/
│   ├── dashboard/             # User dashboard routes
│   └── admin/                 # Admin panel routes
└── lib/
    ├── api.ts                 # API utilities
    └── analytics.ts           # PostHog wrapper
```

### Scoring Engine Flow

```
User Input → score-prompt Edge Function
                    │
                    ▼
           ┌───────────────────┐
           │  Parse Prompt     │
           │  Components       │
           │  (action, tone,   │
           │   audience, etc.) │
           └───────────────────┘
                    │
                    ▼
           ┌───────────────────┐
           │  Check Against    │
           │  Framework Rules  │
           │  (keywords +      │
           │   regex patterns) │
           └───────────────────┘
                    │
                    ▼
           ┌───────────────────┐
           │  Calculate Score  │
           │  (weighted sum)   │
           │  → Grade (A-F)    │
           └───────────────────┘
                    │
                    ▼
           ┌───────────────────┐
           │  Generate         │
           │  Contextual       │
           │  Suggestions      │
           └───────────────────┘
                    │
                    ▼
           Log to DB + Return Response
```

### Rewrite Engine Flow

```
Score Result → rewrite-prompt Edge Function
                    │
                    ▼
           ┌───────────────────┐
           │  Validate Credits │
           │  (check_rewrite_  │
           │   credits RPC)    │
           └───────────────────┘
                    │
                    ▼
           ┌───────────────────┐
           │  Build System     │
           │  Prompt from      │
           │  Failed Rules     │
           └───────────────────┘
                    │
                    ▼
           ┌───────────────────┐
           │  Call Lovable     │
           │  AI Gateway       │
           │  (Gemini/GPT/     │
           │   Claude)         │
           └───────────────────┘
                    │
                    ▼
           ┌───────────────────┐
           │  Re-score New     │
           │  Prompt           │
           └───────────────────┘
                    │
                    ▼
           Consume Credit + Log + Return
```

---

## Features

### Core Features

| Feature | Free Tier | Pro Tier | Unlimited |
|---------|-----------|----------|-----------|
| Prompt Scoring | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |
| AI Rewrites | 10/month | 200+/month | Unlimited |
| Credit Rollover | ❌ | ✅ (up to 200) | N/A |
| All Platforms | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

### Grading Scale

| Grade | Score Range | Label |
|-------|-------------|-------|
| A | 90-100 | Excellent |
| B+ | 80-89 | Very Good |
| B | 70-79 | Good |
| C | 60-69 | Fair |
| D | 50-59 | Needs Work |
| F | 0-49 | Poor |

### Admin Panel

- **User Management**: Search, filter, view user details
- **Framework Rules**: CRUD operations, CSV/Excel import
- **Analytics**: Users, engagement, quality, revenue, technical metrics
- **Analysis Logs**: View all prompt analyses with filters

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun
- Supabase project

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd zeroretry

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_POSTHOG_KEY=your_posthog_key (optional)
VITE_POSTHOG_HOST=https://app.posthog.com (optional)
```

### Edge Function Secrets

Configure these in Supabase Dashboard → Settings → Edge Functions:

| Secret | Purpose |
|--------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin ops |
| `STRIPE_SECRET_KEY` | Stripe API key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `LOVABLE_API_KEY` | Lovable AI Gateway key |
| `ADMIN_EMAILS` | Comma-separated admin emails |

---

## Project Structure

```
zeroretry/
├── public/                    # Static assets
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── assets/               # Images, SVGs
│   ├── components/           # React components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom hooks
│   ├── lib/                  # Utilities
│   ├── pages/                # Route pages
│   ├── types/                # TypeScript types
│   └── integrations/         # Third-party integrations
├── supabase/
│   ├── functions/            # Edge Functions
│   │   ├── _shared/          # Shared utilities
│   │   ├── score-prompt/
│   │   ├── rewrite-prompt/
│   │   ├── stripe-webhook/
│   │   └── admin-*/
│   └── migrations/           # Database migrations
└── docs/                     # Documentation
```

---

## Database Schema

### Core Tables

```sql
-- User profiles (extends auth.users)
profiles (
  id UUID PRIMARY KEY,          -- References auth.users
  email TEXT,
  full_name TEXT,
  tier app_tier,                -- 'free' | 'pro' | 'unlimited'
  subscription_status TEXT,
  stripe_customer_id TEXT,
  total_analyses_count INTEGER,
  created_at TIMESTAMPTZ
)

-- Framework scoring rules
framework_rules (
  id SERIAL PRIMARY KEY,
  rule_name TEXT,
  category_id INTEGER,
  weight NUMERIC,               -- Rule importance (0.5-2.0)
  detection_keywords TEXT[],
  detection_patterns TEXT[],    -- Regex patterns
  suggestion TEXT,
  is_active BOOLEAN
)

-- Analysis history
prompt_analysis_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  original_prompt TEXT,
  score NUMERIC,
  grade letter_grade,
  improved_prompt TEXT,
  analysis_method TEXT,         -- 'template' | 'llm'
  llm_cost_cents INTEGER,
  created_at TIMESTAMPTZ
)

-- Subscription tracking
user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID,
  tier app_tier,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  status TEXT
)

-- Credit management
rewrite_credits (
  id UUID PRIMARY KEY,
  user_id UUID,
  credits_remaining INTEGER,
  credits_used_this_period INTEGER,
  rollover_credits INTEGER,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
)
```

### Key RPC Functions

| Function | Purpose |
|----------|---------|
| `check_rewrite_credits` | Validates user has credits before rewrite |
| `consume_rewrite_credit` | Atomically decrements credit balance |
| `get_user_tier_info` | Returns tier, credits, subscription status |
| `check_rate_limit` | Enforces per-user rate limits |
| `change_user_tier` | Handles tier upgrades/downgrades |

---

## Edge Functions

### Public Functions

| Function | Method | Rate Limit | Description |
|----------|--------|------------|-------------|
| `score-prompt` | POST | 30/min | Scores prompt against rules |
| `rewrite-prompt` | POST | 10/min | AI-powered prompt rewrite |
| `create-checkout-session` | POST | 5/min | Creates Stripe checkout |
| `create-billing-portal` | POST | 5/min | Stripe billing portal |

### Admin Functions

| Function | Method | Rate Limit | Description |
|----------|--------|------------|-------------|
| `admin-check` | GET | 20/min | Validates admin access |
| `admin-users` | POST | 20/min | User management |
| `admin-analyses` | POST | 20/min | Analysis logs |
| `admin-analytics` | POST | 20/min | Dashboard analytics |
| `admin-framework` | POST | 20/min | Rule management |

### Webhook Functions

| Function | Description |
|----------|-------------|
| `stripe-webhook` | Handles Stripe events (checkout, subscription changes) |

---

## Security

### Authentication

- Supabase Auth with email/password
- Session-based authentication
- Protected routes with automatic redirects

### Authorization

- **Row Level Security (RLS)** on all tables
- Users can only access their own data
- Admin access requires both `admin` role AND email allowlist

### Rate Limiting

Database-backed rate limiting per endpoint:

| Endpoint | Limit |
|----------|-------|
| Auth | 5/min |
| Scoring | 30/min |
| Rewrites | 10/min |
| Admin | 20/min |

### Data Protection

- SQL injection prevention via parameterized queries
- Input sanitization for search queries
- HTTPS enforced
- Secrets stored in environment variables

---

## Deployment

### Frontend (Vercel/Netlify)

1. Connect repository
2. Set environment variables
3. Deploy

### Supabase Edge Functions

Edge functions are automatically deployed when code changes.

Manual deployment:
```bash
npx supabase functions deploy
```

### Database Migrations

Migrations are managed through Supabase Dashboard or CLI:
```bash
npx supabase db push
```

---

## Development

### Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build

# Testing
npm test             # Run tests
npm run test:coverage # Run with coverage

# Linting
npm run lint         # ESLint check
```

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Tailwind CSS with semantic tokens
- shadcn/ui component library

---

## License

Proprietary - All rights reserved.

## Support

For support, email support@zeroretry.com

---

Built with ❤️ using [Lovable](https://lovable.dev)
