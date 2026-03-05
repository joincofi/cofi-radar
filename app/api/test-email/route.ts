/**
 * GET /api/test-email?to=you@example.com
 * Sends a test free-report email with fake data.
 * Owner-only (checks OWNER_EMAIL env var).
 */

import { NextResponse } from "next/server";
import { sendFreeReport } from "@/lib/email/freeReport";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("to");

  if (!to) {
    return NextResponse.json({ error: "Pass ?to=your@email.com" }, { status: 400 });
  }

  const fakeLead = {
    id:            "test-lead-id",
    email:         to,
    domain:        "cofiradar.com",
    brandName:     "CoFi Radar",
    industry:      "SaaS",
    competitors:   ["Brandwatch", "Mention"],
    score:         58,
    reportSent:    false,
    dripScheduled: false,
    converted:     false,
    scannedAt:     null,
    createdAt:     new Date(),
  } as Parameters<typeof sendFreeReport>[0]["lead"];

  await sendFreeReport({
    lead:        fakeLead,
    brandName:   "CoFi Radar",
    score:       { scoreTotal: 58, scoreVisibility: 62, scoreAccuracy: 55, scoreCompetitive: 50, scoreSentiment: 70 },
    topFindings: [],
    topAlert:    {
      model:    "gpt-4o",
      question: "What does CoFi Radar do?",
      detail:   "AI described pricing incorrectly as free tier when no free tier exists.",
      severity: "high",
    },
    lowPresence:  false,
    competitors:  ["Brandwatch", "Mention"],
  });

  return NextResponse.json({ ok: true, sentTo: to });
}
