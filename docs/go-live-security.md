# Go-live security checklist

Do these before real clients/staff use the system.

## Accounts & passwords
- [ ] **Rotate the seeded demo accounts.** The seed created staff with the shared
      password `GoddessGold!2026`. For real staff, use **Staff → Add team member**
      (owner only) which generates a unique password per person.
- [ ] Have each person change their password on first sign-in.
- [ ] **Enable leaked-password protection** (Supabase → Authentication →
      Policies / Password settings → "Prevent use of compromised passwords").
      This checks new passwords against HaveIBeenPwned.
- [ ] Set a minimum password length / strength in the same settings.

## Secrets (set in Vercel → Project → Settings → Environment Variables)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (server-only; powers the WhatsApp bot, cron,
      and Add-Staff). Never expose to the browser.
- [ ] `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`,
      `WHATSAPP_APP_SECRET` (webhook signature verification).
- [ ] `CRON_SECRET` (protects the reminders cron).

## Database
- [ ] RLS is enabled on every table (it is) — re-run the Supabase **Security
      Advisor** after any schema change.
- [ ] Integrity constraints active: no double-booking a room
      (`appointments_no_room_overlap`), stock never negative
      (`products_stock_nonneg`).
- [ ] Consider a paid Supabase plan for daily backups + point-in-time recovery
      of clinical records (the only recommendation we deliberately left for you).

## App
- [ ] Webhook rejects unsigned requests once `WHATSAPP_APP_SECRET` is set (401).
- [ ] Photos bucket (`client-photos`) is **private**; images are served via
      short-lived signed URLs.
