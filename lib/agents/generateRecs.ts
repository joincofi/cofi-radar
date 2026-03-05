import Anthropic from "@anthropic-ai/sdk";
import type { Extraction, Brand } from "@prisma/client";
import type { ScoreData } from "@/lib/scoring/computeScore";

const RECS_MODEL = "claude-sonnet-4-20250514";

export interface RecommendationData {
  priority: "p0" | "p1" | "p2";
  title: string;
  rationale: string;
  exactActions: string[];
  expectedImpact: string;
}

interface RiskFlag {
  type: string;
  detail: string;
  severity: string;
}

export async function generateRecommendations(
  brand: Brand,
  score: ScoreData,
  extractions: Extraction[]
): Promise<RecommendationData[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Summarize risk flags for context
  const allFlags = extractions.flatMap(
    (e) => (e.riskFlags as unknown as RiskFlag[]) ?? []
  );
  const criticalFlags = allFlags.filter((f) => f.severity === "critical");
  const highFlags = allFlags.filter((f) => f.severity === "high");

  const mentionRate = Math.round(
    (extractions.filter((e) => e.brandMentioned).length / extractions.length) *
      100
  );
  const sentimentBreakdown = ["positive", "neutral", "negative", "mixed"].map(
    (s) => ({
      sentiment: s,
      count: extractions.filter(
        (e) => e.brandMentioned && e.sentiment === s
      ).length,
    })
  );

  const systemPrompt = `You are an AI visibility strategist. Based on data about how AI models represent a brand, generate specific, actionable recommendations.

Return ONLY valid JSON array of recommendations with this schema:
[{
  "priority": "p0" | "p1" | "p2",
  "title": "string",
  "rationale": "string (cite specific query or finding as evidence)",
  "exact_actions": ["string"],
  "expected_impact": "string"
}]

Priority guide:
- p0: Wrong or fabricated claims about pricing, policy, security. Fix this week.
- p1: Missing content causing brand to lose comparison or discovery queries.
- p2: Longer-term visibility improvements (case studies, thought leadership).

Generate 3–6 recommendations. Be specific and actionable.`;

  const userMessage = `Brand: ${brand.name} (${brand.domain})
Industry: ${brand.industry}
Description: ${brand.description}

Current AI Visibility Score: ${score.scoreTotal}/100
- Visibility: ${score.scoreVisibility}/100
- Accuracy: ${score.scoreAccuracy}/100
- Competitive: ${score.scoreCompetitive}/100
- Sentiment: ${score.scoreSentiment}/100

Brand mention rate: ${mentionRate}% of AI answers
Sentiment breakdown: ${JSON.stringify(sentimentBreakdown)}

Critical risk flags (${criticalFlags.length}):
${criticalFlags.map((f) => `- ${f.detail}`).join("\n") || "None"}

High risk flags (${highFlags.length}):
${highFlags.map((f) => `- ${f.detail}`).join("\n") || "None"}

Competitors mentioned: ${Array.from(
    new Set(
      extractions.flatMap((e) => e.competitorMentions as string[])
    )
  ).join(", ") || "None"}`;

  try {
    const res = await client.messages.create({
      model: RECS_MODEL,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = res.content[0];
    const text = block.type === "text" ? block.text : "[]";
    const clean = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(clean);

    return (parsed as Array<Record<string, unknown>>).map((r) => ({
      priority: (r.priority as "p0" | "p1" | "p2") ?? "p2",
      title: String(r.title ?? ""),
      rationale: String(r.rationale ?? ""),
      exactActions: Array.isArray(r.exact_actions) ? r.exact_actions : [],
      expectedImpact: String(r.expected_impact ?? ""),
    }));
  } catch {
    return [
      {
        priority: "p1",
        title: "Improve brand presence in AI answers",
        rationale: "Brand visibility score indicates AI models have limited information about this brand.",
        exactActions: [
          "Publish detailed product pages with pricing, features, and use cases",
          "Create comparison pages vs key competitors",
          "Add structured data markup to website",
        ],
        expectedImpact: "Expected to improve visibility and accuracy scores over 4–8 weeks",
      },
    ];
  }
}
