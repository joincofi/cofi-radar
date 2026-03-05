/**
 * Onboarding agent — fires after Stripe payment confirmed.
 * Reads the Lead record, generates 30 brand-specific queries,
 * creates a Brand row, triggers the first full weekly run immediately.
 */

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { weeklyRun } from "@/lib/jobs/weeklyRun";
import { Resend } from "resend";

const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const getResend = () => new Resend(process.env.RESEND_API_KEY);

// ─── Query generation ─────────────────────────────────────────────────────────

async function generateBrandQueries(
  brandName:   string,
  domain:      string,
  industry:    string,
  description: string,
  competitors: string[]
): Promise<Array<{ intent: string; text: string; priority: number }>> {
  const competitorList = competitors.length > 0
    ? competitors.join(", ")
    : "competitors in the space";

  const res = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    system: `You generate realistic buyer research questions that real buyers and researchers ask AI assistants.
Return ONLY a valid JSON array, no prose.`,
    messages: [{
      role: "user",
      content: `Generate 100 buyer research questions for this brand:
Brand: ${brandName} (${domain})
Industry: ${industry}
Description: ${description}
Competitors: ${competitorList}

Use {brand} as placeholder for "${brandName}", {competitor} for the main competitor, {industry} for the industry.

Return questions spread across 7 intent categories (100 total):
- pricing (15): cost, tiers, free trials, value-for-money, pricing vs competitors
- trust (15): security, compliance, reliability, reviews, ratings, certifications, data privacy
- comparison (20): brand vs each competitor, head-to-head, which is better, alternatives to competitor
- discovery (15): "best [category] tool", "top [industry] solutions", recommendations, what should I use
- integration (12): integrations, API, ecosystem, works with, compatible with
- use-case (13): fits for specific use cases, good for certain team sizes, industries, scenarios
- features (10): does it have X feature, how does X capability work, what's the difference

JSON format:
[
  { "intent": "pricing", "text": "How much does {brand} cost?", "priority": 1 },
  ...
]

Rules:
- Make every question feel like something a real person types into ChatGPT or Claude
- Mix "{brand}" placeholders with questions that mention the company name directly
- For comparison intent: create questions for EACH competitor listed, not just one
- Vary question phrasing — not every question needs to start with "Is" or "What"
- For discovery intent: use generic category terms, not brand names`,
    }],
  });

  try {
    const block = res.content[0];
    const text  = block.type === "text" ? block.text : "";
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(clean) as Array<{ intent: string; text: string; priority: number }>;
    return parsed.slice(0, 100);
  } catch {
    console.warn("[onboard] Query generation failed, falling back to seed queries");
    return [];
  }
}

// ─── Homepage scraper (same as freeScan) ─────────────────────────────────────

async function scrapeHomepage(domain: string): Promise<string> {
  const url = domain.startsWith("http") ? domain : `https://${domain}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "CoFiRadar/1.0 (+https://cofi-radar.com/bot)" },
      signal: AbortSignal.timeout(10_000),
    });
    const html = await res.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
  } catch {
    return `Company website at ${domain}`;
  }
}

// ─── Brand profile refinement ─────────────────────────────────────────────────

interface BrandProfile {
  name: string;
  industry: string;
  description: string;
  competitors: string[];
}

async function researchBrand(domain: string, pageText: string): Promise<BrandProfile> {
  const res = await getAnthropic().messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: `You extract structured brand information from website text. Return ONLY valid JSON.`,
    messages: [{
      role: "user",
      content: `Extract brand information for the company at ${domain}.

Website text:
${pageText}

Return JSON:
{
  "name": "Company name",
  "industry": "One of: project-management | crm | hr-software | accounting | marketing | analytics | devtools | security | ecommerce | fintech | healthtech | edtech | hospitality | retail | food-beverage | professional-services | media | consumer-app | other",
  "description": "2-sentence description of what they do",
  "competitors": ["competitor1.com", "competitor2.com", "competitor3.com"]
}`,
    }],
  });

  try {
    const block = res.content[0];
    const text  = block.type === "text" ? block.text : "";
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(clean) as BrandProfile;
    return {
      name:        parsed.name        || domain,
      industry:    parsed.industry    || "software",
      description: parsed.description || "",
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors.slice(0, 5) : [],
    };
  } catch {
    return { name: domain, industry: "software", description: "", competitors: [] };
  }
}

// ─── Welcome email ────────────────────────────────────────────────────────────

async function sendWelcomeEmail(clientEmail: string, brandName: string): Promise<void> {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to:   clientEmail,
    subject: `Welcome to CoFi Radar — your first scan is running`,
    html: `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#FAF7F4;padding:32px 16px;margin:0;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;border:1px solid #EDE7E0;overflow:hidden;">
  <tr><td style="padding:32px;">
    <p style="margin:0 0 4px;font-size:12px;color:#C96442;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">CoFi Radar</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#1C1714;">You&rsquo;re in. Your first scan is running.</h1>
    <p style="margin:0 0 16px;font-size:15px;color:#6B5E56;line-height:1.65;">
      We&rsquo;re testing <strong>${brandName}</strong> across 100 buyer queries on ChatGPT, Claude, Gemini, and Perplexity &mdash; 400 AI answers in this first run.
    </p>
    <p style="margin:0 0 24px;font-size:15px;color:#6B5E56;line-height:1.65;">
      Your first AI Visibility Report will arrive in your inbox within the hour. It will include your score, alerts, and a prioritised fix plan.
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#9B8E85;">After that, you&rsquo;ll receive a fresh report every Sunday morning.</p>
  </td></tr>
  <tr><td style="background:#FAF7F4;border-top:1px solid #EDE7E0;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9B8E85;">
      Questions? Reply to this email — we read every one.<br/>
      <a href="${base}/auth/signin" style="color:#C96442;text-decoration:none;">Sign into your dashboard</a>
      &nbsp;·&nbsp;
      <a href="${base}/api/stripe/portal" style="color:#C96442;text-decoration:none;">Manage subscription</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function onboardBrand(params: {
  clientEmail:         string;
  domain:              string;
  stripeCustomerId:    string;
  stripeSubscriptionId: string;
  stripePriceId:       string;
}): Promise<void> {
  const { clientEmail, domain, stripeCustomerId, stripeSubscriptionId, stripePriceId } = params;

  console.log(`[onboard] Starting onboarding for ${domain}`);

  // 1. Check if brand already exists (idempotency)
  const existing = await prisma.brand.findUnique({ where: { domain } });
  if (existing) {
    // Just update Stripe fields if missing
    await prisma.brand.update({
      where: { id: existing.id },
      data: { stripeCustomerId, stripeSubscriptionId, stripePriceId, status: "active" },
    });
    console.log(`[onboard] Brand ${domain} already exists — updated Stripe fields`);
    return;
  }

  // 2. Get lead data if available (has brand profile from free scan)
  const lead = await prisma.lead.findUnique({ where: { email: clientEmail } });

  // 3. Research brand (use lead data if available, else re-scrape)
  let profile: BrandProfile;
  if (lead?.brandName && lead?.industry) {
    const pageText   = await scrapeHomepage(domain);
    const fullProfile = await researchBrand(domain, pageText);
    profile = {
      name:        lead.brandName,
      industry:    lead.industry,
      description: fullProfile.description,
      competitors: fullProfile.competitors,
    };
  } else {
    const pageText = await scrapeHomepage(domain);
    profile = await researchBrand(domain, pageText);
  }

  // 4. Create Brand row
  const brand = await prisma.brand.create({
    data: {
      name:                 profile.name,
      domain,
      industry:             profile.industry,
      description:          profile.description,
      competitorDomains:    profile.competitors,
      clientEmail,
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      status:               "active",
    },
  });

  console.log(`[onboard] Created brand ${brand.id} for ${domain}`);

  // 5. Generate brand-specific queries
  const generatedQueries = await generateBrandQueries(
    profile.name,
    domain,
    profile.industry,
    profile.description,
    profile.competitors
  );

  if (generatedQueries.length >= 10) {
    // Insert brand-specific queries (or fall back to seed queries if generation failed)
    await prisma.query.createMany({
      data: generatedQueries.map((q) => ({
        intent:   q.intent,
        text:     q.text,
        priority: q.priority ?? 1,
        active:   true,
      })),
      skipDuplicates: true,
    });
    console.log(`[onboard] Created ${generatedQueries.length} brand-specific queries (target: 100)`);
  }

  // 6. Mark lead as converted
  if (lead) {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { converted: true },
    });
  }

  // 7. Send welcome email
  await sendWelcomeEmail(clientEmail, profile.name);

  // 8. Trigger first full run immediately (don't wait for Sunday)
  console.log(`[onboard] Triggering first run for ${brand.id}`);
  weeklyRun(brand.id).catch((err) => {
    console.error(`[onboard] First run failed for ${brand.id}:`, err);
  });
}
