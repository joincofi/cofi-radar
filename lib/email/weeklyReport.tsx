import { Resend } from "resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import type { Brand, Alert, Recommendation } from "@prisma/client";
import type { ScoreData } from "@/lib/scoring/computeScore";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

function trendArrow(current: number, previous: number | null): string {
  if (previous === null) return "";
  if (current > previous) return "↑";
  if (current < previous) return "↓";
  return "→";
}

function trendColor(current: number, previous: number | null): string {
  if (previous === null) return "#555";
  if (current > previous) return "#16a34a";
  if (current < previous) return "#dc2626";
  return "#555";
}

function severityColor(severity: string): string {
  switch (severity) {
    case "critical": return "#dc2626";
    case "high": return "#ea580c";
    case "medium": return "#d97706";
    default: return "#6b7280";
  }
}

function priorityBadge(priority: string): string {
  switch (priority) {
    case "p0": return "🔴 P0";
    case "p1": return "🟠 P1";
    default: return "🟡 P2";
  }
}

async function generateMagicLink(clientEmail: string): Promise<string> {
  const adapter = PrismaAdapter(prisma);
  const tokenStr = randomBytes(32).toString("hex");
  await adapter.createVerificationToken!({
    identifier: clientEmail,
    token: tokenStr,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/api/auth/callback/email?token=${tokenStr}&email=${encodeURIComponent(clientEmail)}&callbackUrl=%2F`;
}

function buildEmail(
  brand: Brand,
  score: ScoreData,
  previousScore: ScoreData | null,
  alerts: Alert[],
  recs: Recommendation[],
  dashboardUrl: string,
  weekLabel: string
): string {
  const delta =
    previousScore !== null ? score.scoreTotal - previousScore.scoreTotal : null;
  const deltaStr =
    delta !== null
      ? ` ${delta >= 0 ? "+" : ""}${delta}`
      : "";

  const criticalHighAlerts = alerts.filter(
    (a) => a.severity === "critical" || a.severity === "high"
  );
  const topRecs = recs
    .sort((a, b) =>
      a.priority < b.priority ? -1 : a.priority > b.priority ? 1 : 0
    )
    .slice(0, 3);

  const subscores = [
    { label: "Visibility", value: score.scoreVisibility, prev: previousScore?.scoreVisibility ?? null },
    { label: "Accuracy", value: score.scoreAccuracy, prev: previousScore?.scoreAccuracy ?? null },
    { label: "Competitive", value: score.scoreCompetitive, prev: previousScore?.scoreCompetitive ?? null },
    { label: "Sentiment", value: score.scoreSentiment, prev: previousScore?.scoreSentiment ?? null },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${brand.name} AI Visibility Report</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">

      <!-- Header -->
      <tr><td style="background:#1e293b;padding:24px 32px;">
        <p style="margin:0;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;">CoFi Radar · ${weekLabel}</p>
        <h1 style="margin:4px 0 0;color:#fff;font-size:22px;font-weight:700;">${brand.name} AI Visibility Report</h1>
      </td></tr>

      <!-- Score hero -->
      <tr><td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #f1f5f9;">
        <p style="margin:0 0 4px;font-size:14px;color:#64748b;">AI Visibility Score</p>
        <div style="font-size:72px;font-weight:800;color:#1e293b;line-height:1;">${score.scoreTotal}</div>
        ${delta !== null ? `<div style="font-size:18px;font-weight:600;color:${trendColor(score.scoreTotal, previousScore?.scoreTotal ?? null)};margin-top:4px;">${trendArrow(score.scoreTotal, previousScore?.scoreTotal ?? null)} ${deltaStr} vs last week</div>` : ""}
      </td></tr>

      <!-- Subscores -->
      <tr><td style="padding:24px 32px;border-bottom:1px solid #f1f5f9;">
        <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Subscores</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${subscores.map(s => `
          <tr>
            <td style="padding:6px 0;font-size:14px;color:#374151;">${s.label}</td>
            <td style="padding:6px 0;text-align:right;font-size:14px;font-weight:700;color:#1e293b;">
              ${s.value}
              ${s.prev !== null ? `<span style="font-size:12px;color:${trendColor(s.value, s.prev)};margin-left:4px;">${trendArrow(s.value, s.prev)}</span>` : ""}
            </td>
          </tr>`).join("")}
        </table>
      </td></tr>

      ${criticalHighAlerts.length > 0 ? `
      <!-- Alerts -->
      <tr><td style="padding:24px 32px;border-bottom:1px solid #f1f5f9;">
        <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">⚠️ Alerts Requiring Attention</p>
        ${criticalHighAlerts.slice(0, 5).map(alert => {
          const ev = alert.evidence as Record<string, string>;
          return `
          <div style="background:#fef2f2;border:1px solid #fee2e2;border-radius:8px;padding:14px;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
              <span style="background:${severityColor(alert.severity)};color:#fff;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase;">${alert.severity}</span>
              <span style="font-size:13px;font-weight:600;color:#1e293b;">${alert.message}</span>
            </div>
            ${ev.query ? `<p style="margin:0 0 4px;font-size:12px;color:#6b7280;">Query: "${ev.query}"</p>` : ""}
            ${ev.model ? `<p style="margin:0 0 4px;font-size:12px;color:#6b7280;">Model: ${ev.model}</p>` : ""}
            ${ev.answerSnippet ? `<p style="margin:0;font-size:12px;color:#6b7280;font-style:italic;">"${ev.answerSnippet.slice(0, 200)}…"</p>` : ""}
          </div>`;
        }).join("")}
      </td></tr>` : ""}

      <!-- Recommendations -->
      <tr><td style="padding:24px 32px;border-bottom:1px solid #f1f5f9;">
        <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">Top Fixes This Week</p>
        ${topRecs.map((rec, i) => {
          const actions = rec.exactActions as string[];
          return `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px;">
            <div style="font-size:12px;font-weight:700;color:#6b7280;margin-bottom:6px;">${priorityBadge(rec.priority)} · Fix ${i + 1}</div>
            <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:6px;">${rec.title}</div>
            <p style="margin:0 0 10px;font-size:13px;color:#4b5563;">${rec.rationale}</p>
            <ul style="margin:0;padding-left:16px;">
              ${actions.map(a => `<li style="font-size:13px;color:#374151;margin-bottom:4px;">${a}</li>`).join("")}
            </ul>
          </div>`;
        }).join("")}
      </td></tr>

      <!-- CTA -->
      <tr><td style="padding:32px;text-align:center;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#3b5bdb;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:0.01em;">
          View your dashboard →
        </a>
        <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">
          Tested 120 buyer queries across ChatGPT, Claude, Gemini, and Perplexity.
          This link signs you in automatically — no password needed.
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94a3b8;">CoFi Radar · AI Visibility Intelligence</p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function sendWeeklyEmail(
  brand: Brand,
  score: ScoreData,
  previousScore: ScoreData | null,
  alerts: Alert[],
  recs: Recommendation[]
): Promise<void> {
  const dashboardUrl = await generateMagicLink(brand.clientEmail);

  const now = new Date();
  const weekLabel = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Toronto",
  });

  const delta =
    previousScore !== null ? score.scoreTotal - previousScore.scoreTotal : null;
  const deltaStr = delta !== null ? ` ${delta >= 0 ? "+" : ""}${delta}` : "";
  const arrow =
    delta !== null ? (delta > 0 ? " ↑" : delta < 0 ? " ↓" : " →") : "";

  const subject = `${brand.name} AI Visibility Report — Week of ${weekLabel} · Score: ${score.scoreTotal}${arrow}${deltaStr}`;
  const html = buildEmail(brand, score, previousScore, alerts, recs, dashboardUrl, weekLabel);

  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: brand.clientEmail,
    subject,
    html,
  });
}
