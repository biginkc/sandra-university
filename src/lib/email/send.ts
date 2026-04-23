/**
 * Minimal SendGrid wrapper. Uses SendGrid's v3 mail/send HTTP API so we
 * don't need to add a client SDK as a dependency. Gracefully no-ops
 * (returning { ok: false, skipped: true }) when SENDGRID_API_KEY isn't
 * configured so local development and pre-config deploys don't throw.
 *
 * Sender policy: SendGrid requires a verified sender (single-sender
 * verification or domain authentication). Set SENDGRID_FROM_EMAIL to a
 * verified address — anything else will fail with a 403 from the API.
 */
export type SendResult =
  | { ok: true; messageId: string | null }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; error: string };

const SENDGRID_ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}): Promise<SendResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey || apiKey === "replace_me") {
    return {
      ok: false,
      skipped: true,
      reason: "SENDGRID_API_KEY not configured",
    };
  }

  const fromEmail =
    input.from ??
    process.env.SENDGRID_FROM_EMAIL ??
    "";
  if (!fromEmail) {
    return {
      ok: false,
      skipped: true,
      reason: "SENDGRID_FROM_EMAIL not configured",
    };
  }

  const fromName =
    input.fromName ??
    process.env.SENDGRID_FROM_NAME ??
    "Sandra University";

  const body = {
    personalizations: [{ to: [{ email: input.to }] }],
    from: { email: fromEmail, name: fromName },
    subject: input.subject,
    content: [{ type: "text/html", value: input.html }],
    ...(input.replyTo ? { reply_to: { email: input.replyTo } } : {}),
  };

  try {
    const res = await fetch(SENDGRID_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        skipped: false,
        error: `SendGrid ${res.status}: ${text.slice(0, 400)}`,
      };
    }
    // SendGrid returns 202 Accepted on success with no JSON body.
    return {
      ok: true,
      messageId: res.headers.get("x-message-id"),
    };
  } catch (e) {
    return {
      ok: false,
      skipped: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
