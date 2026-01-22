# Next.js 14 App Router Migration Guide (from Vite + React Router)

This repository currently runs on **React + Vite + React Router**.
This document describes how to migrate the app to **Next.js 14+ with App Router** while preserving:

- UI structure and components
- Tailwind theme tokens and styling approach
- External Supabase authentication + database patterns

> Maintenance rule: when we add a new route/page/component in this Vite project, also update the **Route Mapping** section and, if relevant, the **Supabase/Auth** section.

---

## 0) Goal & constraints

### Target architecture

- Next.js 14+
- App Router (`app/` directory)
- TypeScript strict
- Tailwind CSS
- External Supabase instance

### Current architecture

- Vite
- React Router (`src/App.tsx` + `src/pages/*`)
- Tailwind + `src/index.css` design tokens (HSL CSS variables)

### Important note about styling rules

Your project knowledge base says “no custom CSS files”, but Next.js + Tailwind still requires at least one global CSS entry (commonly `app/globals.css`) to load Tailwind layers.

In the Next.js version:

- Keep **only** Tailwind layers + design tokens + a small set of utilities (like `pp-*`) in `app/globals.css`.
- Keep component styling in Tailwind utility classes and semantic tokens.

---

## 1) Route mapping (keep updated)

Map React Router routes to App Router segments.

| Current (Vite) | File today | Next.js App Router | Notes |
|---|---|---|---|
| `/` | `src/pages/Landing.tsx` | `app/page.tsx` | Landing page |
| `/login` | `src/pages/Login.tsx` | `app/(auth)/login/page.tsx` | Auth group |
| `/signup` | `src/pages/Signup.tsx` | `app/(auth)/signup/page.tsx` | Auth group |
| `/dashboard` | `src/pages/Dashboard.tsx` | `app/dashboard/page.tsx` | Protected route |
| `/admin` | `src/pages/Admin.tsx` | `app/admin/page.tsx` | Protected route (admin) |
| `*` | `src/pages/NotFound.tsx` | `app/not-found.tsx` | Next.js built-in |

If we add new routes in Vite, extend this table.

---

## 2) Component mapping

### Current component folders

- `src/components/marketing/*`
- `src/components/ui/*`

### Next.js target

- `components/marketing/*`
- `components/ui/*`
- `lib/*` (Supabase clients, types, helpers)

> Tip: Most components can move as-is. The biggest changes are around routing (`NavLink`) and any browser-only APIs.

---

## 3) Replace React Router with Next.js navigation

### What changes

- `react-router-dom` is removed in the Next.js project.
- Replace any `NavLink` wrapper with Next.js `Link`.

### Suggested approach

1. Create `components/nav-link.tsx` in Next.js:
   - Wrap `next/link`
   - Preserve your `className` API

2. Update imports:
   - `import { NavLink } from "@/components/NavLink"` → `import Link from "next/link"` (or your wrapper)

3. For hash links like `href="#pricing"`:
   - Next.js `Link` supports hash navigation.
   - Plain `<a href="#pricing">` is also fine.

---

## 4) Tailwind + design tokens migration

### Current source

- `src/index.css` contains:
  - Tailwind layers
  - HSL tokens (`--background`, `--primary`, etc.)
  - `pp-*` utilities

### Next.js target

- Create `app/globals.css` and copy:
  - `@tailwind base; @tailwind components; @tailwind utilities;`
  - All `:root` and `.dark` CSS variable tokens
  - `@layer utilities` helpers (`pp-text-balance`, `pp-surface`, `pp-hero-bg`, motion reduction)

### Tailwind config

Copy `tailwind.config.ts` into the Next.js project and ensure content globs include:

- `./app/**/*.{ts,tsx}`
- `./components/**/*.{ts,tsx}`
- `./lib/**/*.{ts,tsx}`

---

## 5) Supabase (external) integration plan (Next.js)

This project uses an **external Supabase instance**.

### Environment variables (Next.js)

Configure in Vercel / `.env.local` (not committed):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Client vs Server clients

- Client components: use `createBrowserClient`
- Server components / route handlers: use `createServerClient`

Recommended library:

- `@supabase/supabase-js`
- `@supabase/ssr` (for App Router cookies integration)

### Auth pages

- `app/(auth)/login/page.tsx`
- Optional: `app/(auth)/signup/page.tsx`

### Protecting routes (dashboard)

In `app/dashboard/page.tsx`:

- Read session server-side
- If no session, `redirect('/login')`

---

## 6) Database schema guidance (roles + profiles)

### Profiles decision (must be explicit)

Before implementing auth in Next.js, decide:

- Do we need a `profiles` table for user tier/preferences?

If **yes**, create `profiles` with RLS and a trigger to create a profile on signup.

### Roles (security requirement)

Do **not** store roles on `profiles` or `users` rows.
Use a separate `user_roles` table and a `has_role()` SECURITY DEFINER function to avoid RLS recursion.

Keep the canonical SQL in a migration folder in the Next.js project (e.g., `supabase/migrations/*`) or document it in a dedicated `docs/supabase-schema.md`.

---

## 7) Page-by-page porting checklist

### Landing page (`/`)

- [ ] Create `app/page.tsx`
- [ ] Copy markup from `src/pages/Index.tsx`
- [ ] Ensure any client-only components are marked with `'use client'` (only when required)

### Login (`/login`)

- [ ] Create `app/(auth)/login/page.tsx`
- [ ] Convert form to a client component if using interactive state
- [ ] Wire Supabase sign-in

### Dashboard (`/dashboard`)

- [ ] Create `app/dashboard/page.tsx`
- [ ] Add server-side auth gate + redirect
- [ ] Keep prompt textarea UI
- [ ] Later: call Route Handler `/api/analyze-prompt` (Next.js `app/api/.../route.ts`)

---

## 8) Known code differences to watch for

- `window` access: Only in client components.
- Event listeners (like pointer tracking for the spotlight): likely `'use client'`.
- `react-router-dom` hooks: remove/replace.
- File-based routing means you’ll remove route config from `App.tsx` entirely.

---

## 9) “Keep this doc updated” checklist

Whenever we change the current Vite app, update this doc if it affects:

- Routes or navigation
- Authentication screens/flow
- Tailwind tokens/utilities
- Database schema expectations
- Any new API endpoints that will become Next.js Route Handlers
