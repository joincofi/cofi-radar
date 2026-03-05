/**
 * Thin wrapper around the Resend HTTP API.
 * Avoids the Resend SDK whose error-handling path crashes on Node 18/Next 14.
 */

export interface SendEmailParams {
  to:          string | string[];
  subject:     string;
  html:        string;
  scheduledAt?: string; // ISO 8601 — Resend scheduled send
}

const FROM_DEFAULT = "team@cofiradar.com";

export async function sendEmail(params: SendEmailParams): Promise<{ id?: string; error?: string }> {
  const apiKey  = process.env.RESEND_API_KEY;
  const from    = process.env.RESEND_FROM_EMAIL || FROM_DEFAULT;

  if (!apiKey) {
    console.error("[sendEmail] RESEND_API_KEY not set");
    return { error: "RESEND_API_KEY not set" };
  }

  const body: Record<string, unknown> = {
    from:    `CoFi Radar <${from}>`,
    to:      Array.isArray(params.to) ? params.to : [params.to],
    subject: params.subject,
    html:    params.html,
  };

  if (params.scheduledAt) {
    body.scheduled_at = params.scheduledAt;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error(`[sendEmail] Resend ${res.status}:`, JSON.stringify(json));
      return { error: JSON.stringify(json) };
    }

    return { id: (json as { id?: string }).id };
  } catch (err) {
    console.error("[sendEmail] fetch exception:", err);
    return { error: String(err) };
  }
}
