# ZeroRetry

**Privacy-first Chrome extensions that help you work smarter and stay focused.**

ZeroRetry is a suite of browser extensions — each one solves a specific problem while keeping all your data local. No accounts required, no cloud sync, no tracking.

---

## Extensions

### ZeroRetry Index

**Stop scrolling long AI chats.** Index questions, bookmark insights, and continue across AI tools instantly.

| | |
|---|---|
| **Platforms** | ChatGPT, Claude, Gemini, Grok, Perplexity, Copilot |
| **Key Features** | Conversation Index, Search & Filter, Bookmarks, Cross-AI Handoff, Projects, Tags, Milestones, Dark Mode |
| **Privacy** | 100% local. No data collection, no analytics, no tracking. |
| **Chrome Web Store** | [Install ZeroRetry Index](https://chrome.google.com/webstore) |

### Zero Distract

**Reclaim your focus with intelligent nudges.** Track distraction patterns, get smart nudges, and replace social media feeds with your priorities.

| | |
|---|---|
| **Sites** | YouTube, Reddit, Twitter/X, Instagram, Facebook, TikTok (configurable) |
| **Key Features** | Focus Mode, Time Tracking, Smart Nudges, Feed Replacement, Analytics Dashboard, Pattern Detection |
| **Privacy** | Local only. Tracks domain names and time spent. No identity or content tracked. |
| **Chrome Web Store** | [Install Zero Distract](https://chrome.google.com/webstore) |

---

## Website

This repository contains the ZeroRetry marketing website — a React SPA that serves as the landing page, extension showcase, and admin dashboard.

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TypeScript (strict mode) |
| **Styling** | Tailwind CSS, shadcn/ui components |
| **Routing** | React Router v6 |
| **State** | TanStack Query (React Query) |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **Payments** | Stripe (Checkout, Billing Portal, Webhooks) |
| **Analytics** | PostHog |

### Pages

| Route | Description |
|-------|-------------|
| `/` | Brand landing page with extension cards |
| `/extensions/zeroretry-index` | ZeroRetry Index detail page |
| `/extensions/zero-distract` | Zero Distract detail page |
| `/pricing` | Subscription tiers (Free / Pro / Unlimited) |
| `/privacy` | Privacy Policy (covers both extensions) |
| `/terms` | Terms of Use (covers both extensions) |
| `/support` | Contact and support info |
| `/dashboard/*` | User dashboard (protected) |
| `/admin/*` | Admin panel (protected, admin role required) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project

### Installation

```bash
git clone <repository-url>
cd zeroretry
npm install
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_POSTHOG_KEY=your_posthog_key (optional)
VITE_POSTHOG_HOST=https://app.posthog.com (optional)
```

### Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
```

---

## Project Structure

```
src/
├── assets/                    # SVGs, images
├── data/
│   └── extensions.ts          # Extension metadata registry
├── components/
│   ├── ui/                    # shadcn/ui base components
│   ├── marketing/             # SiteHeader, SiteFooter
│   ├── prompt-analyzer/       # Core analyzer UI
│   ├── subscription/          # Billing & credits UI
│   └── admin/                 # Admin panel components
├── contexts/                  # AuthContext, AnalyticsContext
├── hooks/                     # Custom React hooks
├── pages/
│   ├── extensions/            # Extension detail pages
│   │   ├── ExtensionPage.tsx  # Shared extension page layout
│   │   ├── ZeroRetryIndexPage.tsx
│   │   └── ZeroDistractPage.tsx
│   ├── dashboard/             # User dashboard routes
│   ├── admin/                 # Admin panel routes
│   ├── Landing.tsx            # Brand landing page
│   ├── Privacy.tsx            # Privacy Policy
│   ├── Terms.tsx              # Terms of Use
│   └── Support.tsx            # Support page
├── lib/                       # Utilities
├── types/                     # TypeScript types
└── App.tsx                    # Router setup
```

---

## Architecture

### High-Level

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT (React SPA)                      │
├──────────────────────────────────────────────────────────┤
│  Landing │ Extension Pages │ Dashboard │ Admin │ Auth     │
│                          ↕                                │
│            React Query + Custom Hooks                     │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                 SUPABASE EDGE FUNCTIONS                    │
├──────────────────────────────────────────────────────────┤
│  score-prompt  │ rewrite-prompt │ stripe-webhook │ admin-*│
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                  SUPABASE (PostgreSQL)                     │
├──────────────────────────────────────────────────────────┤
│  profiles │ framework_rules │ prompt_analysis_log         │
│  user_subscriptions │ rewrite_credits │ credit_packages   │
└──────────────────────────────────────────────────────────┘
```

### Extension Data Model

Both extensions use `src/data/extensions.ts` as a centralized registry. Adding a new extension requires:
1. Add entry to `extensions` array in `src/data/extensions.ts`
2. Create a page in `src/pages/extensions/`
3. Add route in `src/App.tsx`
4. Update Privacy and Terms pages if data handling differs

---

## Pricing & Subscription

| Tier | Monthly | Credits |
|------|---------|---------|
| **Free** | $0 | 10/month |
| **Pro** | $3-15/mo | 200-1000/month |
| **Unlimited** | $19/mo | Unlimited |

New users receive a **7-day Pro trial** with 200 credits (no credit card required).

---

## Admin Panel

- **User Management**: Search, filter, view details, change tiers
- **Framework Rules**: CRUD operations, CSV/Excel import
- **Analytics**: Users, engagement, quality, revenue, technical metrics
- **Analysis Logs**: View all prompt analyses with filters
- **Uninstall Feedback**: Track extension uninstalls (charts, comments, filters)

---

## Security

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Row Level Security (RLS) on all tables; admin requires role + email allowlist
- **Rate Limiting**: Database-backed per-user limits (scoring: 30/min, rewrites: 10/min, admin: 20/min)
- **Data Protection**: Parameterized queries, input sanitization, HTTPS enforced, secrets in env vars

---

## Edge Functions

| Function | Description |
|----------|-------------|
| `score-prompt` | Scores prompts against framework rules |
| `rewrite-prompt` | AI-powered prompt improvement |
| `create-checkout-session` | Stripe checkout |
| `create-billing-portal` | Stripe billing portal |
| `stripe-webhook` | Handles Stripe payment events |
| `admin-*` | Admin operations (users, analytics, rules, tier changes) |

---

## Database Schema

Core tables: `profiles`, `framework_rules`, `rule_categories`, `prompt_analysis_log`, `user_subscriptions`, `rewrite_credits`, `rewrite_transactions`, `credit_packages`, `user_roles`, `uninstall_feedback`.

Key RPC functions: `check_rewrite_credits`, `consume_rewrite_credit`, `get_user_subscription_info`, `get_trial_status`, `check_and_expire_trial`, `change_user_tier`, `check_rate_limit`, `has_role`.

---

## Deployment

**Frontend**: Connect repository to Vercel/Netlify, set environment variables, deploy.

**Edge Functions**: Auto-deployed via Lovable, or manually with `npx supabase functions deploy`.

**Database Migrations**: Managed through Supabase Dashboard.

---

## License

Proprietary. All rights reserved.

---

## Support

- **Email**: mairh.utkarsh@gmail.com
- **Issues**: GitHub Issues
