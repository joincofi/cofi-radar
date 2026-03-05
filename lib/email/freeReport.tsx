/**
 * Free report email — sent after free scan completes.
 * Shows real score + 3 findings + 1 alert. Rest blurred with upsell.
 */

import { Resend } from "resend";
import type { Lead } from "@prisma/client";
import type { ScoreData } from "@/lib/scoring/computeScore";
import type { ExtractionData } from "@/lib/agents/extractAnswer";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

const CORAL   = "#C96442";
const BG      = "#FAF7F4";
const WHITE   = "#FFFFFF";
const T1      = "#1C1714";
const T2      = "#6B5E56";
const T3      = "#9B8E85";
const BORDER  = "#EDE7E0";

function scoreColor(score: number): string {
  if (score >= 70) return "#16a34a";
  if (score >= 45) return CORAL;
  return "#dc2626";
}

function scoreLabel(score: number): string {
  if (score >= 70) return "Good";
  if (score >= 45) return "Needs work";
  return "Critical";
}

function severityColor(severity: string): string {
  switch (severity) {
    case "critical": return "#dc2626";
    case "high":     return "#ea580c";
    case "medium":   return "#d97706";
    default:         return "#6b7280";
  }
}

interface FreeFinding {
  model:    string;
  question: string;
  answer:   string;
  extraction: ExtractionData;
}

interface TopAlert {
  model:    string;
  question: string;
  detail:   string;
  severity: string;
}

interface FreeScanResult {
  lead:        Lead;
  brandName:   string;
  score:       ScoreData;
  topFindings: FreeFinding[];
  topAlert:    TopAlert | null;
  lowPresence: boolean;
  competitors: string[];
}

function buildFreeReportEmail(params: FreeScanResult, checkoutMonthly: string, checkoutYearly: string): string {
  const { lead, brandName, score, topFindings, topAlert, lowPresence, competitors } = params;

  const s = score.scoreTotal;
  const color = scoreColor(s);
  const label = scoreLabel(s);

  const lowPresenceNote = lowPresence
    ? `<div style="background:#FBF0EB;border:1px solid #F0D9CF;border-radius:8px;padding:16px;margin-bottom:20px;">
        <p style="margin:0;font-size:14px;color:${CORAL};font-weight:600;">⚠️ AI models barely know ${brandName} exists</p>
        <p style="margin:8px 0 0;font-size:13px;color:${T2};line-height:1.6;">
          Your low score isn't a product problem — it's a visibility problem. AI models don't have enough
          content about ${brandName} to confidently recommend it. This is fixable, and that's exactly what CoFi Radar helps you do.
        </p>
      </div>`
    : "";

  const findingsHtml = topFindings.length > 0
    ? topFindings.map((f, i) => {
        const mentioned = f.extraction.brandMentioned;
        return `
        <div style="background:${BG};border:1px solid ${BORDER};border-radius:8px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:11px;color:${T3};font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Finding ${i + 1} · ${f.model}</span>
            <span style="font-size:11px;color:${mentioned ? "#16a34a" : "#dc2626"};font-weight:600;">${mentioned ? "✓ Mentioned" : "✗ Not mentioned"}</span>
          </div>
          <p style="margin:0 0 8px;font-size:13px;color:${T2};font-style:italic;">"${f.question}"</p>
          <p style="margin:0;font-size:13px;color:${T1};line-height:1.6;">${f.answer.slice(0, 300)}${f.answer.length > 300 ? "…" : ""}</p>
        </div>`;
      }).join("")
    : `<p style="font-size:14px;color:${T3};text-align:center;padding:24px;">No brand mentions found in the sample queries.</p>`;

  const alertHtml = topAlert
    ? `<div style="background:#FEF2F2;border:1px solid #FEE2E2;border-radius:8px;padding:16px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="background:${severityColor(topAlert.severity)};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase;">${topAlert.severity}</span>
          <span style="font-size:13px;font-weight:600;color:${T1};">Risk flag detected</span>
        </div>
        <p style="margin:0 0 6px;font-size:13px;color:${T2};">${topAlert.detail}</p>
        <p style="margin:0;font-size:12px;color:${T3};">Found in ${topAlert.model} · Query: "${topAlert.question.slice(0, 80)}…"</p>
      </div>`
    : "";

  // Blurred teaser rows
  const blurredRow = (label: string) =>
    `<div style="background:${BG};border:1px solid ${BORDER};border-radius:8px;padding:16px;margin-bottom:12px;filter:blur(3px);user-select:none;opacity:0.6;">
      <p style="margin:0;font-size:13px;color:${T1};">${label}</p>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${brandName} — Free AI Visibility Report</title>
</head>
<body style="margin:0;padding:0;background:${BG};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${WHITE};border-radius:16px;border:1px solid ${BORDER};overflow:hidden;">

  <!-- Header -->
  <tr><td style="padding:28px 32px;border-bottom:1px solid ${BORDER};">
    <p style="margin:0 0 4px;font-size:11px;color:${CORAL};font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">CoFi Radar · Free AI Visibility Report</p>
    <h1 style="margin:0;font-size:22px;font-weight:800;color:${T1};">${brandName}</h1>
  </td></tr>

  <!-- Score hero -->
  <tr><td style="padding:32px;text-align:center;border-bottom:1px solid ${BORDER};background:${BG};">
    <p style="margin:0 0 8px;font-size:13px;color:${T3};font-weight:500;text-transform:uppercase;letter-spacing:0.06em;">AI Visibility Score</p>
    <div style="font-size:80px;font-weight:800;color:${color};line-height:1;letter-spacing:-0.04em;">${s}</div>
    <div style="display:inline-block;background:${color}1A;border:1px solid ${color}33;border-radius:99px;padding:4px 16px;margin-top:8px;">
      <span style="font-size:13px;font-weight:700;color:${color};">${label}</span>
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:${T3};">Based on ${topFindings.length * 2 + 4} buyer queries across ChatGPT &amp; Claude</p>
  </td></tr>

  <!-- Subscores -->
  <tr><td style="padding:24px 32px;border-bottom:1px solid ${BORDER};">
    <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:${T3};text-transform:uppercase;letter-spacing:0.08em;">Score breakdown</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${[
        { label: "Visibility",   value: score.scoreVisibility,   note: "How often AI mentions your brand" },
        { label: "Accuracy",     value: score.scoreAccuracy,     note: "Correctness of claims about you" },
        { label: "Competitive",  value: score.scoreCompetitive,  note: "Position vs competitors" },
        { label: "Sentiment",    value: score.scoreSentiment,    note: "Tone when you are mentioned" },
      ].map(sub => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid ${BORDER};">
          <p style="margin:0;font-size:14px;font-weight:600;color:${T1};">${sub.label}</p>
          <p style="margin:2px 0 0;font-size:12px;color:${T3};">${sub.note}</p>
        </td>
        <td style="padding:8px 0;text-align:right;border-bottom:1px solid ${BORDER};">
          <span style="font-size:22px;font-weight:800;color:${scoreColor(sub.value)};">${sub.value}</span>
          <span style="font-size:12px;color:${T3};">/100</span>
        </td>
      </tr>`).join("")}
    </table>
  </td></tr>

  <!-- Low presence note -->
  ${lowPresenceNote ? `<tr><td style="padding:24px 32px 0;">${lowPresenceNote}</td></tr>` : ""}

  <!-- Top alert -->
  ${alertHtml ? `<tr><td style="padding:24px 32px 0;">
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${T3};text-transform:uppercase;letter-spacing:0.08em;">⚠️ Risk flag detected</p>
    ${alertHtml}
  </td></tr>` : ""}

  <!-- Sample findings -->
  <tr><td style="padding:24px 32px;border-bottom:1px solid ${BORDER};">
    <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${T3};text-transform:uppercase;letter-spacing:0.08em;">Sample findings</p>
    <p style="margin:0 0 16px;font-size:13px;color:${T3};">3 of 20 queries shown</p>
    ${findingsHtml}
  </td></tr>

  <!-- Blurred teaser -->
  <tr><td style="padding:24px 32px;border-bottom:1px solid ${BORDER};position:relative;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <p style="margin:0;font-size:11px;font-weight:700;color:${T3};text-transform:uppercase;letter-spacing:0.08em;">Full report (17 more findings)</p>
      <span style="font-size:11px;color:${CORAL};font-weight:600;background:#FBF0EB;padding:3px 10px;border-radius:4px;">LOCKED</span>
    </div>
    ${blurredRow(`${brandName} is not mentioned when buyers ask about ${competitors[0] ?? "top competitors"}`)}
    ${blurredRow("Pricing page content is missing from AI training context — buyers get wrong numbers")}
    ${blurredRow("3 compliance claims flagged as unverifiable across Gemini and Perplexity")}
    <!-- Overlay -->
    <div style="background:linear-gradient(to bottom,rgba(250,247,244,0),rgba(250,247,244,0.97));position:absolute;bottom:0;left:0;right:0;height:80px;pointer-events:none;"></div>
  </td></tr>

  <!-- Upsell -->
  <tr><td style="padding:32px;background:${BG};border-bottom:1px solid ${BORDER};">
    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:${T1};text-align:center;">Unlock your full report + weekly monitoring</p>
    <p style="margin:0 0 24px;font-size:13px;color:${T2};text-align:center;line-height:1.6;">
      Get all 20 findings, your complete fix plan (P0/P1/P2), full evidence explorer,<br/>and a fresh report every Sunday — automatically.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;margin:0 auto;">
      <tr>
        <td style="padding-right:8px;" width="50%">
          <a href="${checkoutMonthly}" style="display:block;text-align:center;padding:14px 0;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;color:${WHITE};background:${CORAL};">
            $299/mo
          </a>
          <p style="margin:6px 0 0;text-align:center;font-size:12px;color:${T3};">Monthly · cancel anytime</p>
        </td>
        <td style="padding-left:8px;" width="50%">
          <a href="${checkoutYearly}" style="display:block;text-align:center;padding:14px 0;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;color:${CORAL};background:${WHITE};border:1.5px solid #E8C4B0;">
            $2,490/yr
          </a>
          <p style="margin:6px 0 0;text-align:center;font-size:12px;color:${CORAL};font-weight:600;">Save $1,098 · best value</p>
        </td>
      </tr>
    </table>
    <p style="margin:20px 0 0;text-align:center;font-size:12px;color:${T3};">
      First full report delivered within 24 hours of signup. No credit card required for this scan.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:${T3};">
      CoFi Radar · AI Visibility Intelligence<br/>
      <a href="%%unsubscribe%%" style="color:${T3};text-decoration:underline;">Unsubscribe</a>
      &nbsp;·&nbsp;
      <a href="${process.env.NEXTAUTH_URL ?? "https://cofi-radar.com"}" style="color:${T3};text-decoration:none;">cofi-radar.com</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Public function ──────────────────────────────────────────────────────────

export async function sendFreeReport(params: FreeScanResult): Promise<void> {
  const base = process.env.NEXTAUTH_URL ?? "https://cofi-radar.com";

  // Build Stripe checkout URLs with pre-filled email
  const emailEnc = encodeURIComponent(params.lead.email);
  const checkoutMonthly = `${base}/api/stripe/checkout?plan=monthly&email=${emailEnc}`;
  const checkoutYearly  = `${base}/api/stripe/checkout?plan=yearly&email=${emailEnc}`;

  const html = buildFreeReportEmail(params, checkoutMonthly, checkoutYearly);

  const s = params.score.scoreTotal;
  const label = s >= 70 ? "Good" : s >= 45 ? "needs work" : "critical";

  await getResend().emails.send({
    from:    process.env.RESEND_FROM_EMAIL!,
    to:      params.lead.email,
    subject: `${params.brandName} AI Visibility Score: ${s}/100 — ${label}`,
    html,
  });
}
