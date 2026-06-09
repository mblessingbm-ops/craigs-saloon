import "server-only";

/* Meta WhatsApp Cloud API senders.
   Requires env: WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN. */

const GRAPH_VERSION = "v21.0";

function endpoint() {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

async function post(body: Record<string, unknown>): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.warn("[whatsapp] credentials missing — skipping send", JSON.stringify(body));
    return;
  }
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
  });
  if (!res.ok) {
    console.error("[whatsapp] send failed", res.status, await res.text());
  }
}

export function sendText(to: string, body: string) {
  return post({ to, type: "text", text: { body } });
}

/** Up to 3 reply buttons. */
export function sendButtons(to: string, body: string, buttons: { id: string; title: string }[]) {
  return post({
    to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: body },
      action: { buttons: buttons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: b.title.slice(0, 20) } })) },
    },
  });
}

/** Send a pre-approved template message (required for messages outside the
 *  24-hour customer-service window — e.g. reminders). Register templates in
 *  Meta first; see docs/whatsapp-setup.md. */
export function sendTemplate(
  to: string,
  templateName: string,
  bodyParams: string[] = [],
  languageCode = "en"
) {
  return post({
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(bodyParams.length
        ? {
            components: [
              {
                type: "body",
                parameters: bodyParams.map((text) => ({ type: "text", text })),
              },
            ],
          }
        : {}),
    },
  });
}

/** A single-section list (up to 10 rows). */
export function sendList(
  to: string,
  body: string,
  buttonLabel: string,
  rows: { id: string; title: string; description?: string }[]
) {
  return post({
    to,
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: body },
      action: {
        button: buttonLabel.slice(0, 20),
        sections: [{ rows: rows.slice(0, 10).map((r) => ({ id: r.id, title: r.title.slice(0, 24), description: r.description?.slice(0, 72) })) }],
      },
    },
  });
}
