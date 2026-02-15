# CLAUDE.md — SimSwing Project Instructions

## What This Project Is

SimSwing is an AI-powered booking and revenue optimization platform for indoor golf simulator venues. It's a Next.js web app with a Supabase backend, intended for Vercel deployment. The key differentiator is not the booking calendar — it's the AI layer that tells venue owners how to increase revenue through dynamic pricing, demand forecasting, no-show prediction, and automated customer engagement.

Target: $100K ARR from 55–60 venues at ~$150/mo. Solo-founder, bootstrapped, Denver-first.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript 5, Tailwind CSS 4, React 19
- **Backend:** Supabase (@supabase/ssr 0.8.0, @supabase/supabase-js 2.95.3) — Postgres, Auth, Storage, Edge Functions, Real-time
- **Hosting:** Vercel (configure via dashboard)
- **Payments:** Stripe Connect (not yet integrated)
- **AI:** Anthropic Claude API (not yet integrated)
- **Repo:** github.com/vtsvetkov/simswing

### Supabase
- Project URL: https://fbkyiwilqigejhoasdmp.supabase.co
- Project ref: fbkyiwilqigejhoasdmp
- CLI is linked to project

## Project Structure

```
simswing/
  app/                            # Next.js App Router (routes)
    layout.tsx                    # Root layout (Geist fonts, global CSS)
    page.tsx                      # Landing page
    globals.css                   # Tailwind v4 imports + CSS variables
    login/page.tsx                # Login (client component)
    signup/page.tsx               # Signup (client component)
    dashboard/
      page.tsx                    # Venue list (server component)
      logout-button.tsx           # Client component for sign-out
      venues/
        new/
          page.tsx                # New venue page (server)
          venue-form.tsx          # Venue creation form (client)
        [id]/
          page.tsx                # Venue detail (server, fetches venue+bays+rules)
          venue-info.tsx          # Venue info + image upload (client)
          bay-management.tsx      # Bay CRUD + image upload (client)
          operating-hours.tsx     # Operating hours & pricing grid (client)
  src/lib/
    supabase.ts                   # Browser Supabase client (createBrowserClient)
    supabase-server.ts            # Server Supabase client (createServerClient + cookies)
  supabase/migrations/
    001_initial_schema.sql        # venues, bays, availability_rules, bookings + RLS enable
    002_rls_policies.sql          # RLS policies for all 4 tables
    003_add_images.sql            # image_url columns + venue-images storage bucket
  middleware.ts                   # Auth: refreshes Supabase session on every request
  package.json
  tsconfig.json                   # strict: true, paths: @/* -> ./*
```

## Architecture Rules

Follow these conventions in all code you write:

- **Multi-tenant:** Every table is scoped by `venue_id` with RLS policies. Never query without venue context.
- **Server components by default.** Only use `"use client"` when the component needs interactivity (forms, modals, useState/useEffect).
- **Import paths:** `@/` maps to project root (tsconfig). Use `@/src/lib/` for Supabase clients, `@/app/` for cross-referencing components.
- **Prices:** Store as cents (integers) in the database. Display as dollars in the UI. Never use floating point for money.
- **Images:** Supabase Storage "venue-images" bucket.
- **App Router conventions:** Routes in `app/` (project root). Lib code in `src/lib/`. Uses layout.tsx and page.tsx patterns.
- **Tailwind v4:** Uses `@import "tailwindcss"` in globals.css (NOT `@tailwind` directives). Theme customization via `@theme inline {}` block.
- **Supabase clients:** Two client factories — `@/src/lib/supabase-server` for Server Components (uses `cookies()` from `next/headers`), `@/src/lib/supabase` for Client Components (uses `createBrowserClient`). Never mix these up.
- **Auth middleware:** `middleware.ts` at project root refreshes Supabase auth sessions on every request via `supabase.auth.getUser()`. Matches all routes except static assets.
- **TypeScript:** Strict types. Define interfaces for all data models.

## Current Build Status

### Completed
- Authentication (signup, login, logout)
- Multi-venue creation and management
- Venue detail page with three sections: venue info with image upload, bay management with images, operating hours and pricing
- Database tables with RLS: venues, bays, availability_rules, bookings
- Configured for Vercel deployment (via Vercel dashboard, no config in repo)

### Not Yet Built (in priority order)
1. Tee sheet view (bays × time slots calendar grid)
2. Customer-facing booking page (public URL per venue)
3. Stripe Connect payments
4. Dynamic pricing engine (base rate + stackable modifiers)
5. AI pricing suggestions (Supabase Edge Function → Anthropic API)
6. AI suggestions dashboard (accept/dismiss UI)
7. AI setup wizard
8. Demo mode with synthetic data
9. Email notifications and confirmations
10. Consumer-facing venue search

## Pricing Architecture

The current pricing (tied to hours of operation) is being replaced with a flexible model:

- **Base rate** per venue/bay (default $/hr)
- **Pricing rules** (stackable modifiers in a `pricing_rules` table): time-of-day, day-of-week, lead-time, group-size, demand-based
- **Each rule:** rule_type, conditions (JSON), modifier_type (percentage/flat), modifier_value, priority, active flag
- **Final price** computed at booking time by applying all matching rules to base rate

When building booking-related features, design for this flexible model even if only base rates are implemented initially.

## AI Features Architecture

The AI layer uses Supabase Edge Functions calling the Anthropic API:

- **Pricing analysis:** Scheduled jobs aggregate booking data → send to Claude with structured prompt → parse JSON response → write to `pricing_suggestions` table
- **Suggestions UI:** Venue owners see recommendations with accept/dismiss actions. Accepting creates a `pricing_rule` automatically.
- **AI setup wizard:** New venues answer a few questions → AI generates complete pricing strategy
- **AI support agent:** Handles customer comms (booking changes, FAQs, confirmations) without human intervention
- **Estimated cost:** ~$0.01–0.02 per venue per analysis run

## Before Starting Any New Feature

1. Check the current project structure (`app/` and `src/lib/` directory trees)
2. Review the Supabase schema (tables, columns, RLS policies)
3. Look at existing component patterns (how data fetching, forms, and Supabase client usage work)
4. Understand the auth pattern (middleware, session access in server components)
5. Check existing TypeScript types/interfaces

This ensures new code fits cleanly into what exists.

## Build Plan Reference

### Phase 1: Core Booking (next)
- Tee sheet view — bays × time slots grid, available/booked display, operator click-to-book
- Customer booking page — public URL, select bay/date/time, confirm
- Stripe Connect — venue connects account, customer pays, automated payouts
- Notifications — email confirmations, cancellations, basic dashboard

### Phase 2: AI Differentiators
- Seed data generator + demo mode (/demo route with synthetic data)
- AI pricing engine (Edge Function → Anthropic API → pricing_suggestions)
- AI suggestions dashboard (accept/dismiss, before/after preview, revenue impact)
- Dynamic pricing rules engine (stackable modifiers, real-time calculation)
- AI setup wizard (onboarding generates pricing strategy from minimal inputs)

### Phase 3: Polish & Launch
- UX/UI polish (consider shadcn/ui)
- Consumer venue search experience
- Denver venue outreach with shareable demo
- Iterate on feedback

## Product Context

Six AI value pillars (for understanding feature priorities):
1. **Make more money from same bays** — dynamic pricing, flash deals for empty slots
2. **Stop losing money to no-shows** — predictive scoring, automated backfill
3. **Stop guessing on pricing** — AI recommendations with estimated revenue impact
4. **Survive the off-season** — proactive seasonal planning and campaigns
5. **Run without staff** — AI handles customer communications (critical for 24/7 unmanned venues)
6. **Know what's working** — narrative insights, not just dashboards
