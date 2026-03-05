/**
 * GET /api/test-email?to=you@example.com
 * Sends a minimal test email via Resend HTTP API directly.
 * No SDK, no imports beyond NextResponse.
 */

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json({ error: "Pass ?to=your@email.com" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "team@cofiradar.com";

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY not set", v: 2 }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `CoFi Radar <${from}>`,
        to: [to],
        subject: "CoFi Radar Test — Email Delivery Works",
        html: `<div style="font-family:sans-serif;padding:32px;max-width:500px;margin:auto;">
          <h1 style="color:#C96442;">CoFi Radar</h1>
          <p>If you're reading this, email delivery is working.</p>
          <p>Sent to: <strong>${to}</strong></p>
          <p>From: <strong>${from}</strong></p>
          <p style="color:#999;font-size:12px;">Test sent at ${new Date().toISOString()}</p>
        </div>`,
      }),
    });

    const body = await res.json();

    if (!res.ok) {
      return NextResponse.json({ ok: false, sentTo: to, from, status: res.status, resendError: body, v: 2 }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sentTo: to, from, resendId: body.id, v: 2 });
  } catch (err) {
    return NextResponse.json({ ok: false, sentTo: to, from, error: String(err), v: 2 }, { status: 500 });
  }
}
