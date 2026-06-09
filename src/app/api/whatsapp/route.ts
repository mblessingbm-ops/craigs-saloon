import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { handleInbound } from "@/lib/whatsapp/bot";

export const dynamic = "force-dynamic";

/** Verify Meta's X-Hub-Signature-256 against the raw body using the app secret. */
function verifySignature(raw: string, signature: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    console.warn("[whatsapp] WHATSAPP_APP_SECRET not set — skipping signature check");
    return true; // dev: allow
  }
  if (!signature) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---- Webhook verification (Meta calls this once when you subscribe) ---- */
export function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

/* ---- Inbound messages ---- */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const entries = (body as { entry?: unknown[] })?.entry ?? [];
    for (const entry of entries) {
      const changes = (entry as { changes?: unknown[] })?.changes ?? [];
      for (const change of changes) {
        const value = (change as { value?: Record<string, unknown> })?.value ?? {};
        const messages = (value.messages as unknown[]) ?? [];
        const contacts = (value.contacts as { profile?: { name?: string } }[]) ?? [];
        const name = contacts[0]?.profile?.name;

        for (const m of messages) {
          const msg = m as {
            from: string;
            type: string;
            text?: { body: string };
            interactive?: {
              type: string;
              button_reply?: { id: string };
              list_reply?: { id: string };
            };
          };
          const replyId =
            msg.interactive?.button_reply?.id ?? msg.interactive?.list_reply?.id ?? undefined;
          const text = msg.text?.body;
          await handleInbound({ from: msg.from, name, text, replyId });
        }
      }
    }
  } catch (e) {
    console.error("[whatsapp] webhook error", e);
  }

  // Always 200 so Meta doesn't retry indefinitely.
  return NextResponse.json({ ok: true });
}
