import Anthropic from "@anthropic-ai/sdk";
import type { Response, Brand } from "@prisma/client";

const EXTRACT_MODEL = "claude-sonnet-4-20250514";

export interface ExtractionData {
  brandMentioned: boolean;
  mentionRank: number | null;
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  competitorMentions: string[];
  claims: Array<{ type: string; claim: string; confidence: number }>;
  riskFlags: Array<{ type: string; detail: string; severity: string }>;
  confidence: number;
}

const SAFE_DEFAULTS: ExtractionData = {
  brandMentioned: false,
  mentionRank: null,
  sentiment: "neutral",
  competitorMentions: [],
  claims: [],
  riskFlags: [],
  confidence: 0,
};

export async function extractAnswer(
  response: Response,
  brand: Brand
): Promise<ExtractionData> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const systemPrompt = `You are a structured data extraction assistant. Extract information about how a brand is represented in an AI-generated answer.

Return ONLY valid JSON with these exact fields:
{
  "brand_mentioned": boolean,
  "mention_rank": number | null,
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "competitor_mentions": string[],
  "claims": [{ "type": string, "claim": string, "confidence": number }],
  "risk_flags": [{ "type": string, "detail": string, "severity": "critical" | "high" | "medium" | "low" }],
  "confidence": number
}

Risk flag severity guide:
- critical: Specific wrong number (pricing, headcount, dates)
- high: Unverifiable security/compliance claim, clear misrepresentation
- medium: Vague or likely outdated claim
- low: Minor uncertainty or ambiguity

mention_rank: 1 = mentioned first, 2 = mentioned second, null = not mentioned.
confidence: 0.0–1.0 how confident you are in this extraction.`;

  const userMessage = `Brand being analyzed: ${brand.name} (${brand.domain})
Competitor domains: ${brand.competitorDomains.join(", ")}

Question asked: ${response.prompt}

AI answer to analyze:
${response.rawAnswer}`;

  try {
    const res = await client.messages.create({
      model: EXTRACT_MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = res.content[0];
    const text = block.type === "text" ? block.text : "";

    // Strip any markdown code fences before parsing
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(clean);

    return {
      brandMentioned: Boolean(parsed.brand_mentioned),
      mentionRank: parsed.mention_rank ?? null,
      sentiment: parsed.sentiment ?? "neutral",
      competitorMentions: Array.isArray(parsed.competitor_mentions)
        ? parsed.competitor_mentions
        : [],
      claims: Array.isArray(parsed.claims) ? parsed.claims : [],
      riskFlags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    };
  } catch {
    return SAFE_DEFAULTS;
  }
}
