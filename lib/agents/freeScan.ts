/**
 * Free scan agent — runs on every new lead.
 * Scrapes homepage → extracts brand profile → runs 10 queries × 2 models
 * → computes score → stores Lead → triggers free report email.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { computeScore } from "@/lib/scoring/computeScore";
import { sendFreeReport } from "@/lib/email/freeReport";
import { scheduleDripEmails } from "@/lib/email/drip";
import type { ExtractionData } from "@/lib/agents/extractAnswer";

const getAnthropic = () => new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const getOpenAI    = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Homepage scraper ────────────────────────────────────────────────────────

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

// ─── Brand profile extraction ────────────────────────────────────────────────

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
    system: `You extract structured brand information from website text. Return ONLY valid JSON, no prose.`,
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
  "competitors": ["competitor1.com", "competitor2.com"]
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
      competitors: Array.isArray(parsed.competitors) ? parsed.competitors.slice(0, 3) : [],
    };
  } catch {
    return { name: domain, industry: "software", description: "", competitors: [] };
  }
}

// ─── Query selection ─────────────────────────────────────────────────────────

// Pick 2 queries per intent from the seed bank (10 total)
async function pickQueries() {
  const intents = ["pricing", "trust", "comparison", "discovery", "integration"];
  const results = await Promise.all(
    intents.map((intent) =>
      prisma.query.findMany({
        where: { intent, active: true },
        take: 2,
        orderBy: { priority: "asc" },
      })
    )
  );
  return results.flat();
}

// ─── Mini extraction ─────────────────────────────────────────────────────────

async function miniExtract(
  brandName: string,
  brandDomain: string,
  competitors: string[],
  question: string,
  answer: string
): Promise<ExtractionData> {
  try {
    const res = await getAnthropic().messages.create({
      model: "claude-haiku-4-20250514",   // cheaper for bulk extraction
      max_tokens: 400,
      system: `Extract brand visibility data. Return ONLY valid JSON.`,
      messages: [{
        role: "user",
        content: `Brand: ${brandName} (${brandDomain})
Competitors: ${competitors.join(", ")}
Question: ${question}
AI Answer: ${answer}

Return JSON:
{
  "brand_mentioned": boolean,
  "mention_rank": number | null,
  "sentiment": "positive"|"neutral"|"negative"|"mixed",
  "competitor_mentions": string[],
  "claims": [],
  "risk_flags": [{"type": string, "detail": string, "severity": "critical"|"high"|"medium"|"low"}],
  "confidence": number
}`,
      }],
    });
    const block = res.content[0];
    const text  = block.type === "text" ? block.text : "";
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    const p = JSON.parse(clean);
    return {
      brandMentioned:     Boolean(p.brand_mentioned),
      mentionRank:        p.mention_rank ?? null,
      sentiment:          p.sentiment ?? "neutral",
      competitorMentions: Array.isArray(p.competitor_mentions) ? p.competitor_mentions : [],
      claims:             Array.isArray(p.claims) ? p.claims : [],
      riskFlags:          Array.isArray(p.risk_flags) ? p.risk_flags : [],
      confidence:         typeof p.confidence === "number" ? p.confidence : 0,
    };
  } catch {
    return {
      brandMentioned: false, mentionRank: null, sentiment: "neutral",
      competitorMentions: [], claims: [], riskFlags: [], confidence: 0,
    };
  }
}

// ─── Model calls ─────────────────────────────────────────────────────────────

const BUYER_SYSTEM = `You are answering a software buyer's question honestly.
If unsure about specifics like pricing or policies, say so explicitly.
Keep your answer focused and under 250 words.`;

async function callGPT(prompt: string): Promise<string> {
  try {
    const res = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      max_tokens: 350,
      messages: [
        { role: "system", content: BUYER_SYSTEM },
        { role: "user",   content: prompt },
      ],
    });
    return res.choices[0]?.message?.content ?? "";
  } catch { return ""; }
}

async function callClaude(prompt: string): Promise<string> {
  try {
    const res = await getAnthropic().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 350,
      system: BUYER_SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });
    const block = res.content[0];
    return block.type === "text" ? block.text : "";
  } catch { return ""; }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function runFreeScan(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUniqueOrThrow({ where: { id: leadId } });

  console.log(`[freeScan] Starting scan for ${lead.domain}`);

  // 1. Scrape + research brand
  const pageText = await scrapeHomepage(lead.domain);
  const profile  = await researchBrand(lead.domain, pageText);

  // Update lead with discovered brand info
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      brandName:   profile.name,
      industry:    profile.industry,
      competitors: profile.competitors,
      scannedAt:   new Date(),
    },
  });

  // 2. Pick 10 representative queries
  const queries = await pickQueries();
  if (queries.length === 0) {
    console.warn("[freeScan] No queries found in seed bank — run prisma db seed first");
    return;
  }

  function hydrate(text: string): string {
    const competitor = profile.competitors[0] ?? "a competitor";
    return text
      .replace(/\{brand\}/g,      profile.name)
      .replace(/\{competitor\}/g, competitor)
      .replace(/\{industry\}/g,   profile.industry);
  }

  // 3. Run queries × 2 models (ChatGPT + Claude), collect extractions
  type MiniExtraction = ExtractionData & { query: string };
  const extractions: MiniExtraction[] = [];
  const findings: Array<{ model: string; question: string; answer: string; extraction: ExtractionData }> = [];

  for (const query of queries) {
    const prompt = hydrate(query.text);

    const [gptAnswer, claudeAnswer] = await Promise.all([
      callGPT(prompt),
      callClaude(prompt),
    ]);

    for (const [model, answer] of [["ChatGPT", gptAnswer], ["Claude", claudeAnswer]] as const) {
      if (!answer) continue;
      const extraction = await miniExtract(
        profile.name,
        lead.domain,
        profile.competitors,
        prompt,
        answer
      );
      extractions.push({ ...extraction, query: prompt });
      findings.push({ model, question: prompt, answer, extraction });
    }
  }

  // 4. Compute score (reuse existing deterministic algorithm)
  // computeScore expects Extraction[] but we have the same shape — cast safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const score = computeScore(extractions as any);

  // Handle "unknown brand" gracefully
  const lowPresence = score.scoreVisibility < 20 && score.scoreTotal < 25;

  // 5. Store score on Lead
  await prisma.lead.update({
    where: { id: leadId },
    data: { score: score.scoreTotal },
  });

  // 6. Collect top findings for report
  const topFindings = findings
    .filter((f) => f.extraction.brandMentioned || f.extraction.riskFlags.length > 0)
    .slice(0, 3);

  const topAlert = findings
    .flatMap((f) =>
      (f.extraction.riskFlags as Array<{ type: string; detail: string; severity: string }>).map((rf) => ({
        model:    f.model,
        question: f.question,
        detail:   rf.detail,
        severity: rf.severity,
      }))
    )
    .sort((a, b) => {
      const order: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.severity] ?? 4) - (order[b.severity] ?? 4);
    })[0] ?? null;

  // 7. Send free report email
  await sendFreeReport({
    lead,
    brandName:   profile.name,
    score,
    topFindings,
    topAlert,
    lowPresence,
    competitors: profile.competitors,
  });

  // 8. Mark report sent
  await prisma.lead.update({
    where: { id: leadId },
    data: { reportSent: true },
  });

  // 9. Schedule 3-email drip sequence (day 1, 3, 7) — fire and forget
  scheduleDripEmails({
    email:       lead.email,
    brandName:   profile.name,
    score:       score.scoreTotal,
    competitors: profile.competitors,
  }).then((ok) => {
    if (ok) {
      prisma.lead.update({ where: { id: leadId }, data: { dripScheduled: true } }).catch(() => {});
    }
  }).catch(() => {});

  console.log(`[freeScan] Completed scan for ${lead.domain} — score: ${score.scoreTotal}`);
}
