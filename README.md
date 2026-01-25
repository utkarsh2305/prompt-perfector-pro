# ZeroRetry

**Get it right the first time.** Score your AI prompts and fix them before you send.

Works with ChatGPT, Claude, Gemini, and more.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Pricing & Subscription](#pricing--subscription)
- [User Flows](#user-flows)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Edge Functions](#edge-functions)
- [Security](#security)
- [Deployment](#deployment)
- [Limitations](#limitations)

---

## Overview

ZeroRetry is a SaaS application and browser extension that analyzes AI prompts using a rule-based scoring engine and provides actionable improvements. Users can score prompts for free and use AI-powered rewrites with a credit-based subscription model.

### Value Proposition

- **Instant Scoring**: Get a 0-100 score with letter grade (A-F) based on prompt quality
- **Contextual Suggestions**: See exactly what's missing with slot-filled recommendations
- **AI Rewrites**: One-click prompt improvement using LLM models
- **Multi-Platform**: Works with ChatGPT, Claude, Gemini, and Perplexity

### Target Users

- **Developers**: Writing prompts for code generation, debugging, documentation
- **Marketers**: Crafting prompts for content creation, copywriting, campaigns
- **Business Professionals**: Creating prompts for reports, analysis, communication
- **Power Users**: Anyone using AI tools regularly who wants better results

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
| **Browser Extension** | Chrome Extension (content scripts) |

### Key Dependencies

```json
{
  "react": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "@tanstack/react-query": "^5.83.0",
  "@supabase/supabase-js": "^2.91.0",
  "tailwindcss": "^3.x",
  "recharts": "^2.15.4",
  "lucide-react": "^0.462.0",
  "zod": "^3.25.76"
}
```

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

### Scoring Engine Flow

```
User Input → score-prompt Edge Function
                    │
                    ▼
           ┌───────────────────┐
           │  Fetch All Active │
           │  Framework Rules  │
           │  from Database    │
           └───────────────────┘
                    │
                    ▼
           ┌───────────────────┐
           │  Evaluate Each    │
           │  Rule Against     │
           │  Prompt (regex +  │
           │  keyword match)   │
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
           │  Generate AI      │
           │  Suggested Prompt │
           │  (Lovable Gateway)│
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

- **User Management**: Search, filter, view user details, change tiers
- **Framework Rules**: CRUD operations, CSV/Excel import
- **Analytics**: Users, engagement, quality, revenue, technical metrics
- **Analysis Logs**: View all prompt analyses with filters
- **Uninstall Feedback**: Track why users uninstall (pie charts, comments, filters)

---

## Pricing & Subscription

### Tier Structure

| Tier | Monthly Price | Annual Price | Credits |
|------|---------------|--------------|---------|
| **Free** | $0 | $0 | 10/month |
| **Pro** | $3-15/mo | ~17% savings | 200-1000/month |
| **Unlimited** | $19/mo | ~17% savings | Unlimited |

### 7-Day Free Trial

All new users receive a **7-day Pro trial** with:
- 200 AI rewrite credits (capped at 200)
- Full Pro features access
- No credit card required

**Trial Rules:**
- Automatically expires after 7 days
- User downgrades to Free tier (10 credits/month)
- Can upgrade to paid Pro/Unlimited during trial
- Upgrading ends trial immediately and starts paid subscription

### Credit Packages (Pro Tier)

| Package | Monthly | Annual | Cost/Rewrite |
|---------|---------|--------|--------------|
| 200 credits | $3/mo | $30/yr | $0.015 |
| 500 credits | $6/mo | $60/yr | $0.012 |
| 1000 credits | $10/mo | $100/yr | $0.010 |

### Credit Rollover

- Pro users can roll over up to **200 unused credits** to next month
- Rollover credits are used before new credits
- No rollover for Free or Unlimited tiers

---

## User Flows

### 1. New User Journey

```
Landing Page → Sign Up → Email Confirmation → Dashboard (Trial Active)
     │                                              │
     └── View Pricing → Start Trial ──────────────┘
```

### 2. Prompt Analysis Flow

```
User enters prompt in analyzer
         │
         ▼
┌─────────────────────┐
│ Click "Analyze"     │
│ (score-prompt API)  │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ View Score + Grade  │
│ + Suggested Prompt  │
│ + Improvements List │
└─────────────────────┘
         │
         ├── Copy suggested prompt
         │
         └── Click "Rewrite" (if credits available)
                     │
                     ▼
             ┌─────────────────────┐
             │ AI generates new    │
             │ prompt, re-scores   │
             └─────────────────────┘
```

### 3. Subscription Upgrade Flow

```
Dashboard → Settings/Pricing → Select Tier
         │
         ├── Pro: Select credit package → Stripe Checkout
         │
         └── Unlimited: Stripe Checkout
                     │
                     ▼
             ┌─────────────────────┐
             │ Stripe Webhook      │
             │ Updates DB          │
             └─────────────────────┘
                     │
                     ▼
             Credits allocated, tier active
```

### 4. Admin User Management

```
Admin Dashboard → Users → Search/Filter
         │
         └── Click User Row → User Detail Modal
                     │
                     ├── View user info
                     │
                     └── Change Tier (dropdown)
                              │
                              ├── Select tier
                              ├── Select package (if Pro)
                              ├── Optional reason
                              └── Confirm → Tier changed
```

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
│   │   ├── ui/               # shadcn/ui base components
│   │   ├── marketing/        # Landing page components
│   │   ├── prompt-analyzer/  # Core analyzer UI
│   │   ├── subscription/     # Billing & credits UI
│   │   └── admin/            # Admin panel components
│   ├── contexts/             # React contexts
│   │   ├── AuthContext.tsx   # Authentication state
│   │   └── AnalyticsContext.tsx
│   ├── hooks/                # Custom hooks
│   │   ├── useAnalyzePrompt.ts
│   │   ├── use-subscription.ts
│   │   ├── use-trial.ts
│   │   └── useAuth.ts
│   ├── pages/                # Route pages
│   │   ├── dashboard/        # User dashboard routes
│   │   └── admin/            # Admin panel routes
│   ├── lib/                  # Utilities
│   └── types/                # TypeScript types
├── supabase/
│   ├── functions/            # Edge Functions
│   │   ├── _shared/          # Shared utilities
│   │   ├── score-prompt/
│   │   ├── rewrite-prompt/
│   │   ├── stripe-webhook/
│   │   ├── admin-*/
│   │   └── admin-change-tier/
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
  tier app_tier,                -- 'free' | 'pro' | 'enterprise'
  subscription_status TEXT,     -- 'active' | 'trialing' | 'canceled' | etc.
  stripe_customer_id TEXT,
  is_trial_active BOOLEAN,
  trial_ends_at TIMESTAMPTZ,
  total_analyses_count INTEGER,
  daily_usage_count INTEGER,
  created_at TIMESTAMPTZ
)

-- Framework scoring rules
framework_rules (
  id UUID PRIMARY KEY,
  rule_number INTEGER,
  rule_name TEXT,
  rule_description TEXT,
  category_id UUID,             -- References rule_categories
  weight NUMERIC,               -- Rule importance (default 1)
  tier_required TEXT,           -- 'free' | 'pro'
  detection_keywords TEXT[],
  detection_patterns TEXT[],    -- Regex patterns
  improvement_template TEXT,
  positive_examples TEXT[],
  negative_examples TEXT[],
  is_active BOOLEAN
)

-- Rule categories
rule_categories (
  id UUID PRIMARY KEY,
  name TEXT,                    -- 'Clarity', 'Persona', 'Format', etc.
  description TEXT,
  sort_order INTEGER,
  color TEXT,
  icon TEXT
)

-- Analysis history
prompt_analysis_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  original_prompt TEXT,
  improved_prompt TEXT,
  score NUMERIC,
  grade letter_grade,           -- 'A' | 'B' | 'C' | 'D' | 'F'
  analysis_method TEXT,         -- 'template' | 'llm'
  ai_platform TEXT,             -- 'chatgpt' | 'claude' | 'gemini'
  llm_cost_cents INTEGER,
  processing_time_ms INTEGER,
  violations JSONB,
  created_at TIMESTAMPTZ
)

-- Subscription tracking
user_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID,
  tier_name TEXT,               -- 'free' | 'pro' | 'unlimited'
  status TEXT,                  -- 'active' | 'trialing' | 'canceled'
  billing_cycle TEXT,           -- 'monthly' | 'yearly'
  credit_package_id UUID,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ
)

-- Credit management
rewrite_credits (
  id UUID PRIMARY KEY,
  user_id UUID,
  credits_remaining INTEGER,
  credits_used_this_period INTEGER,
  rollover_credits INTEGER,
  last_reset_at TIMESTAMPTZ
)

-- Credit transactions (audit log)
rewrite_transactions (
  id UUID PRIMARY KEY,
  user_id UUID,
  transaction_type TEXT,        -- 'usage' | 'tier_change' | 'rollover' | 'reset'
  credits_amount INTEGER,
  balance_after INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ
)

-- Credit packages (Pro tier options)
credit_packages (
  id UUID PRIMARY KEY,
  credits_amount INTEGER,
  monthly_price NUMERIC,
  yearly_price NUMERIC,
  cost_per_rewrite NUMERIC,
  is_default BOOLEAN,
  is_active BOOLEAN,
  sort_order INTEGER
)

-- User roles (separate from profiles for security)
user_roles (
  id UUID PRIMARY KEY,
  user_id UUID,
  role app_role                 -- 'admin' | 'moderator' | 'user'
)

-- Uninstall feedback
uninstall_feedback (
  id UUID PRIMARY KEY,
  user_id UUID,
  reason TEXT,
  additional_comments TEXT,
  user_tier TEXT,
  days_used INTEGER,
  browser TEXT,
  created_at TIMESTAMPTZ
)
```

### Key RPC Functions

| Function | Purpose |
|----------|---------|
| `check_rewrite_credits` | Validates user has credits before rewrite |
| `consume_rewrite_credit` | Atomically decrements credit balance |
| `get_user_subscription_info` | Returns tier, credits, subscription status |
| `get_trial_status` | Returns trial state and days remaining |
| `check_and_expire_trial` | Expires trial and downgrades to free tier |
| `change_user_tier` | Handles tier upgrades/downgrades (admin) |
| `check_rate_limit` | Enforces per-user rate limits |
| `has_role` | Security definer function for role checks |

---

## Edge Functions

### Public Functions

| Function | Method | Rate Limit | Description |
|----------|--------|------------|-------------|
| `score-prompt` | POST | 30/min | Scores prompt against all active rules |
| `rewrite-prompt` | POST | 10/min | AI-powered prompt rewrite |
| `create-checkout-session` | POST | 5/min | Creates Stripe checkout |
| `create-billing-portal` | POST | 5/min | Stripe billing portal |
| `get-extension-data` | POST | 30/min | Browser extension data fetch |

### Admin Functions

| Function | Method | Rate Limit | Description |
|----------|--------|------------|-------------|
| `admin-check` | POST | 20/min | Validates admin access (role + allowlist) |
| `admin-users` | POST | 20/min | User management with search/filter |
| `admin-change-tier` | POST | 20/min | Change user tier (admin only) |
| `admin-analyses` | POST | 20/min | Analysis logs with filters |
| `admin-analytics` | POST | 20/min | Dashboard analytics |
| `admin-framework` | POST | 20/min | Rule management |
| `admin-overview` | POST | 20/min | Dashboard overview stats |

### Webhook Functions

| Function | Description |
|----------|-------------|
| `stripe-webhook` | Handles Stripe events (checkout.session.completed, customer.subscription.updated) |

---

## Security

### Authentication

- Supabase Auth with email/password
- Session-based authentication with auto-refresh
- Protected routes with automatic redirects
- Password reset flow with email verification

### Authorization

- **Row Level Security (RLS)** on all tables
- Users can only access their own data
- Admin access requires BOTH:
  - `admin` role in `user_roles` table
  - Email in `ADMIN_EMAILS` environment secret

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
- Input sanitization with `sanitizeSearchInput()` for ILIKE queries
- HTTPS enforced
- Secrets stored in environment variables (never in code)
- No sensitive data exposed in client-side code

---

## Deployment

### Frontend (Lovable/Vercel/Netlify)

1. Connect repository
2. Set environment variables
3. Deploy

### Supabase Edge Functions

Edge functions are automatically deployed when code changes in Lovable.

Manual deployment:
```bash
npx supabase functions deploy
```

### Database Migrations

Migrations are managed through Supabase Dashboard or Lovable migration tool.

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
- Tailwind CSS with semantic tokens (from index.css)
- shadcn/ui component library
- Mobile-first responsive design

---

## Limitations

### Technical Limitations

1. **No Server-Side Rendering**: React SPA only (no Next.js/SSR)
2. **No Native Mobile**: Web and browser extension only
3. **Edge Function Timeout**: 30 second limit per request
4. **File Size Limit**: Prompts capped at 5000 characters
5. **Rate Limits**: Enforced per user (see Security section)

### Feature Limitations

1. **Scoring**: Rule-based only; AI scoring available but not primary
2. **Platforms**: ChatGPT, Claude, Gemini, Perplexity only
3. **Rollover Cap**: Maximum 200 credits can roll over (Pro tier)
4. **Trial Credits**: Capped at 200 during 7-day trial
5. **Admin**: No bulk operations (planned)

### Browser Extension

1. **Chrome Only**: Currently Chrome/Chromium-based browsers
2. **Injection Limits**: May not work on certain secured pages
3. **No Offline Mode**: Requires internet connection

---

## Roadmap

### Planned Features

- [ ] Bulk admin tier changes
- [ ] Email notifications for trial expiration
- [ ] Firefox extension
- [ ] Team/Organization plans
- [ ] API access for developers
- [ ] Custom rule creation (user-defined)
- [ ] Integration with more AI platforms

---

## License

Proprietary. All rights reserved.

---

## Support

- **Documentation**: This README and `/docs` folder
- **Issues**: GitHub Issues or in-app feedback
- **Email**: support@zeroretry.com (planned)
