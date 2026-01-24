# ZeroRetry

AI prompt analyzer and optimizer. Get it right the first time. Works with ChatGPT, Claude, Gemini, and more.

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

Create a `.env` file with the following:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Project Structure

```
src/
├── components/     # Reusable UI components
├── contexts/       # React contexts (Auth, Analytics)
├── hooks/          # Custom React hooks
├── lib/            # Utility functions and configurations
├── pages/          # Route pages
│   ├── admin/      # Admin dashboard pages
│   └── dashboard/  # User dashboard pages
└── integrations/   # Third-party integrations

supabase/
├── functions/      # Edge Functions
└── migrations/     # Database migrations
```

## Features

### Core Features
- **Prompt Analysis**: Score prompts against proven principles
- **AI Rewrites**: Generate improved versions of prompts
- **History Tracking**: View and manage past analyses
- **Multi-platform**: Works with ChatGPT, Claude, Gemini, Perplexity

### Subscription Tiers
- **Free**: Unlimited scoring, 10 AI rewrites/month
- **Pro**: 200+ AI rewrites/month with rollover credits
- **Unlimited**: Unlimited AI rewrites

## Development

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- Tailwind CSS for styling
- shadcn/ui component library

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Building

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The project is configured for deployment on Vercel or Netlify.

### Vercel

1. Connect your repository to Vercel
2. Set environment variables
3. Deploy

### Supabase Edge Functions

```bash
# Deploy all functions
npx supabase functions deploy

# Deploy specific function
npx supabase functions deploy function-name
```

## License

Proprietary - All rights reserved.

## Support

For support, email support@zeroretry.com
