# Craig's Saloon — Franchise Management Platform

A Progressive Web App for running Craig's four-location salon franchise — appointments,
station-level daily reconciliation, real-time financials, staff, and WhatsApp booking — in
one system. Replaces the spreadsheet-per-station workflow.

**Live:** https://craigs-saloon.vercel.app

## Stack

- **Next.js 16** (App Router, React 19) — PWA, installable, offline-capable
- **Supabase** — PostgreSQL, Auth, Row-Level Security (per-location data isolation)
- **WhatsApp Business Cloud API** — conversational booking + reminders
- Deployed on **Vercel**

## Roles

| Role | Sees |
| --- | --- |
| Owner | All four saloons — franchise dashboard, every calendar, reconciliation, reports |
| Admin | Their own saloon only (one per location) |
| Technician | Their own schedule + earnings |
| Client | Books via WhatsApp — no account |

Scoping is enforced by Row-Level Security, not just the UI.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values below
npm run dev                  # http://localhost:3000
```

### Environment

```
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Supabase publishable/anon key (browser-safe)
SUPABASE_SERVICE_ROLE_KEY=         # server-only — WhatsApp webhook + owner staff onboarding
WHATSAPP_VERIFY_TOKEN=             # any string; matches the Meta webhook config
WHATSAPP_ACCESS_TOKEN=             # Meta WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=          # Meta WhatsApp Cloud API
WHATSAPP_APP_SECRET=               # Meta app secret (verifies inbound webhook signatures)
```

The public `NEXT_PUBLIC_*` values live in `.env.production`; secrets stay in `.env.local`
(gitignored) and in the Vercel project's environment settings.

## Database

Schema and seed live in `supabase/migrations/`. Apply them to a fresh Supabase project
(`supabase db reset` locally, or via the dashboard). The seed creates the four saloons,
their stations, the service menu, and demo staff.

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run lint    # eslint
npm test        # vitest
```

## Docs

- WhatsApp go-live: `docs/whatsapp-setup.md`
- Known gaps / go-live checklist: `docs/known-gaps.md`, `docs/go-live-security.md`
