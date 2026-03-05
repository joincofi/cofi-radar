/**
 * POST /api/support/inbound
 *
 * Resend inbound email webhook — receives forwarded support emails,
 * passes them to the support agent.
 *
 * Set up in Resend: Inbound → route support@cofi-radar.com → this URL.
 */

import { NextResponse } from "next/server";
import { handleSupportEmail } from "@/lib/agents/support";

export async function POST(req: Request) {
  try {
    // Resend inbound webhook payload
    const body = await req.json() as {
      from?:    string;
      subject?: string;
      text?:    string;
      html?:    string;
    };

    const from    = body.from    ?? "";
    const subject = body.subject ?? "(no subject)";
    const text    = body.text    ?? body.html?.replace(/<[^>]+>/g, " ") ?? "";

    if (!from) {
      return NextResponse.json({ error: "No sender" }, { status: 400 });
    }

    // Extract just the email address if it's "Name <email>" format
    const emailMatch = from.match(/<([^>]+)>/);
    const senderEmail = emailMatch ? emailMatch[1] : from;

    // Fire-and-forget — Resend expects a fast response
    handleSupportEmail({ from: senderEmail, subject, text }).catch((err) => {
      console.error("[support/inbound] Handler error:", err);
    });

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("[support/inbound] Error:", err);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}
