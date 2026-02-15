# CLAUDE.md — SimSwing Project Instructions

## What This Project Is

SimSwing is an AI-powered booking and revenue optimization platform for indoor golf simulator venues. It's a Next.js web app with a Supabase backend, deployed on Vercel. The key differentiator is not the booking calendar — it's the AI layer that tells venue owners how to increase revenue through dynamic pricing, demand forecasting, no-show prediction, and automated customer engagement.

Target: $100K ARR from 55–60 venues at ~$150/mo. Solo-founder, bootstrapped, Denver-first.

## Tech Stack

- **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions, Real-time)
- **Hosting:** Vercel (auto-deploys from GitHub)
- **Payments:** Stripe Connect (not yet integrated)
- **AI:** Anthropic Claude API (not yet integrated)
- **Repo:** github.com/vtsvetkov/simswing

### Supabase
- Project URL: https://fbkyiwilqigejhoasdmp.supabase.co
- Project ref: fbkyiwilqigejhoasdmp
- CLI is linked to project

## Architecture Rules

Follow these conventions in all code you write:

- **Multi-tenant:** Every table is scoped by `venue_id` with RLS policies. Never query without venue context.
- **Server components by default.** Only use `"use client"` when the component needs interactivity (forms, modals, useState/useEffect).
- **Import paths:** Use `@/src/lib/` for lib files.
- **Prices:** Store as cents (integers) in the database. Display as dollars in the UI. Never use floating point for money.
- **Images:** Supabase Storage "venue-images" bucket.
- **App Router conventions:** Routes in `src/app/`, using layout.tsx, page.tsx, loading.tsx patterns.
- **TypeScript:** Strict types. Define interfaces for all data models.

## Current Build Status

### Completed
- Authentication (signup, login, logout)
- Multi-venue creation and management
- Venue detail page with three sections: venue info with image upload, bay management with images, operating hours and pricing
- Database tables with RLS: venues, bays, availability_rules, bookings, customers
- Deployed on Vercel with auto-deploys from GitHub

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

1. Check the current project structure (`src/` directory tree)
2. Review the Supabase schema (tables, columns, RLS policies)
3. Look at existing component patterns (how data fetching, forms, and Supabase client usage work)
4. Understand the auth pattern (middleware, session access in server components)
5. Check existing TypeScript types/interfaces

This ensures new code fits cleanly into what exists.

## Build Plan Reference

### Phase 1: Core Booking (Days 5–8)
- Day 5: Tee sheet view — bays × time slots grid, available/booked display, operator click-to-book
- Day 6: Customer booking page — public URL, select bay/date/time, confirm
- Day 7: Stripe Connect — venue connects account, customer pays, automated payouts
- Day 8: Notifications — email confirmations, cancellations, basic dashboard

### Phase 2: AI Differentiators (Days 9–13)
- Day 9: Seed data generator + demo mode (/demo route with synthetic data)
- Day 10: AI pricing engine (Edge Function → Anthropic API → pricing_suggestions)
- Day 11: AI suggestions dashboard (accept/dismiss, before/after preview, revenue impact)
- Day 12: Dynamic pricing rules engine (stackable modifiers, real-time calculation)
- Day 13: AI setup wizard (onboarding generates pricing strategy from minimal inputs)

### Phase 3: Polish & Launch (Days 14–17)
- Day 14: UX/UI polish (consider shadcn/ui)
- Day 15: Consumer venue search experience
- Day 16: Denver venue outreach with shareable demo
- Day 17: Iterate on feedback

## Product Context

Six AI value pillars (for understanding feature priorities):
1. **Make more money from same bays** — dynamic pricing, flash deals for empty slots
2. **Stop losing money to no-shows** — predictive scoring, automated backfill
3. **Stop guessing on pricing** — AI recommendations with estimated revenue impact
4. **Survive the off-season** — proactive seasonal planning and campaigns
5. **Run without staff** — AI handles customer communications (critical for 24/7 unmanned venues)
6. **Know what's working** — narrative insights, not just dashboards
