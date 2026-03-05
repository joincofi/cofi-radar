import type { Extraction } from "@prisma/client";

export interface ScoreData {
  scoreTotal: number;
  scoreVisibility: number;
  scoreAccuracy: number;
  scoreCompetitive: number;
  scoreSentiment: number;
}

interface RiskFlag {
  type: string;
  detail: string;
  severity: "critical" | "high" | "medium" | "low";
}

export function computeScore(extractions: Extraction[]): ScoreData {
  const total = extractions.length;
  if (total === 0) {
    return {
      scoreTotal: 0,
      scoreVisibility: 0,
      scoreAccuracy: 0,
      scoreCompetitive: 0,
      scoreSentiment: 0,
    };
  }

  // Visibility (35%)
  const mentionRate =
    extractions.filter((e) => e.brandMentioned).length / total;
  const topRankBonus =
    extractions.filter(
      (e) => e.mentionRank !== null && e.mentionRank <= 3
    ).length / total;
  const scoreVisibility = Math.min(
    100,
    mentionRate * 80 + topRankBonus * 20
  );

  // Accuracy (30%)
  const allFlags = extractions.flatMap(
    (e) => (e.riskFlags as unknown as RiskFlag[]) ?? []
  );
  const criticalCount = allFlags.filter((f) => f.severity === "critical").length;
  const highCount = allFlags.filter((f) => f.severity === "high").length;
  const mediumCount = allFlags.filter((f) => f.severity === "medium").length;
  const scoreAccuracy = Math.max(
    0,
    100 - criticalCount * 20 - highCount * 8 - mediumCount * 3
  );

  // Competitive (20%)
  const displacedCount = extractions.filter(
    (e) =>
      !e.brandMentioned &&
      (e.competitorMentions as string[]).length > 0
  ).length;
  const scoreCompetitive = Math.max(0, 100 - (displacedCount / total) * 100);

  // Sentiment (15%)
  const sentimentMap: Record<string, number> = {
    positive: 100,
    neutral: 60,
    mixed: 40,
    negative: 0,
  };
  const mentionedExtractions = extractions.filter((e) => e.brandMentioned);
  const scoreSentiment =
    mentionedExtractions.length === 0
      ? 50
      : mentionedExtractions.reduce(
          (sum, e) => sum + (sentimentMap[e.sentiment] ?? 50),
          0
        ) / mentionedExtractions.length;

  const scoreTotal = Math.round(
    scoreVisibility * 0.35 +
      scoreAccuracy * 0.3 +
      scoreCompetitive * 0.2 +
      scoreSentiment * 0.15
  );

  return {
    scoreTotal,
    scoreVisibility: Math.round(scoreVisibility),
    scoreAccuracy: Math.round(scoreAccuracy),
    scoreCompetitive: Math.round(scoreCompetitive),
    scoreSentiment: Math.round(scoreSentiment),
  };
}
