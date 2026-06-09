# WhatsApp Business booking — setup

The WhatsApp booking bot is implemented and waiting on credentials. It uses the
official **Meta WhatsApp Cloud API**. Everything is code-complete; you only need to
create a Meta app, paste three secrets, and point the webhook at the deployed app.

## What's built

- `POST /api/whatsapp` — receives inbound messages, runs the booking bot, replies.
- `GET /api/whatsapp` — webhook verification handshake.
- Booking flow: greeting → **saloon (location)** → category → service → time slot →
  confirm → creates a real `appointments` row (`source = whatsapp`) on the chosen
  saloon's calendar, assigned to a station + technician at that location. Returning
  clients are recognised by phone number.
- Self-service: **My Bookings** (upcoming visits with saloon) and **Talk to Us**
  (human handoff).
- Every message (in and out) is logged to `whatsapp_conversations`.

> One franchise number serves all four saloons — the client picks the saloon in the
> flow, so the booking lands on the right calendar. (Meta also supports one number
> per saloon if Craig prefers; only the location step would change.)

## 1. Create a Meta app + WhatsApp number

1. Go to <https://developers.facebook.com/> → **Create App** → type **Business**.
2. Add the **WhatsApp** product. Meta gives you a free **test number** and a
   temporary 24-hour access token to start.
3. Note your **Phone number ID** (WhatsApp → API Setup).

## 2. Set environment variables

In `.env.local` (and in your Vercel/host project settings for production):

```
SUPABASE_SERVICE_ROLE_KEY=…     # Supabase Dashboard → Settings → API → service_role
WHATSAPP_VERIFY_TOKEN=…         # any random string you choose
WHATSAPP_ACCESS_TOKEN=…         # Meta → WhatsApp → API Setup (temp token, then a permanent System User token)
WHATSAPP_PHONE_NUMBER_ID=…      # Meta → WhatsApp → API Setup
```

## 3. Configure the webhook

The webhook must be a public HTTPS URL, so deploy first (e.g. Vercel) — or use a
tunnel like `ngrok http 3100` for local testing.

1. Meta App → **WhatsApp → Configuration → Webhook → Edit**.
2. **Callback URL:** `https://YOUR_DOMAIN/api/whatsapp`
3. **Verify token:** the same string you set as `WHATSAPP_VERIFY_TOKEN`.
4. Click **Verify and save** (Meta calls `GET /api/whatsapp`).
5. **Subscribe** to the `messages` field.

## 4. Test

Message your WhatsApp test/business number with **"Hi"**. You should get the
welcome menu with buttons. Walk through Book Appointment → saloon → category →
service → time → confirm, then check that saloon's calendar — the appointment
appears with a **whatsapp** source.

## Message templates (for reminders)

Messages sent **outside the 24-hour customer-service window** (e.g. the
24h/1h reminders and re-engagement) must use **pre-approved templates**. Create
these in **Meta → WhatsApp → Message Templates**, then they're sent via
`sendTemplate()` (`src/lib/whatsapp/send.ts`). Suggested templates:

| Template name | Category | Body (with {{n}} variables) |
|---|---|---|
| `appointment_reminder_24h` | UTILITY | "Reminder: you have {{1}} at Craig's {{2}} on {{3}}. Reply CONFIRM or CHANGE." |
| `appointment_reminder_1h` | UTILITY | "See you in about an hour at Craig's {{1}} 💈 If you're running late, reply LATE." |
| `no_show_followup` | UTILITY | "We missed you today, {{1}}. Reply BOOK to rebook your visit." |
| `daily_summary` | UTILITY | "Craig's Saloon — {{1}}: {{2}} in services, {{3}} clients. Reconciliation {{4}}." |

Once approved, switch the cron (`src/app/api/cron/reminders/route.ts`) from
`sendText` to `sendTemplate(to, "appointment_reminder_24h", [service, when])`.

## Webhook security

Set **`WHATSAPP_APP_SECRET`** (Meta App → Settings → Basic → App Secret). The
webhook verifies every inbound POST's `X-Hub-Signature-256` HMAC against it and
rejects forgeries with 401. If unset (local dev), the check is skipped with a
warning.

## Production notes

- **Outbound reminders** (24h / 1h before, course prompts) require pre-approved
  **message templates** in Meta and a scheduled job — that's Phase 4 work.
- Swap the temporary token for a **System User permanent token** before go-live.
- Providers like **WATI / 360dialog / Twilio** can be used instead of the raw Cloud
  API; only `src/lib/whatsapp/send.ts` would change.
