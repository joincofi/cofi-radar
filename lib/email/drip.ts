/**
 * 3-email drip sequence for free scan leads.
 * Emails are pre-built with full personalization and scheduled
 * via Resend's `scheduledAt` param — no cron required.
 *
 * Day 1  → "What your score actually means"
 * Day 3  → "The competitor angle you're missing"
 * Day 7  → "Last look — your window is closing"
 */

import { sendEmail } from "@/lib/email/send";

const BASE    = process.env.NEXTAUTH_URL ?? "https://cofiradar.com";
const PRICE_M = process.env.STRIPE_PRICE_MONTHLY ?? "";

// ─── Shared styles ────────────────────────────────────────────────────────────

const OUTER = `font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#FAF7F4;padding:32px 16px;margin:0;`;
const CARD  = `max-width:560px;background:#fff;border-radius:12px;border:1px solid #EDE7E0;overflow:hidden;`;
const BODY_TD = `padding:32px;`;
const FOOT_TD = `background:#FAF7F4;border-top:1px solid #EDE7E0;padding:16px 32px;text-align:center;`;
const BTN   = `display:inline-block;padding:14px 32px;background:#C96442;color:#fff;font-weight:700;font-size:15px;border-radius:8px;text-decoration:none;`;
const H1    = `margin:0 0 20px;font-size:22px;font-weight:800;color:#1C1714;`;
const P     = `margin:0 0 16px;font-size:15px;color:#6B5E56;line-height:1.7;`;
const LABEL = `margin:0 0 4px;font-size:11px;color:#C96442;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;`;
const FOOT_P = `margin:0;font-size:12px;color:#9B8E85;`;

function scoreLabel(score: number): string {
  if (score >= 70) return "strong";
  if (score >= 45) return "moderate";
  return "low";
}

function wrap(inner: string): string {
  return `<!DOCTYPE html><html><body style="${OUTER}">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="${CARD}">${inner}</table>
</td></tr></table></body></html>`;
}

// ─── Day 1: Score explainer + soft upsell ────────────────────────────────────

function day1Html(brandName: string, score: number, competitors: string[]): string {
  const level = scoreLabel(score);
  const compList = competitors.length > 0
    ? competitors.slice(0, 2).join(" and ")
    : "your competitors";
  const checkoutUrl = `${BASE}/api/stripe/checkout?plan=monthly&email=`;

  return wrap(`
  <tr><td style="${BODY_TD}">
    <p style="${LABEL}">CoFi Radar</p>
    <h1 style="${H1}">Your score of ${score} is ${level}. Here's what that means.</h1>
    <p style="${P}">Yesterday we ran ${brandName} through 10 AI queries across ChatGPT and Claude. Your AI Visibility Score came back at <strong style="color:#C96442;">${score}/100</strong>.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;border:1px solid #EDE7E0;overflow:hidden;">
      <tr>
        <td style="padding:16px;background:#FAF7F4;border-right:1px solid #EDE7E0;">
          <p style="margin:0 0 4px;font-size:11px;color:#9B8E85;text-transform:uppercase;letter-spacing:0.06em;">0–40</p>
          <p style="margin:0;font-size:13px;color:#6B5E56;">AI consistently misrepresents or omits you</p>
        </td>
        <td style="padding:16px;background:#FAF7F4;border-right:1px solid #EDE7E0;">
          <p style="margin:0 0 4px;font-size:11px;color:#9B8E85;text-transform:uppercase;letter-spacing:0.06em;">41–69</p>
          <p style="margin:0;font-size:13px;color:#6B5E56;">Partial presence, accuracy gaps, competitor risk</p>
        </td>
        <td style="padding:16px;background:#FBF0EB;">
          <p style="margin:0 0 4px;font-size:11px;color:#C96442;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;">You: ${score}</p>
          <p style="margin:0;font-size:13px;color:#6B5E56;font-weight:600;">${level === "strong" ? "Well represented — track to keep it" : level === "moderate" ? "Visible, but gaps are costing you" : "High risk of losing buyers at the research stage"}</p>
        </td>
      </tr>
    </table>

    <p style="${P}">The free scan covered 10 queries. Our full weekly monitoring runs <strong>100 queries across 4 models</strong> — ChatGPT, Claude, Gemini, and Perplexity — giving you 400 data points every week. It also tracks ${compList} so you see exactly where you win and lose in AI answers.</p>

    <p style="${P}">If you want to see the full picture:</p>
    <a href="${checkoutUrl}" style="${BTN}">Start monitoring for $999/mo</a>
    <p style="margin:16px 0 0;font-size:13px;color:#9B8E85;">Cancel anytime. First full report arrives within the hour.</p>
  </td></tr>
  <tr><td style="${FOOT_TD}">
    <p style="${FOOT_P}">CoFi Radar &middot; AI Visibility Intelligence<br>
    <a href="${checkoutUrl}" style="color:#C96442;text-decoration:none;">Start monitoring</a> &nbsp;&middot;&nbsp;
    <a href="${BASE}" style="color:#9B8E85;text-decoration:none;">cofi-radar.com</a></p>
  </td></tr>`);
}

// ─── Day 3: Competitor angle ──────────────────────────────────────────────────

function day3Html(brandName: string, score: number, competitors: string[]): string {
  const comp1 = competitors[0] ?? "your top competitor";
  const comp2 = competitors[1] ?? "others in your space";
  const checkoutUrl = `${BASE}/api/stripe/checkout?plan=monthly&email=`;

  return wrap(`
  <tr><td style="${BODY_TD}">
    <p style="${LABEL}">CoFi Radar</p>
    <h1 style="${H1}">What happens when buyers compare ${brandName} to ${comp1}?</h1>
    <p style="${P}">When someone asks ChatGPT "Is ${brandName} better than ${comp1}?" — do you know what it says? Our free scan doesn't include comparison queries. The full monitoring does.</p>

    <div style="background:#FAF7F4;border-radius:8px;border:1px solid #EDE7E0;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1C1714;">Comparison queries we track in full monitoring:</p>
      <ul style="margin:0;padding:0 0 0 18px;font-size:14px;color:#6B5E56;line-height:1.8;">
        <li>"Is ${brandName} better than ${comp1}?"</li>
        <li>"${brandName} vs ${comp1} — which should I choose?"</li>
        <li>"Why would I pick ${brandName} over ${comp2}?"</li>
        <li>"Best alternative to ${comp1}"</li>
        <li>"What do users say about ${brandName} vs ${comp1}?"</li>
        <li>...and 95 more, every week</li>
      </ul>
    </div>

    <p style="${P}">Across 400 AI answers per week, we build your <strong>share of voice</strong>: what percentage of relevant queries mention you vs ${comp1}. If that number is dropping, you know before your pipeline does.</p>

    <p style="${P}">Your free scan gave you a score of ${score}. The full dashboard shows you the breakdown, the trend, and the exact answers behind every data point.</p>

    <a href="${checkoutUrl}" style="${BTN}">See your full competitor picture — $999/mo</a>
  </td></tr>
  <tr><td style="${FOOT_TD}">
    <p style="${FOOT_P}">CoFi Radar &middot; AI Visibility Intelligence<br>
    <a href="${BASE}" style="color:#9B8E85;text-decoration:none;">cofi-radar.com</a></p>
  </td></tr>`);
}

// ─── Day 7: Final push ────────────────────────────────────────────────────────

function day7Html(brandName: string, score: number): string {
  const level = scoreLabel(score);
  const checkoutUrl = `${BASE}/api/stripe/checkout?plan=monthly&email=`;
  const urgency = score < 45
    ? `At ${score}/100, AI models are actively misrepresenting ${brandName} to buyers right now. Every week you wait is another week of buyers getting wrong information.`
    : `Your score of ${score}/100 puts you in the moderate range. The gap between you and a brand with a 70+ score is visible to buyers using AI for research.`;

  return wrap(`
  <tr><td style="${BODY_TD}">
    <p style="${LABEL}">CoFi Radar</p>
    <h1 style="${H1}">Last note on ${brandName}'s AI visibility.</h1>
    <p style="${P}">${urgency}</p>
    <p style="${P}">We ran your free scan 7 days ago. Since then, AI models have answered questions about your brand and your competitors thousands of times. We don't know what they said — and neither do you.</p>

    <div style="background:#FBF0EB;border-radius:8px;border:1px solid #F0D9CF;padding:20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#1C1714;">What $999/mo gets you:</p>
      <ul style="margin:0;padding:0 0 0 18px;font-size:14px;color:#6B5E56;line-height:1.9;">
        <li>400 AI answers per week (100 queries × 4 models)</li>
        <li>AI Visibility Score + trend vs prior weeks</li>
        <li>Competitor share-of-voice in every run</li>
        <li>Alerts the moment AI says something wrong</li>
        <li>A prioritized fix plan — P0, P1, P2 — every week</li>
        <li>Cancel anytime, no lock-in</li>
      </ul>
    </div>

    <p style="${P}">If the timing isn't right, no problem. If it is:</p>
    <a href="${checkoutUrl}" style="${BTN}">Start monitoring ${brandName} — $999/mo</a>
    <p style="margin:16px 0 0;font-size:13px;color:#9B8E85;">This is the last email in this sequence. We won't reach out again unless you start monitoring.</p>
  </td></tr>
  <tr><td style="${FOOT_TD}">
    <p style="${FOOT_P}">CoFi Radar &middot; AI Visibility Intelligence<br>
    <a href="${BASE}" style="color:#9B8E85;text-decoration:none;">cofi-radar.com</a></p>
  </td></tr>`);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface DripParams {
  email:       string;
  brandName:   string;
  score:       number;
  competitors: string[];
}

/**
 * Schedule all 3 drip emails via Resend scheduledAt.
 * Emails are fully built now and delivered at +1d, +3d, +7d.
 * Returns true if all 3 were scheduled successfully.
 */
export async function scheduleDripEmails(params: DripParams): Promise<boolean> {
  const { email, brandName, score, competitors } = params;

  const now = Date.now();
  const day1At = new Date(now + 1  * 24 * 60 * 60 * 1000).toISOString();
  const day3At = new Date(now + 3  * 24 * 60 * 60 * 1000).toISOString();
  const day7At = new Date(now + 7  * 24 * 60 * 60 * 1000).toISOString();

  try {
    const results = await Promise.all([
      sendEmail({ to: email, subject: `Your AI Visibility Score of ${score} — what it means for ${brandName}`, html: day1Html(brandName, score, competitors), scheduledAt: day1At }),
      sendEmail({ to: email, subject: `What AI says when buyers compare ${brandName} to competitors`,           html: day3Html(brandName, score, competitors), scheduledAt: day3At }),
      sendEmail({ to: email, subject: `Last note on ${brandName}'s AI visibility`,                             html: day7Html(brandName, score),              scheduledAt: day7At }),
    ]);

    const failed = results.filter(r => r.error);
    if (failed.length > 0) {
      console.error(`[drip] ${failed.length} email(s) failed for ${email}:`, failed.map(f => f.error).join(", "));
      return false;
    }

    console.log(`[drip] Scheduled 3 emails for ${email} at +1d, +3d, +7d`);
    return true;
  } catch (err) {
    console.error("[drip] Failed to schedule drip emails:", err);
    return false;
  }
}
