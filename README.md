# Prompt Perfector

AI prompt analyzer and optimizer for ChatGPT, Claude, Gemini, and more. Get 10/10 prompts every time.

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript (strict mode)
- **Styling**: Tailwind CSS, shadcn/ui components
- **Routing**: React Router v6
- **State**: React Query (TanStack Query)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Analytics**: PostHog
- **Deployment**: Vercel/Netlify

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (for backend)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd prompt-perfector

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Analytics (optional)
VITE_POSTHOG_KEY=your-posthog-key
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

See `.env.example` for full documentation.

### Supabase Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/`
3. Deploy edge functions: `supabase functions deploy`
4. Set edge function secrets:
   - `ADMIN_EMAILS`: Comma-separated list of admin emails

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── marketing/      # Landing page components
├── contexts/           # React contexts (Auth, Analytics)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── pages/              # Page components
│   ├── admin/          # Admin panel pages
│   └── dashboard/      # User dashboard pages
├── types/              # TypeScript type definitions
└── integrations/       # Third-party integrations

supabase/
├── functions/          # Edge functions
└── migrations/         # Database migrations

docs/
├── analytics-events.md # Event taxonomy
└── supabase-schema.sql # Database schema reference
```

## Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run test       # Run tests
```

## Features

### User Features
- **Prompt Analysis**: Get instant feedback on your AI prompts
- **Score & Grade**: See how your prompt rates (1-10, A-F)
- **Improvements**: Get actionable suggestions to improve
- **History**: View and revisit past analyses
- **Multi-platform**: Optimize for ChatGPT, Claude, Gemini, etc.

### Admin Features
- **Dashboard**: Overview of platform health
- **User Management**: View and manage users
- **Analytics**: Detailed usage analytics
- **Framework Rules**: Manage prompt analysis rules

### Tiers
- **Free**: 10 analyses/day, template-based analysis
- **Pro** ($9/mo): Unlimited analyses, AI-powered analysis

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository
2. Set environment variables in Project Settings
3. Deploy automatically on push to main

### Build

```bash
npm run build
```

Output is in the `dist/` directory.

## Security

- Row Level Security (RLS) on all tables
- Server-side admin verification (role + email allowlist)
- No client-side admin trust
- GDPR-compliant analytics with consent
- Input validation on all forms

## Documentation

- [Analytics Events](docs/analytics-events.md) - Event taxonomy
- [Database Schema](docs/supabase-schema.sql) - Schema reference
- [Changelog](CHANGELOG.md) - Version history

## License

Proprietary - All rights reserved.
