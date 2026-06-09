# Known gaps & deferred work

The high-risk loopholes (fraud, clinical safety, double-booking, duplicate
clients, reminder reliability) are now closed in code. These remaining items are
intentionally deferred — tracked here so they aren't forgotten.

## Needs an external account / decision
- **WhatsApp reminders need approved templates.** The cron currently sends
  free-text, which Meta only delivers inside the 24-hour service window. Register
  the templates in `docs/whatsapp-setup.md` and switch `sendText` → `sendTemplate`
  in `src/app/api/cron/reminders/route.ts`.
- **Error monitoring.** Add Sentry (or similar) — DSN as an env var — so cron/
  webhook failures alert someone.
- **Email channel.** The brief mentions email alongside WhatsApp; only WhatsApp
  is built. Add a provider (e.g. Resend) if email is wanted.
- **Backups / no-pause DB.** Supabase Pro (deliberately left out per request).

## Compliance (Zimbabwe Data Protection Act) — needs legal input
- **Privacy policy + explicit photo consent** before storing before/after images.
- **Right to erasure.** Add a "delete client + their photos + records" flow
  (currently hard-deletes are intentionally blocked and storage objects aren't
  purged on client removal).
- **Data retention policy** for clinical records.
- **Access audit for clinical reads.** The audit log now covers *writes*; reading
  a client record isn't logged. Any therapist can read any client's clinical
  notes/photos (operationally needed, but broad).

## Smaller engineering items
- **Split payments.** `payment_method = 'split'` isn't broken into cash/card/mobile,
  so a split-paid transaction would show as a reconciliation variance. Model the
  split amounts if that payment mode is used.
- **Accessibility.** Bottom-sheets don't trap focus or close on Escape; toasts
  aren't announced via `aria-live`.
- **Money-path tests.** Unit tests cover formatting, timezone, stock level, and
  phone normalization. The dashboard revenue aggregation + reconciliation math
  are still only verified manually.
- **Void/refund UI.** `enrolment_status='refunded'` exists but there's no in-app
  void/refund flow for a mistaken sale or course.
- **Booking validation.** No guard against booking in the past or outside
  operating hours.
- **Scale.** Dashboard aggregates ~70 days of rows in JS; fine at studio scale,
  but move to SQL aggregates / materialized views if volume grows. No pagination
  on clients/diary.

## Before real launch
- **Purge demo/seed data** from the production database (Rutendo, seeded staff,
  today's fake appointments and sales) and start clean.
- **Rotate the shared demo password** and enable leaked-password protection
  (see `docs/go-live-security.md`).
