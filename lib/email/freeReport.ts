/**
 * Sends the immediate free-scan report email to the lead.
 * Called by freeScan.ts right after the score is computed.
 */

import { Resend } from "resend";
import type { Lead } from "@prisma/client";
import type { ScoreData } from "@/lib/scoring/computeScore";

const getResend = () => new Resend(process.env.RESEND_API_KEY);
const FROM    = process.env.RESEND_FROM_EMAIL!;
const BASE    = process.env.NEXTAUTH_URL ?? "https://cofiradar.com";

// ─── Styles (match drip.ts) ───────────────────────────────────────────────────

const OUTER   = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#FAF7F4;padding:32px 16px;margin:0;`;
const CARD    = `max-width:560px;background:#fff;border-radius:12px;border:1px solid #EDE7E0;overflow:hidden;`;
const BODY_TD = `padding:32px;`;
const FOOT_TD = `background:#FAF7F4;border-top:1px solid #EDE7E0;padding:16px 32px;text-align:center;`;
const BTN     = `display:inline-block;padding:14px 32px;background:#C96442;color:#fff;font-weight:700;font-size:15px;border-radius:8px;text-decoration:none;`;
const H1      = `margin:0 0 20px;font-size:22px;font-weight:800;color:#1C1714;`;
const P       = `margin:0 0 16px;font-size:15px;color:#6B5E56;line-height:1.7;`;
const LABEL   = `margin:0 0 4px;font-size:11px;color:#C96442;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;`;
const FOOT_P  = `margin:0;font-size:12px;color:#9B8E85;`;

function scoreColor(score: number): string {
  if (score >= 70) return "#22C55E";
  if (score >= 45) return "#F59E0B";
  return "#EF4444";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "Strong";
  if (score >= 45) return "Moderate";
  return "Low";
}

function scoreContext(score: number, brandName: string): string {
  if (score >= 70) return `${brandName} is well-represented in AI answers. Weekly monitoring will help you keep it that way as models update.`;
  if (score >= 45) return `${brandName} has partial AI presence. There are accuracy gaps and competitor risks that full monitoring surfaces every week.`;
  return `AI models are inconsistently representing ${brandName} — buyers researching you may be getting misleading answers. This is the range where monitoring matters most.`;
}

// ─── Email HTML ───────────────────────────────────────────────────────────────

interface ReportParams {
  lead:        Lead;
  brandName:   string;
  score:       ScoreData;
  topFindings: Array<{ model: string; question: string; answer: string; extraction: { brandMentioned: boolean; riskFlags: unknown[] } }>;
  topAlert:    { model: string; question: string; detail: string; severity: string } | null;
  lowPresence: boolean;
  competitors: string[];
}

function buildHtml(p: ReportParams): string {
  const { brandName, score, topAlert, lowPresence, competitors } = p;
  const s = score.scoreTotal;
  const checkoutUrl = `${BASE}/api/stripe/checkout?plan=monthly`;

  const subscoreRows = [
    { label: "Visibility",   value: score.scoreVisibility,   tip: "How often AI mentions you" },
    { label: "Accuracy",     value: score.scoreAccuracy,     tip: "How correctly AI describes you" },
    { label: "Competitive",  value: score.scoreCompetitive,  tip: "Share of voice vs competitors" },
    { label: "Sentiment",    value: score.scoreSentiment,    tip: "Tone when AI mentions you" },
  ]
    .map(
      (r) =>
        `<tr>
          <td style="padding:8px 12px;font-size:13px;color:#6B5E56;">${r.label}</td>
          <td style="padding:8px 12px;font-size:13px;color:#6B5E56;">${r.tip}</td>
          <td style="padding:8px 12px;font-size:13px;font-weight:700;color:${scoreColor(r.value)};text-align:right;">${r.value}/100</td>
        </tr>`
    )
    .join("");

  const alertBlock = topAlert
    ? `<div style="background:#FEF2F2;border-radius:8px;border:1px solid #FCA5A5;padding:16px;margin:0 0 20px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#DC2626;letter-spacing:0.08em;text-transform:uppercase;">Risk Flag Detected</p>
        <p style="margin:0 0 6px;font-size:13px;color:#1C1714;font-weight:600;">${topAlert.question}</p>
        <p style="margin:0;font-size:13px;color:#6B5E56;">${topAlert.detail}</p>
      </div>`
    : "";

  const lowPresenceBlock = lowPresence
    ? `<p style="${P}"><strong>Note:</strong> AI models had very limited information about ${brandName}. This often means your brand is too new or too niche for training data — the good news is there's a clear path to fix this.</p>`
    : "";

  const compText = competitors.length > 0
    ? `We also detected competitors: <strong>${competitors.slice(0, 3).join(", ")}</strong>. Full monitoring tracks how AI answers compare-and-choose queries between you and them.`
    : "Full monitoring includes competitor share-of-voice across 4 models every week.";

  return `<!DOCTYPE html><html><body style="${OUTER}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="${CARD}">

  <tr><td style="${BODY_TD}">
    <p style="${LABEL}">CoFi Radar — Free Scan Report</p>
    <h1 style="${H1}">${brandName}'s AI Visibility Score: <span style="color:${scoreColor(s)}">${s}/100</span></h1>
    <p style="${P}">${scoreContext(s, brandName)}</p>

    ${lowPresenceBlock}

    <!-- Score breakdown -->
    <table width="100%" cellpadding="0" cellspacing="0"
      style="margin:0 0 24px;border-radius:8px;border:1px solid #EDE7E0;overflow:hidden;border-collapse:collapse;">
      <thead>
        <tr style="background:#FAF7F4;">
          <th style="padding:8px 12px;font-size:11px;color:#9B8E85;text-align:left;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Dimension</th>
          <th style="padding:8px 12px;font-size:11px;color:#9B8E85;text-align:left;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">What it measures</th>
          <th style="padding:8px 12px;font-size:11px;color:#9B8E85;text-align:right;text-transform:uppercase;letter-spacing:0.06em;font-weight:600;">Score</th>
        </tr>
      </thead>
      <tbody>${subscoreRows}</tbody>
    </table>

    ${alertBlock}

    <p style="${P}">${compText}</p>

    <p style="${P}">The free scan ran 10 queries across 2 models. Full monitoring runs <strong>100 queries × 4 models = 400 data points every week</strong>, with a weekly email digest, alert notifications, and a prioritized fix plan.</p>

    <a href="${checkoutUrl}" style="${BTN}">Start weekly monitoring — $999/mo</a>
    <p style="margin:16px 0 0;font-size:13px;color:#9B8E85;">Cancel anytime. First full report within the hour of signing up.</p>
  </td></tr>

  <tr><td style="${FOOT_TD}">
    <p style="${FOOT_P}">CoFi Radar &middot; AI Visibility Intelligence &middot; <a href="${checkoutUrl}" style="color:#C96442;text-decoration:none;">Start monitoring</a></p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function sendFreeReport(params: ReportParams): Promise<{ id?: string; error?: string }> {
  const { lead, brandName, score } = params;
  const s = score.scoreTotal;
  const fromAddr = FROM || "team@cofiradar.com";
  const apiKey = process.env.RESEND_API_KEY;

  console.log(`[freeReport] Sending to ${lead.email} | from: ${fromAddr} | apiKey: ${apiKey ? apiKey.slice(0, 8) + "..." : "MISSING"}`);

  if (!apiKey) {
    const msg = "RESEND_API_KEY env var is not set";
    console.error(`[freeReport] ${msg}`);
    return { error: msg };
  }

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from:    `CoFi Radar <${fromAddr}>`,
      to:      lead.email,
      subject: `Your CoFi Radar report: ${brandName} scored ${s}/100`,
      html:    buildHtml(params),
    });

    console.log(`[freeReport] Resend raw response:`, JSON.stringify(result));

    // Resend v4 returns { data, error }
    const data = result?.data;
    const error = result?.error;

    if (error) {
      console.error(`[freeReport] Resend error for ${lead.email}:`, JSON.stringify(error));
      return { error: JSON.stringify(error) };
    }

    console.log(`[freeReport] Sent report to ${lead.email} — id: ${data?.id}`);
    return { id: data?.id };
  } catch (err) {
    console.error(`[freeReport] Exception sending to ${lead.email}:`, err);
    return { error: String(err) };
  }
}
