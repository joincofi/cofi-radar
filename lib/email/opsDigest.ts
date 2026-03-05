/**
 * Weekly ops digest — sent Monday 7am to the owner.
 * 10 lines. Everything you need to know in 30 seconds.
 */

import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

export async function sendOpsDigest(): Promise<void> {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) {
    console.warn("[opsDigest] OWNER_EMAIL not set — skipping digest");
    return;
  }

  const now      = new Date();
  const weekAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // ── Gather metrics ──────────────────────────────────────────────────────────
  const [
    totalBrands,
    activeBrands,
    pastDueBrands,
    cancelledBrands,
    newLeads,
    newConversions,
    runsThisWeek,
    failedRunsThisWeek,
    recentAlerts,
  ] = await Promise.all([
    prisma.brand.count(),
    prisma.brand.count({ where: { status: "active" } }),
    prisma.brand.count({ where: { status: "past_due" } }),
    prisma.brand.count({ where: { status: "cancelled" } }),
    prisma.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.lead.count({ where: { converted: true, createdAt: { gte: weekAgo } } }),
    prisma.run.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.run.count({ where: { status: "failed", createdAt: { gte: weekAgo } } }),
    prisma.alert.findMany({
      where: { severity: { in: ["critical", "high"] }, createdAt: { gte: weekAgo } },
      include: { brand: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const conversionRate = newLeads > 0 ? Math.round((newConversions / newLeads) * 100) : 0;
  const runSuccessRate = runsThisWeek > 0
    ? Math.round(((runsThisWeek - failedRunsThisWeek) / runsThisWeek) * 100)
    : 100;

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    timeZone: "America/Toronto",
  });

  const CORAL  = "#C96442";
  const T1     = "#1C1714";
  const T2     = "#6B5E56";
  const T3     = "#9B8E85";
  const BORDER = "#EDE7E0";
  const BG     = "#FAF7F4";
  const WHITE  = "#FFFFFF";

  function statusDot(ok: boolean) {
    return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${ok ? "#16a34a" : "#dc2626"};margin-right:6px;"></span>`;
  }

  const alertsHtml = recentAlerts.length > 0
    ? recentAlerts.map((a) => `
      <tr>
        <td style="padding:6px 0;font-size:13px;color:${T1};">${(a as typeof a & { brand: { name: string } }).brand.name}</td>
        <td style="padding:6px 0;font-size:13px;color:${T2};">${a.message}</td>
        <td style="padding:6px 0;text-align:right;">
          <span style="font-size:11px;color:${a.severity === "critical" ? "#dc2626" : "#ea580c"};font-weight:700;text-transform:uppercase;">${a.severity}</span>
        </td>
      </tr>`).join("")
    : `<tr><td colspan="3" style="padding:8px 0;font-size:13px;color:${T3};">No critical/high alerts this week.</td></tr>`;

  const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:${BG};padding:24px 16px;margin:0;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table style="max-width:560px;background:${WHITE};border-radius:12px;border:1px solid ${BORDER};overflow:hidden;">

  <tr><td style="padding:24px 28px;border-bottom:1px solid ${BORDER};">
    <p style="margin:0 0 2px;font-size:11px;color:${CORAL};font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">CoFi Radar · Weekly Ops Digest</p>
    <h1 style="margin:0;font-size:18px;font-weight:800;color:${T1};">${dateStr}</h1>
  </td></tr>

  <!-- Subscription health -->
  <tr><td style="padding:20px 28px;border-bottom:1px solid ${BORDER};">
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${T3};text-transform:uppercase;letter-spacing:0.08em;">Subscriptions</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:4px 0;font-size:14px;color:${T2};">Active</td>
        <td style="padding:4px 0;text-align:right;font-size:14px;font-weight:700;color:${T1};">${activeBrands} of ${totalBrands}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:14px;color:${T2};">Past due</td>
        <td style="padding:4px 0;text-align:right;font-size:14px;font-weight:700;color:${pastDueBrands > 0 ? "#dc2626" : T1};">${pastDueBrands}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:14px;color:${T2};">Cancelled (all-time)</td>
        <td style="padding:4px 0;text-align:right;font-size:14px;font-weight:700;color:${T1};">${cancelledBrands}</td>
      </tr>
    </table>
  </td></tr>

  <!-- Acquisition -->
  <tr><td style="padding:20px 28px;border-bottom:1px solid ${BORDER};">
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${T3};text-transform:uppercase;letter-spacing:0.08em;">This week — acquisition</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:4px 0;font-size:14px;color:${T2};">New free scans</td>
        <td style="padding:4px 0;text-align:right;font-size:14px;font-weight:700;color:${T1};">${newLeads}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:14px;color:${T2};">Converted to paid</td>
        <td style="padding:4px 0;text-align:right;font-size:14px;font-weight:700;color:${T1};">${newConversions} <span style="font-size:12px;color:${T3};">(${conversionRate}%)</span></td>
      </tr>
    </table>
  </td></tr>

  <!-- Runs -->
  <tr><td style="padding:20px 28px;border-bottom:1px solid ${BORDER};">
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${T3};text-transform:uppercase;letter-spacing:0.08em;">This week — runs</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:4px 0;font-size:14px;color:${T2};">Total runs</td>
        <td style="padding:4px 0;text-align:right;font-size:14px;font-weight:700;color:${T1};">${runsThisWeek}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:14px;color:${T2};">Failed runs</td>
        <td style="padding:4px 0;text-align:right;font-size:14px;font-weight:700;color:${failedRunsThisWeek > 0 ? "#dc2626" : T1};">
          ${statusDot(failedRunsThisWeek === 0)}${failedRunsThisWeek} (${runSuccessRate}% success)
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Critical alerts -->
  <tr><td style="padding:20px 28px;border-bottom:1px solid ${BORDER};">
    <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${T3};text-transform:uppercase;letter-spacing:0.08em;">Critical/high alerts this week</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${alertsHtml}
    </table>
  </td></tr>

  <tr><td style="padding:16px 28px;text-align:center;">
    <p style="margin:0;font-size:12px;color:${T3};">CoFi Radar Ops · Automated digest · Reply to respond</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;

  await getResend().emails.send({
    from:    process.env.RESEND_FROM_EMAIL!,
    to:      ownerEmail,
    subject: `CoFi Radar digest · ${activeBrands} active · ${newLeads} scans · ${newConversions} converted`,
    html,
  });

  console.log(`[opsDigest] Sent to ${ownerEmail}`);
}
